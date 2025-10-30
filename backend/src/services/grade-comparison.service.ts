import { GradeComparisonModel } from '../models/grade-comparison.model';
import { MonMasterNormalizationModel } from '../models/monmaster-normalization.model';
import { PvNormalizationModel } from '../models/pv-normalization.model';
import { FuzzyMatchingService } from './fuzzy-matching.service';
import { MappingService } from './mapping.service';
import {
    CandidateMatch,
    ComparisonResult,
    ComparisonReport,
    VerificationStatus,
    CandidateMatchingResult,
    StudentTableData,
} from '../types/grade-comparison.types';
import { AcademicRecord, CandidateScore, NormalizedCandidate } from '../types/monmaster-normalization.types';
import { NormalizedStudentData } from '../types/pv-normalization.types';
import { MonMasterNormalizationService } from './monmaster-normalization.service';
import { PvNormalizationService } from './pv-normalization.service';
import { FileService } from './file.service';
import { FileOrigin } from '../types/file.types';

export class GradeComparisonService {
    private model: GradeComparisonModel;
    private monmasterModel: MonMasterNormalizationModel;
    private pvModel: PvNormalizationModel;
    private fuzzyMatchingService: FuzzyMatchingService;
    private mappingService: MappingService;
    private monmasterService: MonMasterNormalizationService;
    private pvService: PvNormalizationService;

    constructor() {
        this.model = new GradeComparisonModel();
        this.monmasterModel = new MonMasterNormalizationModel();
        this.pvModel = new PvNormalizationModel();
        this.fuzzyMatchingService = new FuzzyMatchingService();
        this.mappingService = new MappingService();
        this.monmasterService = new MonMasterNormalizationService();
        this.pvService = new PvNormalizationService();
    }

    /**
     * Mock candidate matching service (for now)
     * This would eventually be replaced with a call to an external service
     * @param monmasterFileId MonMaster file ID
     * @param pvFileId PV file ID
     */
    async mockCandidateMatching(monmasterFileId: number, pvFileId: number): Promise<CandidateMatchingResult | null> {
        try {
            // Get MonMaster candidates
            const monmasterData = await this.monmasterModel.getNormalizedDataByFileId(monmasterFileId);
            if (!monmasterData || monmasterData.candidates.length === 0) {
                return null;
            }

            // Get PV students
            const pvData = await this.pvModel.getNormalizedDataByPvFileId(pvFileId);
            if (!pvData || pvData.length === 0) {
                return null;
            }

            // Map to format expected by fuzzy matching service
            const monmasterCandidates = monmasterData.candidates.map(candidate => ({
                id: candidate.candidateId!,
                firstName: candidate.firstName,
                lastName: candidate.lastName,
                dateOfBirth: candidate.dateOfBirth
            }));

            const pvCandidates = pvData.map(student => ({
                id: student.studentDataId!,
                firstName: '', // PV data might not have separated first/last names
                lastName: student.name, // Put full name in lastName for matching
                dateOfBirth: student.dateOfBirth
            }));

            // Use fuzzy matching to find best matches
            const matchResults = this.fuzzyMatchingService.findBestMatches(monmasterCandidates, pvCandidates);

            // Transform to the expected format
            const matches = matchResults.map(match => ({
                monmasterCandidateId: match.source.id as number,
                pvStudentDataId: match.target.id as number,
                score: match.score
            }));

            return {
                monmasterFileId,
                pvFileId,
                matches
            };
        } catch (error) {
            console.error("Error in mock candidate matching:", error);
            return null;
        }
    }

    /**
     * Create candidate matches based on matching results
     * @param matchingResult Result from candidate matching
     * @returns Created candidate matches
     */
    async createCandidateMatches(matchingResult: CandidateMatchingResult): Promise<CandidateMatch[]> {
        const matches: CandidateMatch[] = matchingResult.matches.map(match => ({
            monmasterFileId: matchingResult.monmasterFileId,
            pvFileId: matchingResult.pvFileId,
            monmasterCandidateId: match.monmasterCandidateId,
            pvStudentDataId: match.pvStudentDataId
        }));

        return await this.model.createCandidateMatches(matches);
    }

