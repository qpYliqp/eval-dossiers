/**
 * @swagger
 * components:
 *   schemas:
 *     FileOrigin:
 *       type: string
 *       enum: [MonMaster, PV, StudentDocuments]
 *       description: Type of file origin
 *     
 *     FileSession:
 *       type: integer
 *       enum: [1, 2]
 *       description: Academic session (1=SESSION1, 2=SESSION2)
 *     
 *     FileMetadata:
 *       type: object
 *       properties:
 *         fileId:
 *           type: integer
 *           description: Unique identifier for the file
 *         masterId:
 *           type: integer
 *           description: ID of the associated master program
 *         fileName:
 *           type: string
 *           description: Original name of the file
 *         fileType:
 *           type: string
 *           description: File extension (e.g., pdf, xlsx, xml)
 *         filePath:
 *           type: string
 *           description: Path where the file is stored
 *         university:
 *           type: string
 *           description: University name
 *         formation:
 *           type: string
 *           description: Formation name
 *         yearAcademic:
 *           type: string
 *           description: Academic year
 *         fileOrigin:
 *           $ref: '#/components/schemas/FileOrigin'
 *         session:
 *           $ref: '#/components/schemas/FileSession'
 *         uploadedBy:
 *           type: integer
 *           description: ID of the user who uploaded the file
 *         uploadDate:
 *           type: string
 *           format: date-time
 *           description: Date and time when the file was uploaded
 *       required:
 *         - fileName
 *         - fileType
 *         - filePath
 *         - fileOrigin
 *         - uploadedBy
 *     
 *     FileUploadResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           description: Indicates if the operation was successful
 *         message:
 *           type: string
 *           description: Description of the operation result
 *         file:
 *           $ref: '#/components/schemas/FileMetadata'
 */

export enum FileOrigin {
    MonMaster = 'MonMaster',
    PV = 'PV',
    StudentDocuments = 'StudentDocuments'
}

export enum FileSession {
    Session1 = 1,
    Session2 = 2,
}

export interface IFileMetadata {
    fileId?: number;
    masterId?: number;
    fileName: string;
    fileType: string;
    filePath: string;
    university?: string;
    formation?: string;
    yearAcademic?: string;
    fileOrigin: FileOrigin;
    session?: FileSession;
    uploadedBy: number;
    uploadDate?: Date;
}

export interface IFileUploadResponse {
    success: boolean;
    message: string;
    file?: IFileMetadata;
}

export interface IFileUploadRequest {
    masterId?: number;
    university?: string;
    formation?: string;
    yearAcademic?: string;
    fileOrigin: FileOrigin;
    session?: FileSession;
}
