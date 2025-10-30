import { Request, Response } from 'express';
import { FileController } from '../../controllers/file.controller';
import { FileService } from '../../services/file.service';
import { FileOrigin, IFileMetadata } from '../../types/file.types';

interface ResponseObject {
    success: boolean;
    message?: string;
    file?: IFileMetadata;
    files?: IFileMetadata[];
}

jest.mock('../../services/file.service');

describe('FileController', () => {
    const mockFileService = FileService as jest.Mocked<typeof FileService>;

    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let responseObject: ResponseObject = { success: false };

    beforeEach(() => {
        jest.clearAllMocks();

        mockRequest = {};
        responseObject = { success: false };

        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockImplementation(result => {
                responseObject = result;
                return mockResponse as Response;
            }),
            setHeader: jest.fn().mockReturnThis(), // Add the missing setHeader mock
            sendFile: jest.fn()                   // Make sure sendFile is also mocked
        };
    });

    describe('uploadFile', () => {
        test('devrait télécharger un fichier avec succès', async () => {
            const mockFile = {
                originalname: 'test.pdf',
                buffer: Buffer.from('test content')
            } as Express.Multer.File;

            mockRequest.file = mockFile;
            mockRequest.body = {
                fileOrigin: FileOrigin.StudentDocuments,
                masterId: '1'
            };

            const mockFileData: IFileMetadata = {
                fileId: 1,
                fileName: 'test.pdf',
                fileType: 'pdf',
                filePath: '/path/to/file',
                fileOrigin: FileOrigin.StudentDocuments,
                uploadedBy: 1,
                masterId: 1
            };

            mockFileService.processFileUpload.mockResolvedValueOnce(mockFileData);

            await FileController.uploadFile(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(201);
            expect(responseObject.success).toBe(true);
            expect(responseObject.file).toEqual(mockFileData);
            expect(mockFileService.processFileUpload).toHaveBeenCalledWith(
                mockFile,
                expect.objectContaining({
                    fileOrigin: FileOrigin.StudentDocuments,
                    masterId: 1
                }),
                expect.any(Number)
            );
        });

        test('devrait renvoyer 400 quand aucun fichier n\'est téléchargé', async () => {
            mockRequest.file = undefined;
            mockRequest.body = {
                fileOrigin: FileOrigin.StudentDocuments
            };

            await FileController.uploadFile(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(responseObject.success).toBe(false);
            expect(responseObject.message).toContain('No file uploaded');
        });

        test('devrait renvoyer 400 quand fileOrigin est manquant', async () => {
            mockRequest.file = {} as Express.Multer.File;
            mockRequest.body = {};

            await FileController.uploadFile(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(responseObject.success).toBe(false);
            expect(responseObject.message).toContain('File origin is required');
        });

        test('devrait renvoyer 400 quand fileOrigin est invalide', async () => {
            mockRequest.file = {} as Express.Multer.File;
            mockRequest.body = {
                fileOrigin: 'InvalidOrigin'
            };

            await FileController.uploadFile(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(responseObject.success).toBe(false);
            expect(responseObject.message).toContain('Invalid file origin');
        });

        test('devrait renvoyer 404 quand le programme master n\'existe pas', async () => {
            mockRequest.file = {} as Express.Multer.File;
            mockRequest.body = {
                fileOrigin: FileOrigin.StudentDocuments,
                masterId: '999'
            };

            mockFileService.processFileUpload.mockRejectedValueOnce(
                new Error('Master program with ID 999 does not exist')
            );

            await FileController.uploadFile(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(responseObject.success).toBe(false);
            expect(responseObject.message).toContain('Master program with ID 999 does not exist');
        });
    });

    describe('getFilesByMaster', () => {
        test('devrait obtenir les fichiers par ID master', async () => {
            mockRequest.params = { masterId: '1' };

            const mockFiles: IFileMetadata[] = [
                {
                    fileId: 1,
                    fileName: 'test1.pdf',
                    fileType: 'pdf',
                    filePath: '/path/to/file1',
                    fileOrigin: FileOrigin.StudentDocuments,
                    uploadedBy: 1,
                    masterId: 1
                },
                {
                    fileId: 2,
                    fileName: 'test2.pdf',
                    fileType: 'pdf',
                    filePath: '/path/to/file2',
                    fileOrigin: FileOrigin.StudentDocuments,
                    uploadedBy: 1,
                    masterId: 1
                }
            ];

            mockFileService.getFilesByMasterId.mockResolvedValueOnce(mockFiles);

            await FileController.getFilesByMaster(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(responseObject.success).toBe(true);
            expect(responseObject.files).toHaveLength(2);
            expect(mockFileService.getFilesByMasterId).toHaveBeenCalledWith(1);
        });

        test('devrait renvoyer 400 quand l\'ID master est invalide', async () => {
            mockRequest.params = { masterId: 'invalid' };

            await FileController.getFilesByMaster(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(responseObject.success).toBe(false);
            expect(responseObject.message).toContain('Invalid master ID');
        });

        test('devrait renvoyer 500 en cas d\'erreur de service', async () => {
            mockRequest.params = { masterId: '1' };

            mockFileService.getFilesByMasterId.mockRejectedValueOnce(new Error('Database error'));

            await FileController.getFilesByMaster(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(responseObject.success).toBe(false);
            expect(responseObject.message).toContain('Database error');
        });
    });

    describe('getFilesByOrigin', () => {
        test('devrait obtenir les fichiers par origine', async () => {
            mockRequest.params = { origin: FileOrigin.MonMaster };

            const mockFiles: IFileMetadata[] = [
                {
                    fileId: 1,
                    fileName: 'test.xlsx',
                    fileType: 'xlsx',
                    filePath: '/path/to/file',
                    fileOrigin: FileOrigin.MonMaster,
                    uploadedBy: 1
                }
            ];

            mockFileService.getFilesByOrigin.mockResolvedValueOnce(mockFiles);

            await FileController.getFilesByOrigin(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(responseObject.success).toBe(true);
            expect(responseObject.files).toHaveLength(1);
            expect(responseObject.files![0].fileOrigin).toBe(FileOrigin.MonMaster);
        });

        test('devrait renvoyer 400 quand l\'origine est invalide', async () => {
            mockRequest.params = { origin: 'InvalidOrigin' };

            await FileController.getFilesByOrigin(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(responseObject.success).toBe(false);
            expect(responseObject.message).toContain('Invalid file origin');
        });

        test('devrait renvoyer 500 en cas d\'erreur de service', async () => {
            mockRequest.params = { origin: FileOrigin.MonMaster };

            mockFileService.getFilesByOrigin.mockRejectedValueOnce(new Error('Database error'));

            await FileController.getFilesByOrigin(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(responseObject.success).toBe(false);
            expect(responseObject.message).toContain('Database error');
        });
    });

    describe('getFileById', () => {
        test('devrait obtenir un fichier par ID', async () => {
            mockRequest.params = { fileId: '1' };

            const mockFile: IFileMetadata = {
                fileId: 1,
                fileName: 'test.pdf',
                fileType: 'pdf',
                filePath: '/path/to/file',
                fileOrigin: FileOrigin.StudentDocuments,
                uploadedBy: 1
            };

            mockFileService.getFileById.mockResolvedValueOnce(mockFile);

            await FileController.getFileById(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(responseObject.success).toBe(true);
            expect(responseObject.file).toEqual(mockFile);
        });

        test('devrait renvoyer 400 quand l\'ID du fichier est invalide', async () => {
            mockRequest.params = { fileId: 'invalid' };

            await FileController.getFileById(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(responseObject.success).toBe(false);
            expect(responseObject.message).toContain('Invalid file ID');
        });

        test('devrait renvoyer 404 quand le fichier n\'existe pas', async () => {
            mockRequest.params = { fileId: '999' };

            mockFileService.getFileById.mockResolvedValueOnce(null);

            await FileController.getFileById(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(responseObject.success).toBe(false);
            expect(responseObject.message).toContain('not found');
        });

        test('devrait renvoyer 500 en cas d\'erreur de service', async () => {
            mockRequest.params = { fileId: '1' };

            mockFileService.getFileById.mockRejectedValueOnce(new Error('Database error'));

            await FileController.getFileById(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(responseObject.success).toBe(false);
            expect(responseObject.message).toContain('Database error');
        });
    });

    describe('deleteFile', () => {
        test('devrait supprimer un fichier', async () => {
            mockRequest.params = { fileId: '1' };

            const mockFile: IFileMetadata = {
                fileId: 1,
                fileName: 'test.pdf',
                fileType: 'pdf',
                filePath: '/path/to/file',
                fileOrigin: FileOrigin.StudentDocuments,
                uploadedBy: 1
            };

            mockFileService.deleteFile.mockResolvedValueOnce(mockFile);

            await FileController.deleteFile(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(responseObject.success).toBe(true);
            expect(responseObject.message).toContain('deleted successfully');
            expect(responseObject.file).toEqual(mockFile);
        });

        test('devrait renvoyer 400 quand l\'ID du fichier est invalide', async () => {
            mockRequest.params = { fileId: 'invalid' };

            await FileController.deleteFile(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(responseObject.success).toBe(false);
            expect(responseObject.message).toContain('Invalid file ID');
        });

        test('devrait renvoyer 404 quand le fichier n\'existe pas', async () => {
            mockRequest.params = { fileId: '999' };

            mockFileService.deleteFile.mockResolvedValueOnce(null);

            await FileController.deleteFile(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(responseObject.success).toBe(false);
            expect(responseObject.message).toContain('not found');
        });

        test('devrait renvoyer 500 en cas d\'erreur de service', async () => {
            mockRequest.params = { fileId: '1' };

            mockFileService.deleteFile.mockRejectedValueOnce(new Error('Database error'));

            await FileController.deleteFile(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(responseObject.success).toBe(false);
            expect(responseObject.message).toContain('Database error');
        });
    });

    describe('downloadFile', () => {
        test('devrait télécharger un fichier avec succès', async () => {
            mockRequest.params = { fileId: '1' };

            const fileDetails = {
                fileName: 'test.pdf',
                fileType: 'pdf',
                filePath: '/path/to/file'
            };

            mockFileService.getFileForDownload.mockResolvedValueOnce(fileDetails);

            await FileController.downloadFile(mockRequest as Request, mockResponse as Response);

            // Check if content headers are set correctly
            expect(mockResponse.setHeader).toHaveBeenCalledWith('Content-Type', 'application/pdf');
            expect(mockResponse.setHeader).toHaveBeenCalledWith(
                'Content-Disposition',
                expect.stringContaining('attachment; filename="test.pdf"')
            );

            // Check if sendFile was called with correct parameters
            expect(mockResponse.sendFile).toHaveBeenCalledWith(
                '/path/to/file',
                expect.objectContaining({
                    dotfiles: 'deny',
                    headers: expect.objectContaining({
                        'Content-Type': 'application/pdf'
                    })
                })
            );
        });

        test('devrait renvoyer 400 quand l\'ID du fichier est invalide', async () => {
            mockRequest.params = { fileId: 'invalid' };

            await FileController.downloadFile(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(responseObject.success).toBe(false);
            expect(responseObject.message).toContain('Invalid file ID format');
        });

        test('devrait renvoyer 404 quand le fichier n\'est pas trouvé', async () => {
            mockRequest.params = { fileId: '999' };

            mockFileService.getFileForDownload.mockResolvedValueOnce(null);

            await FileController.downloadFile(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(responseObject.success).toBe(false);
            expect(responseObject.message).toContain('File not found');
        });

        test('devrait gérer les erreurs quand le fichier existe dans la base de données mais pas sur le disque', async () => {
            mockRequest.params = { fileId: '1' };

            mockFileService.getFileForDownload.mockRejectedValueOnce(
                new Error('File not found on disk: /path/to/file')
            );

            await FileController.downloadFile(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(responseObject.success).toBe(false);
            expect(responseObject.message).toContain('File not found on disk');
        });

        test('devrait définir le type de contenu correct pour différentes extensions de fichiers', async () => {
            const fileTypes = [
                { fileName: 'test.xlsx', fileType: 'xlsx', contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
                { fileName: 'test.xml', fileType: 'xml', contentType: 'application/xml' },
                { fileName: 'test.unknown', fileType: 'unknown', contentType: 'application/octet-stream' }
            ];

            // Test each file type
            for (const type of fileTypes) {
                jest.clearAllMocks();
                mockRequest.params = { fileId: '1' };

                const fileDetails = {
                    fileName: type.fileName,
                    fileType: type.fileType,
                    filePath: `/path/to/${type.fileName}`
                };

                mockFileService.getFileForDownload.mockResolvedValueOnce(fileDetails);

                await FileController.downloadFile(mockRequest as Request, mockResponse as Response);

                // Check content type is set correctly for this file type
                expect(mockResponse.setHeader).toHaveBeenCalledWith('Content-Type', type.contentType);
                expect(mockResponse.sendFile).toHaveBeenCalledWith(
                    `/path/to/${type.fileName}`,
                    expect.objectContaining({
                        headers: expect.objectContaining({
                            'Content-Type': type.contentType
                        })
                    })
                );
            }
        });
    });

    describe('getFilesByMasterIdAndOrigin', () => {
        test('devrait obtenir les fichiers par ID master et origine', async () => {
            mockRequest.params = {
                masterId: '1',
                origin: FileOrigin.StudentDocuments
            };

            const mockFiles: IFileMetadata[] = [
                {
                    fileId: 1,
                    fileName: 'test1.pdf',
                    fileType: 'pdf',
                    filePath: '/path/to/file1',
                    fileOrigin: FileOrigin.StudentDocuments,
                    uploadedBy: 1,
                    masterId: 1
                },
                {
                    fileId: 2,
                    fileName: 'test2.pdf',
                    fileType: 'pdf',
                    filePath: '/path/to/file2',
                    fileOrigin: FileOrigin.StudentDocuments,
                    uploadedBy: 1,
                    masterId: 1
                }
            ];

            mockFileService.getFilesByMasterIdAndOrigin.mockResolvedValueOnce(mockFiles);

            await FileController.getFilesByMasterIdAndOrigin(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(responseObject.success).toBe(true);
            expect(responseObject.files).toHaveLength(2);
            expect(mockFileService.getFilesByMasterIdAndOrigin).toHaveBeenCalledWith(
                1,
                FileOrigin.StudentDocuments
            );
        });

        test('devrait renvoyer 400 quand l\'ID master est invalide', async () => {
            mockRequest.params = {
                masterId: 'invalid',
                origin: FileOrigin.StudentDocuments
            };

            await FileController.getFilesByMasterIdAndOrigin(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(responseObject.success).toBe(false);
            expect(responseObject.message).toContain('Invalid master ID');
        });

        test('devrait renvoyer 400 quand l\'origine est invalide', async () => {
            mockRequest.params = {
                masterId: '1',
                origin: 'InvalidOrigin'
            };

            await FileController.getFilesByMasterIdAndOrigin(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(responseObject.success).toBe(false);
            expect(responseObject.message).toContain('Invalid file origin');
        });

        test('devrait renvoyer 500 quand le service renvoie une erreur', async () => {
            mockRequest.params = {
                masterId: '1',
                origin: FileOrigin.StudentDocuments
            };

            mockFileService.getFilesByMasterIdAndOrigin.mockRejectedValueOnce(new Error('Database error'));

            await FileController.getFilesByMasterIdAndOrigin(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(responseObject.success).toBe(false);
            expect(responseObject.message).toContain('Database error');
        });
    });

    
});
