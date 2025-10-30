import express, { Express, Request, Response } from 'express';
import request from 'supertest';
import { NormalizedStudentData } from '../../types/pv-normalization.types';
import { NormalizationError } from '../../types/pv-normalization.types';

// Mock the controller
jest.mock('../../controllers/pv-normalization.controller', () => {
    const mockController = {
        processPvFile: jest.fn(),
        getNormalizedData: jest.fn(),
        deleteNormalizedData: jest.fn()
    };

    return {
        PvNormalizationController: jest.fn(() => mockController)
    };
});

// Import the routes after mocking controller
import pvNormalizationRoutes from '../../routes/pv-normalization.routes';

describe('PV Normalization Routes', () => {
    let app: Express;
    const { PvNormalizationController } = require('../../controllers/pv-normalization.controller');
    const controller = new PvNormalizationController();

    // Test data
    const mockFileId = 42;
    const mockNormalizedData: NormalizedStudentData[] = [
        {
            name: 'John Doe',
            dateOfBirth: '19950515',
            studentNumber: '12345678',
            semesterResults: [
                { semesterName: 'Fall 2022', grade: 14.5 }
            ]
        },
        {
            name: 'Jane Smith',
            dateOfBirth: '19960620',
            studentNumber: '87654321',
            semesterResults: [
                { semesterName: 'Fall 2022', grade: 16.0 }
            ]
        }
    ];

    beforeEach(() => {
        jest.clearAllMocks();

        // Setup Express app with the routes
        app = express();
        app.use(express.json());
        app.use('/api/pv-normalization', pvNormalizationRoutes);

        // Setup controller to pass calls to our test handlers
        controller.processPvFile.mockImplementation((req: Request, res: Response) => {
            const fileId = parseInt(req.params.fileId);
            if (isNaN(fileId)) {
                return res.status(400).json({ success: false, message: 'Invalid file ID' });
            }
            if (fileId === 409) {
                return res.status(409).json({
                    success: false,
                    message: NormalizationError.ALREADY_NORMALIZED
                });
            }
            if (fileId === 500) {
                return res.status(500).json({
                    success: false,
                    message: 'Server error while processing PV file'
                });
            }
            return res.status(200).json({
                success: true,
                message: 'PV file processed successfully',
                data: {
                    fileId,
                    studentsCount: mockNormalizedData.length
                }
            });
        });

        controller.getNormalizedData.mockImplementation((req: Request, res: Response) => {
            const fileId = parseInt(req.params.fileId);
            if (isNaN(fileId)) {
                return res.status(400).json({ success: false, message: 'Invalid file ID' });
            }
            if (fileId === 500) {
                return res.status(500).json({
                    success: false,
                    message: 'Server error while retrieving normalized data'
                });
            }
            return res.status(200).json({
                success: true,
                data: mockNormalizedData
            });
        });

        controller.deleteNormalizedData.mockImplementation((req: Request, res: Response) => {
            const fileId = parseInt(req.params.fileId);
            if (isNaN(fileId)) {
                return res.status(400).json({ success: false, message: 'Invalid file ID' });
            }
            if (fileId === 404) {
                return res.status(404).json({
                    success: false,
                    message: 'No normalized data found for this file or deletion failed'
                });
            }
            if (fileId === 500) {
                return res.status(500).json({
                    success: false,
                    message: 'Server error while deleting normalized data'
                });
            }
            return res.status(200).json({
                success: true,
                message: 'Normalized data deleted successfully'
            });
        });
    });

    describe('POST /api/pv-normalization/process/:fileId', () => {
        it('devrait traiter un fichier PV avec succès', async () => {
            const response = await request(app)
                .post(`/api/pv-normalization/process/${mockFileId}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('PV file processed successfully');
            expect(response.body.data.fileId).toBe(mockFileId);
            expect(response.body.data.studentsCount).toBe(mockNormalizedData.length);

            expect(controller.processPvFile).toHaveBeenCalledTimes(1);
        });

        it('devrait retourner 400 pour un ID de fichier invalide', async () => {
            const response = await request(app)
                .post('/api/pv-normalization/process/invalid')
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Invalid file ID');
        });

        it('devrait retourner 409 si le fichier est déjà normalisé', async () => {
            const response = await request(app)
                .post('/api/pv-normalization/process/409')
                .expect(409);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe(NormalizationError.ALREADY_NORMALIZED);
        });

        it('devrait retourner 500 pour les erreurs de serveur', async () => {
            const response = await request(app)
                .post('/api/pv-normalization/process/500')
                .expect(500);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Server error while processing PV file');
        });
    });

    describe('GET /api/pv-normalization/data/:fileId', () => {
        it('devrait récupérer les données normalisées avec succès', async () => {
            const response = await request(app)
                .get(`/api/pv-normalization/data/${mockFileId}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveLength(mockNormalizedData.length);
            expect(response.body.data[0].name).toBe(mockNormalizedData[0].name);
            expect(response.body.data[0].studentNumber).toBe(mockNormalizedData[0].studentNumber);

            expect(controller.getNormalizedData).toHaveBeenCalledTimes(1);
        });

        it('devrait retourner 400 pour un ID de fichier invalide', async () => {
            const response = await request(app)
                .get('/api/pv-normalization/data/invalid')
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Invalid file ID');
        });

        it('devrait retourner 500 pour les erreurs de serveur', async () => {
            const response = await request(app)
                .get('/api/pv-normalization/data/500')
                .expect(500);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Server error while retrieving normalized data');
        });
    });

    describe('DELETE /api/pv-normalization/data/:fileId', () => {
        it('devrait supprimer les données normalisées avec succès', async () => {
            const response = await request(app)
                .delete(`/api/pv-normalization/data/${mockFileId}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Normalized data deleted successfully');

            expect(controller.deleteNormalizedData).toHaveBeenCalledTimes(1);
        });

        it('devrait retourner 400 pour un ID de fichier invalide', async () => {
            const response = await request(app)
                .delete('/api/pv-normalization/data/invalid')
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Invalid file ID');
        });

        it('devrait retourner 404 si aucune donnée n\'est trouvée ou si la suppression a échoué', async () => {
            const response = await request(app)
                .delete('/api/pv-normalization/data/404')
                .expect(404);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('No normalized data found for this file or deletion failed');
        });

        it('devrait retourner 500 pour les erreurs de serveur', async () => {
            const response = await request(app)
                .delete('/api/pv-normalization/data/500')
                .expect(500);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Server error while deleting normalized data');
        });
    });
});