    /**
     * Calculate similarity between two grades
     * @param grade1 First grade (already normalized to 0-20 scale)
     * @param grade2 Second grade (already normalized to 0-20 scale)
     * @returns Similarity score between 0 and 1
     */
    private calculateGradeSimilarity(grade1: number | null, grade2: number | null): number {
        // If either grade is missing, we can't verify
        if (grade1 === null || grade2 === null) {
            return 0;
        }

        // Calculate the difference as a percentage of the maximum possible difference (20)
        const diff = Math.abs(grade1 - grade2);
        const maxDiff = 20;

        // Convert difference to a similarity score (0 to 1)
        // Where 0 difference = 1 (perfect match) and maxDiff = 0 (complete mismatch)
        return Math.max(0, 1 - (diff / maxDiff));
    }

    /**
     * Determine verification status based on similarity score
     * @param similarityScore Similarity score between 0 and 1
     * @returns Verification status
     */
    private determineVerificationStatus(similarityScore: number): VerificationStatus {
        if (similarityScore >= 0.95) {
            return VerificationStatus.FULLY_VERIFIED;
        } else if (similarityScore >= 0.80) {
            return VerificationStatus.PARTIALLY_VERIFIED;
        } else if (similarityScore > 0) {
            return VerificationStatus.FRAUD;
        } else {
            return VerificationStatus.CANNOT_VERIFY;
        }
    }

