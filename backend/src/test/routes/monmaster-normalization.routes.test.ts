import request from 'supertest';
import express, { Express, Response } from 'express';
import { MonMasterNormalizationController } from '../../controllers/monmaster-normalization.controller';
import routes from '../../routes/monmaster-normalization.routes';
import {
    MonMasterNormalizationError,
    MonMasterNormalizationResult
} from '../../types/monmaster-normalization.types';


jest.mock('../../controllers/monmaster-normalization.controller');

describe('MonMaster Normalization Routes', () => {
    let app: Express;
    let mockController: jest.Mocked<MonMasterNormalizationController>;

    beforeEach(() => {

        jest.clearAllMocks();


        app = express();
        app.use(express.json());
        app.use('/api/monmaster-normalization', routes);


        mockController = MonMasterNormalizationController.prototype as jest.Mocked<MonMasterNormalizationController>;


        mockController.processMonMasterFile.mockImplementation((_, res) => {
            res.status(200).json({ success: true });
            return Promise.resolve(res);
        });

        mockController.getNormalizedData.mockImplementation((_, res) => {
            res.status(200).json({ success: true });
            return Promise.resolve(res);
        });

        mockController.searchCandidates.mockImplementation((_, res) => {
            res.status(200).json({ success: true });
            return Promise.resolve(res);
        });

        mockController.getCandidateById.mockImplementation((_, res) => {
            res.status(200).json({ success: true });
            return Promise.resolve(res);
        });

        mockController.deleteNormalizedData.mockImplementation((_, res) => {
            res.status(200).json({ success: true });
            return Promise.resolve(res);
        });
    });

    describe('POST /process/:fileId', () => {
        it('devrait traiter un fichier MonMaster avec succès', async () => {

            mockController.processMonMasterFile.mockImplementation((_, res) => {
                res.status(200).json({
                    success: true,
                    message: 'MonMaster file processed successfully',
                    data: {
                        fileId: 123,
                        candidatesCount: 5,
                        academicRecordsCount: 10,
                        scoresCount: 15
                    }
                });
                return Promise.resolve(res);
            });


            const response = await request(app)
                .post('/api/monmaster-normalization/process/123')
                .expect('Content-Type', /json/)
                .expect(200);


            expect(response.body).toEqual({
                success: true,
                message: 'MonMaster file processed successfully',
                data: {
                    fileId: 123,
                    candidatesCount: 5,
                    academicRecordsCount: 10,
                    scoresCount: 15
                }
            });
            expect(mockController.processMonMasterFile).toHaveBeenCalled();
        });

        it('devrait gérer un ID de fichier invalide', async () => {

            mockController.processMonMasterFile.mockImplementation((_, res) => {
                res.status(400).json({
                    success: false,
                    message: 'Invalid file ID'
                });
                return Promise.resolve(res);
            });


            const response = await request(app)
                .post('/api/monmaster-normalization/process/invalid')
                .expect('Content-Type', /json/)
                .expect(400);


            expect(response.body).toEqual({
                success: false,
                message: 'Invalid file ID'
            });
            expect(mockController.processMonMasterFile).toHaveBeenCalled();
        });

        it('devrait gérer les fichiers déjà normalisés', async () => {

            mockController.processMonMasterFile.mockImplementation((_, res) => {
                res.status(409).json({
                    success: false,
                    message: MonMasterNormalizationError.ALREADY_NORMALIZED
                });
                return Promise.resolve(res);
            });


            const response = await request(app)
                .post('/api/monmaster-normalization/process/123')
                .expect('Content-Type', /json/)
                .expect(409);


            expect(response.body).toEqual({
                success: false,
                message: MonMasterNormalizationError.ALREADY_NORMALIZED
            });
            expect(mockController.processMonMasterFile).toHaveBeenCalled();
        });

        it('devrait gérer les fichiers non trouvés', async () => {

            mockController.processMonMasterFile.mockImplementation((_, res) => {
                res.status(404).json({
                    success: false,
                    message: MonMasterNormalizationError.FILE_NOT_FOUND
                });
                return Promise.resolve(res);
            });


            const response = await request(app)
                .post('/api/monmaster-normalization/process/999')
                .expect('Content-Type', /json/)
                .expect(404);


            expect(response.body).toEqual({
                success: false,
                message: MonMasterNormalizationError.FILE_NOT_FOUND
            });
            expect(mockController.processMonMasterFile).toHaveBeenCalled();
        });

        it('devrait gérer les erreurs du serveur', async () => {

            mockController.processMonMasterFile.mockImplementation((_, res) => {
                res.status(500).json({
                    success: false,
                    message: 'Server error while processing MonMaster file'
                });
                return Promise.resolve(res);
            });


            const response = await request(app)
                .post('/api/monmaster-normalization/process/123')
                .expect('Content-Type', /json/)
                .expect(500);


            expect(response.body).toEqual({
                success: false,
                message: 'Server error while processing MonMaster file'
            });
            expect(mockController.processMonMasterFile).toHaveBeenCalled();
        });

        it('devrait gérer les erreurs lancées dans le contrôleur', async () => {

            mockController.processMonMasterFile.mockImplementation(() => {
                throw new Error('Unexpected error');
            });


            await request(app)
                .post('/api/monmaster-normalization/process/123')
                .expect(500);

            expect(mockController.processMonMasterFile).toHaveBeenCalled();
        });
    });

    describe('GET /data/:fileId', () => {
        it('devrait récupérer les données normalisées avec succès', async () => {
            const mockData: MonMasterNormalizationResult = {
                candidates: [{ candidateId: 1, monmasterFileId: 123, lastName: 'Doe', firstName: 'John', fullName: 'Doe John', candidateNumber: 'C123', dateOfBirth: '01/01/1990' }],
                academicRecords: [{ recordId: 1, candidateId: 1, academicYear: '2022-2023', programType: 'Master', curriculumYear: '2', specialization: 'CS', coursePath: 'AI', gradeSemester1: 16, gradeSemester2: 18, institution: 'Uni' }],
                candidateScores: [{ scoreId: 1, candidateId: 1, scoreLabel: 'GPA', scoreValue: '17' }]
            };


            mockController.getNormalizedData.mockImplementation((_, res) => {
                res.status(200).json({
                    success: true,
                    data: mockData
                });
                return Promise.resolve(res);
            });


            const response = await request(app)
                .get('/api/monmaster-normalization/data/123')
                .expect('Content-Type', /json/)
                .expect(200);


            expect(response.body).toEqual({
                success: true,
                data: mockData
            });
            expect(mockController.getNormalizedData).toHaveBeenCalled();
        });

        it('devrait gérer un ID de fichier invalide', async () => {

            mockController.getNormalizedData.mockImplementation((_, res) => {
                res.status(400).json({
                    success: false,
                    message: 'Invalid file ID'
                });
                return Promise.resolve(res);
            });


            const response = await request(app)
                .get('/api/monmaster-normalization/data/invalid')
                .expect('Content-Type', /json/)
                .expect(400);


            expect(response.body).toEqual({
                success: false,
                message: 'Invalid file ID'
            });
            expect(mockController.getNormalizedData).toHaveBeenCalled();
        });

        it('devrait gérer l\'absence de données normalisées', async () => {

            mockController.getNormalizedData.mockImplementation((_, res) => {
                res.status(404).json({
                    success: false,
                    message: 'No normalized data found for this file'
                });
                return Promise.resolve(res);
            });


            const response = await request(app)
                .get('/api/monmaster-normalization/data/999')
                .expect('Content-Type', /json/)
                .expect(404);


            expect(response.body).toEqual({
                success: false,
                message: 'No normalized data found for this file'
            });
            expect(mockController.getNormalizedData).toHaveBeenCalled();
        });

        it('devrait gérer les erreurs du serveur', async () => {

            mockController.getNormalizedData.mockImplementation((_, res) => {
                res.status(500).json({
                    success: false,
                    message: 'Server error while retrieving normalized data'
                });
                return Promise.resolve(res);
            });


            const response = await request(app)
                .get('/api/monmaster-normalization/data/123')
                .expect('Content-Type', /json/)
                .expect(500);


            expect(response.body).toEqual({
                success: false,
                message: 'Server error while retrieving normalized data'
            });
            expect(mockController.getNormalizedData).toHaveBeenCalled();
        });

        it('devrait gérer les erreurs lancées dans le contrôleur', async () => {

            mockController.getNormalizedData.mockImplementation(() => {
                throw new Error('Unexpected error');
            });


            await request(app)
                .get('/api/monmaster-normalization/data/123')
                .expect(500);

            expect(mockController.getNormalizedData).toHaveBeenCalled();
        });
    });

    describe('GET /candidates/search', () => {
        it('devrait rechercher des candidats avec succès', async () => {
            const mockCandidates = [
                { candidateId: 1, monmasterFileId: 123, lastName: 'Doe', firstName: 'John', candidateNumber: 'C123', dateOfBirth: '01/01/1990' },
                { candidateId: 2, monmasterFileId: 123, lastName: 'Doe', firstName: 'Jane', candidateNumber: 'C124', dateOfBirth: '02/02/1991' }
            ];


            mockController.searchCandidates.mockImplementation((_, res) => {
                res.status(200).json({
                    success: true,
                    data: mockCandidates
                });
                return Promise.resolve(res);
            });


            const response = await request(app)
                .get('/api/monmaster-normalization/candidates/search?firstName=John&lastName=Doe')
                .expect('Content-Type', /json/)
                .expect(200);


            expect(response.body).toEqual({
                success: true,
                data: mockCandidates
            });
            expect(mockController.searchCandidates).toHaveBeenCalled();
        });

        it('devrait gérer les résultats de recherche vides', async () => {

            mockController.searchCandidates.mockImplementation((_, res) => {
                res.status(200).json({
                    success: true,
                    data: []
                });
                return Promise.resolve(res);
            });


            const response = await request(app)
                .get('/api/monmaster-normalization/candidates/search?firstName=NonExistent')
                .expect('Content-Type', /json/)
                .expect(200);


            expect(response.body).toEqual({
                success: true,
                data: []
            });
            expect(mockController.searchCandidates).toHaveBeenCalled();
        });

        it('devrait gérer la recherche par plusieurs critères', async () => {

            mockController.searchCandidates.mockImplementation((req, res) => {
                const queryParams = req.query;
                res.status(200).json({
                    success: true,
                    data: [],
                    queriedParams: queryParams
                });
                return Promise.resolve(res);
            });


            const response = await request(app)
                .get('/api/monmaster-normalization/candidates/search?firstName=John&lastName=Doe&candidateNumber=C123&monmasterFileId=123')
                .expect('Content-Type', /json/)
                .expect(200);


            expect(response.body.queriedParams).toEqual({
                firstName: 'John',
                lastName: 'Doe',
                candidateNumber: 'C123',
                monmasterFileId: '123'
            });
            expect(mockController.searchCandidates).toHaveBeenCalled();
        });

        it('devrait gérer les erreurs du serveur', async () => {

            mockController.searchCandidates.mockImplementation((_, res) => {
                res.status(500).json({
                    success: false,
                    message: 'Server error while searching candidates'
                });
                return Promise.resolve(res);
            });


            const response = await request(app)
                .get('/api/monmaster-normalization/candidates/search')
                .expect('Content-Type', /json/)
                .expect(500);


            expect(response.body).toEqual({
                success: false,
                message: 'Server error while searching candidates'
            });
            expect(mockController.searchCandidates).toHaveBeenCalled();
        });

        it('devrait gérer les erreurs lancées dans le contrôleur', async () => {

            mockController.searchCandidates.mockImplementation(() => {
                throw new Error('Unexpected error');
            });


            await request(app)
                .get('/api/monmaster-normalization/candidates/search?firstName=John')
                .expect(500);

            expect(mockController.searchCandidates).toHaveBeenCalled();
        });
    });

    describe('GET /candidates/:candidateId', () => {
        it('devrait récupérer un candidat par ID avec succès', async () => {
            const mockCandidateData = {
                candidate: { candidateId: 123, monmasterFileId: 456, lastName: 'Doe', firstName: 'John', candidateNumber: 'C123', dateOfBirth: '01/01/1990' },
                academicRecords: [{ recordId: 1, candidateId: 123, academicYear: '2022-2023', programType: 'Master', curriculumYear: '2', specialization: 'CS', coursePath: 'AI', gradeSemester1: 16, gradeSemester2: 18, institution: 'Uni' }],
                scores: [{ scoreId: 1, candidateId: 123, scoreLabel: 'GPA', scoreValue: '17' }]
            };


            mockController.getCandidateById.mockImplementation((_, res) => {
                res.status(200).json({
                    success: true,
                    data: mockCandidateData
                });
                return Promise.resolve(res);
            });


            const response = await request(app)
                .get('/api/monmaster-normalization/candidates/123')
                .expect('Content-Type', /json/)
                .expect(200);


            expect(response.body).toEqual({
                success: true,
                data: mockCandidateData
            });
            expect(mockController.getCandidateById).toHaveBeenCalled();
        });

        it('devrait gérer un ID de candidat invalide', async () => {

            mockController.getCandidateById.mockImplementation((_, res) => {
                res.status(400).json({
                    success: false,
                    message: 'Invalid candidate ID'
                });
                return Promise.resolve(res);
            });


            const response = await request(app)
                .get('/api/monmaster-normalization/candidates/invalid')
                .expect('Content-Type', /json/)
                .expect(400);


            expect(response.body).toEqual({
                success: false,
                message: 'Invalid candidate ID'
            });
            expect(mockController.getCandidateById).toHaveBeenCalled();
        });

        it('devrait gérer un candidat non trouvé', async () => {

            mockController.getCandidateById.mockImplementation((_, res) => {
                res.status(404).json({
                    success: false,
                    message: 'Candidate not found'
                });
                return Promise.resolve(res);
            });


            const response = await request(app)
                .get('/api/monmaster-normalization/candidates/999')
                .expect('Content-Type', /json/)
                .expect(404);


            expect(response.body).toEqual({
                success: false,
                message: 'Candidate not found'
            });
            expect(mockController.getCandidateById).toHaveBeenCalled();
        });

        it('devrait gérer les erreurs du serveur', async () => {

            mockController.getCandidateById.mockImplementation((_, res) => {
                res.status(500).json({
                    success: false,
                    message: 'Server error while retrieving candidate data'
                });
                return Promise.resolve(res);
            });


            const response = await request(app)
                .get('/api/monmaster-normalization/candidates/123')
                .expect('Content-Type', /json/)
                .expect(500);


            expect(response.body).toEqual({
                success: false,
                message: 'Server error while retrieving candidate data'
            });
            expect(mockController.getCandidateById).toHaveBeenCalled();
        });

        it('devrait gérer les erreurs lancées dans le contrôleur', async () => {

            mockController.getCandidateById.mockImplementation(() => {
                throw new Error('Unexpected error');
            });


            await request(app)
                .get('/api/monmaster-normalization/candidates/123')
                .expect(500);

            expect(mockController.getCandidateById).toHaveBeenCalled();
        });
    });

    describe('DELETE /data/:fileId', () => {
        it('devrait supprimer les données normalisées avec succès', async () => {

            mockController.deleteNormalizedData.mockImplementation((_, res) => {
                res.status(200).json({
                    success: true,
                    message: 'Normalized data deleted successfully'
                });
                return Promise.resolve(res);
            });


            const response = await request(app)
                .delete('/api/monmaster-normalization/data/123')
                .expect('Content-Type', /json/)
                .expect(200);


            expect(response.body).toEqual({
                success: true,
                message: 'Normalized data deleted successfully'
            });
            expect(mockController.deleteNormalizedData).toHaveBeenCalled();
        });

        it('devrait gérer un ID de fichier invalide', async () => {

            mockController.deleteNormalizedData.mockImplementation((_, res) => {
                res.status(400).json({
                    success: false,
                    message: 'Invalid file ID'
                });
                return Promise.resolve(res);
            });


            const response = await request(app)
                .delete('/api/monmaster-normalization/data/invalid')
                .expect('Content-Type', /json/)
                .expect(400);


            expect(response.body).toEqual({
                success: false,
                message: 'Invalid file ID'
            });
            expect(mockController.deleteNormalizedData).toHaveBeenCalled();
        });

        it('devrait gérer l\'absence de données à supprimer', async () => {

            mockController.deleteNormalizedData.mockImplementation((_, res) => {
                res.status(404).json({
                    success: false,
                    message: 'No normalized data found for this file or deletion failed'
                });
                return Promise.resolve(res);
            });


            const response = await request(app)
                .delete('/api/monmaster-normalization/data/999')
                .expect('Content-Type', /json/)
                .expect(404);


            expect(response.body).toEqual({
                success: false,
                message: 'No normalized data found for this file or deletion failed'
            });
            expect(mockController.deleteNormalizedData).toHaveBeenCalled();
        });

        it('devrait gérer les erreurs du serveur', async () => {

            mockController.deleteNormalizedData.mockImplementation((_, res) => {
                res.status(500).json({
                    success: false,
                    message: 'Server error while deleting normalized data'
                });
                return Promise.resolve(res);
            });


            const response = await request(app)
                .delete('/api/monmaster-normalization/data/123')
                .expect('Content-Type', /json/)
                .expect(500);


            expect(response.body).toEqual({
                success: false,
                message: 'Server error while deleting normalized data'
            });
            expect(mockController.deleteNormalizedData).toHaveBeenCalled();
        });

        it('devrait gérer les erreurs lancées dans le contrôleur', async () => {

            mockController.deleteNormalizedData.mockImplementation(() => {
                throw new Error('Unexpected error');
            });


            await request(app)
                .delete('/api/monmaster-normalization/data/123')
                .expect(500);

            expect(mockController.deleteNormalizedData).toHaveBeenCalled();
        });
    });
});
