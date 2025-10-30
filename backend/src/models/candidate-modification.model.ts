import pool from "../config/db";
import { NormalizedCandidate, AcademicRecord, CandidateScore } from "../types/monmaster-normalization.types";

export class CandidateModificationModel {
    /**
     * Mettre à jour le prénom d'un candidat et recalculer le nom complet.
     */
    static async updateFirstName(candidateId: number, firstName: string): Promise<NormalizedCandidate | null> {
        const query = `
            UPDATE "NormalizedCandidates"
            SET "firstName" = $1::text,
                "fullName" = CONCAT($1::text, ' ', "lastName")
            WHERE "candidateId" = $2::integer
            RETURNING *;
        `;
        const result = await pool.query(query, [firstName, candidateId]);
        return result.rows.length > 0 ? result.rows[0] : null;
    }

    /**
     * Mettre à jour le nom de famille d'un candidat et recalculer le nom complet.
     */
    static async updateLastName(candidateId: number, lastName: string): Promise<NormalizedCandidate | null> {
        const query = `
            UPDATE "NormalizedCandidates"
            SET "lastName" = $1::text,
                "fullName" = CONCAT("firstName", ' ', $1::text)
            WHERE "candidateId" = $2::integer
            RETURNING *;
        `;
        const result = await pool.query(query, [lastName, candidateId]);
        return result.rows.length > 0 ? result.rows[0] : null;
    }

    /**
     * Mettre à jour un relevé académique spécifique (uniquement les champs gradeSemester1 et gradeSemester2).
     */
    static async updateAcademicRecord(recordId: number, gradeSemester1: number | null, gradeSemester2: number | null): Promise<AcademicRecord | null> {
        const query = `
            UPDATE "AcademicRecords"
            SET "gradeSemester1" = $1::numeric,
                "gradeSemester2" = $2::numeric
            WHERE "recordId" = $3::integer
            RETURNING *;
        `;
        const result = await pool.query(query, [gradeSemester1, gradeSemester2, recordId]);
        return result.rows.length > 0 ? result.rows[0] : null;
    }

    /**
     * Mettre à jour le score d'un candidat (uniquement le champ scoreValue).
     */
    static async updateCandidateScore(scoreId: number, scoreValue: string): Promise<CandidateScore | null> {
        const query = `
            UPDATE "CandidateScores"
            SET "scoreValue" = $1::text
            WHERE "scoreId" = $2::integer
            RETURNING *;
        `;
        const result = await pool.query(query, [scoreValue, scoreId]);
        return result.rows.length > 0 ? result.rows[0] : null;
    }
}