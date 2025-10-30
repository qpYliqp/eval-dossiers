import fs from 'fs';
import * as XLSX from 'xlsx';
import { promisify } from 'util';
import { FileModel } from '../models/file.model';
import { MonMasterNormalizationModel } from '../models/monmaster-normalization.model';
import {
    AcademicRecord,
    CandidateScore,
    EXCLUDED_REGEXES,
    MonMasterNormalizationError,
    MonMasterNormalizationResult,
    MOYENNE_KEYWORDS,
    NormalizedCandidate,
    ProcessMonMasterResult,
    AvailableMonMasterFields,
    IndexedMonMasterField
} from '../types/monmaster-normalization.types';
import { FileOrigin } from '../types/file.types';
import { parseAndNormalizeGrade } from '../utils/grade-normalization.utils';

const readFileAsync = promisify(fs.readFile);

export class MonMasterNormalizationService {
    private model = new MonMasterNormalizationModel();

    /**
     * Process a MonMaster XLSX file and normalize its data
     * @param fileId ID of the MonMaster file to process
     */
    async processMonMasterFile(fileId: number): Promise<ProcessMonMasterResult | null> {
        try {
            // Check if the file was already normalized
            const isAlreadyNormalized = await this.model.isFileAlreadyNormalized(fileId);

            if (isAlreadyNormalized) {
                console.error(`File with ID ${fileId} has already been normalized`);
                throw new Error(MonMasterNormalizationError.ALREADY_NORMALIZED);
            }

            // Get file metadata from the database
            const fileMetadata = await FileModel.getFileById(fileId);

            if (!fileMetadata) {
                console.error(`File with ID ${fileId} not found`);
                throw new Error(MonMasterNormalizationError.FILE_NOT_FOUND);
            }

            // Verify this is a MonMaster file
            if (fileMetadata.fileOrigin !== FileOrigin.MonMaster) {
                console.error(`File with ID ${fileId} is not a MonMaster file`);
                throw new Error(MonMasterNormalizationError.INVALID_FILE_TYPE);
            }

            // Read the XLSX file
            const workbook = await MonMasterNormalizationService.readXlsxFile(fileMetadata.filePath);
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];

            // Convert to JSON
            const rawData = XLSX.utils.sheet_to_json(worksheet);

            if (!rawData || rawData.length === 0) {
                console.error('No data found in the XLSX file');
                throw new Error(MonMasterNormalizationError.PROCESSING_ERROR);
            }

            // Normalize the data
            const normalizedData = this.normalizeMonMasterData(rawData, fileId);

            // Save the normalized data
            const savedSuccessfully = await this.model.saveNormalizedData(
                fileId,
                normalizedData.candidates,
                normalizedData.academicRecords,
                normalizedData.candidateScores
            );

            if (!savedSuccessfully) {
                console.error('Failed to save normalized data');
                throw new Error(MonMasterNormalizationError.PROCESSING_ERROR);
            }

            return {
                fileId,
                normalizedData
            };
        } catch (error) {
            console.error(`Error processing MonMaster file: ${error}`);

            if (error instanceof Error) {
                throw error;
            }

            throw new Error(MonMasterNormalizationError.PROCESSING_ERROR);
        }
    }

    /**
     * Read an XLSX file and return a workbook
     * @param filePath Path to the XLSX file
     */
    public static async readXlsxFile(filePath: string): Promise<XLSX.WorkBook> {
        try {
            const data = await readFileAsync(filePath);
            return XLSX.read(data);
        } catch (error) {
            console.error(`Error reading XLSX file: ${error}`);
            throw new Error(MonMasterNormalizationError.PROCESSING_ERROR);
        }
    }

    /**
     * Normalize MonMaster data from the raw JSON
     * @param rawData Raw data from the XLSX file
     * @param fileId ID of the MonMaster file
     */
    private normalizeMonMasterData(rawData: any[], fileId: number): MonMasterNormalizationResult {
        try {
            // 1. Standardize headers (done implicitly by sheet_to_json)
            // 2. Clean data and extract candidates
            const candidatesData = this.extractCandidates(rawData, fileId);

            // 3. Extract academic records with row indices
            const academicRecordsWithRowIndex = this.extractAcademicRecords(rawData, candidatesData);

            // 4. Extract candidate scores with row indices
            const candidateScoresWithRowIndex = this.extractCandidateScores(rawData, candidatesData);

            // 5. Prepare data for insertion (linking records to candidates)
            return this.model.prepareDataForInsertionWithRowIndex(
                candidatesData,
                academicRecordsWithRowIndex,
                candidateScoresWithRowIndex
            );
        } catch (error) {
            console.error(`Error normalizing MonMaster data: ${error}`);
            throw new Error(MonMasterNormalizationError.PROCESSING_ERROR);
        }
    }

    /**
     * Extract candidate core data from raw data
     * @param rawData Raw data from the XLSX file
     * @param fileId ID of the MonMaster file
     */
    private extractCandidates(rawData: any[], fileId: number): Omit<NormalizedCandidate, 'candidateId'>[] {
        return rawData.map(row => {
            const lastName = this.getValueByMappedKey(row, 'Nom de naissance') || '';
            const firstName = this.getValueByMappedKey(row, 'Prénom') || '';

            const fullName = `${lastName} ${firstName}`.trim();

            return {
                monmasterFileId: fileId,
                lastName,
                firstName,
                fullName,
                candidateNumber: this.getValueByMappedKey(row, 'Numéro de candidat') || '',
                dateOfBirth: this.getValueByMappedKey(row, 'Date de naissance') || ''
            };
        });
    }

    /**
     * Extract academic records from raw data
     * @param rawData Raw data from the XLSX file
     * @param _candidates Extracted candidate data
     */
    private extractAcademicRecords(
        rawData: any[],
        _candidates: Omit<NormalizedCandidate, 'candidateId'>[]
    ): { record: Omit<AcademicRecord, 'recordId' | 'candidateId'>, rowIndex: number }[] {
        const academicRecordsWithRowIndex: {
            record: Omit<AcademicRecord, 'recordId' | 'candidateId'>,
            rowIndex: number
        }[] = [];

        // In TypeScript with xlsx library, suffixes use underscore instead of dot
        const suffixes = ['', '_1', '_2', '_3', '_4', '_5', '_6', '_7'];

        // Process each candidate
        for (let i = 0; i < rawData.length; i++) {
            const row = rawData[i];

            // Process each suffix (representing a set of academic record fields)
            for (const suffix of suffixes) {
                // Check if academic record exists for this suffix
                const yearField = `Année universitaire${suffix}`;

                if (!row[yearField] || row[yearField] === '') {
                    continue; // Skip if no academic year
                }

                // Create an academic record object
                const academicRecord: Omit<AcademicRecord, 'recordId' | 'candidateId'> = {
                    academicYear: row[`Année universitaire${suffix}`] || '',
                    programType: row[`Type de formation ou de diplôme préparé${suffix}`] || '',
                    curriculumYear: row[`Année dans le cursus${suffix}`] || '',
                    specialization: row[`Mention ou spécialité${suffix}`] || '',
                    coursePath: row[`Parcours${suffix}`] || '',
                    gradeSemester1: parseAndNormalizeGrade(row[`Moyenne au premier semestre${suffix}`]),
                    gradeSemester2: parseAndNormalizeGrade(row[`Moyenne au second semestre${suffix}`]),
                    institution: row[`Établissement${suffix}`] || ''
                };

                academicRecordsWithRowIndex.push({ record: academicRecord, rowIndex: i });
            }
        }

        return academicRecordsWithRowIndex;
    }

    /**
     * Extract candidate scores from raw data
     * @param rawData Raw data from the XLSX file
     * @param _candidates Extracted candidate data
     */
    private extractCandidateScores(
        rawData: any[],
        _candidates: Omit<NormalizedCandidate, 'candidateId'>[]
    ): { score: Omit<CandidateScore, 'scoreId' | 'candidateId'>, rowIndex: number }[] {
        const candidateScoresWithRowIndex: {
            score: Omit<CandidateScore, 'scoreId' | 'candidateId'>,
            rowIndex: number
        }[] = [];

        // Process each candidate
        for (let i = 0; i < rawData.length; i++) {
            const row = rawData[i];

            // Get all column names
            const columnNames = Object.keys(row);

            // Filter columns that contain score-like keywords but are not standard academic fields
            for (const columnName of columnNames) {
                if (
                    this.isScoreColumn(columnName) &&
                    row[columnName] !== null &&
                    row[columnName] !== undefined &&
                    row[columnName] !== ''
                ) {
                    // Normalize the score if it's a numeric grade
                    let scoreValue = row[columnName];

                    // Try to normalize if it looks like a numeric grade
                    const normalizedGrade = parseAndNormalizeGrade(scoreValue);
                    if (normalizedGrade !== null) {
                        scoreValue = normalizedGrade.toString();
                    }

                    candidateScoresWithRowIndex.push({
                        score: {
                            scoreLabel: columnName,
                            scoreValue: String(scoreValue)
                        },
                        rowIndex: i
                    });
                }
            }
        }

        return candidateScoresWithRowIndex;
    }

    /**
     * Check if a column name represents a score
     * @param columnName Column name to check
     */
    private isScoreColumn(columnName: string): boolean {
        // Check if column name matches any exclusion patterns
        for (const pattern of EXCLUDED_REGEXES) {
            if (pattern.test(columnName)) {
                return false;
            }
        }

        // Check if column name contains any score keywords
        const lowerColumnName = columnName.toLowerCase();
        return MOYENNE_KEYWORDS.some(keyword => lowerColumnName.includes(keyword));
    }

    /**
     * Get a value from a row using the mapped key
     * @param row Row data
     * @param sourceKey Original key in the source data
     */
    private getValueByMappedKey(row: any, sourceKey: string): any {
        return row[sourceKey] || null;
    }

    /**
     * Parse a value as a number, or return null if not a valid number
     * @param value Value to parse
     */
    private parseNumberOrNull(value: any): number | null {
        if (value === null || value === undefined || value === '') {
            return null;
        }

        const num = Number(value);
        return isNaN(num) ? null : num;
    }

    /**
     * Get normalized data for a specific MonMaster file
     * @param fileId ID of the MonMaster file
     */
    async getNormalizedDataByFileId(fileId: number): Promise<MonMasterNormalizationResult | null> {
        return this.model.getNormalizedDataByFileId(fileId);
    }

    /**
     * Delete normalized data for a specific MonMaster file
     * @param fileId ID of the MonMaster file
     */
    async deleteNormalizedDataByFileId(fileId: number): Promise<boolean> {
        try {
            const isNormalized = await this.model.isFileAlreadyNormalized(fileId);

            if (!isNormalized) {
                console.error(`File with ID ${fileId} has not been normalized yet`);
                return false;
            }

            return await this.model.deleteNormalizedData(fileId);
        } catch (error) {
            console.error(`Error deleting normalized data: ${error}`);
            return false;
        }
    }

    /**
     * Search candidates based on various criteria
     * @param searchParams Search parameters (firstName, lastName, candidateNumber, monmasterFileId)
     * @returns Array of candidates matching the search criteria
     */
    async searchCandidates(searchParams: {
        firstName?: string;
        lastName?: string;
        candidateNumber?: string;
        monmasterFileId?: number;
    }): Promise<NormalizedCandidate[]> {
        try {
            return await this.model.searchCandidates(searchParams);
        } catch (error) {
            console.error(`Error searching candidates: ${error}`);
            return [];
        }
    }

    /**
     * Get detailed information about a specific candidate
     * @param candidateId ID of the candidate
     * @returns Candidate data with academic records and scores, or null if not found
     */
    async getCandidateById(candidateId: number): Promise<{
        candidate: NormalizedCandidate;
        academicRecords: AcademicRecord[];
        scores: CandidateScore[];
    } | null> {
        try {
            return await this.model.getCandidateById(candidateId);
        } catch (error) {
            console.error(`Error getting candidate by ID: ${error}`);
            return null;
        }
    }

    /**
     * Get available indexed fields from a normalized MonMaster file
     * These fields can be used by the mapping service
     */
    async getAvailableMonMasterFields(fileId: number): Promise<AvailableMonMasterFields | null> {
        try {
            const isNormalized = await this.model.isFileAlreadyNormalized(fileId);

            if (!isNormalized) {
                console.error(`File with ID ${fileId} has not been normalized yet`);
                return null;
            }

            const fields: IndexedMonMasterField[] = [
                {
                    index: 0,
                    name: 'fullName',
                    type: 'string',
                    description: 'Nom complet du candidat',
                    category: 'candidate'
                },
                {
                    index: 1,
                    name: 'dateOfBirth',
                    type: 'date',
                    description: 'Date de naissance',
                    category: 'candidate'
                }
            ];

            const normalizedData = await this.getNormalizedDataByFileId(fileId);

            if (normalizedData && normalizedData.candidates.length > 0) {
                let index = 2;

                if (normalizedData.candidateScores.length > 0) {
                    const scoreLabels = new Set<string>();
                    normalizedData.candidateScores.forEach(score => {
                        scoreLabels.add(score.scoreLabel);
                    });

                    scoreLabels.forEach(label => {
                        fields.push({
                            index: index++,
                            name: `score_${label.replace(/\s+/g, '_')}`,
                            type: 'number',
                            description: label,
                            category: 'score'
                        });
                    });
                }
            }

            return {
                fileId: fileId,
                fields: fields
            };
        } catch (error) {
            console.error(`Error retrieving available MonMaster fields: ${error}`);
            return null;
        }
    }

    /**
     * Transform normalized MonMaster data into a format suitable for mapping
     * This converts the hierarchical candidate objects into flat records with indexed columns
     */
    async getNormalizedDataAsIndexedRecords(fileId: number): Promise<Record<string, any>[] | null> {
        try {
            const normalizedData = await this.getNormalizedDataByFileId(fileId);

            if (!normalizedData || normalizedData.candidates.length === 0) {
                return null;
            }

            const fields = await this.getAvailableMonMasterFields(fileId);

            if (!fields) {
                return null;
            }

            const scoreFieldMap = new Map<string, number>();
            fields.fields.forEach(field => {
                if (field.category === 'score' && field.name.startsWith('score_')) {
                    const label = field.description;
                    scoreFieldMap.set(label, field.index);
                }
            });

            return normalizedData.candidates.map(candidate => {
                // Only include fullName and dateOfBirth
                const record: Record<string, any> = {
                    0: candidate.fullName,
                    1: candidate.dateOfBirth
                };

                // Add scores data
                const candidateScores = normalizedData.candidateScores.filter(
                    score => score.candidateId === candidate.candidateId
                );

                candidateScores.forEach(score => {
                    const index = scoreFieldMap.get(score.scoreLabel);
                    if (index !== undefined) {
                        record[index] = score.scoreValue;
                    }
                });

                return record;
            });
        } catch (error) {
            console.error(`Error converting MonMaster data to indexed records: ${error}`);
            return null;
        }
    }

    /**
     * Get normalized data as indexed record for a single candidate
     * @param monmasterFileId MonMaster file ID
     * @param candidateId Candidate ID
     * @returns Indexed record for the candidate, or null if not found
     */
    async getSingleCandidateAsIndexedRecord(
        monmasterFileId: number,
        candidateId: number
    ): Promise<Record<string, any> | null> {
        try {
            // Get all indexed records for the MonMaster file
            const allRecords = await this.getNormalizedDataAsIndexedRecords(monmasterFileId);

            if (!allRecords) {
                return null;
            }

            // Get the candidate's details to find its record
            const candidateData = await this.getCandidateById(candidateId);
            if (!candidateData) {
                return null;
            }

            // Find the record that matches our candidate
            for (const record of allRecords) {
                // Records have fullName at index 0
                if (record[0] === candidateData.candidate.fullName) {
                    return record;
                }
            }

            return null;
        } catch (error) {
            console.error(`Error getting indexed record for MonMaster candidate ${candidateId}:`, error);
            return null;
        }
    }
}