    /**
     * Compare grades between MonMaster candidate and PV student using mapping entries
     * @param monmasterCandidate MonMaster candidate data
     * @param pvStudent PV student data
     * @param monmasterFileId MonMaster file ID
     * @param pvFileId PV file ID
     * @returns Array of comparison results
     */
    private async compareGrades(
        monmasterCandidate: {
            candidate: NormalizedCandidate;
            academicRecords: AcademicRecord[];
            scores: CandidateScore[];
        },
        pvStudent: NormalizedStudentData,
        monmasterFileId: number,
        pvFileId: number
    ): Promise<{
        results: ComparisonResult[],
        averageSimilarity: number,
        overallVerificationStatus: VerificationStatus
    }> {
        const results: ComparisonResult[] = [];
        let totalSimilarity = 0;
        let fieldCount = 0;

        try {
            // Get mapping configuration for these files
            const mappingConfig = await this.mappingService.getMappingConfiguration(monmasterFileId, pvFileId);

            if (!mappingConfig || !mappingConfig.entries || mappingConfig.entries.length === 0) {
                console.warn(`No mapping entries found between MonMaster file ${monmasterFileId} and PV file ${pvFileId}`);
                return {
                    results: [],
                    averageSimilarity: 0,
                    overallVerificationStatus: VerificationStatus.CANNOT_VERIFY
                };
            }

            const monmasterRecord = await this.monmasterService.getSingleCandidateAsIndexedRecord(
                monmasterFileId,
                monmasterCandidate.candidate.candidateId!
            );

            const pvRecord = await this.pvService.getSingleStudentAsIndexedRecord(
                pvFileId,
                pvStudent.studentDataId!
            );

            if (!monmasterRecord || !pvRecord) {
                console.error('Could not get indexed records for comparison');
                return {
                    results: [],
                    averageSimilarity: 0,
                    overallVerificationStatus: VerificationStatus.CANNOT_VERIFY
                };
            }

            // For each mapping entry that maps grade-related fields
            for (const entry of mappingConfig.entries) {
                // Filter for grade-related fields
                // MonMaster scores start at index 2+, PV grades at index 3+
                const isMonMasterGradeField = entry.masterColumnIndex >= 2;
                const isPvGradeField = entry.pvColumnIndex >= 3;

                if (!isMonMasterGradeField || !isPvGradeField) {
                    continue; // Skip non-grade field mappings
                }

                // Get the actual values from the indexed records
                const monmasterValue = monmasterRecord[entry.masterColumnIndex]?.toString() || '';
                const pvValue = pvRecord[entry.pvColumnIndex]?.toString() || '';

                // Field name for the comparison result
                const fieldName = `${entry.masterColumnName} -> ${entry.pvColumnName}`;

                // If either value is missing, mark as cannot verify
                if (!monmasterValue || !pvValue) {
                    results.push({
                        matchId: 0, // Will be filled in later
                        fieldName,
                        monmasterValue,
                        pvValue,
                        similarityScore: 0,
                        verificationStatus: VerificationStatus.CANNOT_VERIFY
                    });
                    continue;
                }

                // Since values are already normalized during extraction, we can directly parse them
                const numericMonmaster = parseFloat(monmasterValue);
                const numericPv = parseFloat(pvValue);

                // Ensure we have valid numbers
                if (isNaN(numericMonmaster) || isNaN(numericPv)) {
                    results.push({
                        matchId: 0,
                        fieldName,
                        monmasterValue,
                        pvValue,
                        similarityScore: 0,
                        verificationStatus: VerificationStatus.CANNOT_VERIFY
                    });
                    continue;
                }

                // Calculate similarity between grades
                const similarity = this.calculateGradeSimilarity(numericMonmaster, numericPv);

                // Determine verification status based on similarity
                const status = this.determineVerificationStatus(similarity);

                // Add result
                results.push({
                    matchId: 0, // Will be filled in later
                    fieldName,
                    monmasterValue,
                    pvValue,
                    similarityScore: similarity,
                    verificationStatus: status
                });

                totalSimilarity += similarity;
                fieldCount++;
            }

            // Calculate average similarity
            const averageSimilarity = fieldCount > 0 ? totalSimilarity / fieldCount : 0;

            // Determine overall verification status
            const overallVerificationStatus = fieldCount > 0
                ? this.determineVerificationStatus(averageSimilarity)
                : VerificationStatus.CANNOT_VERIFY;

            return {
                results,
                averageSimilarity,
                overallVerificationStatus
            };
        } catch (error) {
            console.error('Error comparing grades using mapping entries:', error);
            return {
                results: [],
                averageSimilarity: 0,
                overallVerificationStatus: VerificationStatus.CANNOT_VERIFY
            };
        }
    }

    /**
     * Process grade comparisons for a match
     * @param matchId ID of the candidate match
     * @returns True if successful, false otherwise
     */
    async processGradeComparison(matchId: number): Promise<boolean> {
        try {
            // Get match details
            const match = await this.model.getCandidateMatchById(matchId);
            if (!match) {
                console.error(`Match with ID ${matchId} not found`);
                return false;
            }

            // Get MonMaster candidate details
            const monmasterCandidateData = await this.monmasterModel.getCandidateById(match.monmasterCandidateId);
            if (!monmasterCandidateData) {
                console.error(`MonMaster candidate with ID ${match.monmasterCandidateId} not found`);
                return false;
            }

            // Get PV student details
            const pvData = await this.pvModel.getNormalizedDataByPvFileId(match.pvFileId);
            if (!pvData || pvData.length === 0) {
                console.error(`PV data for file ID ${match.pvFileId} not found`);
                return false;
            }

            // Find the specific PV student
            const pvStudent = pvData.find(student => student.studentDataId === match.pvStudentDataId);
            if (!pvStudent) {
                console.error(`PV student with ID ${match.pvStudentDataId} not found`);
                return false;
            }

            // Compare grades using the mapping entries
            const comparison = await this.compareGrades(
                monmasterCandidateData,
                pvStudent,
                match.monmasterFileId,
                match.pvFileId
            );

            // Add matchId to results
            const resultsWithMatchId = comparison.results.map(result => ({
                ...result,
                matchId
            }));

            // Save results to database
            await this.model.saveComparisonResults(resultsWithMatchId);

            // Save summary to database
            await this.model.saveComparisonSummary({
                matchId,
                averageSimilarity: comparison.averageSimilarity,
                overallVerificationStatus: comparison.overallVerificationStatus
            });

            return true;
        } catch (error) {
            console.error(`Error processing grade comparison for match ${matchId}:`, error);
            return false;
        }
    }

