/**
 * Represents a mapping entry between MonMaster and PV file columns
 */
export interface MappingEntry {
    entryId?: number;
    configurationId: number;
    masterColumnIndex: number;
    masterColumnName: string;
    pvColumnIndex: number;
    pvColumnName: string;
    monmasterFileId: number;
    pvFileId: number;
}

/**
 * Represents a mapping configuration between MonMaster and PV files
 */
export interface MappingConfiguration {
    configurationId?: number;
    monmasterFileId: number;
    pvFileId: number;
    entries?: MappingEntry[];
    createdDate?: Date;
    updatedDate?: Date;
}

/**
 * Represents a mapping with field descriptions for UI display
 */
export interface MappingWithDescription {
    master: {
        index: number;
        name: string;
        description?: string;
    };
    pv: {
        index: number;
        name: string;
        description?: string;
    };
    entryId?: number;
}
