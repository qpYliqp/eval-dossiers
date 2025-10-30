import pool from '../config/db';
import {
    CandidateMatch,
    ComparisonResult,
    ComparisonSummary,
    ComparisonReport,
    FieldComparison
} from '../types/grade-comparison.types';
import { NormalizedCandidate } from '../types/monmaster-normalization.types';
import { NormalizedStudentData } from '../types/pv-normalization.types';

export class GradeComparisonModel {
    /**
     * Create a new candidate match (mock for external matching service)
     * @param match The candidate match data to create
     * @returns The created candidate match
     */
    async createCandidateMatch(match: CandidateMatch): Promise<CandidateMatch> {
        const result = await pool.query(
            'INSERT INTO "CandidateMatches" ("monmasterFileId", "pvFileId", "monmasterCandidateId", "pvStudentDataId") ' +
            'VALUES ($1, $2, $3, $4) RETURNING *',
            [match.monmasterFileId, match.pvFileId, match.monmasterCandidateId, match.pvStudentDataId]
        );
        return result.rows[0];
    }

    /**
     * Create multiple candidate matches in a transaction
     * @param matches Array of candidate matches to create
     * @returns Array of created candidate matches
     */
    async createCandidateMatches(matches: CandidateMatch[]): Promise<CandidateMatch[]> {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const createdMatches: CandidateMatch[] = [];
            for (const match of matches) {
                const result = await client.query(
                    'INSERT INTO "CandidateMatches" ("monmasterFileId", "pvFileId", "monmasterCandidateId", "pvStudentDataId") ' +
                    'VALUES ($1, $2, $3, $4) RETURNING *',
                    [match.monmasterFileId, match.pvFileId, match.monmasterCandidateId, match.pvStudentDataId]
                );
                createdMatches.push(result.rows[0]);
            }

            await client.query('COMMIT');
            return createdMatches;
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Error creating candidate matches:', error);
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Get candidate matches by MonMaster file ID and PV file ID
     * @param monmasterFileId MonMaster file ID
     * @param pvFileId PV file ID
     * @returns Array of candidate matches
     */
    async getCandidateMatches(monmasterFileId: number, pvFileId: number): Promise<CandidateMatch[]> {
        const result = await pool.query(
            'SELECT * FROM "CandidateMatches" WHERE "monmasterFileId" = $1 AND "pvFileId" = $2',
            [monmasterFileId, pvFileId]
        );
        return result.rows;
    }

    /**
     * Get a candidate match by ID
     * @param matchId Match ID
     * @returns Candidate match or null if not found
     */
    async getCandidateMatchById(matchId: number): Promise<CandidateMatch | null> {
        const result = await pool.query(
            'SELECT * FROM "CandidateMatches" WHERE "matchId" = $1',
            [matchId]
        );
        return result.rows.length > 0 ? result.rows[0] : null;
    }

    /**
     * Get candidate details for a match
     * @param matchId Match ID
     * @returns Object containing candidate details or null if not found
     */
    async getCandidateDetailsForMatch(matchId: number): Promise<{
        monmasterCandidate: NormalizedCandidate,
        pvStudent: NormalizedStudentData
    } | null> {
        const result = await pool.query(
            `SELECT 
                nc.*, 
                nsd.*
            FROM "CandidateMatches" cm
            JOIN "NormalizedCandidates" nc ON cm."monmasterCandidateId" = nc."candidateId"
            JOIN "NormalizedStudentData" nsd ON cm."pvStudentDataId" = nsd."studentDataId"
            WHERE cm."matchId" = $1`,
            [matchId]
        );

        if (result.rows.length === 0) {
            return null;
        }

        const row = result.rows[0];
        return {
            monmasterCandidate: {
                candidateId: row.candidateId,
                monmasterFileId: row.monmasterFileId,
                lastName: row.lastName,
                firstName: row.firstName,
                fullName: row.fullName,
                candidateNumber: row.candidateNumber,
                dateOfBirth: row.dateOfBirth,
                processedDate: row.processedDate
            },
            pvStudent: {
                name: row.name,
                dateOfBirth: row.pvDateOfBirth,
                studentNumber: row.studentNumber,
                semesterResults: []
            }
        };
    }

    /**
     * Delete a candidate match
     * @param matchId Match ID
     * @returns True if deleted, false otherwise
     */
    async deleteCandidateMatch(matchId: number): Promise<boolean> {
        const result = await pool.query(
            'DELETE FROM "CandidateMatches" WHERE "matchId" = $1',
            [matchId]
        );
        return (result.rowCount ?? 0) > 0;
    }

    /**
     * Save a comparison result
     * @param result The comparison result to save
     * @returns The saved comparison result
     */
    async saveComparisonResult(result: ComparisonResult): Promise<ComparisonResult> {
        const queryResult = await pool.query(
            'INSERT INTO "ComparisonResults" ("matchId", "fieldName", "monmasterValue", "pvValue", "similarityScore", "verificationStatus") ' +
            'VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [
                result.matchId,
                result.fieldName,
                result.monmasterValue || null,
                result.pvValue || null,
                result.similarityScore,
                result.verificationStatus
            ]
        );
        return queryResult.rows[0];
    }