    /**
     * Process grade comparisons for all matches between MonMaster and PV files
     * @param monmasterFileId MonMaster file ID
     * @param pvFileId PV file ID
     * @returns True if successful, false otherwise
     */
    async processFileComparisons(monmasterFileId: number, pvFileId: number): Promise<boolean> {
        try {
            // Check if we already have matches
            const existingMatches = await this.model.getCandidateMatches(monmasterFileId, pvFileId);

            // If no existing matches, create them
            if (existingMatches.length === 0) {
                const matchingResult = await this.mockCandidateMatching(monmasterFileId, pvFileId);
                if (!matchingResult || matchingResult.matches.length === 0) {
                    console.error('No matches found between MonMaster and PV files');
                    return false;
                }

                existingMatches.push(...await this.createCandidateMatches(matchingResult));
            }

            // Process each match
            for (const match of existingMatches) {
                await this.processGradeComparison(match.matchId!);
            }

            return true;
        } catch (error) {
            console.error(`Error processing file comparisons for MonMaster file ${monmasterFileId} and PV file ${pvFileId}:`, error);
            return false;
        }
    }

    /**
     * Get a comparison report for a candidate
     * @param matchId ID of the candidate match
     * @returns Comparison report or null if not found
     */
    async getComparisonReport(matchId: number): Promise<ComparisonReport | null> {
        return await this.model.getComparisonReport(matchId);
    }

    /**
     * Get all comparison reports for MonMaster and PV files
     * @param monmasterFileId MonMaster file ID
     * @param pvFileId PV file ID
     * @returns Array of comparison reports
     */
    async getComparisonReports(monmasterFileId: number, pvFileId: number): Promise<ComparisonReport[]> {
        return await this.model.getComparisonReportsByFileIds(monmasterFileId, pvFileId);
    }

    /**
     * Get all comparison reports for a specific candidate across all PV files
     * @param monmasterCandidateId MonMaster candidate ID
     * @returns Array of comparison reports for the candidate
     */
    async getComparisonReportsByCandidateId(monmasterCandidateId: number): Promise<ComparisonReport[]> {
        return await this.model.getComparisonReportsByCandidateId(monmasterCandidateId);
    }

    /**
     * Get all comparison reports for a master program, grouped by candidate
     * @param masterId Master program ID
     * @returns Array of comparison reports for all file pairs in the master program
     */
    async getComparisonReportsByMasterId(masterId: number): Promise<ComparisonReport[]> {
        try {
            // Get the MonMaster file for this master program
            const monmasterFiles = await FileService.getFilesByMasterIdAndOrigin(masterId, FileOrigin.MonMaster);

            // There should only be one MonMaster file per master program
            if (monmasterFiles.length === 0) {
                console.warn(`No MonMaster file found for master program ID ${masterId}`);
                return [];
            }

            const monmasterFileId = monmasterFiles[0].fileId!;

            // Get all PV files for this master program
            const pvFiles = await FileService.getFilesByMasterIdAndOrigin(masterId, FileOrigin.PV);

            if (pvFiles.length === 0) {
                console.warn(`No PV files found for master program ID ${masterId}`);
                return [];
            }

            // Get reports for each combination
            let allReports: ComparisonReport[] = [];

            for (const pvFile of pvFiles) {
                const pvFileId = pvFile.fileId!;

                try {
                    const reports = await this.getComparisonReports(monmasterFileId, pvFileId);
                    allReports = [...allReports, ...reports];
                } catch (error) {
                    console.error(`Error retrieving reports for MonMaster file ${monmasterFileId} and PV file ${pvFileId}:`, error);
                }
            }

            return allReports;
        } catch (error) {
            console.error(`Error retrieving comparison reports for master program ID ${masterId}:`, error);
            return [];
        }
    }

