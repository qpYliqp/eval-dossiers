import { CandidateMatch } from '../types/grade-comparison.types';
import pool from '../config/db';

export class CandidateMatchingModel {
    /**
     * Save candidate matches to the database
     * @param matches Array of CandidateMatch to save
     * @returns Array of saved CandidateMatch
     */
    async saveCandidateMatches(matches: CandidateMatch[]): Promise<CandidateMatch[]> {
        if (matches.length === 0) return [];

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const savedMatches: CandidateMatch[] = [];
            for (const match of matches) {
                const result = await client.query(
                    'INSERT INTO "CandidateMatches" ("monmasterFileId", "pvFileId", "monmasterCandidateId", "pvStudentDataId", "createdAt") ' +
                    'VALUES ($1, $2, $3, $4, $5) RETURNING *',
                    [
                        match.monmasterFileId,
                        match.pvFileId,
                        match.monmasterCandidateId,
                        match.pvStudentDataId,
                        match.createdAt,
                    ]
                );
                savedMatches.push(result.rows[0]);
            }

            await client.query('COMMIT');
            return savedMatches;
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Error saving candidate matches:', error);
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
        return (await pool.query(
            'SELECT * FROM "CandidateMatches" WHERE "monmasterFileId" = $1 AND "pvFileId" = $2',
            [monmasterFileId, pvFileId]
        )).rows;
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
        monmasterCandidate: any,
        pvStudent: any
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
}