    /**
     * Save multiple comparison results in a transaction
     * @param results Array of comparison results to save
     * @returns Array of saved comparison results
     */
    async saveComparisonResults(results: ComparisonResult[]): Promise<ComparisonResult[]> {
        if (results.length === 0) return [];

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const savedResults: ComparisonResult[] = [];
            for (const result of results) {
                const queryResult = await client.query(
                    'INSERT INTO "ComparisonResults" ("matchId", "fieldName", "monmasterValue", "pvValue", "similarityScore", "verificationStatus") ' +
                    'VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
                    [
                        result.matchId,
                        result.fieldName,
                        result.monmasterValue || null,
                        result.pvValue || null,
                        result.similarityScore,
                        result.verificationStatus
                    ]
                );
                savedResults.push(queryResult.rows[0]);
            }

            await client.query('COMMIT');
            return savedResults;
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Error saving comparison results:', error);
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Get comparison results by match ID
     * @param matchId Match ID
     * @returns Array of comparison results
     */
    async getComparisonResultsByMatchId(matchId: number): Promise<ComparisonResult[]> {
        const result = await pool.query(
            'SELECT * FROM "ComparisonResults" WHERE "matchId" = $1 ORDER BY "fieldName"',
            [matchId]
        );
        return result.rows;
    }

    /**
     * Save a comparison summary
     * @param summary The comparison summary to save
     * @returns The saved comparison summary
     */
    async saveComparisonSummary(summary: ComparisonSummary): Promise<ComparisonSummary> {
        // Check if a summary already exists for this match
        const existingResult = await pool.query(
            'SELECT * FROM "ComparisonSummary" WHERE "matchId" = $1',
            [summary.matchId]
        );

        if (existingResult.rows.length > 0) {
            // Update existing summary
            const result = await pool.query(
                'UPDATE "ComparisonSummary" SET "averageSimilarity" = $1, "overallVerificationStatus" = $2 ' +
                'WHERE "matchId" = $3 RETURNING *',
                [summary.averageSimilarity, summary.overallVerificationStatus, summary.matchId]
            );
            return result.rows[0];
        } else {
            // Create new summary
            const result = await pool.query(
                'INSERT INTO "ComparisonSummary" ("matchId", "averageSimilarity", "overallVerificationStatus") ' +
                'VALUES ($1, $2, $3) RETURNING *',
                [summary.matchId, summary.averageSimilarity, summary.overallVerificationStatus]
            );
            return result.rows[0];
        }
    }

    /**
     * Get a comparison summary by match ID
     * @param matchId Match ID
     * @returns Comparison summary or null if not found
     */
    async getComparisonSummaryByMatchId(matchId: number): Promise<ComparisonSummary | null> {
        const result = await pool.query(
            'SELECT * FROM "ComparisonSummary" WHERE "matchId" = $1',
            [matchId]
        );
        return result.rows.length > 0 ? result.rows[0] : null;
    }

    /**
     * Get a complete comparison report including match, results and summary
     * @param matchId Match ID
     * @returns Comparison report or null if not found
     */
    async getComparisonReport(matchId: number): Promise<ComparisonReport | null> {
        try {
            // Get the candidate match
            const matchResult = await pool.query(
                `SELECT 
                    cm.*,
                    nc."fullName" as "monmasterFullName",
                    nc."dateOfBirth" as "monmasterDateOfBirth",
                    ns."name" as "pvName",
                    ns."dateOfBirth" as "pvDateOfBirth"
                FROM "CandidateMatches" cm
                JOIN "NormalizedCandidates" nc ON cm."monmasterCandidateId" = nc."candidateId"
                JOIN "NormalizedStudentData" ns ON cm."pvStudentDataId" = ns."studentDataId"
                WHERE cm."matchId" = $1`,
                [matchId]
            );

            if (matchResult.rows.length === 0) {
                return null;
            }

            const match = matchResult.rows[0];

            // Get the comparison summary
            const summaryResult = await pool.query(
                'SELECT * FROM "ComparisonSummary" WHERE "matchId" = $1',
                [matchId]
            );

            if (summaryResult.rows.length === 0) {
                return null;
            }

            const summary = summaryResult.rows[0];

            // Get the comparison results
            const resultsResult = await pool.query(
                'SELECT * FROM "ComparisonResults" WHERE "matchId" = $1 ORDER BY "fieldName"',
                [matchId]
            );

            const fieldComparisons: FieldComparison[] = resultsResult.rows.map(row => ({
                fieldName: row.fieldName,
                monmasterValue: row.monmasterValue,
                pvValue: row.pvValue,
                similarityScore: row.similarityScore,
                verificationStatus: row.verificationStatus
            }));

            // Construct the report
            const report: ComparisonReport = {
                candidate: {
                    monmasterCandidateId: match.monmasterCandidateId,
                    pvStudentDataId: match.pvStudentDataId,
                    fullName: match.monmasterFullName || match.pvName || '',
                    dateOfBirth: match.monmasterDateOfBirth || match.pvDateOfBirth
                },
                monmasterFileId: match.monmasterFileId,
                pvFileId: match.pvFileId,
                averageSimilarity: summary.averageSimilarity,
                overallVerificationStatus: summary.overallVerificationStatus,
                fields: fieldComparisons
            };

            return report;
        } catch (error) {
            console.error('Error retrieving comparison report:', error);
            return null;
        }
    }

    /**
     * Get all comparison reports for a specific MonMaster file and PV file
     * @param monmasterFileId MonMaster file ID
     * @param pvFileId PV file ID
     * @returns Array of comparison reports
     */
    async getComparisonReportsByFileIds(monmasterFileId: number, pvFileId: number): Promise<ComparisonReport[]> {
        try {
            // Get all matches between the files
            const matchesResult = await pool.query(
                'SELECT "matchId" FROM "CandidateMatches" WHERE "monmasterFileId" = $1 AND "pvFileId" = $2',
                [monmasterFileId, pvFileId]
            );

            if (matchesResult.rows.length === 0) {
                return [];
            }

            // Get reports for each match
            const reports: ComparisonReport[] = [];
            for (const row of matchesResult.rows) {
                const report = await this.getComparisonReport(row.matchId);
                if (report) {
                    reports.push(report);
                }
            }

            return reports;
        } catch (error) {
            console.error('Error retrieving comparison reports by file IDs:', error);
            return [];
        }
    }

    /**
     * Get all comparison reports for a specific MonMaster candidate across all PV files
     * @param monmasterCandidateId MonMaster candidate ID
     * @returns Array of comparison reports
     */
    async getComparisonReportsByCandidateId(monmasterCandidateId: number): Promise<ComparisonReport[]> {
        try {
            // Get all matches involving this candidate
            const matchesResult = await pool.query(
                'SELECT "matchId" FROM "CandidateMatches" WHERE "monmasterCandidateId" = $1',
                [monmasterCandidateId]
            );

            if (matchesResult.rows.length === 0) {
                return [];
            }

            // Get reports for each match
            const reports: ComparisonReport[] = [];
            for (const row of matchesResult.rows) {
                const report = await this.getComparisonReport(row.matchId);
                if (report) {
                    reports.push(report);
                }
            }

            return reports;
        } catch (error) {
            console.error(`Error retrieving comparison reports for candidate ID ${monmasterCandidateId}:`, error);
            return [];
        }
    }

    /**
     * Delete all comparison data for a match
     * @param matchId Match ID
     * @returns True if deleted, false otherwise
     */
    async deleteComparisonDataForMatch(matchId: number): Promise<boolean> {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Delete summary
            await client.query('DELETE FROM "ComparisonSummary" WHERE "matchId" = $1', [matchId]);

            // Delete results
            await client.query('DELETE FROM "ComparisonResults" WHERE "matchId" = $1', [matchId]);

            // Delete match
            const result = await client.query('DELETE FROM "CandidateMatches" WHERE "matchId" = $1', [matchId]);

            await client.query('COMMIT');

            return (result.rowCount ?? 0) > 0;
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Error deleting comparison data:', error);
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Delete all comparison data for a master program
     * @param masterId Master program ID
     * @returns Number of matches deleted
     */
    async deleteComparisonDataForMasterProgram(masterId: number): Promise<number> {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Step 1: Find all files associated with this master program
            const filesResult = await client.query(
                'SELECT "fileId" FROM "Files" WHERE "masterId" = $1',
                [masterId]
            );

            if (filesResult.rows.length === 0) {
                await client.query('COMMIT');
                return 0;
            }

            const fileIds = filesResult.rows.map(row => row.fileId);

            // Step 2: Find all matches involving these files
            const matchesResult = await client.query(
                'SELECT "matchId" FROM "CandidateMatches" WHERE "monmasterFileId" = ANY($1) OR "pvFileId" = ANY($1)',
                [fileIds]
            );

            if (matchesResult.rows.length === 0) {
                await client.query('COMMIT');
                return 0;
            }

            const matchIds = matchesResult.rows.map(row => row.matchId);

            // Step 3: Delete all comparison summaries for these matches
            await client.query(
                'DELETE FROM "ComparisonSummary" WHERE "matchId" = ANY($1)',
                [matchIds]
            );

            // Step 4: Delete all comparison results for these matches
            await client.query(
                'DELETE FROM "ComparisonResults" WHERE "matchId" = ANY($1)',
                [matchIds]
            );

            // Step 5: Delete all candidate matches
            const deleteResult = await client.query(
                'DELETE FROM "CandidateMatches" WHERE "matchId" = ANY($1)',
                [matchIds]
            );

            await client.query('COMMIT');
            return deleteResult.rowCount || 0;
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Error deleting comparison data for master program:', error);
            throw error;
        } finally {
            client.release();
        }
    }
}