    /**
     * Get all candidate matches for MonMaster and PV files
     * @param monmasterFileId MonMaster file ID
     * @param pvFileId PV file ID
     * @returns Array of candidate matches
     */
    async getCandidateMatches(monmasterFileId: number, pvFileId: number): Promise<CandidateMatch[]> {
        return await this.model.getCandidateMatches(monmasterFileId, pvFileId);
    }

    /**
     * Delete a comparison and all its related data
     * @param matchId ID of the candidate match to delete
     * @returns True if deleted, false otherwise
     */
    async deleteComparison(matchId: number): Promise<boolean> {
        return await this.model.deleteComparisonDataForMatch(matchId);
    }

    /**
     * Delete all comparison data for a master program
     * @param masterId Master program ID
     * @returns Number of matches deleted
     */
    async deleteComparisonDataForMasterProgram(masterId: number): Promise<number> {
        try {
            return await this.model.deleteComparisonDataForMasterProgram(masterId);
        } catch (error) {
            console.error(`Error deleting comparison data for master program ${masterId}:`, error);
            throw error;
        }
    }

    /**
     * Process grade comparisons for all files in a master program
     * @param masterId Master program ID
     * @returns Object containing success status and processing results
     */
    async processMasterProgramComparisons(masterId: number): Promise<{
        success: boolean;
        message: string;
        results: {
            monmasterFileId: number;
            pvFileId: number;
            success: boolean;
        }[];
    }> {
        try {
            // First, delete any existing comparison data for this master program
            const deletedCount = await this.deleteComparisonDataForMasterProgram(masterId);
            console.log(`Deleted ${deletedCount} existing comparison matches for master program ${masterId}`);

            // Get the MonMaster file for this master program
            const monmasterFiles = await FileService.getFilesByMasterIdAndOrigin(masterId, FileOrigin.MonMaster);

            // There should only be one MonMaster file per master program
            if (monmasterFiles.length === 0) {
                return {
                    success: false,
                    message: `No MonMaster file found for master program ID ${masterId}`,
                    results: []
                };
            }

            const monmasterFileId = monmasterFiles[0].fileId!;

            // Get all PV files for this master program
            const pvFiles = await FileService.getFilesByMasterIdAndOrigin(masterId, FileOrigin.PV);

            if (pvFiles.length === 0) {
                return {
                    success: false,
                    message: `No PV files found for master program ID ${masterId}`,
                    results: []
                };
            }

            // Process each combination
            const results = [];

            for (const pvFile of pvFiles) {
                const pvFileId = pvFile.fileId!;

                try {
                    const success = await this.processFileComparisons(monmasterFileId, pvFileId);
                    results.push({
                        monmasterFileId,
                        pvFileId,
                        success
                    });
                } catch (error) {
                    console.error(`Error processing comparison for MonMaster file ${monmasterFileId} and PV file ${pvFileId}:`, error);
                    results.push({
                        monmasterFileId,
                        pvFileId,
                        success: false
                    });
                }
            }

            return {
                success: results.some(r => r.success), // At least one successful comparison
                message: `Processed ${results.length} file combinations for master program ID ${masterId}. Previously deleted ${deletedCount} existing comparisons.`,
                results
            };

        } catch (error) {
            console.error(`Error processing master program comparisons for ID ${masterId}:`, error);
            return {
                success: false,
                message: `Error processing master program comparisons: ${error instanceof Error ? error.message : 'Unknown error'}`,
                results: []
            };
        }
    }

