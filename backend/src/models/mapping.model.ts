import pool from '../config/db';
import { QueryResult } from 'pg';
import { MappingConfiguration, MappingEntry } from '../types/mapping.types';

export class MappingModel {
    // Configuration methods
    async getConfiguration(monmasterFileId: number, pvFileId: number): Promise<MappingConfiguration | null> {
        const result = await pool.query(
            'SELECT * FROM "MappingConfigurations" WHERE "monmasterFileId" = $1 AND "pvFileId" = $2',
            [monmasterFileId, pvFileId]
        );

        if (result.rows.length === 0) {
            return null;
        }

        const config = result.rows[0] as MappingConfiguration;
        config.entries = await this.getEntriesByConfigId(config.configurationId!);

        return config;
    }

    /**
     * Create a new mapping configuration 
     * @returns The ID of the newly created configuration
     */
    async createConfiguration(monmasterFileId: number, pvFileId: number): Promise<number> {
        try {
            const result = await pool.query(
                'INSERT INTO "MappingConfigurations" ("monmasterFileId", "pvFileId", "updatedDate") ' +
                'VALUES ($1, $2, CURRENT_TIMESTAMP) RETURNING "configurationId"',
                [monmasterFileId, pvFileId]
            );

            return result.rows[0].configurationId;
        } catch (error: any) {
            // Re-throw the error with more context for better error handling upstream
            if (error.code === '23505' && error.constraint === 'uq_file_pair') {
                const existingConfig = await this.getConfiguration(monmasterFileId, pvFileId);
                if (existingConfig && existingConfig.configurationId) {
                    return existingConfig.configurationId;
                }
            }
            throw error;
        }
    }

    async deleteConfiguration(configurationId: number): Promise<boolean> {
        const result = await pool.query(
            'DELETE FROM "MappingConfigurations" WHERE "configurationId" = $1 RETURNING *',
            [configurationId]
        );

        return (result.rowCount ?? 0) > 0;
    }

    async getConfigurationById(configurationId: number): Promise<MappingConfiguration | null> {
        const result = await pool.query(
            'SELECT * FROM "MappingConfigurations" WHERE "configurationId" = $1',
            [configurationId]
        );

        if (result.rows.length === 0) {
            return null;
        }

        const config = result.rows[0] as MappingConfiguration;
        config.entries = await this.getEntriesByConfigId(configurationId);

        return config;
    }

    // Entry methods
    async getEntriesByConfigId(configurationId: number): Promise<MappingEntry[]> {
        const result = await pool.query(
            'SELECT * FROM "MappingEntries" WHERE "configurationId" = $1',
            [configurationId]
        );

        return result.rows as MappingEntry[];
    }

    async checkExistingMasterColumnMapping(configurationId: number, masterColumnIndex: number): Promise<boolean> {
        const result = await pool.query(
            'SELECT * FROM "MappingEntries" WHERE "configurationId" = $1 AND "masterColumnIndex" = $2',
            [configurationId, masterColumnIndex]
        );

        return result.rows.length > 0;
    }

    async checkExistingPvColumnMapping(configurationId: number, pvColumnIndex: number): Promise<boolean> {
        const result = await pool.query(
            'SELECT * FROM "MappingEntries" WHERE "configurationId" = $1 AND "pvColumnIndex" = $2',
            [configurationId, pvColumnIndex]
        );

        return result.rows.length > 0;
    }

    async addEntry(entry: MappingEntry): Promise<MappingEntry> {
        // Check if this MonMaster column is already mapped
        const existingMasterMapping = await this.checkExistingMasterColumnMapping(
            entry.configurationId,
            entry.masterColumnIndex
        );

        if (existingMasterMapping) {
            throw new Error('This MonMaster column is already mapped to a PV column');
        }

        // Check if this PV column is already mapped
        const existingPvMapping = await this.checkExistingPvColumnMapping(
            entry.configurationId,
            entry.pvColumnIndex
        );

        if (existingPvMapping) {
            throw new Error('This PV column is already mapped to a MonMaster column');
        }

        const result = await pool.query(
            'INSERT INTO "MappingEntries" ("configurationId", "masterColumnIndex", "masterColumnName", ' +
            '"pvColumnIndex", "pvColumnName") VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [
                entry.configurationId,
                entry.masterColumnIndex,
                entry.masterColumnName,
                entry.pvColumnIndex,
                entry.pvColumnName
            ]
        );

