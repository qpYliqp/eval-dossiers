import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { FileModel } from '../models/file.model';
import { FileOrigin, FileSession, IFileMetadata, IFileUploadRequest } from '../types/file.types';
import { checkMasterProgramExists } from '../models/master-program.model';

export class FileService {
    private static readonly UPLOAD_DIR = path.resolve(process.cwd(), 'uploads');

    // Make sure upload directories exist
    static initializeStorage(): void {
        // Create main uploads directory
        if (!fs.existsSync(this.UPLOAD_DIR)) {
            fs.mkdirSync(this.UPLOAD_DIR, { recursive: true });
        }

        // Create subdirectories for each file type
        const subDirs = ['monmaster', 'pv', 'studentdocs'];
        subDirs.forEach(dir => {
            const dirPath = path.join(this.UPLOAD_DIR, dir);
            if (!fs.existsSync(dirPath)) {
                fs.mkdirSync(dirPath, { recursive: true });
            }
        });
    }

    // Get the subfolder based on fileOrigin
    private static getSubfolderByOrigin(fileOrigin: FileOrigin): string {
        switch (fileOrigin) {
            case FileOrigin.MonMaster: return 'monmaster';
            case FileOrigin.PV: return 'pv';
            case FileOrigin.StudentDocuments: return 'studentdocs';
            default: return '';
        }
    }

    // Generate a unique filename
    static generateUniqueFileName(originalName: string): string {
        const fileExt = path.extname(originalName);
        const baseName = path.basename(originalName, fileExt)
            .replace(/[^a-zA-Z0-9]/g, '_'); // Replace non-alphanumeric chars
        const timestamp = Date.now();
        const uuid = uuidv4().slice(0, 8);

        return `${baseName}_${timestamp}_${uuid}${fileExt}`;
    }

    // Save file to local storage
    static async saveFile(
        file: Express.Multer.File,
        fileOrigin: FileOrigin
    ): Promise<string> {
        this.initializeStorage();

        const subfolder = this.getSubfolderByOrigin(fileOrigin);
        const uniqueFileName = this.generateUniqueFileName(file.originalname);
        const destinationDir = path.join(this.UPLOAD_DIR, subfolder);
        const filePath = path.join(destinationDir, uniqueFileName);

        return new Promise((resolve, reject) => {
            fs.writeFile(filePath, file.buffer, (err) => {
                if (err) return reject(err);
                resolve(filePath);
            });
        });
    }

    // Validate file based on fileOrigin and metadata
    static validateFileMetadata(
        file: Express.Multer.File,
        metadata: IFileUploadRequest
    ): string | null {
        // First check if fileOrigin exists
        if (!metadata.fileOrigin) {
            return "File origin is required";
        }

        const { fileOrigin } = metadata;
        const fileExt = path.extname(file.originalname).toLowerCase();

        // Validate by file origin
        switch (fileOrigin) {
            case FileOrigin.MonMaster:
                if (fileExt !== '.xlsx') {
                    return "MonMaster files must be Excel (.xlsx) files";
                }
                if (!metadata.masterId) {
                    return "Master program ID is required for MonMaster files";
                }
                break;

            case FileOrigin.PV:
                if (fileExt !== '.xml') {
                    return "PV files must be XML (.xml) files";
                }
                if (!metadata.university || !metadata.university.trim()) {
                    return "University is required for PV files";
                }
                if (!metadata.formation || !metadata.formation.trim()) {
                    return "Formation is required for PV files";
                }
                if (!metadata.yearAcademic || !metadata.yearAcademic.trim()) {
                    return "Academic year is required for PV files";
                }
                if (!metadata.session) {
                    return "Session is required for PV files";
                }
                if (metadata.session !== FileSession.Session1 &&
                    metadata.session !== FileSession.Session2) {
                    return "Session must be either Session (1) or Session (2)";
                }
                if (!metadata.masterId) {
                    return "Master program ID is required for PV files";
                }
                break;

            case FileOrigin.StudentDocuments:
                if (fileExt !== '.pdf') {
                    return "Student documents must be PDF (.pdf) files";
                }
                if (!metadata.masterId) {
                    return "Master program ID is required for student documents";
                }
                break;

            default:
                return `Invalid file origin: ${fileOrigin}. Must be one of: ${Object.values(FileOrigin).join(', ')}`;
        }

        return null; // No validation errors
    }

