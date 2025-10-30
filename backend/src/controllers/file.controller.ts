import { Request, Response } from 'express';
import { FileService } from '../services/file.service';
import { FileOrigin, FileSession, IFileUploadRequest } from '../types/file.types';
import { User } from '../types/master-programs.types';
import path from 'path';

// Extended request type that includes a typed user
interface AuthenticatedRequest extends Request {
    user?: User;
}
/**
 * Controller for handling file-related operations.
 * This includes uploading, retrieving, deleting, and downloading files,
 * as well as validating input and interacting with the FileService.
 */
export class FileController {
    /**
     * Handles the uploading of a file and validates the file and its metadata.
     * @param {Request} req - The HTTP request object containing the file and metadata.
     * @param {Response} res - The HTTP response object used to send the response.
     * @returns {Promise<void>}
     */
    static async uploadFile(req: Request, res: Response): Promise<void> {
        try {
            if (!req.file) {
                res.status(400).json({ success: false, message: 'No file uploaded' });
                return;
            }

            // Check if fileOrigin is provided
            if (!req.body.fileOrigin) {
                res.status(400).json({ success: false, message: 'File origin is required' });
                return;
            }

            // Validate that fileOrigin is a valid enum value
            if (!Object.values(FileOrigin).includes(req.body.fileOrigin)) {
                res.status(400).json({
                    success: false,
                    message: `Invalid file origin. Must be one of: ${Object.values(FileOrigin).join(', ')}`
                });
                return;
            }

            const metadata: IFileUploadRequest = {
                fileOrigin: req.body.fileOrigin as FileOrigin,
                masterId: req.body.masterId ? parseInt(req.body.masterId) : undefined,
                university: req.body.university,
                formation: req.body.formation,
                yearAcademic: req.body.yearAcademic,
                session: req.body.session ? parseInt(req.body.session) as FileSession : undefined
            };

            // TODO : Get user ID from authenticated user
            const authReq = req as AuthenticatedRequest;
            const userId = authReq.user?.id || 1; // Default for testing

            const file = await FileService.processFileUpload(req.file, metadata, userId);

            res.status(201).json({
                success: true,
                message: 'File uploaded successfully',
                file
            });
        } catch (error: unknown) {
            console.error('Error in uploadFile:', error); // Debug log
            const errorMessage = error instanceof Error ? error.message : 'Error uploading file';

            // Check for specific error about master program not existing
            if (errorMessage.includes('Master program with ID') && errorMessage.includes('does not exist')) {
                res.status(404).json({
                    success: false,
                    message: errorMessage
                });
                return;
            }

            res.status(400).json({
                success: false,
                message: errorMessage
            });
        }
    }

    /**
     * Retrieves files associated with a specific master program.
     * @param {Request} req - The HTTP request object containing the master ID as a parameter.
     * @param {Response} res - The HTTP response object used to send the response.
     * @returns {Promise<void>}
     */
    static async getFilesByMaster(req: Request, res: Response): Promise<void> {
        try {
            const masterId = parseInt(req.params.masterId);
            if (isNaN(masterId)) {
                res.status(400).json({ success: false, message: 'Invalid master ID' });
                return;
            }

            const files = await FileService.getFilesByMasterId(masterId);

            res.status(200).json({
                success: true,
                files
            });
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Error retrieving files';
            res.status(500).json({
                success: false,
                message: errorMessage
            });
        }
    }

    /**
     * Retrieves files based on their origin.
     * @param {Request} req - The HTTP request object containing the origin as a parameter.
     * @param {Response} res - The HTTP response object used to send the response.
     * @returns {Promise<void>}
     */
    static async getFilesByOrigin(req: Request, res: Response): Promise<void> {
        try {
            const { origin } = req.params;
            if (!Object.values(FileOrigin).includes(origin as FileOrigin)) {
                res.status(400).json({ success: false, message: 'Invalid file origin' });
                return;
            }

            const files = await FileService.getFilesByOrigin(origin as FileOrigin);

            res.status(200).json({
                success: true,
                files
            });
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Error retrieving files';
            res.status(500).json({
                success: false,
                message: errorMessage
            });
        }
    }

    /**
     * Deletes a file by its ID.
     * @param {Request} req - The HTTP request object containing the file ID as a parameter.
     * @param {Response} res - The HTTP response object used to send the response.
     * @returns {Promise<void>}
     */
    static async deleteFile(req: Request, res: Response): Promise<void> {
        try {
            const fileId = parseInt(req.params.fileId);
            if (isNaN(fileId)) {
                res.status(400).json({ success: false, message: 'Invalid file ID' });
                return;
            }

            const deletedFile = await FileService.deleteFile(fileId);

            if (!deletedFile) {
                res.status(404).json({
                    success: false,
                    message: `File with ID ${fileId} not found`
                });
                return;
            }

            res.status(200).json({
                success: true,
                message: 'File deleted successfully',
                file: deletedFile
            });
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Error deleting file';
            res.status(500).json({
                success: false,
                message: errorMessage
            });
        }
    }