        await pool.query(
            'UPDATE "MappingConfigurations" SET "updatedDate" = CURRENT_TIMESTAMP ' +
            'WHERE "configurationId" = $1',
            [entry.configurationId]
        );

        return result.rows[0] as MappingEntry;
    }

    async updateEntry(entryId: number, entry: Partial<MappingEntry>): Promise<MappingEntry | null> {
        // Get the current entry first to know its configurationId
        const currentEntryResult = await pool.query(
            'SELECT * FROM "MappingEntries" WHERE "entryId" = $1',
            [entryId]
        );

        if (currentEntryResult.rows.length === 0) {
            return null;
        }

        const currentEntry = currentEntryResult.rows[0];
        const configId = currentEntry.configurationId;

        // If updating masterColumnIndex, check for existing mappings
        if (entry.masterColumnIndex !== undefined) {
            // Check if this would create a duplicate MonMaster column mapping
            const existingMasterMapping = await pool.query(
                'SELECT * FROM "MappingEntries" WHERE "configurationId" = $1 AND "masterColumnIndex" = $2 AND "entryId" != $3',
                [configId, entry.masterColumnIndex, entryId]
            );

            if (existingMasterMapping.rows.length > 0) {
                throw new Error('This MonMaster column is already mapped to a PV column');
            }
        }

        // If updating pvColumnIndex, check for existing mappings
        if (entry.pvColumnIndex !== undefined) {
            // Check if this would create a duplicate PV column mapping
            const existingPvMapping = await pool.query(
                'SELECT * FROM "MappingEntries" WHERE "configurationId" = $1 AND "pvColumnIndex" = $2 AND "entryId" != $3',
                [configId, entry.pvColumnIndex, entryId]
            );

            if (existingPvMapping.rows.length > 0) {
                throw new Error('This PV column is already mapped to a MonMaster column');
            }
        }

        // Build dynamic update query based on provided fields
        const updates: string[] = [];
        const values: any[] = [];
        let paramIndex = 1;

        if (entry.masterColumnIndex !== undefined) {
            updates.push(`"masterColumnIndex" = $${paramIndex++}`);
            values.push(entry.masterColumnIndex);
        }

        if (entry.masterColumnName !== undefined) {
            updates.push(`"masterColumnName" = $${paramIndex++}`);
            values.push(entry.masterColumnName);
        }

        if (entry.pvColumnIndex !== undefined) {
            updates.push(`"pvColumnIndex" = $${paramIndex++}`);
            values.push(entry.pvColumnIndex);
        }

        if (entry.pvColumnName !== undefined) {
            updates.push(`"pvColumnName" = $${paramIndex++}`);
            values.push(entry.pvColumnName);
        }

        if (updates.length === 0) {
            return null; // No fields to update
        }

        values.push(entryId);

        const result = await pool.query(
            `UPDATE "MappingEntries" SET ${updates.join(', ')} WHERE "entryId" = $${paramIndex} RETURNING *`,
            values
        );

        if (result.rows.length === 0) {
            return null;
        }

        const updatedEntry = result.rows[0] as MappingEntry;

        // Update configuration's updatedDate field
        await pool.query(
            'UPDATE "MappingConfigurations" SET "updatedDate" = CURRENT_TIMESTAMP ' +
            'WHERE "configurationId" = $1',
            [updatedEntry.configurationId]
        );

        return updatedEntry;
    }

    async deleteEntry(entryId: number): Promise<boolean> {
        // First get the entry to know its configurationId
        const entryResult = await pool.query(
            'SELECT "configurationId" FROM "MappingEntries" WHERE "entryId" = $1',
            [entryId]
        );

        if (entryResult.rows.length === 0) {
            return false;
        }

        const configId = entryResult.rows[0].configurationId;

        // Delete the entry
        const result = await pool.query(
            'DELETE FROM "MappingEntries" WHERE "entryId" = $1 RETURNING *',
            [entryId]
        );

        if ((result.rowCount ?? 0) > 0) {
            // Update the configuration's updatedDate field
            await pool.query(
                'UPDATE "MappingConfigurations" SET "updatedDate" = CURRENT_TIMESTAMP ' +
                'WHERE "configurationId" = $1',
                [configId]
            );
            return true;
        }

        return false;
    }
}