    // Process file upload
    static async processFileUpload(
        file: Express.Multer.File,
        metadata: IFileUploadRequest,
        userId: number
    ): Promise<IFileMetadata> {
        // Validate metadata
        const validationError = this.validateFileMetadata(file, metadata);
        if (validationError) {
            throw new Error(validationError);
        }

        // Check if masterId is provided and if so, verify it exists
        if (metadata.masterId) {
            const masterExists = await checkMasterProgramExists(metadata.masterId);
            if (!masterExists) {
                throw new Error(`Master program with ID ${metadata.masterId} does not exist`);
            }

            // Check if a MonMaster file already exists for this master program
            if (metadata.fileOrigin === FileOrigin.MonMaster) {
                const fileExists = await FileModel.fileExistsForMaster(metadata.masterId, FileOrigin.MonMaster);
                if (fileExists) {
                    throw new Error(`A MonMaster file already exists for Master program with ID ${metadata.masterId}. Only one MonMaster file is allowed per master program.`);
                }
            }
        }

        try {
            // First, save the file to disk
            const filePath = await this.saveFile(file, metadata.fileOrigin);

            // Only if file is saved successfully, create the database record
            const fileData: IFileMetadata = {
                fileName: file.originalname,
                fileType: path.extname(file.originalname).slice(1), // Remove the dot
                filePath,
                fileOrigin: metadata.fileOrigin,
                uploadedBy: userId,
                masterId: metadata.masterId,
                university: metadata.university,
                formation: metadata.formation,
                yearAcademic: metadata.yearAcademic,
                session: metadata.session
            };

            return await FileModel.createFile(fileData);
        } catch (error) {
            // If file saving fails, log and rethrow the error
            console.error("Error saving file:", error);
            throw new Error(`Failed to save file: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    // Get files by master ID
    static async getFilesByMasterId(masterId: number): Promise<IFileMetadata[]> {
        return await FileModel.getFilesByMasterId(masterId);
    }

    // Get files by origin
    static async getFilesByOrigin(fileOrigin: FileOrigin): Promise<IFileMetadata[]> {
        return await FileModel.getFilesByOrigin(fileOrigin);
    }

    // Get files by master ID and origin
    static async getFilesByMasterIdAndOrigin(masterId: number, fileOrigin: FileOrigin): Promise<IFileMetadata[]> {
        return await FileModel.getFilesByMasterIdAndOrigin(masterId, fileOrigin);
    }

    // Get file by ID
    static async getFileById(fileId: number): Promise<IFileMetadata | null> {
        return await FileModel.getFileById(fileId);
    }

    // Get file download details
    static async getFileForDownload(fileId: number): Promise<{
        filePath: string;
        fileName: string;
        fileType: string;
    } | null> {
        const file = await FileModel.getFileById(fileId);

        if (!file) {
            return null; // File not found in database
        }

        // Check if file exists in filesystem
        if (!fs.existsSync(file.filePath)) {
            throw new Error(`File not found on disk: ${file.filePath}`);
        }

        return {
            filePath: file.filePath,
            fileName: file.fileName,
            fileType: file.fileType
        };
    }

    // Delete file (both from database and filesystem)
    static async deleteFile(fileId: number): Promise<IFileMetadata | null> {
        // First get the file details to determine the file path
        const fileDetails = await FileModel.getFileById(fileId);
        if (!fileDetails) {
            return null; // File not found
        }

        try {
            // Delete the file from the database
            const deletedFile = await FileModel.deleteFile(fileId);

            if (deletedFile) {
                // If database deletion successful, delete the file from the filesystem
                if (fs.existsSync(deletedFile.filePath)) {
                    fs.unlinkSync(deletedFile.filePath);
                    console.log(`File deleted from filesystem: ${deletedFile.filePath}`);
                } else {
                    console.warn(`File not found in filesystem: ${deletedFile.filePath}`);
                }
                return deletedFile;
            }
            return null;
        } catch (error) {
            console.error(`Error deleting file with ID ${fileId}:`, error);
            throw new Error(`Failed to delete file: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    static async getStudentDocument(masterId: number, candidateNumber: string) {
        return await FileModel.findStudentDocument(masterId, candidateNumber);
    }

}