    /**
     * Retrieves a file by its ID.
     * @param {Request} req - The HTTP request object containing the file ID as a parameter.
     * @param {Response} res - The HTTP response object used to send the response.
     * @returns {Promise<void>}
     */
    static async getFileById(req: Request, res: Response): Promise<void> {
        try {
            const fileId = parseInt(req.params.fileId);
            if (isNaN(fileId)) {
                res.status(400).json({ success: false, message: 'Invalid file ID' });
                return;
            }

            const file = await FileService.getFileById(fileId);

            if (!file) {
                res.status(404).json({
                    success: false,
                    message: `File with ID ${fileId} not found`
                });
                return;
            }

            res.status(200).json({
                success: true,
                file
            });
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Error retrieving file';
            res.status(500).json({
                success: false,
                message: errorMessage
            });
        }
    }

    /**
     * Downloads a file by its ID.
     * @param {Request} req - The HTTP request object containing the file ID as a parameter.
     * @param {Response} res - The HTTP response object used to send the response.
     * @returns {Promise<void>}
     */
    static async downloadFile(req: Request, res: Response): Promise<void> {
        try {
            const fileId = parseInt(req.params.fileId);

            if (isNaN(fileId)) {
                res.status(400).json({
                    success: false,
                    message: "Invalid file ID format"
                });
                return;
            }

            const fileDetails = await FileService.getFileForDownload(fileId);

            if (!fileDetails) {
                res.status(404).json({
                    success: false,
                    message: "File not found"
                });
                return;
            }

            // Set the appropriate content type based on the file type
            const mimeTypes: Record<string, string> = {
                'pdf': 'application/pdf',
                'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'xls': 'application/vnd.ms-excel',
                'xml': 'application/xml',
            };

            const contentType = mimeTypes[fileDetails.fileType.toLowerCase()] || 'application/octet-stream';

            // Set response headers
            res.setHeader('Content-Type', contentType);
            res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileDetails.fileName)}"`);

            // Stream the file
            res.sendFile(fileDetails.filePath, {
                dotfiles: 'deny',
                headers: {
                    'Content-Type': contentType,
                    'Content-Disposition': `attachment; filename="${encodeURIComponent(fileDetails.fileName)}"`
                }
            });

        } catch (error) {
            console.error('Error downloading file:', error);
            res.status(500).json({
                success: false,
                message: error instanceof Error ? error.message : 'An error occurred during file download'
            });
        }
    }

    /**
     * Retrieves files by both master ID and file origin.
     * @param {Request} req - The HTTP request object containing master ID and origin as parameters.
     * @param {Response} res - The HTTP response object used to send the response.
     * @returns {Promise<void>}
     */
    static async getFilesByMasterIdAndOrigin(req: Request, res: Response): Promise<void> {
        try {
            const masterId = parseInt(req.params.masterId);
            const { origin } = req.params;

            // Validate masterId
            if (isNaN(masterId)) {
                res.status(400).json({ success: false, message: 'Invalid master ID' });
                return;
            }

            // Validate origin
            if (!Object.values(FileOrigin).includes(origin as FileOrigin)) {
                res.status(400).json({ success: false, message: 'Invalid file origin' });
                return;
            }

            const files = await FileService.getFilesByMasterIdAndOrigin(masterId, origin as FileOrigin);

            res.status(200).json({
                success: true,
                files
            });
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Error retrieving files';
            res.status(500).json({
                success: false,
                message: errorMessage
            });
        }
    }

    /**
     * Retrieves a student document by master ID and candidate number.
     * @param {Request} req - The HTTP request object containing master ID and candidate number as parameters.
     * @param {Response} res - The HTTP response object used to send the response.
     * @returns {Promise<void>}
     */
    static async getStudentDocument(req: Request, res: Response): Promise<void> {
        const { masterId, candidateNumber } = req.params;
    
        if (!masterId || !candidateNumber) {
            res.status(400).json({ message: "Master ID et Candidate Number sont requis." });
        }
    
        try {
            const file = await FileService.getStudentDocument(parseInt(masterId), candidateNumber);
    
            if (!file) {
                res.status(404).json({ message: "Document non trouvé." });
                return;
            }
    
            res.json({ filePath: file.filePath, fileName: file.fileName });
        } catch (error) {
            console.error("Erreur lors de la récupération du document :", error);
            res.status(500).json({ message: "Erreur serveur" });
        }
    }
}
