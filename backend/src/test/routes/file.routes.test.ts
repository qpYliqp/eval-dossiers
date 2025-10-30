import request from 'supertest';
import express from 'express';
import fileRoutes from '../../routes/file.routes';
import { FileController } from '../../controllers/file.controller';
import { FileOrigin, IFileMetadata } from '../../types/file.types';
import path from 'path';
import fs from 'fs';

jest.mock('../../controllers/file.controller');

const app = express();
app.use(express.json());
app.use('/api/files', fileRoutes);

describe('File Routes', () => {
    const mockFileController = FileController as jest.Mocked<typeof FileController>;

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /api/files/master/:masterId', () => {
        test('devrait renvoyer les fichiers pour un ID master spécifique', async () => {
            const mockFiles = [
                { fileId: 1, fileName: 'test1.pdf', fileOrigin: FileOrigin.StudentDocuments },
                { fileId: 2, fileName: 'test2.pdf', fileOrigin: FileOrigin.StudentDocuments }
            ] as IFileMetadata[];

            mockFileController.getFilesByMaster.mockImplementationOnce(async (req, res) => {
                res.status(200).json({ success: true, files: mockFiles });
            });

            const response = await request(app).get('/api/files/master/5');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.files).toHaveLength(2);
        });

        test('devrait gérer un ID master invalide', async () => {
            mockFileController.getFilesByMaster.mockImplementationOnce(async (req, res) => {
                res.status(400).json({ success: false, message: 'Invalid master ID' });
            });

            const response = await request(app).get('/api/files/master/invalid');

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });
    });

    describe('GET /api/files/origin/:origin', () => {
        test('devrait renvoyer les fichiers pour une origine spécifique', async () => {
            const mockFiles = [
                { fileId: 1, fileName: 'test1.xlsx', fileOrigin: FileOrigin.MonMaster }
            ] as IFileMetadata[];

            mockFileController.getFilesByOrigin.mockImplementationOnce(async (req, res) => {
                res.status(200).json({ success: true, files: mockFiles });
            });

            const response = await request(app).get('/api/files/origin/MonMaster');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.files).toHaveLength(1);
        });

        test('devrait gérer une origine invalide', async () => {
            mockFileController.getFilesByOrigin.mockImplementationOnce(async (req, res) => {
                res.status(400).json({ success: false, message: 'Invalid file origin' });
            });

            const response = await request(app).get('/api/files/origin/InvalidOrigin');

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });
    });

    describe('GET /api/files/:fileId', () => {
        test('devrait renvoyer un fichier par ID', async () => {
            const mockFile = {
                fileId: 1,
                fileName: 'test.pdf',
                fileOrigin: FileOrigin.StudentDocuments
            } as IFileMetadata;

            mockFileController.getFileById.mockImplementationOnce(async (req, res) => {
                res.status(200).json({ success: true, file: mockFile });
            });

            const response = await request(app).get('/api/files/1');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.file.fileId).toBe(1);
        });

        test('devrait gérer un fichier non trouvé', async () => {
            mockFileController.getFileById.mockImplementationOnce(async (req, res) => {
                res.status(404).json({ success: false, message: 'File not found' });
            });

            const response = await request(app).get('/api/files/999');

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
        });
    });

    describe('DELETE /api/files/:fileId', () => {
        test('devrait supprimer un fichier', async () => {
            const mockFile = {
                fileId: 1,
                fileName: 'test.pdf',
                fileOrigin: FileOrigin.StudentDocuments
            } as IFileMetadata;

            mockFileController.deleteFile.mockImplementationOnce(async (req, res) => {
                res.status(200).json({
                    success: true,
                    message: 'File deleted successfully',
                    file: mockFile
                });
            });

            const response = await request(app).delete('/api/files/1');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toContain('deleted successfully');
        });

        test('devrait gérer un fichier non trouvé lors de la suppression', async () => {
            mockFileController.deleteFile.mockImplementationOnce(async (req, res) => {
                res.status(404).json({ success: false, message: 'File not found' });
            });

            const response = await request(app).delete('/api/files/999');

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
        });
    });

    describe('POST /api/files/upload', () => {
        test('devrait gérer avec succès le téléchargement du fichier', async () => {
            const mockUploadResponse = {
                success: true,
                message: 'File uploaded successfully',
                file: {
                    fileId: 1,
                    fileName: 'test.pdf',
                    fileOrigin: FileOrigin.StudentDocuments
                }
            };

            mockFileController.uploadFile.mockImplementationOnce(async (req, res) => {
                res.status(201).json(mockUploadResponse);
            });

            // Note: In a real test with supertest, we'd use .attach() to send files,
            // but since we're mocking the controller, we'll just test the route handling
            const response = await request(app)
                .post('/api/files/upload')
                .field('fileOrigin', FileOrigin.StudentDocuments);

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toContain('uploaded successfully');
        });

        test('devrait gérer l\'échec du téléchargement du fichier', async () => {
            mockFileController.uploadFile.mockImplementationOnce(async (req, res) => {
                res.status(400).json({
                    success: false,
                    message: 'Error uploading file: Invalid file type'
                });
            });

            const response = await request(app)
                .post('/api/files/upload')
                .field('fileOrigin', FileOrigin.StudentDocuments);

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('Error uploading file');
        });
    });

    describe('GET /api/files/:fileId/download', () => {
        test('devrait router vers le contrôleur de téléchargement du fichier', async () => {
            // Create a simple implementation that just confirms the controller was called
            mockFileController.downloadFile.mockImplementationOnce(async (req, res) => {
                // We'll just return a success status to verify the route works
                res.status(200).send('File controller called');
            });

            const response = await request(app).get('/api/files/1/download');

            expect(response.status).toBe(200);
            expect(response.text).toBe('File controller called');
            expect(mockFileController.downloadFile).toHaveBeenCalled();
        });

        test('devrait gérer le téléchargement du fichier avec les en-têtes appropriés', async () => {
            // Create a test file to download
            const testFilePath = path.join(__dirname, 'test-download-file.txt');
            fs.writeFileSync(testFilePath, 'Test file content');

            // Mock implementation that sends a real file
            mockFileController.downloadFile.mockImplementationOnce(async (req, res) => {
                res.setHeader('Content-Type', 'text/plain');
                res.setHeader('Content-Disposition', 'attachment; filename="test.txt"');
                res.sendFile(testFilePath);
            });

            const response = await request(app)
                .get('/api/files/1/download')
                .expect('Content-Type', /text\/plain/)
                .expect('Content-Disposition', /attachment; filename="test.txt"/);

            expect(response.status).toBe(200);

            // Clean up test file
            fs.unlinkSync(testFilePath);
        });

        test('devrait gérer les erreurs dans la route de téléchargement', async () => {
            mockFileController.downloadFile.mockImplementationOnce(async (req, res) => {
                res.status(404).json({
                    success: false,
                    message: 'File not found'
                });
            });

            const response = await request(app).get('/api/files/999/download');

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('File not found');
        });
    });

    describe('GET /api/files/master/:masterId/origin/:origin', () => {
        test('devrait renvoyer les fichiers pour un ID master et une origine spécifiques', async () => {
            const mockFiles = [
                { fileId: 1, fileName: 'test1.pdf', fileOrigin: FileOrigin.StudentDocuments, masterId: 5 },
                { fileId: 2, fileName: 'test2.pdf', fileOrigin: FileOrigin.StudentDocuments, masterId: 5 }
            ] as IFileMetadata[];

            mockFileController.getFilesByMasterIdAndOrigin.mockImplementationOnce(async (req, res) => {
                res.status(200).json({ success: true, files: mockFiles });
            });

            const response = await request(app).get('/api/files/master/5/origin/StudentDocuments');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.files).toHaveLength(2);
            expect(mockFileController.getFilesByMasterIdAndOrigin).toHaveBeenCalled();
        });

        test('devrait gérer un ID master invalide', async () => {
            mockFileController.getFilesByMasterIdAndOrigin.mockImplementationOnce(async (req, res) => {
                res.status(400).json({ success: false, message: 'Invalid master ID' });
            });

            const response = await request(app).get('/api/files/master/invalid/origin/StudentDocuments');

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Invalid master ID');
        });

        test('devrait gérer une origine invalide', async () => {
            mockFileController.getFilesByMasterIdAndOrigin.mockImplementationOnce(async (req, res) => {
                res.status(400).json({ success: false, message: 'Invalid file origin' });
            });

            const response = await request(app).get('/api/files/master/5/origin/InvalidOrigin');

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Invalid file origin');
        });

        test('devrait gérer les erreurs du serveur', async () => {
            mockFileController.getFilesByMasterIdAndOrigin.mockImplementationOnce(async (req, res) => {
                res.status(500).json({ success: false, message: 'Server error' });
            });

            const response = await request(app).get('/api/files/master/5/origin/StudentDocuments');

            expect(response.status).toBe(500);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Server error');
        });
    });
});