    /**
     * Get structured student data for table rendering in the frontend
     * @param masterId Master program ID
     * @returns Object containing columns structure and student data array
     */
    async getStudentTableData(masterId: number): Promise<{
        columns: { id: string; label: string; type: string }[];
        students: StudentTableData[];
    }> {
        try {
            // Get the MonMaster file for this master program
            const monmasterFiles = await FileService.getFilesByMasterIdAndOrigin(masterId, FileOrigin.MonMaster);

            // There should only be one MonMaster file per master program
            if (monmasterFiles.length === 0) {
                console.warn(`No MonMaster file found for master program ID ${masterId}`);
                return { columns: [], students: [] };
            }

            const monmasterFileId = monmasterFiles[0].fileId!;

            // Get normalized MonMaster data
            const monmasterData = await this.monmasterModel.getNormalizedDataByFileId(monmasterFileId);

            if (!monmasterData || monmasterData.candidates.length === 0) {
                return { columns: [], students: [] };
            }

            const studentTableData: StudentTableData[] = [];

            // Process each candidate
            for (const candidate of monmasterData.candidates) {
                // Get academic records for this candidate
                const academicRecords = monmasterData.academicRecords.filter(
                    record => record.candidateId === candidate.candidateId
                );

                // Find the most recent academic record based on academicYear
                let latestRecord: AcademicRecord | null = null;
                if (academicRecords.length > 0) {
                    // Sort by academic year in descending order
                    const sortedRecords = [...academicRecords].sort((a, b) => {
                        // Extract years from academic year strings like "2022-2023"
                        const yearA = a.academicYear ? parseInt(a.academicYear.split('-')[0]) : 0;
                        const yearB = b.academicYear ? parseInt(b.academicYear.split('-')[0]) : 0;
                        return yearB - yearA; // Descending order
                    });

                    latestRecord = sortedRecords[0];
                }

                // Get scores for this candidate
                const scores = monmasterData.candidateScores.filter(
                    score => score.candidateId === candidate.candidateId
                );

                // Convert scores to the expected format
                const scoresObject: { [label: string]: string } = {};
                scores.forEach(score => {
                    scoresObject[score.scoreLabel] = score.scoreValue;
                });

                // Get verification status for this candidate from the latest comparison
                let verificationStatus: VerificationStatus = VerificationStatus.CANNOT_VERIFY; // Default to cannot verify
                try {
                    const reports = await this.model.getComparisonReportsByCandidateId(candidate.candidateId!);

                    if (reports && reports.length > 0) {
                        // Use the status from the latest report
                        const latestReport = reports[0]; // Assuming reports are returned in reverse chronological order
                        verificationStatus = latestReport.overallVerificationStatus;
                    }
                } catch (error) {
                    console.warn(`Could not get verification status for candidate ${candidate.candidateId}:`, error);
                }

                // Create table data entry
                const tableData: StudentTableData = {
                    candidateId: candidate.candidateId!,
                    fullName: candidate.fullName,
                    dateOfBirth: candidate.dateOfBirth,
                    candidateNumber: candidate.candidateNumber,
                    latestInstitution: latestRecord ? latestRecord.institution : '',
                    scores: scoresObject,
                    verificationStatus
                };

                studentTableData.push(tableData);
            }

            // Extract unique score labels from all students to create dynamic columns
            const scoreLabels = new Set<string>();
            studentTableData.forEach(student => {
                Object.keys(student.scores).forEach(label => {
                    scoreLabels.add(label);
                });
            });

            // Create columns array for table structure
            const columns = [
                { id: 'fullName', label: 'Nom complet', type: 'string' },
                { id: 'dateOfBirth', label: 'Date de naissance', type: 'date' },
                { id: 'candidateNumber', label: 'Numéro de candidat', type: 'string' },
                { id: 'latestInstitution', label: 'Institution', type: 'string' },
                // Add dynamic score columns
                ...Array.from(scoreLabels).map(label => ({
                    id: `score_${label.replace(/\s+/g, '_')}`,
                    label: label,
                    type: 'number'
                }))
            ];

            return {
                columns,
                students: studentTableData
            };
        } catch (error) {
            console.error(`Error getting student table data for master ID ${masterId}:`, error);
            return {
                columns: [],
                students: []
            };
        }
    }

}
