import { Request, Response } from 'express';
import { MappingService } from '../services/mapping.service';
import { AddMappingEntryRequest, UpdateMappingEntryRequest } from '../types/mapping.types';

export class MappingController {
    private service: MappingService;

    constructor() {
        this.service = new MappingService();
    }

    /**
     * Add a new mapping entry
     */
    async addMappingEntry(req: Request, res: Response): Promise<void> {
        try {
            const request: AddMappingEntryRequest = req.body;

            // Validate required fields
            if (!request.monmasterFileId ||
                !request.pvFileId ||
                request.masterColumnIndex === undefined ||
                !request.masterColumnName ||
                request.pvColumnIndex === undefined ||
                !request.pvColumnName) {
                res.status(400).json({ error: 'Missing required fields' });
                return;
            }

            const result = await this.service.addMappingEntry(request);
            res.status(201).json(result);
        } catch (error: any) {
            console.error('Error adding mapping entry:', error);

            // Handle specific errors for duplicate mappings
            if (error.message) {
                if (error.message.includes('already mapped')) {
                    res.status(409).json({ error: error.message });
                    return;
                }
                // Handle potential database constraint violation errors
                if (error.code === '23505') { // PostgreSQL unique violation code
                    if (error.constraint === 'uq_master_column_mapping') {
                        res.status(409).json({
                            error: 'This MonMaster column is already mapped to a PV column'
                        });
                        return;
                    } else if (error.constraint === 'uq_pv_column_mapping') {
                        res.status(409).json({
                            error: 'This PV column is already mapped to a MonMaster column'
                        });
                        return;
                    }
                }
            }

            res.status(500).json({ error: 'Failed to add mapping entry' });
        }
    }

    /**
     * Update an existing mapping entry
     */
    async updateMappingEntry(req: Request, res: Response): Promise<void> {
        try {
            const entryId = parseInt(req.params.entryId);
            const updates: UpdateMappingEntryRequest = req.body;

            if (isNaN(entryId)) {
                res.status(400).json({ error: 'Invalid entry ID' });
                return;
            }

            const result = await this.service.updateMappingEntry(entryId, updates);

            if (!result) {
                res.status(404).json({ error: 'Mapping entry not found' });
                return;
            }

            res.status(200).json(result);
        } catch (error: any) {
            console.error('Error updating mapping entry:', error);

            // Handle specific errors for duplicate mappings
            if (error.message) {
                if (error.message.includes('already mapped')) {
                    res.status(409).json({ error: error.message });
                    return;
                }
                // Handle potential database constraint violation errors
                if (error.code === '23505') { // PostgreSQL unique violation code
                    if (error.constraint === 'uq_master_column_mapping') {
                        res.status(409).json({
                            error: 'This MonMaster column is already mapped to a PV column'
                        });
                        return;
                    } else if (error.constraint === 'uq_pv_column_mapping') {
                        res.status(409).json({
                            error: 'This PV column is already mapped to a MonMaster column'
                        });
                        return;
                    }
                }
            }

            res.status(500).json({ error: 'Failed to update mapping entry' });
        }
    }

    /**
     * Delete a mapping entry
     */
    async deleteMappingEntry(req: Request, res: Response): Promise<void> {
        try {
            const entryId = parseInt(req.params.entryId);

            if (isNaN(entryId)) {
                res.status(400).json({ error: 'Invalid entry ID' });
                return;
            }

            const result = await this.service.deleteMappingEntry(entryId);

            if (!result) {
                res.status(404).json({ error: 'Mapping entry not found' });
                return;
            }

            res.status(204).send();
        } catch (error) {
            console.error('Error deleting mapping entry:', error);
            res.status(500).json({ error: 'Failed to delete mapping entry' });
        }
    }

    /**
     * Delete a mapping configuration
     */
    async deleteMappingConfiguration(req: Request, res: Response): Promise<void> {
        try {
            const configId = parseInt(req.params.configId);

            if (isNaN(configId)) {
                res.status(400).json({ error: 'Invalid configuration ID' });
                return;
            }

            const result = await this.service.deleteMappingConfiguration(configId);

            if (!result) {
                res.status(404).json({ error: 'Mapping configuration not found' });
                return;
            }

            res.status(204).send();
        } catch (error) {
            console.error('Error deleting mapping configuration:', error);
            res.status(500).json({ error: 'Failed to delete mapping configuration' });
        }
    }

    /**
     * Get mapping configuration
     */
    async getMappingConfiguration(req: Request, res: Response): Promise<void> {
        try {
            const monmasterFileId = parseInt(req.query.monmasterFileId as string);
            const pvFileId = parseInt(req.query.pvFileId as string);

            if (isNaN(monmasterFileId) || isNaN(pvFileId)) {
                res.status(400).json({ error: 'Invalid file IDs' });
                return;
            }

            const result = await this.service.getMappingConfiguration(monmasterFileId, pvFileId);

            if (!result) {
                res.status(404).json({ error: 'Mapping configuration not found' });
                return;
            }

            res.status(200).json(result);
        } catch (error) {
            console.error('Error getting mapping configuration:', error);
            res.status(500).json({ error: 'Failed to get mapping configuration' });
        }
    }

    /**
     * Get mapping configuration by ID
     */
    async getMappingConfigurationById(req: Request, res: Response): Promise<void> {
        try {
            const configId = parseInt(req.params.configId);

            if (isNaN(configId)) {
                res.status(400).json({ error: 'Invalid configuration ID' });
                return;
            }

            const result = await this.service.getMappingConfigurationById(configId);

            if (!result) {
                res.status(404).json({ error: 'Mapping configuration not found' });
                return;
            }

            res.status(200).json(result);
        } catch (error) {
            console.error('Error getting mapping configuration:', error);
            res.status(500).json({ error: 'Failed to get mapping configuration' });
        }
    }

    /**
     * Create a new mapping configuration
     */
    async createMappingConfiguration(req: Request, res: Response): Promise<void> {
        try {
            const { monmasterFileId, pvFileId } = req.body;

            // Validate required fields
            if (!monmasterFileId || !pvFileId) {
                res.status(400).json({ error: 'Missing required fields: monmasterFileId and pvFileId are required' });
                return;
            }

            // Check if both IDs are valid integers
            if (isNaN(parseInt(monmasterFileId)) || isNaN(parseInt(pvFileId))) {
                res.status(400).json({ error: 'Invalid file IDs: monmasterFileId and pvFileId must be integers' });
                return;
            }

            // Create the configuration
            const config = await this.service.createMappingConfiguration(monmasterFileId, pvFileId);
            
            // Return the created configuration
            res.status(201).json(config);
        } catch (error: any) {
            console.error('Error creating mapping configuration:', error);

            // Handle potential database constraint violation error (duplicate configuration)
            if (error.code === '23505' && error.constraint === 'uq_file_pair') {
                res.status(409).json({ error: 'A mapping configuration already exists for these file IDs' });
                return;
            }

            res.status(500).json({ error: 'Failed to create mapping configuration' });
        }
    }
}
