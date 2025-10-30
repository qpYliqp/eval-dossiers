import pool from '../config/db';
import { NormalizedStudentData, ProcessPvResult } from '../types/pv-normalization.types';

export class PvNormalizationModel {
    async saveNormalizedData(pvFileId: number, normalizedData: NormalizedStudentData[]): Promise<boolean> {
        const client = await pool.connect();

        try {
            // Begin transaction
            await client.query('BEGIN');

            for (const student of normalizedData) {
                // Insert student data
                const studentResult = await client.query(
                    `INSERT INTO "NormalizedStudentData" ("pvFileId", "name", "dateOfBirth", "studentNumber") 
           VALUES ($1, $2, $3, $4) RETURNING "studentDataId"`,
                    [pvFileId, student.name, student.dateOfBirth, student.studentNumber]
                );

                const studentDataId = studentResult.rows[0].studentDataId;

                // Insert semester results for this student
                for (const result of student.semesterResults) {
                    await client.query(
                        `INSERT INTO "SemesterResults" ("studentDataId", "semesterName", "grade")
             VALUES ($1, $2, $3)`,
                        [studentDataId, result.semesterName, result.grade]
                    );
                }
            }

            // Commit transaction
            await client.query('COMMIT');
            return true;
        } catch (error) {
            // Rollback in case of error
            await client.query('ROLLBACK');
            console.error(`Error saving normalized data: ${error}`);
            return false;
        } finally {
            client.release();
        }
    }

    async getNormalizedDataByPvFileId(pvFileId: number): Promise<NormalizedStudentData[]> {
        try {
            // Get all students for this PV file
            const studentResult = await pool.query(
                `SELECT * FROM "NormalizedStudentData" WHERE "pvFileId" = $1`,
                [pvFileId]
            );

            const normalizedData: NormalizedStudentData[] = [];

            // For each student, get their semester results
            for (const student of studentResult.rows) {
                const resultQuery = await pool.query(
                    `SELECT * FROM "SemesterResults" WHERE "studentDataId" = $1`,
                    [student.studentDataId]
                );

                normalizedData.push({
                    studentDataId: student.studentDataId,
                    name: student.name,
                    dateOfBirth: student.dateOfBirth,
                    studentNumber: student.studentNumber,
                    semesterResults: resultQuery.rows.map(row => ({
                        semesterName: row.semesterName,
                        grade: parseFloat(row.grade)
                    }))
                });
            }

            return normalizedData;
        } catch (error) {
            console.error(`Error retrieving normalized data: ${error}`);
            return [];
        }
    }

    async isFileAlreadyNormalized(pvFileId: number): Promise<boolean> {
        try {
            const result = await pool.query(
                `SELECT COUNT(*) as count FROM "NormalizedStudentData" WHERE "pvFileId" = $1`,
                [pvFileId]
            );

            return parseInt(result.rows[0].count) > 0;
        } catch (error) {
            console.error(`Error checking if file is already normalized: ${error}`);
            return false;
        }
    }

    async deleteNormalizedData(pvFileId: number): Promise<boolean> {
        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            await client.query(
                `DELETE FROM "NormalizedStudentData" WHERE "pvFileId" = $1`,
                [pvFileId]
            );

            await client.query('COMMIT');
            return true;
        } catch (error) {
            await client.query('ROLLBACK');
            console.error(`Error deleting normalized data: ${error}`);
            return false;
        } finally {
            client.release();
        }
    }
}
