import pool from "../config/db";
import { FileOrigin, IFileMetadata } from '../types/file.types';
import { QueryResult } from 'pg';

export class FileModel {
    static async createFile(fileData: IFileMetadata): Promise<IFileMetadata> {
        const {
            masterId,
            fileName,
            fileType,
            filePath,
            university,
            formation,
            yearAcademic,
            fileOrigin,
            session,
            uploadedBy
        } = fileData;

        const query = `
      INSERT INTO "Files" (
        "masterId", "fileName", "fileType", "filePath", "university",
        "formation", "yearAcademic", "fileOrigin", "session", "uploadedBy"
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;

        const values = [
            masterId || null,
            fileName,
            fileType,
            filePath,
            university || null,
            formation || null,
            yearAcademic || null,
            fileOrigin,
            session || null,
            uploadedBy
        ];

        const result = await pool.query(query, values);
        return result.rows[0];
    }

    static async getFileById(fileId: number): Promise<IFileMetadata | null> {
        const query = `SELECT * FROM "Files" WHERE "fileId" = $1`;
        const result = await pool.query(query, [fileId]);
        return result.rows[0] || null;
    }

    static async getFilesByMasterId(masterId: number): Promise<IFileMetadata[]> {
        const query = `SELECT * FROM "Files" WHERE "masterId" = $1 ORDER BY "uploadDate" DESC`;
        const result = await pool.query(query, [masterId]);
        return result.rows;
    }

    static async getFilesByOrigin(fileOrigin: FileOrigin): Promise<IFileMetadata[]> {
        const query = `SELECT * FROM "Files" WHERE "fileOrigin" = $1 ORDER BY "uploadDate" DESC`;
        const result = await pool.query(query, [fileOrigin]);
        return result.rows;
    }

    static async getFilesByMasterIdAndOrigin(masterId: number, fileOrigin: FileOrigin): Promise<IFileMetadata[]> {
        const query = `SELECT * FROM "Files" WHERE "masterId" = $1 AND "fileOrigin" = $2 ORDER BY "uploadDate" DESC`;
        const result = await pool.query(query, [masterId, fileOrigin]);
        return result.rows;
    }


    static async deleteFile(fileId: number): Promise<IFileMetadata | null> {
        const query = `
            DELETE FROM "Files"
            WHERE "fileId" = $1
            RETURNING *
        `;
        const result: QueryResult = await pool.query(query, [fileId]);
        // Fix the null check
        return result && result.rowCount && result.rowCount > 0 ? result.rows[0] : null;
    }
    
    static async fileExistsForMaster(masterId: number, fileOrigin: FileOrigin): Promise<boolean> {
        const query = `SELECT COUNT(*) FROM "Files" WHERE "masterId" = $1 AND "fileOrigin" = $2`;
        const result = await pool.query(query, [masterId, fileOrigin]);
        return parseInt(result.rows[0].count) > 0;
    }

    static async findStudentDocument(masterId: number, candidateNumber: string): Promise<IFileMetadata | null> {
        const query = `
            SELECT * FROM "Files"
            WHERE "masterId" = $1
            AND "fileOrigin" = 'studentDocuments'
            AND "fileName" = $2
            LIMIT 1
        `;

        const values = [masterId, `${candidateNumber}.pdf`]; // Format exact du fichier
        const result = await pool.query(query, values);

        //return result.rows[0];

        return result.rows.length > 0 ? result.rows[0] : null;
    }
    
}
