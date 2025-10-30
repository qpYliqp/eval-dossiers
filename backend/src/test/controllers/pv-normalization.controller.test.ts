import { Request, Response } from 'express';
import { PvNormalizationController } from '../../controllers/pv-normalization.controller';
import { PvNormalizationService } from '../../services/pv-normalization.service';
import { NormalizationError, NormalizedStudentData } from '../../types/pv-normalization.types';


jest.mock('../../services/pv-normalization.service');

describe('PvNormalizationController', () => {
    let controller: PvNormalizationController;
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let mockService: jest.Mocked<PvNormalizationService>;


    const mockFileId = 1;
    const mockNormalizedData: NormalizedStudentData[] = [
        {
            name: 'John Doe',
            dateOfBirth: '1995-05-15',
            studentNumber: '12345678',
            semesterResults: [
                { semesterName: 'Fall 2020', grade: 8.5 }
            ]
        },
        {
            name: 'Jane Smith',
            dateOfBirth: '1996-03-20',
            studentNumber: '87654321',
            semesterResults: [
                { semesterName: 'Spring 2021', grade: 9.0 }
            ]
        }
    ];

    beforeEach(() => {

        jest.clearAllMocks();


        mockService = new PvNormalizationService() as jest.Mocked<PvNormalizationService>;


        controller = new PvNormalizationController();

        Object.defineProperty(controller, 'service', {
            value: mockService
        });


        mockRequest = {
            params: {
                fileId: mockFileId.toString()
            }
        };

        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
    });

    describe('processPvFile', () => {
        it('devrait traiter un fichier PV avec succès', async () => {

            mockService.processPvFile.mockResolvedValueOnce({
                fileId: mockFileId,
                normalizedData: mockNormalizedData
            });


            await controller.processPvFile(mockRequest as Request, mockResponse as Response);


            expect(mockService.processPvFile).toHaveBeenCalledWith(mockFileId);


            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                message: 'PV file processed successfully',
                data: {
                    fileId: mockFileId,
                    studentsCount: mockNormalizedData.length
                }
            });
        });

        it('devrait retourner 400 pour un ID de fichier invalide', async () => {

            mockRequest.params = { fileId: 'invalid' };


            await controller.processPvFile(mockRequest as Request, mockResponse as Response);


            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'Invalid file ID'
            });


            expect(mockService.processPvFile).not.toHaveBeenCalled();
        });

        it('devrait retourner 500 si le traitement échoue', async () => {

            mockService.processPvFile.mockResolvedValueOnce(null);


            await controller.processPvFile(mockRequest as Request, mockResponse as Response);


            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'Failed to process PV file'
            });
        });

        it('devrait retourner 409 si le fichier est déjà normalisé', async () => {

            mockService.processPvFile.mockRejectedValueOnce(
                new Error(NormalizationError.ALREADY_NORMALIZED)
            );


            await controller.processPvFile(mockRequest as Request, mockResponse as Response);


            expect(mockResponse.status).toHaveBeenCalledWith(409);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: NormalizationError.ALREADY_NORMALIZED
            });
        });

        it('devrait retourner 500 pour les erreurs inattendues', async () => {

            mockService.processPvFile.mockRejectedValueOnce(new Error('Unexpected error'));


            await controller.processPvFile(mockRequest as Request, mockResponse as Response);


            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'Server error while processing PV file'
            });
        });
    });

    describe('getNormalizedData', () => {
        it('devrait retourner les données normalisées avec succès', async () => {

            mockService.getNormalizedDataByPvFileId.mockResolvedValueOnce(mockNormalizedData);


            await controller.getNormalizedData(mockRequest as Request, mockResponse as Response);


            expect(mockService.getNormalizedDataByPvFileId).toHaveBeenCalledWith(mockFileId);


            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                data: mockNormalizedData
            });
        });

        it('devrait retourner 400 pour un ID de fichier invalide', async () => {

            mockRequest.params = { fileId: 'invalid' };


            await controller.getNormalizedData(mockRequest as Request, mockResponse as Response);


            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'Invalid file ID'
            });


            expect(mockService.getNormalizedDataByPvFileId).not.toHaveBeenCalled();
        });

        it('devrait retourner 500 en cas d\'erreur de service', async () => {

            mockService.getNormalizedDataByPvFileId.mockRejectedValueOnce(new Error('Database error'));


            await controller.getNormalizedData(mockRequest as Request, mockResponse as Response);


            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'Server error while retrieving normalized data'
            });
        });
    });

    describe('deleteNormalizedData', () => {
        it('devrait supprimer les données normalisées avec succès', async () => {

            mockService.deleteNormalizedDataByPvFileId.mockResolvedValueOnce(true);


            await controller.deleteNormalizedData(mockRequest as Request, mockResponse as Response);


            expect(mockService.deleteNormalizedDataByPvFileId).toHaveBeenCalledWith(mockFileId);


            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                message: 'Normalized data deleted successfully'
            });
        });

        it('devrait retourner 400 pour un ID de fichier invalide', async () => {

            mockRequest.params = { fileId: 'invalid' };


            await controller.deleteNormalizedData(mockRequest as Request, mockResponse as Response);


            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'Invalid file ID'
            });


            expect(mockService.deleteNormalizedDataByPvFileId).not.toHaveBeenCalled();
        });

        it('devrait retourner 404 si aucune donnée n\'a été trouvée ou si la suppression a échoué', async () => {

            mockService.deleteNormalizedDataByPvFileId.mockResolvedValueOnce(false);


            await controller.deleteNormalizedData(mockRequest as Request, mockResponse as Response);


            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'No normalized data found for this file or deletion failed'
            });
        });

        it('devrait retourner 500 en cas d\'erreur de service', async () => {

            mockService.deleteNormalizedDataByPvFileId.mockRejectedValueOnce(new Error('Database error'));


            await controller.deleteNormalizedData(mockRequest as Request, mockResponse as Response);


            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'Server error while deleting normalized data'
            });
        });
    });
});
