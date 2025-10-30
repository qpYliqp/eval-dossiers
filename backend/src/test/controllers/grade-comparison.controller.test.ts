import { Request, Response } from 'express';
import { GradeComparisonController } from '../../controllers/grade-comparison.controller';
import { GradeComparisonService } from '../../services/grade-comparison.service';
import { VerificationStatus, ComparisonReport } from '../../types/grade-comparison.types';


jest.mock('../../services/grade-comparison.service');

describe('GradeComparisonController', () => {
    let controller: GradeComparisonController;
    let mockService: jest.Mocked<GradeComparisonService>;
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let mockNext: jest.Mock;


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

    beforeEach(() => {

        jest.clearAllMocks();


        controller = new GradeComparisonController();


        mockService = (controller as any).service as jest.Mocked<GradeComparisonService>;


        mockRequest = {
            params: {},
            query: {},
            body: {}
        };

        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };

        mockNext = jest.fn();
    });

    describe('processFileComparisons', () => {
        it('devrait traiter les comparaisons entre un fichier MonMaster et un fichier PV', async () => {

            mockRequest.query = {
                monmasterFileId: '1',
                pvFileId: '2'
            };


            mockService.processFileComparisons.mockResolvedValueOnce(true);


            await controller.processFileComparisons(mockRequest as Request, mockResponse as Response);


            expect(mockService.processFileComparisons).toHaveBeenCalledWith(1, 2);


            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                message: expect.stringContaining('Successfully processed comparisons')
            });
        });

        it('devrait retourner une erreur 400 si les IDs de fichier ne sont pas valides', async () => {

            mockRequest.query = {
                monmasterFileId: 'invalid',
                pvFileId: '2'
            };


            await controller.processFileComparisons(mockRequest as Request, mockResponse as Response);


            expect(mockService.processFileComparisons).not.toHaveBeenCalled();


            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: expect.stringContaining('Invalid file IDs')
            });
        });

        it('devrait retourner une erreur 500 si le traitement échoue', async () => {

            mockRequest.query = {
                monmasterFileId: '1',
                pvFileId: '2'
            };


            mockService.processFileComparisons.mockResolvedValueOnce(false);


            await controller.processFileComparisons(mockRequest as Request, mockResponse as Response);


            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: expect.stringContaining('Failed to process comparisons')
            });
        });

        it('devrait gérer les erreurs du service', async () => {

            mockRequest.query = {
                monmasterFileId: '1',
                pvFileId: '2'
            };


            mockService.processFileComparisons.mockRejectedValueOnce(new Error('Service error'));


            await controller.processFileComparisons(mockRequest as Request, mockResponse as Response);


            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: expect.stringContaining('Service error')
            });
        });
    });

    describe('processMasterProgramComparisons', () => {
        it('devrait traiter les comparaisons pour tous les fichiers dans un programme de master', async () => {

            mockRequest.params = {
                masterId: '1'
            };


            mockService.processMasterProgramComparisons.mockResolvedValueOnce({
                success: true,
                message: 'Processed 2 file combinations for master program ID 1',
                results: [
                    { monmasterFileId: 1, pvFileId: 2, success: true },
                    { monmasterFileId: 1, pvFileId: 3, success: true }
                ]
            });


            await controller.processMasterProgramComparisons(mockRequest as Request, mockResponse as Response);


            expect(mockService.processMasterProgramComparisons).toHaveBeenCalledWith(1);


            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                message: 'Processed 2 file combinations for master program ID 1',
                results: expect.any(Array)
            });
        });

        it('devrait retourner une erreur 400 si l\'ID du programme n\'est pas valide', async () => {

            mockRequest.params = {
                masterId: 'invalid'
            };


            await controller.processMasterProgramComparisons(mockRequest as Request, mockResponse as Response);


            expect(mockService.processMasterProgramComparisons).not.toHaveBeenCalled();


            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: expect.stringContaining('Invalid master program ID')
            });
        });

        it('devrait retourner une erreur 404 si le traitement échoue', async () => {

            mockRequest.params = {
                masterId: '1'
            };


            mockService.processMasterProgramComparisons.mockResolvedValueOnce({
                success: false,
                message: 'No MonMaster file found for master program ID 1',
                results: []
            });


            await controller.processMasterProgramComparisons(mockRequest as Request, mockResponse as Response);


            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'No MonMaster file found for master program ID 1',
                results: []
            });
        });
    });

    describe('getComparisonReport', () => {
        it('devrait obtenir un rapport de comparaison par ID de correspondance', async () => {

            mockRequest.params = {
                matchId: '1'
            };


            mockService.getComparisonReport.mockResolvedValueOnce(mockComparisonReport);


            await controller.getComparisonReport(mockRequest as Request, mockResponse as Response);


            expect(mockService.getComparisonReport).toHaveBeenCalledWith(1);


            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                data: mockComparisonReport
            });
        });

        it('devrait retourner une erreur 400 si l\'ID de correspondance n\'est pas valide', async () => {

            mockRequest.params = {
                matchId: 'invalid'
            };


            await controller.getComparisonReport(mockRequest as Request, mockResponse as Response);


            expect(mockService.getComparisonReport).not.toHaveBeenCalled();


            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: expect.stringContaining('Invalid match ID')
            });
        });

        it('devrait retourner une erreur 404 si le rapport n\'est pas trouvé', async () => {

            mockRequest.params = {
                matchId: '999'
            };


            mockService.getComparisonReport.mockResolvedValueOnce(null);


            await controller.getComparisonReport(mockRequest as Request, mockResponse as Response);


            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: expect.stringContaining('Comparison report not found')
            });
        });
    });

    describe('getComparisonReports', () => {
        it('devrait obtenir tous les rapports de comparaison pour un couple de fichiers', async () => {

            mockRequest.query = {
                monmasterFileId: '1',
                pvFileId: '2'
            };


            mockService.getComparisonReports.mockResolvedValueOnce([mockComparisonReport]);


            await controller.getComparisonReports(mockRequest as Request, mockResponse as Response);


            expect(mockService.getComparisonReports).toHaveBeenCalledWith(1, 2);


            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                data: {
                    count: 1,
                    reports: [mockComparisonReport]
                }
            });
        });

        it('devrait retourner une erreur 400 si les IDs de fichier ne sont pas valides', async () => {

            mockRequest.query = {
                monmasterFileId: 'invalid',
                pvFileId: '2'
            };


            await controller.getComparisonReports(mockRequest as Request, mockResponse as Response);


            expect(mockService.getComparisonReports).not.toHaveBeenCalled();


            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: expect.stringContaining('Invalid file IDs')
            });
        });
    });

    describe('getCandidateMatches', () => {
        it('devrait obtenir toutes les correspondances de candidats pour un couple de fichiers', async () => {

            mockRequest.query = {
                monmasterFileId: '1',
                pvFileId: '2'
            };


            const mockMatches = [{ matchId: 1, monmasterFileId: 1, pvFileId: 2, monmasterCandidateId: 3, pvStudentDataId: 4 }];
            mockService.getCandidateMatches.mockResolvedValueOnce(mockMatches);


            await controller.getCandidateMatches(mockRequest as Request, mockResponse as Response);


            expect(mockService.getCandidateMatches).toHaveBeenCalledWith(1, 2);


            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                data: {
                    count: 1,
                    matches: mockMatches
                }
            });
        });
    });

    describe('getComparisonReportsByMasterId', () => {
        it('devrait obtenir tous les rapports de comparaison pour un programme de master', async () => {

            mockRequest.params = {
                masterId: '1'
            };


            mockService.getComparisonReportsByMasterId.mockResolvedValueOnce([mockComparisonReport]);


            await controller.getComparisonReportsByMasterId(mockRequest as Request, mockResponse as Response);


            expect(mockService.getComparisonReportsByMasterId).toHaveBeenCalledWith(1);


            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                data: {
                    count: 1,
                    reports: [mockComparisonReport]
                }
            });
        });
    });

    describe('deleteComparison', () => {
        it('devrait supprimer une comparaison et ses données associées', async () => {

            mockRequest.params = {
                matchId: '1'
            };


            mockService.deleteComparison.mockResolvedValueOnce(true);


            await controller.deleteComparison(mockRequest as Request, mockResponse as Response);


            expect(mockService.deleteComparison).toHaveBeenCalledWith(1);


            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                message: 'Successfully deleted comparison with ID 1'
            });
        });

        it('devrait retourner une erreur 404 si la comparaison n\'est pas trouvée', async () => {

            mockRequest.params = {
                matchId: '999'
            };


            mockService.deleteComparison.mockResolvedValueOnce(false);


            await controller.deleteComparison(mockRequest as Request, mockResponse as Response);


            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: expect.stringContaining('Comparison not found or already deleted')
            });
        });
    });

    describe('getReportsByCandidateId', () => {
        it('devrait obtenir tous les rapports de comparaison pour un candidat spécifique', async () => {

            mockRequest.params = {
                candidateId: '3'
            };


            mockService.getComparisonReportsByCandidateId.mockResolvedValueOnce([mockComparisonReport]);


            await controller.getReportsByCandidateId(mockRequest as Request, mockResponse as Response);


            expect(mockService.getComparisonReportsByCandidateId).toHaveBeenCalledWith(3);


            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                data: {
                    candidateId: 3,
                    reportCount: 1,
                    reports: [mockComparisonReport]
                }
            });
        });
    });

    describe('getStudentTableData', () => {
        it('devrait obtenir les données structurées des étudiants pour le rendu frontend', async () => {

            mockRequest.params = {
                masterId: '1'
            };


            mockService.getStudentTableData.mockResolvedValueOnce({
                columns: [
                    { id: 'fullName', label: 'Nom complet', type: 'string' },
                    { id: 'score_Average_Score', label: 'Average Score', type: 'number' }
                ],
                students: [{
                    candidateId: 3,
                    fullName: 'Doe John',
                    dateOfBirth: '01/01/1990',
                    candidateNumber: '12345',
                    latestInstitution: 'University Example',
                    scores: { 'Average Score': '15.75' },
                    verificationStatus: VerificationStatus.FULLY_VERIFIED
                }]
            });


            await controller.getStudentTableData(mockRequest as Request, mockResponse as Response);


            expect(mockService.getStudentTableData).toHaveBeenCalledWith(1);


            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                data: {
                    columns: expect.any(Array),
                    count: 1,
                    students: expect.any(Array)
                }
            });
        });

        it('devrait retourner une erreur 400 si l\'ID du programme n\'est pas valide', async () => {

            mockRequest.params = {
                masterId: 'invalid'
            };


            await controller.getStudentTableData(mockRequest as Request, mockResponse as Response);


            expect(mockService.getStudentTableData).not.toHaveBeenCalled();


            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: expect.stringContaining('Invalid Master Program ID')
            });
        });
    });
});
