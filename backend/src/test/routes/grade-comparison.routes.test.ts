import request from 'supertest';
import express from 'express';
import { GradeComparisonController } from '../../controllers/grade-comparison.controller';
import gradeComparisonRoutes from '../../routes/grade-comparison.routes';
import { VerificationStatus, ComparisonReport } from '../../types/grade-comparison.types';

// Mock the GradeComparisonController
jest.mock('../../controllers/grade-comparison.controller');

describe('Grade Comparison Routes', () => {
    let app: express.Application;
    let mockController: jest.Mocked<GradeComparisonController>;

    const mockComparisonReport: ComparisonReport = {
        candidate: {
            monmasterCandidateId: 3,
            pvStudentDataId: 4,
            fullName: 'Doe John',
            dateOfBirth: '01/01/1990'
        },
        monmasterFileId: 1,
        pvFileId: 2,
        averageSimilarity: 0.95,
        overallVerificationStatus: VerificationStatus.FULLY_VERIFIED,
        fields: [{
            fieldName: 'Average Score -> Semester 1',
            monmasterValue: '15.75',
            pvValue: '15.5',
            similarityScore: 0.95,
            verificationStatus: VerificationStatus.FULLY_VERIFIED
        }]
    };

    beforeAll(() => {
        // Set up the Express app for testing
        app = express();
        app.use(express.json());
        app.use('/api/grade-comparison', gradeComparisonRoutes);

        // Setup the mock implementation for the controller
        mockController = GradeComparisonController.prototype as jest.Mocked<GradeComparisonController>;
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /file-comparisons', () => {
        it('devrait appeler le contrôleur processFileComparisons', async () => {
            // Setup the controller mock to handle the request
            mockController.processFileComparisons.mockImplementation((_req, res) => {
                res.status(200).json({
                    success: true,
                    message: 'Successfully processed comparisons'
                });
                return Promise.resolve(res);
            });

            // Make the request
            const response = await request(app)
                .post('/api/grade-comparison/file-comparisons')
                .query({ monmasterFileId: '1', pvFileId: '2' });

            // Assertions
            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                success: true,
                message: 'Successfully processed comparisons'
            });
            expect(mockController.processFileComparisons).toHaveBeenCalled();
        });

        it('devrait gérer les erreurs du contrôleur', async () => {
            // Setup the controller mock to throw an error
            mockController.processFileComparisons.mockImplementation(() => {
                throw new Error('Controller error');
            });

            // Make the request
            const response = await request(app)
                .post('/api/grade-comparison/file-comparisons')
                .query({ monmasterFileId: '1', pvFileId: '2' });

            // Assertions
            expect(response.status).toBe(500);
            expect(response.body).toEqual({
                success: false,
                message: 'Internal server error'
            });
        });
    });

    describe('POST /master-program/:masterId/comparisons', () => {
        it('devrait appeler le contrôleur processMasterProgramComparisons', async () => {
            // Setup the controller mock to handle the request
            mockController.processMasterProgramComparisons.mockImplementation((_req, res) => {
                res.status(200).json({
                    success: true,
                    message: 'Processed 2 file combinations for master program ID 1',
                    results: [
                        { monmasterFileId: 1, pvFileId: 2, success: true },
                        { monmasterFileId: 1, pvFileId: 3, success: true }
                    ]
                });
                return Promise.resolve(res);
            });

            // Make the request
            const response = await request(app)
                .post('/api/grade-comparison/master-program/1/comparisons');

            // Assertions
            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                success: true,
                message: 'Processed 2 file combinations for master program ID 1',
                results: expect.any(Array)
            });
            expect(mockController.processMasterProgramComparisons).toHaveBeenCalled();
        });
    });

    describe('GET /reports/:matchId', () => {
        it('devrait appeler le contrôleur getComparisonReport', async () => {
            // Setup the controller mock to handle the request
            mockController.getComparisonReport.mockImplementation((_req, res) => {
                res.status(200).json({
                    success: true,
                    data: mockComparisonReport
                });
                return Promise.resolve(res);
            });

            // Make the request
            const response = await request(app)
                .get('/api/grade-comparison/reports/1');

            // Assertions
            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                success: true,
                data: mockComparisonReport
            });
            expect(mockController.getComparisonReport).toHaveBeenCalled();
        });
    });

    describe('GET /reports', () => {
        it('devrait appeler le contrôleur getComparisonReports', async () => {
            // Setup the controller mock to handle the request
            mockController.getComparisonReports.mockImplementation((_req, res) => {
                res.status(200).json({
                    success: true,
                    data: {
                        count: 1,
                        reports: [mockComparisonReport]
                    }
                });
                return Promise.resolve(res);
            });

            // Make the request
            const response = await request(app)
                .get('/api/grade-comparison/reports')
                .query({ monmasterFileId: '1', pvFileId: '2' });

            // Assertions
            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                success: true,
                data: {
                    count: 1,
                    reports: [mockComparisonReport]
                }
            });
            expect(mockController.getComparisonReports).toHaveBeenCalled();
        });
    });

    describe('GET /master/:masterId/reports', () => {
        it('devrait appeler le contrôleur getComparisonReportsByMasterId', async () => {
            // Setup the controller mock to handle the request
            mockController.getComparisonReportsByMasterId.mockImplementation((_req, res) => {
                res.status(200).json({
                    success: true,
                    data: {
                        count: 1,
                        reports: [mockComparisonReport]
                    }
                });
                return Promise.resolve(res);
            });

            // Make the request
            const response = await request(app)
                .get('/api/grade-comparison/master/1/reports');

            // Assertions
            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                success: true,
                data: {
                    count: 1,
                    reports: [mockComparisonReport]
                }
            });
            expect(mockController.getComparisonReportsByMasterId).toHaveBeenCalled();
        });
    });

    describe('GET /matches', () => {
        it('devrait appeler le contrôleur getCandidateMatches', async () => {
            // Setup the controller mock to handle the request
            mockController.getCandidateMatches.mockImplementation((_req, res) => {
                res.status(200).json({
                    success: true,
                    data: {
                        count: 1,
                        matches: [{ matchId: 1, monmasterFileId: 1, pvFileId: 2, monmasterCandidateId: 3, pvStudentDataId: 4 }]
                    }
                });
                return Promise.resolve(res);
            });

            // Make the request
            const response = await request(app)
                .get('/api/grade-comparison/matches')
                .query({ monmasterFileId: '1', pvFileId: '2' });

            // Assertions
            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                success: true,
                data: {
                    count: 1,
                    matches: expect.any(Array)
                }
            });
            expect(mockController.getCandidateMatches).toHaveBeenCalled();
        });
    });

    describe('DELETE /reports/:matchId', () => {
        it('devrait appeler le contrôleur deleteComparison', async () => {
            // Setup the controller mock to handle the request
            mockController.deleteComparison.mockImplementation((_req, res) => {
                res.status(200).json({
                    success: true,
                    message: 'Successfully deleted comparison with ID 1'
                });
                return Promise.resolve(res);
            });

            // Make the request
            const response = await request(app)
                .delete('/api/grade-comparison/reports/1');

            // Assertions
            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                success: true,
                message: 'Successfully deleted comparison with ID 1'
            });
            expect(mockController.deleteComparison).toHaveBeenCalled();
        });
    });

    describe('GET /candidate/:candidateId/reports', () => {
        it('devrait appeler le contrôleur getReportsByCandidateId', async () => {
            // Setup the controller mock to handle the request
            mockController.getReportsByCandidateId.mockImplementation((_req, res) => {
                res.status(200).json({
                    success: true,
                    data: {
                        candidateId: 3,
                        reportCount: 1,
                        reports: [mockComparisonReport]
                    }
                });
                return Promise.resolve(res);
            });

            // Make the request
            const response = await request(app)
                .get('/api/grade-comparison/candidate/3/reports');

            // Assertions
            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                success: true,
                data: {
                    candidateId: 3,
                    reportCount: 1,
                    reports: [mockComparisonReport]
                }
            });
            expect(mockController.getReportsByCandidateId).toHaveBeenCalled();
        });
    });

    describe('GET /student-table/master/:masterId', () => {
        it('devrait appeler le contrôleur getStudentTableData', async () => {
            // Setup the controller mock to handle the request
            mockController.getStudentTableData.mockImplementation((_req, res) => {
                res.status(200).json({
                    success: true,
                    data: {
                        columns: [
                            { id: 'fullName', label: 'Nom complet', type: 'string' },
                            { id: 'score_Average_Score', label: 'Average Score', type: 'number' }
                        ],
                        count: 1,
                        students: [{
                            candidateId: 3,
                            fullName: 'Doe John',
                            dateOfBirth: '01/01/1990',
                            candidateNumber: '12345',
                            latestInstitution: 'University Example',
                            scores: { 'Average Score': '15.75' },
                            verificationStatus: VerificationStatus.FULLY_VERIFIED
                        }]
                    }
                });
                return Promise.resolve(res);
            });

            // Make the request
            const response = await request(app)
                .get('/api/grade-comparison/student-table/master/1');

            // Assertions
            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                success: true,
                data: {
                    columns: expect.any(Array),
                    count: 1,
                    students: expect.any(Array)
                }
            });
            expect(mockController.getStudentTableData).toHaveBeenCalled();
        });
    });

    describe('Error handling', () => {
        it('devrait gérer les erreurs générales dans les routes', async () => {
            // Setup a route to throw an unexpected error
            mockController.getStudentTableData.mockImplementation(() => {
                throw new Error('Unexpected error');
            });

            // Make the request
            const response = await request(app)
                .get('/api/grade-comparison/student-table/master/1');

            // Assertions
            expect(response.status).toBe(500);
            expect(response.body).toEqual({
                success: false,
                message: 'Internal server error'
            });
        });
    });
});
