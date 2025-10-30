import { Request, Response } from 'express';
import { MonMasterNormalizationController } from '../../controllers/monmaster-normalization.controller';
import { MonMasterNormalizationService } from '../../services/monmaster-normalization.service';
import {
    MonMasterNormalizationError,
    MonMasterNormalizationResult,
    NormalizedCandidate
} from '../../types/monmaster-normalization.types';


jest.mock('../../services/monmaster-normalization.service');

describe('MonMasterNormalizationController', () => {
    let controller: MonMasterNormalizationController;
    let mockService: jest.Mocked<MonMasterNormalizationService>;
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let mockNext: jest.Mock;

    beforeEach(() => {

        jest.clearAllMocks();


        mockService = new MonMasterNormalizationService() as jest.Mocked<MonMasterNormalizationService>;
        controller = new MonMasterNormalizationController();


        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };


        mockNext = jest.fn();


        (controller as any).service = mockService;
    });

    describe('processMonMasterFile', () => {
        it('devrait retourner 200 et les données de succès quand le traitement réussit', async () => {

            mockRequest = {
                params: { fileId: '123' }
            };

            const normalizedData: MonMasterNormalizationResult = {
                candidates: [{ candidateId: 1, monmasterFileId: 123, lastName: 'Doe', firstName: 'John', fullName: 'Doe John', candidateNumber: 'C123', dateOfBirth: '01/01/1990' }],
                academicRecords: [{ recordId: 1, candidateId: 1, academicYear: '2022-2023', programType: 'Master', curriculumYear: '2', specialization: 'CS', coursePath: 'AI', gradeSemester1: 16, gradeSemester2: 18, institution: 'Uni' }],
                candidateScores: [{ scoreId: 1, candidateId: 1, scoreLabel: 'GPA', scoreValue: '17' }]
            };

            mockService.processMonMasterFile.mockResolvedValue({
                fileId: 123,
                normalizedData
            });


            await controller.processMonMasterFile(mockRequest as Request, mockResponse as Response);


            expect(mockService.processMonMasterFile).toHaveBeenCalledWith(123);
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                message: 'MonMaster file processed successfully',
                data: {
                    fileId: 123,
                    candidatesCount: 1,
                    academicRecordsCount: 1,
                    scoresCount: 1
                }
            });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('devrait retourner 400 si l\'ID du fichier est invalide', async () => {

            mockRequest = {
                params: { fileId: 'invalid' }
            };


            await controller.processMonMasterFile(mockRequest as Request, mockResponse as Response);


            expect(mockService.processMonMasterFile).not.toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'Invalid file ID'
            });
        });

        it('devrait retourner 409 si le fichier est déjà normalisé', async () => {

            mockRequest = {
                params: { fileId: '123' }
            };

            mockService.processMonMasterFile.mockRejectedValue(
                new Error(MonMasterNormalizationError.ALREADY_NORMALIZED)
            );


            await controller.processMonMasterFile(mockRequest as Request, mockResponse as Response);


            expect(mockService.processMonMasterFile).toHaveBeenCalledWith(123);
            expect(mockResponse.status).toHaveBeenCalledWith(409);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: MonMasterNormalizationError.ALREADY_NORMALIZED
            });
        });

        it('devrait retourner 404 si le fichier n\'est pas trouvé', async () => {

            mockRequest = {
                params: { fileId: '123' }
            };

            mockService.processMonMasterFile.mockRejectedValue(
                new Error(MonMasterNormalizationError.FILE_NOT_FOUND)
            );


            await controller.processMonMasterFile(mockRequest as Request, mockResponse as Response);


            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: MonMasterNormalizationError.FILE_NOT_FOUND
            });
        });

        it('devrait retourner 400 si le type de fichier est invalide', async () => {

            mockRequest = {
                params: { fileId: '123' }
            };

            mockService.processMonMasterFile.mockRejectedValue(
                new Error(MonMasterNormalizationError.INVALID_FILE_TYPE)
            );


            await controller.processMonMasterFile(mockRequest as Request, mockResponse as Response);


            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: MonMasterNormalizationError.INVALID_FILE_TYPE
            });
        });

        it('devrait retourner 500 pour les erreurs génériques', async () => {

            mockRequest = {
                params: { fileId: '123' }
            };

            mockService.processMonMasterFile.mockRejectedValue(new Error('Unknown error'));


            await controller.processMonMasterFile(mockRequest as Request, mockResponse as Response);


            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'Server error while processing MonMaster file'
            });
        });

        it('devrait retourner 500 si le traitement échoue avec un résultat null', async () => {

            mockRequest = {
                params: { fileId: '123' }
            };

            mockService.processMonMasterFile.mockResolvedValue(null);


            await controller.processMonMasterFile(mockRequest as Request, mockResponse as Response);


            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'Failed to process MonMaster file'
            });
        });
    });

    describe('getNormalizedData', () => {
        it('devrait retourner 200 et les données lorsque les données normalisées existent', async () => {

            mockRequest = {
                params: { fileId: '123' }
            };

            const normalizedData: MonMasterNormalizationResult = {
                candidates: [{ candidateId: 1, monmasterFileId: 123, lastName: 'Doe', firstName: 'John', fullName: 'Doe John', candidateNumber: 'C123', dateOfBirth: '01/01/1990' }],
                academicRecords: [{ recordId: 1, candidateId: 1, academicYear: '2022-2023', programType: 'Master', curriculumYear: '2', specialization: 'CS', coursePath: 'AI', gradeSemester1: 16, gradeSemester2: 18, institution: 'Uni' }],
                candidateScores: [{ scoreId: 1, candidateId: 1, scoreLabel: 'GPA', scoreValue: '17' }]
            };

            mockService.getNormalizedDataByFileId.mockResolvedValue(normalizedData);


            await controller.getNormalizedData(mockRequest as Request, mockResponse as Response);


            expect(mockService.getNormalizedDataByFileId).toHaveBeenCalledWith(123);
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                data: normalizedData
            });
        });

        it('devrait retourner 400 si l\'ID du fichier est invalide', async () => {

            mockRequest = {
                params: { fileId: 'invalid' }
            };


            await controller.getNormalizedData(mockRequest as Request, mockResponse as Response);


            expect(mockService.getNormalizedDataByFileId).not.toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'Invalid file ID'
            });
        });

        it('devrait retourner 404 si aucune donnée normalisée n\'existe', async () => {

            mockRequest = {
                params: { fileId: '123' }
            };

            mockService.getNormalizedDataByFileId.mockResolvedValue(null);


            await controller.getNormalizedData(mockRequest as Request, mockResponse as Response);


            expect(mockService.getNormalizedDataByFileId).toHaveBeenCalledWith(123);
            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'No normalized data found for this file'
            });
        });

        it('devrait retourner 500 si une erreur survient', async () => {

            mockRequest = {
                params: { fileId: '123' }
            };

            mockService.getNormalizedDataByFileId.mockRejectedValue(new Error('Database error'));


            await controller.getNormalizedData(mockRequest as Request, mockResponse as Response);


            expect(mockService.getNormalizedDataByFileId).toHaveBeenCalledWith(123);
            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'Server error while retrieving normalized data'
            });
        });
    });

    describe('searchCandidates', () => {
        it('devrait retourner 200 avec les candidats correspondant aux critères de recherche', async () => {

            mockRequest = {
                query: {
                    firstName: 'John',
                    lastName: 'Doe',
                    candidateNumber: 'C123',
                    monmasterFileId: '123'
                }
            };

            const candidates: NormalizedCandidate[] = [
                { candidateId: 1, monmasterFileId: 123, lastName: 'Doe', firstName: 'John', fullName: 'Doe John', candidateNumber: 'C123', dateOfBirth: '01/01/1990' }
            ];

            mockService.searchCandidates.mockResolvedValue(candidates);


            await controller.searchCandidates(mockRequest as Request, mockResponse as Response);


            expect(mockService.searchCandidates).toHaveBeenCalledWith({
                firstName: 'John',
                lastName: 'Doe',
                candidateNumber: 'C123',
                monmasterFileId: 123
            });
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                data: candidates
            });
        });

        it('devrait gérer les critères de recherche partiels', async () => {

            mockRequest = {
                query: {
                    firstName: 'John'
                }
            };

            const candidates: NormalizedCandidate[] = [
                { candidateId: 1, monmasterFileId: 123, lastName: 'Doe', firstName: 'John', fullName: 'Doe John', candidateNumber: 'C123', dateOfBirth: '01/01/1990' },
                { candidateId: 2, monmasterFileId: 124, lastName: 'Smith', firstName: 'John', fullName: 'Smith John', candidateNumber: 'C124', dateOfBirth: '02/02/1991' }
            ];

            mockService.searchCandidates.mockResolvedValue(candidates);


            await controller.searchCandidates(mockRequest as Request, mockResponse as Response);


            expect(mockService.searchCandidates).toHaveBeenCalledWith({
                firstName: 'John'
            });
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                data: candidates
            });
        });

        it('devrait gérer gracieusement un monmasterFileId invalide', async () => {

            mockRequest = {
                query: {
                    monmasterFileId: 'not-a-number'
                }
            };

            const candidates: NormalizedCandidate[] = [];
            mockService.searchCandidates.mockResolvedValue(candidates);


            await controller.searchCandidates(mockRequest as Request, mockResponse as Response);


            expect(mockService.searchCandidates).toHaveBeenCalledWith({});
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                data: candidates
            });
        });

        it('devrait retourner 500 si une erreur survient', async () => {

            mockRequest = {
                query: {
                    firstName: 'John'
                }
            };

            mockService.searchCandidates.mockRejectedValue(new Error('Search error'));


            await controller.searchCandidates(mockRequest as Request, mockResponse as Response);


            expect(mockService.searchCandidates).toHaveBeenCalledWith({
                firstName: 'John'
            });
            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'Server error while searching candidates'
            });
        });

        it('devrait gérer les critères de recherche vides et retourner tous les candidats', async () => {

            mockRequest = {
                query: {}
            };

            const candidates: NormalizedCandidate[] = [
                { candidateId: 1, monmasterFileId: 123, lastName: 'Doe', firstName: 'John', fullName: 'Doe John', candidateNumber: 'C123', dateOfBirth: '01/01/1990' },
                { candidateId: 2, monmasterFileId: 124, lastName: 'Smith', firstName: 'Jane', fullName: 'Smith Jane', candidateNumber: 'C124', dateOfBirth: '02/02/1991' }
            ];

            mockService.searchCandidates.mockResolvedValue(candidates);


            await controller.searchCandidates(mockRequest as Request, mockResponse as Response);


            expect(mockService.searchCandidates).toHaveBeenCalledWith({});
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                data: candidates
            });
        });
    });

    describe('getCandidateById', () => {
        it('devrait retourner 200 avec les données du candidat quand il est trouvé', async () => {

            mockRequest = {
                params: { candidateId: '123' }
            };

            const candidateData = {
                candidate: { candidateId: 123, monmasterFileId: 456, lastName: 'Doe', firstName: 'John', fullName: 'Doe John', candidateNumber: 'C123', dateOfBirth: '01/01/1990' },
                academicRecords: [{ recordId: 1, candidateId: 123, academicYear: '2022-2023', programType: 'Master', curriculumYear: '2', specialization: 'CS', coursePath: 'AI', gradeSemester1: 16, gradeSemester2: 18, institution: 'Uni' }],
                scores: [{ scoreId: 1, candidateId: 123, scoreLabel: 'GPA', scoreValue: '17' }]
            };

            mockService.getCandidateById.mockResolvedValue(candidateData);


            await controller.getCandidateById(mockRequest as Request, mockResponse as Response);


            expect(mockService.getCandidateById).toHaveBeenCalledWith(123);
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                data: candidateData
            });
        });

        it('devrait retourner 400 si l\'ID du candidat est invalide', async () => {

            mockRequest = {
                params: { candidateId: 'invalid' }
            };


            await controller.getCandidateById(mockRequest as Request, mockResponse as Response);


            expect(mockService.getCandidateById).not.toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'Invalid candidate ID'
            });
        });

        it('devrait retourner 404 si le candidat n\'est pas trouvé', async () => {

            mockRequest = {
                params: { candidateId: '999' }
            };

            mockService.getCandidateById.mockResolvedValue(null);


            await controller.getCandidateById(mockRequest as Request, mockResponse as Response);


            expect(mockService.getCandidateById).toHaveBeenCalledWith(999);
            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'Candidate not found'
            });
        });

        it('devrait retourner 500 si une erreur survient', async () => {

            mockRequest = {
                params: { candidateId: '123' }
            };

            mockService.getCandidateById.mockRejectedValue(new Error('Database error'));


            await controller.getCandidateById(mockRequest as Request, mockResponse as Response);


            expect(mockService.getCandidateById).toHaveBeenCalledWith(123);
            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'Server error while retrieving candidate data'
            });
        });
    });

    describe('deleteNormalizedData', () => {
        it('devrait retourner 200 quand les données sont supprimées avec succès', async () => {

            mockRequest = {
                params: { fileId: '123' }
            };

            mockService.deleteNormalizedDataByFileId.mockResolvedValue(true);


            await controller.deleteNormalizedData(mockRequest as Request, mockResponse as Response);


            expect(mockService.deleteNormalizedDataByFileId).toHaveBeenCalledWith(123);
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                message: 'Normalized data deleted successfully'
            });
        });

        it('devrait retourner 400 si l\'ID du fichier est invalide', async () => {

            mockRequest = {
                params: { fileId: 'invalid' }
            };


            await controller.deleteNormalizedData(mockRequest as Request, mockResponse as Response);


            expect(mockService.deleteNormalizedDataByFileId).not.toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'Invalid file ID'
            });
        });

        it('devrait retourner 404 si aucune donnée n\'est trouvée pour la suppression', async () => {

            mockRequest = {
                params: { fileId: '123' }
            };

            mockService.deleteNormalizedDataByFileId.mockResolvedValue(false);


            await controller.deleteNormalizedData(mockRequest as Request, mockResponse as Response);


            expect(mockService.deleteNormalizedDataByFileId).toHaveBeenCalledWith(123);
            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'No normalized data found for this file or deletion failed'
            });
        });

        it('devrait retourner 500 si une erreur survient', async () => {

            mockRequest = {
                params: { fileId: '123' }
            };

            mockService.deleteNormalizedDataByFileId.mockRejectedValue(new Error('Database error'));


            await controller.deleteNormalizedData(mockRequest as Request, mockResponse as Response);


            expect(mockService.deleteNormalizedDataByFileId).toHaveBeenCalledWith(123);
            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'Server error while deleting normalized data'
            });
        });
    });
});
