import pool from '../config/db';
import { MonMasterNormalizationService } from '../services/monmaster-normalization.service';
import { ColumnSelectionEntry, FileColumn } from '../types/column-selection.types';
import { FileModel } from './file.model';
import * as XLSX from 'xlsx';
import fs from 'fs';

export class ColumnSelectionModel {
    
    async addColumn(entry: ColumnSelectionEntry): Promise<ColumnSelectionEntry> {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Vérifier si la colonne existe déjà
            const existing = await client.query(
                'SELECT * FROM "ColumnSelections" WHERE "fileId" = $1 AND "columnIndex" = $2',
                [entry.fileId, entry.columnIndex]
            );

            let result;
            if (existing.rows.length > 0) {
                // Mettre à jour si elle existe
                result = await client.query(
                    'UPDATE "ColumnSelections" SET "columnName" = $1, "createdAt" = CURRENT_TIMESTAMP WHERE "fileId" = $2 AND "columnIndex" = $3 RETURNING *',
                    [entry.columnName, entry.fileId, entry.columnIndex]
                );
            } else {
                // Insérer si elle n'existe pas
                result = await client.query(
                    'INSERT INTO "ColumnSelections" ("fileId", "columnIndex", "columnName", "createdAt") VALUES ($1, $2, $3, CURRENT_TIMESTAMP) RETURNING *',
                    [entry.fileId, entry.columnIndex, entry.columnName]
                );
            }

            await client.query('COMMIT');
            return result.rows[0];
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    async removeColumn(fileId: number, columnIndex: number): Promise<boolean> {
        const result = await pool.query(
            'DELETE FROM "ColumnSelections" WHERE "fileId" = $1 AND "columnIndex" = $2',
            [fileId, columnIndex]
        );
        return (result.rowCount ?? 0) > 0;
    }


    async createSelection(entries: ColumnSelectionEntry[]): Promise<ColumnSelectionEntry[]> {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Supprimer les anciennes sélections pour ce fichier
            await client.query(
                'DELETE FROM "ColumnSelections" WHERE "fileId" = $1',
                [entries[0].fileId]
            );

            // Insérer les nouvelles sélections
            const results: ColumnSelectionEntry[] = [];
            for (const entry of entries) {
                const result = await client.query(
                    'INSERT INTO "ColumnSelections" ("fileId", "columnIndex", "columnName", "createdAt") ' +
                    'VALUES ($1, $2, $3, CURRENT_TIMESTAMP) RETURNING *',
                    [entry.fileId, entry.columnIndex, entry.columnName]
                );
                results.push(result.rows[0]);
            }

            await client.query('COMMIT');
            return results;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    async getSelectionsByFileId(fileId: number): Promise<ColumnSelectionEntry[]> {
        const result = await pool.query(
            'SELECT * FROM "ColumnSelections" WHERE "fileId" = $1 ORDER BY "columnIndex"',
            [fileId]
        );
        return result.rows;
    }

    async extractSelectedColumns(fileId: number): Promise<any[]> {
        // Récupérer le fichier XLSX associé
        const file = await FileModel.getFileById(fileId);
        if (!file) throw new Error(`File with ID ${fileId} not found.`);
        if (!fs.existsSync(file.filePath)) throw new Error(`File not found on disk: ${file.filePath}`);

        // Charger le fichier Excel
        const workbook = await MonMasterNormalizationService.readXlsxFile(file.filePath);
        const sheetName = workbook.SheetNames[0]; // Supposons qu'on prend la première feuille
        const worksheet = workbook.Sheets[sheetName];

        // Convertir en tableau JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        // Récupérer les colonnes sélectionnées
        const selectedColumns = await this.getSelectionsByFileId(fileId);
        const selectedIndexes = selectedColumns.map(col => col.columnIndex);

        const extractedData = (jsonData as any[][]).slice(1).map(row => ({
            labels: selectedIndexes.map(index => row[index])
        }));

        return extractedData;
    }


    async getColumnsByFileId(fileId: number): Promise<FileColumn[]> {
        const fileMetadata = await FileModel.getFileById(fileId);
        if (!fileMetadata || !fileMetadata.filePath) {
            throw new Error('Fichier introuvable');
        }
        console.log(fileMetadata.filePath)
        const workbook = await MonMasterNormalizationService.readXlsxFile(fileMetadata.filePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        if (!rawData || rawData.length === 0) {
            console.error('No data found in the XLSX file');
            throw new Error("No data found in the XLSX file");
        }

        const columnNames: string[] = rawData[0] as string[];

        // Transformation en FileColumn avec les bons index
        const fileColumns: FileColumn[] = columnNames.map((columnName, index) => ({
            columnIndex: index,
            columnName: columnName
        }));

        return fileColumns;
    }
}