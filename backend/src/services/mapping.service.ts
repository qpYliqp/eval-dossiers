import { MappingModel } from '../models/mapping.model';
import { MappingConfiguration, MappingEntry, AddMappingEntryRequest, UpdateMappingEntryRequest } from '../types/mapping.types';

export class MappingService {
    private repository: MappingModel;

    constructor() {
        this.repository = new MappingModel();
    }

    /**
     * Add a mapping entry between a MonMaster file and a PV file
     * @throws Error if the MonMaster column is already mapped to a PV column
     */
    async addMappingEntry(request: AddMappingEntryRequest): Promise<MappingEntry> {
        // Check if configuration exists or create a new one
        let configId: number;
        const existingConfig = await this.repository.getConfiguration(
            request.monmasterFileId,
            request.pvFileId
        );

        if (existingConfig) {
            configId = existingConfig.configurationId!;
        } else {
            configId = await this.repository.createConfiguration(
                request.monmasterFileId,
                request.pvFileId
            );
        }

        // Create and save the mapping entry
        const entry: MappingEntry = {
            configurationId: configId,
            masterColumnIndex: request.masterColumnIndex,
            masterColumnName: request.masterColumnName,
            pvColumnIndex: request.pvColumnIndex,
            pvColumnName: request.pvColumnName
        };

        return await this.repository.addEntry(entry);
    }

    /**
     * Update an existing mapping entry
     * @throws Error if the update would create a duplicate MonMaster column mapping
     */
    async updateMappingEntry(
        entryId: number,
        updates: UpdateMappingEntryRequest
    ): Promise<MappingEntry | null> {
        return await this.repository.updateEntry(entryId, updates);
    }

    /**
     * Delete a mapping entry
     */
    async deleteMappingEntry(entryId: number): Promise<boolean> {
        return await this.repository.deleteEntry(entryId);
    }

    /**
     * Delete an entire mapping configuration
     */
    async deleteMappingConfiguration(configurationId: number): Promise<boolean> {
        return await this.repository.deleteConfiguration(configurationId);
    }

    /**
     * Get a mapping configuration by MonMaster file ID and PV file ID
     */
    async getMappingConfiguration(monmasterFileId: number, pvFileId: number): Promise<MappingConfiguration | null> {
        return await this.repository.getConfiguration(monmasterFileId, pvFileId);
    }

    /**
     * Get a mapping configuration by ID
     */
    async getMappingConfigurationById(configurationId: number): Promise<MappingConfiguration | null> {
        return await this.repository.getConfigurationById(configurationId);
    }

    /**
     * Create a new mapping configuration
     */
    async createMappingConfiguration(monmasterFileId: number, pvFileId: number): Promise<MappingConfiguration> {
        // Check if a configuration already exists for these file IDs
        const existingConfig = await this.repository.getConfiguration(monmasterFileId, pvFileId);
        
        if (existingConfig) {
            return existingConfig; // Return the existing configuration if found
        }
        
        // Create the configuration in the database
        const configId = await this.repository.createConfiguration(monmasterFileId, pvFileId);
        
        // Return the complete configuration
        const config = await this.repository.getConfigurationById(configId);
        
        if (!config) {
            throw new Error('Failed to retrieve created configuration');
        }
        
        return config;
    }
}
