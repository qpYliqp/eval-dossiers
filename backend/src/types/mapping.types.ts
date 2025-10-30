/**
 * @swagger
 * components:
 *   schemas:
 *     MappingEntry:
 *       type: object
 *       properties:
 *         entryId:
 *           type: integer
 *           description: Unique ID of the mapping entry
 *         configurationId:
 *           type: integer
 *           description: ID of the parent mapping configuration
 *         masterColumnIndex:
 *           type: integer
 *           description: Column index in the MonMaster file
 *         masterColumnName:
 *           type: string
 *           description: Column name in the MonMaster file
 *         pvColumnIndex:
 *           type: integer
 *           description: Column index in the PV file
 *         pvColumnName:
 *           type: string
 *           description: Column name in the PV file
 *       required:
 *         - configurationId
 *         - masterColumnIndex
 *         - masterColumnName
 *         - pvColumnIndex
 *         - pvColumnName
 *
 *     MappingConfiguration:
 *       type: object
 *       properties:
 *         configurationId:
 *           type: integer
 *           description: Unique ID of the mapping configuration
 *         monmasterFileId:
 *           type: integer
 *           description: ID of the MonMaster file
 *         pvFileId:
 *           type: integer
 *           description: ID of the PV file
 *         entries:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/MappingEntry'
 *           description: List of mapping entries
 *         createdDate:
 *           type: string
 *           format: date-time
 *           description: Date when the configuration was created
 *         updatedDate:
 *           type: string
 *           format: date-time
 *           description: Date when the configuration was last updated
 *       required:
 *         - monmasterFileId
 *         - pvFileId
 *
 *     AddMappingEntryRequest:
 *       type: object
 *       properties:
 *         monmasterFileId:
 *           type: integer
 *           description: ID of the MonMaster file
 *         pvFileId:
 *           type: integer
 *           description: ID of the PV file
 *         masterColumnIndex:
 *           type: integer
 *           description: Column index in the MonMaster file
 *         masterColumnName:
 *           type: string
 *           description: Column name in the MonMaster file
 *         pvColumnIndex:
 *           type: integer
 *           description: Column index in the PV file
 *         pvColumnName:
 *           type: string
 *           description: Column name in the PV file
 *       required:
 *         - monmasterFileId
 *         - pvFileId
 *         - masterColumnIndex
 *         - masterColumnName
 *         - pvColumnIndex
 *         - pvColumnName
 *
 *     UpdateMappingEntryRequest:
 *       type: object
 *       properties:
 *         masterColumnIndex:
 *           type: integer
 *           description: Column index in the MonMaster file
 *         masterColumnName:
 *           type: string
 *           description: Column name in the MonMaster file
 *         pvColumnIndex:
 *           type: integer
 *           description: Column index in the PV file
 *         pvColumnName:
 *           type: string
 *           description: Column name in the PV file
 */
export interface MappingEntry {
    entryId?: number;
    configurationId: number;
    masterColumnIndex: number;
    masterColumnName: string;
    pvColumnIndex: number;
    pvColumnName: string;
}

export interface MappingConfiguration {
    configurationId?: number;
    monmasterFileId: number;
    pvFileId: number;
    entries?: MappingEntry[];
    createdDate?: Date;
    updatedDate?: Date;
}

export interface AddMappingEntryRequest {
    monmasterFileId: number;
    pvFileId: number;
    masterColumnIndex: number;
    masterColumnName: string;
    pvColumnIndex: number;
    pvColumnName: string;
}

export interface UpdateMappingEntryRequest {
    masterColumnIndex?: number;
    masterColumnName?: string;
    pvColumnIndex?: number;
    pvColumnName?: string;
}

export class MappingError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'MappingError';
    }
}
