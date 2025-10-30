import pool from '../config/db';
import {
    NormalizedCandidate,
    AcademicRecord,
    CandidateScore,
    MonMasterNormalizationResult
} from '../types/monmaster-normalization.types';

export class MonMasterNormalizationModel {
    /**
     * Save normalized MonMaster data to the database
     * @param monmasterFileId ID of the MonMaster file
     * @param candidates Normalized candidate data
     * @param academicRecords Academic records for candidates
     * @param candidateScores Optional scores for candidates
     */
    async saveNormalizedData(
        monmasterFileId: number,
        candidates: NormalizedCandidate[],
        academicRecords: AcademicRecord[],
        candidateScores: CandidateScore[]
    ): Promise<boolean> {
        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            // Create a mapping from temp IDs to database IDs
            const candidateIdMap = new Map<number, number>();

            // Insert all candidates and collect their database-generated IDs
            for (const candidate of candidates) {
                const candidateResult = await client.query(
                    `INSERT INTO "NormalizedCandidates" 
                    ("monmasterFileId", "lastName", "firstName", "fullName", "candidateNumber", "dateOfBirth") 
                    VALUES ($1, $2, $3, $4, $5, $6)
                    RETURNING "candidateId"`,
                    [
                        monmasterFileId,
                        candidate.lastName,
                        candidate.firstName,
                        candidate.fullName,
                        candidate.candidateNumber,
                        candidate.dateOfBirth
                    ]
                );

                const dbCandidateId = candidateResult.rows[0].candidateId;

                // Store the mapping from temp ID to database ID
                if (candidate.candidateId) {
                    candidateIdMap.set(candidate.candidateId, dbCandidateId);
                }

                // Find academic records for this candidate and insert them
                const recordsForCandidate = academicRecords.filter(
                    record => record.candidateId === candidate.candidateId
                );

                for (const record of recordsForCandidate) {
                    await client.query(
                        `INSERT INTO "AcademicRecords" 
                        ("candidateId", "academicYear", "programType", "curriculumYear", 
                        "specialization", "coursePath", "gradeSemester1", "gradeSemester2", "institution") 
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
                        [
                            dbCandidateId,
                            record.academicYear,
                            record.programType,
                            record.curriculumYear,
                            record.specialization,
                            record.coursePath,
                            record.gradeSemester1,
                            record.gradeSemester2,
                            record.institution
                        ]
                    );
                }

                // Find candidate scores for this candidate and insert them
                const scoresForCandidate = candidateScores.filter(
                    score => score.candidateId === candidate.candidateId
                );

                for (const score of scoresForCandidate) {
                    await client.query(
                        `INSERT INTO "CandidateScores" 
                        ("candidateId", "scoreLabel", "scoreValue") 
                        VALUES ($1, $2, $3)`,
                        [
                            dbCandidateId,
                            score.scoreLabel,
                            score.scoreValue
                        ]
                    );
                }
            }

            await client.query('COMMIT');
            return true;
        } catch (error) {
            await client.query('ROLLBACK');
            console.error(`Error saving normalized MonMaster data: ${error}`);
            return false;
        } finally {
            client.release();
        }
    }

    /**
     * Check if a MonMaster file has already been normalized
     * @param monmasterFileId File ID to check
     */
    async isFileAlreadyNormalized(monmasterFileId: number): Promise<boolean> {
        try {
            const result = await pool.query(
                `SELECT COUNT(*) as count FROM "NormalizedCandidates" WHERE "monmasterFileId" = $1`,
                [monmasterFileId]
            );

            return parseInt(result.rows[0].count) > 0;
        } catch (error) {
            console.error(`Error checking if MonMaster file is already normalized: ${error}`);
            return false;
        }
    }

    /**
     * Get normalized data for a specific MonMaster file
     * @param monmasterFileId File ID to retrieve data for
     */
    async getNormalizedDataByFileId(monmasterFileId: number): Promise<MonMasterNormalizationResult | null> {
        try {
            // Get all candidates
            const candidatesResult = await pool.query(
                `SELECT * FROM "NormalizedCandidates" WHERE "monmasterFileId" = $1`,
                [monmasterFileId]
            );

            if (candidatesResult.rows.length === 0) {
                return null;
            }

            const candidates = candidatesResult.rows as NormalizedCandidate[];
            const candidateIds = candidates.map(c => c.candidateId);

            // Get academic records for all candidates
            const academicRecordsResult = await pool.query(
                `SELECT * FROM "AcademicRecords" WHERE "candidateId" = ANY($1)`,
                [candidateIds]
            );

            // Get scores for all candidates
            const candidateScoresResult = await pool.query(
                `SELECT * FROM "CandidateScores" WHERE "candidateId" = ANY($1)`,
                [candidateIds]
            );

            return {
                candidates,
                academicRecords: academicRecordsResult.rows as AcademicRecord[],
                candidateScores: candidateScoresResult.rows as CandidateScore[]
            };
        } catch (error) {
            console.error(`Error retrieving normalized MonMaster data: ${error}`);
            return null;
        }
    }

    /**
     * Get a specific candidate by ID
     * @param candidateId ID of the candidate
     */
    async getCandidateById(candidateId: number): Promise<{
        candidate: NormalizedCandidate;
        academicRecords: AcademicRecord[];
        scores: CandidateScore[];
    } | null> {
        try {
            // Get candidate
            const candidateResult = await pool.query(
                `SELECT * FROM "NormalizedCandidates" WHERE "candidateId" = $1`,
                [candidateId]
            );

            if (candidateResult.rows.length === 0) {
                return null;
            }

            // Get academic records
            const academicRecordsResult = await pool.query(
                `SELECT * FROM "AcademicRecords" WHERE "candidateId" = $1`,
                [candidateId]
            );

            // Get scores
            const scoresResult = await pool.query(
                `SELECT * FROM "CandidateScores" WHERE "candidateId" = $1`,
                [candidateId]
            );

            return {
                candidate: candidateResult.rows[0],
                academicRecords: academicRecordsResult.rows,
                scores: scoresResult.rows
            };
        } catch (error) {
            console.error(`Error retrieving candidate data: ${error}`);
            return null;
        }
    }

    /**
     * Search for candidates based on various criteria
     * @param searchParams Search parameters
     */
    async searchCandidates(searchParams: {
        firstName?: string;
        lastName?: string;
        candidateNumber?: string;
        monmasterFileId?: number;
    }): Promise<NormalizedCandidate[]> {
        try {
            const conditions: string[] = [];
            const values: any[] = [];
            let paramCount = 1;

            if (searchParams.firstName) {
                conditions.push(`"firstName" ILIKE $${paramCount}`);
                values.push(`%${searchParams.firstName}%`);
                paramCount++;
            }

            if (searchParams.lastName) {
                conditions.push(`"lastName" ILIKE $${paramCount}`);
                values.push(`%${searchParams.lastName}%`);
                paramCount++;
            }

            if (searchParams.candidateNumber) {
                conditions.push(`"candidateNumber" ILIKE $${paramCount}`);
                values.push(`%${searchParams.candidateNumber}%`);
                paramCount++;
            }

            if (searchParams.monmasterFileId) {
                conditions.push(`"monmasterFileId" = $${paramCount}`);
                values.push(searchParams.monmasterFileId);
                paramCount++;
            }

            let query = `SELECT * FROM "NormalizedCandidates"`;

            if (conditions.length > 0) {
                query += ` WHERE ${conditions.join(" AND ")}`;
            }

            query += ` ORDER BY "lastName", "firstName"`;

            const result = await pool.query(query, values);
            return result.rows;
        } catch (error) {
            console.error(`Error searching candidates: ${error}`);
            return [];
        }
    }

    /**
     * Delete all normalized data for a MonMaster file
     * @param monmasterFileId File ID to delete data for
     */
    async deleteNormalizedData(monmasterFileId: number): Promise<boolean> {
        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            await client.query(
                `DELETE FROM "NormalizedCandidates" WHERE "monmasterFileId" = $1`,
                [monmasterFileId]
            );

            await client.query('COMMIT');
            return true;
        } catch (error) {
            await client.query('ROLLBACK');
            console.error(`Error deleting normalized MonMaster data: ${error}`);
            return false;
        } finally {
            client.release();
        }
    }

    /**
     * Prepare data for insertion by linking records and scores to their candidates based on row indices
     * @param rawCandidates Raw candidates data
     * @param rawAcademicRecordsWithRowIndex Raw academic records data with row indices
     * @param rawCandidateScoresWithRowIndex Raw candidate scores data with row indices
     */
    prepareDataForInsertionWithRowIndex(
        rawCandidates: Omit<NormalizedCandidate, 'candidateId'>[],
        rawAcademicRecordsWithRowIndex: {
            record: Omit<AcademicRecord, 'recordId' | 'candidateId'>,
            rowIndex: number
        }[],
        rawCandidateScoresWithRowIndex: {
            score: Omit<CandidateScore, 'scoreId' | 'candidateId'>,
            rowIndex: number
        }[]
    ): {
        candidates: NormalizedCandidate[],
        academicRecords: AcademicRecord[],
        candidateScores: CandidateScore[]
    } {
        // Add temporary IDs to candidates for linking - these will be replaced by DB
        const candidates = rawCandidates.map((candidate, index) => ({
            ...candidate,
            candidateId: -(index + 1) // Use negative IDs to avoid conflicts with DB
        }));

        // Link academic records to candidates using row indices
        const academicRecords = rawAcademicRecordsWithRowIndex.map(({ record, rowIndex }) => {
            // Ensure rowIndex is within the range of candidates array
            const candidateIndex = Math.min(rowIndex, candidates.length - 1);
            return {
                ...record,
                candidateId: candidates[candidateIndex].candidateId!
            };
        });

        // Link candidate scores to candidates using row indices
        const candidateScores = rawCandidateScoresWithRowIndex.map(({ score, rowIndex }) => {
            // Ensure rowIndex is within the range of candidates array
            const candidateIndex = Math.min(rowIndex, candidates.length - 1);
            return {
                ...score,
                candidateId: candidates[candidateIndex].candidateId!
            };
        });

        return {
            candidates,
            academicRecords,
            candidateScores
        };
    }

    /**
     * Legacy method kept for compatibility - delegates to the new implementation
     */
    prepareDataForInsertion(
        rawCandidates: Omit<NormalizedCandidate, 'candidateId'>[],
        rawAcademicRecords: Omit<AcademicRecord, 'recordId' | 'candidateId'>[],
        rawCandidateScores: Omit<CandidateScore, 'scoreId' | 'candidateId'>[]
    ): {
        candidates: NormalizedCandidate[],
        academicRecords: AcademicRecord[],
        candidateScores: CandidateScore[]
    } {
        // Convert to the new format with row indices - using record index as fallback
        const academicRecordsWithRowIndex = rawAcademicRecords.map((record, index) => ({
            record,
            rowIndex: Math.floor(index / 3) // Rough estimate: assume 3 records per candidate
        }));

        const candidateScoresWithRowIndex = rawCandidateScores.map((score, index) => ({
            score,
            rowIndex: Math.floor(index / 2) // Rough estimate: assume 2 scores per candidate
        }));

        return this.prepareDataForInsertionWithRowIndex(
            rawCandidates,
            academicRecordsWithRowIndex,
            candidateScoresWithRowIndex
        );
    }
}
