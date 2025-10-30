import fs from 'fs';
import { promisify } from 'util';
import { NormalizerRegistry } from '../plugins/normalizer-registry';
import { PvNormalizationModel } from '../models/pv-normalization.model';
import {
    NormalizationResult,
    ProcessPvResult,
    NormalizationError,
    AvailablePvFields,
    IndexedPvField
} from '../types/pv-normalization.types';
import { FileModel } from '../models/file.model';

const readFileAsync = promisify(fs.readFile);

export class PvNormalizationService {
    private model = new PvNormalizationModel();

    constructor() {
        // Initialize the normalizer registry
        NormalizerRegistry.initialize();
    }

    async processPvFile(fileId: number): Promise<ProcessPvResult | null> {
        try {
            const isAlreadyNormalized = await this.model.isFileAlreadyNormalized(fileId);

            if (isAlreadyNormalized) {
                console.error(`File with ID ${fileId} has already been normalized`);
                throw new Error(NormalizationError.ALREADY_NORMALIZED);
            }

            // Get file metadata from the database
            const fileMetadata = await FileModel.getFileById(fileId);

            if (!fileMetadata) {
                console.error(`File with ID ${fileId} not found`);
                return null;
            }

            // Read the file content
            const xmlContent = await readFileAsync(fileMetadata.filePath, 'utf8');

            // Find a suitable normalizer
            const normalizer = NormalizerRegistry.findSuitableNormalizer(xmlContent);

            if (!normalizer) {
                console.error(`No suitable normalizer found for file ${fileMetadata.fileName}`);
                return null;
            }

            // Normalize the data
            const normalizationResult = await normalizer.normalize(xmlContent);

            if (!normalizationResult.success || !normalizationResult.data) {
                console.error(`Normalization failed: ${normalizationResult.errorMessage}`);
                return null;
            }

            // Save the normalized data
            const saveResult = await this.model.saveNormalizedData(fileId, normalizationResult.data);

            if (!saveResult) {
                console.error('Failed to save normalized data');
                return null;
            }

            return {
                fileId,
                normalizedData: normalizationResult.data
            };
        } catch (error) {
            console.error(`Error processing PV file: ${error}`);

            if (error instanceof Error && error.message === NormalizationError.ALREADY_NORMALIZED) {
                throw error;
            }

            return null;
        }
    }

    async getNormalizedDataByPvFileId(fileId: number) {
        return this.model.getNormalizedDataByPvFileId(fileId);
    }

    async deleteNormalizedDataByPvFileId(fileId: number): Promise<boolean> {
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
     * Get available indexed PV fields for a specific file
     * These fields can be used by the mapping service
     */
    async getAvailablePvFields(fileId: number): Promise<AvailablePvFields | null> {
        try {
            const isNormalized = await this.model.isFileAlreadyNormalized(fileId);

            if (!isNormalized) {
                console.error(`File with ID ${fileId} has not been normalized yet`);
                return null;
            }

            const fields: IndexedPvField[] = [
                {
                    index: 0,
                    name: 'name',
                    type: 'string',
                    description: 'Nom complet de l\'étudiant'
                },
                {
                    index: 1,
                    name: 'dateOfBirth',
                    type: 'date',
                    description: 'Date de naissance de l\'étudiant'
                },
                {
                    index: 2,
                    name: 'studentNumber',
                    type: 'string',
                    description: 'Numéro d\'identification de l\'étudiant'
                }
            ];

            const data = await this.getNormalizedDataByPvFileId(fileId);

            if (data && data.length > 0 && data[0].semesterResults) {
                const semesterNames = new Set<string>();
                data.forEach(student => {
                    student.semesterResults.forEach(result => {
                        semesterNames.add(result.semesterName);
                    });
                });

                let index = 3;
                semesterNames.forEach(semesterName => {
                    fields.push({
                        index: index++,
                        name: `grade_${semesterName.replace(/\s+/g, '_')}`,
                        type: 'number',
                        description: `Note pour ${semesterName}`
                    });
                });
            }

            return {
                fileId: fileId,
                fields: fields
            };

        } catch (error) {
            console.error(`Error retrieving available PV fields: ${error}`);
            return null;
        }
    }

    /**
     * Transform normalized data into a format suitable for mapping
     * This converts the hierarchical student objects into flat records with indexed columns
     * The grade values are already normalized during the extraction process
     */
    async getNormalizedDataAsIndexedRecords(fileId: number): Promise<Record<string, any>[] | null> {
        try {
            const normalizedData = await this.getNormalizedDataByPvFileId(fileId);

            if (!normalizedData || normalizedData.length === 0) {
                return null;
            }

            const fields = await this.getAvailablePvFields(fileId);

            if (!fields) {
                return null;
            }

            return normalizedData.map(student => {
                const record: Record<string, any> = {
                    0: student.name,
                    1: student.dateOfBirth,
                    2: student.studentNumber
                };

                const semesterFields = fields.fields.filter(f => f.name.startsWith('grade_'));
                semesterFields.forEach(field => {
                    const semesterName = field.name.replace('grade_', '').replace(/_/g, ' ');
                    const result = student.semesterResults.find(r => r.semesterName === semesterName);
                    record[field.index] = result ? result.grade : null;
                });

                return record;
            });
        } catch (error) {
            console.error(`Error converting normalized data to indexed records: ${error}`);
            return null;
        }
    }

    /**
     * Get normalized data as indexed record for a single student
     * @param pvFileId PV file ID
     * @param studentId Student ID
     * @returns Indexed record for the student, or null if not found
     */
    async getSingleStudentAsIndexedRecord(
        pvFileId: number,
        studentId: number
    ): Promise<Record<string, any> | null> {
        try {
            // Get all indexed records for the PV file
            const allRecords = await this.getNormalizedDataAsIndexedRecords(pvFileId);

            if (!allRecords) {
                return null;
            }

            // Get all normalized data to find the student by ID
            const allStudents = await this.getNormalizedDataByPvFileId(pvFileId);
            if (!allStudents) {
                return null;
            }

            // Find the specific student
            const student = allStudents.find(s => s.studentDataId === studentId);
            if (!student) {
                return null;
            }

            // Find the record that matches our student
            for (const record of allRecords) {
                // Records have name at index 0, studentNumber at index 2
                if (record[0] === student.name && record[2] === student.studentNumber) {
                    return record;
                }
            }

            return null;
        } catch (error) {
            console.error(`Error getting indexed record for PV student ${studentId}:`, error);
            return null;
        }
    }
}
