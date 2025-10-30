import { Request, Response } from 'express';
import { FuzzyMatchingController } from '../../controllers/fuzzy-matching.controller';
import { FuzzyMatchingService } from '../../services/fuzzy-matching.service';
import { Candidate, MatchResult } from '../../types/fuzzy-matching.types';

// Mock the FuzzyMatchingService
jest.mock('../../services/fuzzy-matching.service');

interface ResponseObject {
    success: boolean;
    message?: string;
    matches?: MatchResult[];
    totalMatches?: number;
}

describe('FuzzyMatchingController', () => {
    const mockService = FuzzyMatchingService.prototype as jest.Mocked<FuzzyMatchingService>;

    let controller: FuzzyMatchingController;
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let responseObject: ResponseObject = { success: false };

    beforeEach(() => {
        jest.clearAllMocks();

        controller = new FuzzyMatchingController();
        (controller as any).service = mockService;

        mockRequest = {};
        responseObject = { success: false };

        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockImplementation(result => {
                responseObject = result;
                return mockResponse as Response;
            })
        };
    });

    describe('findMatches', () => {
        const validSourceCandidates: Candidate[] = [
            { id: 1, firstName: 'John', lastName: 'Doe' },
            { id: 2, firstName: 'Jane', lastName: 'Smith' }
        ];

        const validTargetCandidates: Candidate[] = [
            { id: 101, firstName: 'John', lastName: 'Doe' },
            { id: 102, firstName: 'Jane', lastName: 'Smith' }
        ];

        const mockMatchResults: MatchResult[] = [
            {
                source: validSourceCandidates[0],
                target: validTargetCandidates[0],
                score: 1.0,
                nameScore: 1.0
            },
            {
                source: validSourceCandidates[1],
                target: validTargetCandidates[1],
                score: 1.0,
                nameScore: 1.0
            }
        ];

        test('devrait trouver des correspondances avec succès', async () => {
            mockRequest.body = {
                sourceCandidates: validSourceCandidates,
                targetCandidates: validTargetCandidates,
                options: { threshold: 0.8 }
            };

            mockService.findMatches.mockReturnValue(mockMatchResults);

            await controller.findMatches(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(responseObject.success).toBe(true);
            expect(responseObject.matches).toEqual(mockMatchResults);
            expect(responseObject.totalMatches).toBe(2);
            expect(mockService.findMatches).toHaveBeenCalledWith(
                validSourceCandidates,
                validTargetCandidates,
                { threshold: 0.8 }
            );
        });

        test('devrait renvoyer 400 quand sourceCandidates n\'est pas un tableau', async () => {
            mockRequest.body = {
                sourceCandidates: 'not an array',
                targetCandidates: validTargetCandidates
            };

            await controller.findMatches(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(responseObject.success).toBe(false);
            expect(responseObject.message).toContain('must be arrays');
            expect(mockService.findMatches).not.toHaveBeenCalled();
        });

        test('devrait renvoyer 400 quand targetCandidates n\'est pas un tableau', async () => {
            mockRequest.body = {
                sourceCandidates: validSourceCandidates,
                targetCandidates: 'not an array'
            };

            await controller.findMatches(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(responseObject.success).toBe(false);
            expect(responseObject.message).toContain('must be arrays');
            expect(mockService.findMatches).not.toHaveBeenCalled();
        });

        test('devrait renvoyer 400 quand les candidats source n\'ont pas les champs requis', async () => {
            mockRequest.body = {
                sourceCandidates: [{ id: 1, firstName: 'John' }], // Missing lastName
                targetCandidates: validTargetCandidates
            };

            await controller.findMatches(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(responseObject.success).toBe(false);
            expect(responseObject.message).toContain('must have id, firstName, and lastName');
            expect(mockService.findMatches).not.toHaveBeenCalled();
        });

        test('devrait renvoyer 400 quand les candidats cible n\'ont pas les champs requis', async () => {
            mockRequest.body = {
                sourceCandidates: validSourceCandidates,
                targetCandidates: [{ id: 101, firstName: 123 }] // firstName not a string
            };

            await controller.findMatches(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(responseObject.success).toBe(false);
            expect(responseObject.message).toContain('must have id, firstName, and lastName');
            expect(mockService.findMatches).not.toHaveBeenCalled();
        });

        test('devrait renvoyer 500 en cas d\'erreur de service', async () => {
            mockRequest.body = {
                sourceCandidates: validSourceCandidates,
                targetCandidates: validTargetCandidates
            };

            mockService.findMatches.mockImplementation(() => {
                throw new Error('Service error');
            });

            await controller.findMatches(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(responseObject.success).toBe(false);
            expect(responseObject.message).toContain('Server error while finding matches');
        });

        test('devrait utiliser les options fournies', async () => {
            mockRequest.body = {
                sourceCandidates: validSourceCandidates,
                targetCandidates: validTargetCandidates,
                options: {
                    threshold: 0.9,
                    nameWeight: 0.7,
                    dateWeight: 0.3,
                    fuzzyDateMatching: false
                }
            };

            mockService.findMatches.mockReturnValue([]);

            await controller.findMatches(mockRequest as Request, mockResponse as Response);

            expect(mockService.findMatches).toHaveBeenCalledWith(
                validSourceCandidates,
                validTargetCandidates,
                {
                    threshold: 0.9,
                    nameWeight: 0.7,
                    dateWeight: 0.3,
                    fuzzyDateMatching: false
                }
            );
            expect(mockResponse.status).toHaveBeenCalledWith(200);
        });

        test('devrait fonctionner avec des tableaux vides', async () => {
            mockRequest.body = {
                sourceCandidates: [],
                targetCandidates: []
            };

            mockService.findMatches.mockReturnValue([]);

            await controller.findMatches(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(responseObject.success).toBe(true);
            expect(responseObject.matches).toEqual([]);
            expect(responseObject.totalMatches).toBe(0);
        });
    });

    describe('findBestMatches', () => {
        const validSourceCandidates: Candidate[] = [
            { id: 1, firstName: 'John', lastName: 'Doe' },
            { id: 2, firstName: 'Jane', lastName: 'Smith' }
        ];

        const validTargetCandidates: Candidate[] = [
            { id: 101, firstName: 'John', lastName: 'Doe' },
            { id: 102, firstName: 'Jane', lastName: 'Smith' }
        ];

        const mockBestMatchResults: MatchResult[] = [
            {
                source: validSourceCandidates[0],
                target: validTargetCandidates[0],
                score: 1.0,
                nameScore: 1.0
            },
            {
                source: validSourceCandidates[1],
                target: validTargetCandidates[1],
                score: 0.95,
                nameScore: 0.95
            }
        ];

        test('devrait trouver les meilleures correspondances avec succès', async () => {
            mockRequest.body = {
                sourceCandidates: validSourceCandidates,
                targetCandidates: validTargetCandidates,
                options: { threshold: 0.7 }
            };

            mockService.findBestMatches.mockReturnValue(mockBestMatchResults);

            await controller.findBestMatches(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(responseObject.success).toBe(true);
            expect(responseObject.matches).toEqual(mockBestMatchResults);
            expect(responseObject.totalMatches).toBe(2);
            expect(mockService.findBestMatches).toHaveBeenCalledWith(
                validSourceCandidates,
                validTargetCandidates,
                { threshold: 0.7 }
            );
        });

        test('devrait renvoyer 400 quand sourceCandidates n\'est pas un tableau', async () => {
            mockRequest.body = {
                sourceCandidates: 'not an array',
                targetCandidates: validTargetCandidates
            };

            await controller.findBestMatches(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(responseObject.success).toBe(false);
            expect(responseObject.message).toContain('must be arrays');
            expect(mockService.findBestMatches).not.toHaveBeenCalled();
        });

        test('devrait renvoyer 400 quand targetCandidates n\'est pas un tableau', async () => {
            mockRequest.body = {
                sourceCandidates: validSourceCandidates,
                targetCandidates: null
            };

            await controller.findBestMatches(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(responseObject.success).toBe(false);
            expect(responseObject.message).toContain('must be arrays');
            expect(mockService.findBestMatches).not.toHaveBeenCalled();
        });

        test('devrait renvoyer 400 quand les candidats source n\'ont pas les champs requis', async () => {
            mockRequest.body = {
                sourceCandidates: [{ id: 1, lastName: 'Doe' }], // Missing firstName
                targetCandidates: validTargetCandidates
            };

            await controller.findBestMatches(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(responseObject.success).toBe(false);
            expect(responseObject.message).toContain('must have id, firstName, and lastName');
            expect(mockService.findBestMatches).not.toHaveBeenCalled();
        });

        test('devrait renvoyer 400 quand les candidats cible n\'ont pas les champs requis', async () => {
            mockRequest.body = {
                sourceCandidates: validSourceCandidates,
                targetCandidates: [{ lastName: 'Doe', firstName: 'John' }] // Missing id
            };

            await controller.findBestMatches(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(responseObject.success).toBe(false);
            expect(responseObject.message).toContain('must have id, firstName, and lastName');
            expect(mockService.findBestMatches).not.toHaveBeenCalled();
        });

        test('devrait renvoyer 500 en cas d\'erreur de service', async () => {
            mockRequest.body = {
                sourceCandidates: validSourceCandidates,
                targetCandidates: validTargetCandidates
            };

            mockService.findBestMatches.mockImplementation(() => {
                throw new Error('Service error');
            });

            await controller.findBestMatches(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(responseObject.success).toBe(false);
            expect(responseObject.message).toContain('Server error while finding best matches');
        });

        test('devrait utiliser les options fournies', async () => {
            mockRequest.body = {
                sourceCandidates: validSourceCandidates,
                targetCandidates: validTargetCandidates,
                options: {
                    threshold: 0.85,
                    nameWeight: 0.9,
                    dateWeight: 0.1,
                    fuzzyDateMatching: true
                }
            };

            mockService.findBestMatches.mockReturnValue(mockBestMatchResults);

            await controller.findBestMatches(mockRequest as Request, mockResponse as Response);

            expect(mockService.findBestMatches).toHaveBeenCalledWith(
                validSourceCandidates,
                validTargetCandidates,
                {
                    threshold: 0.85,
                    nameWeight: 0.9,
                    dateWeight: 0.1,
                    fuzzyDateMatching: true
                }
            );
            expect(mockResponse.status).toHaveBeenCalledWith(200);
        });

        test('devrait fonctionner avec des candidats ayant des dates de naissance', async () => {
            const candidatesWithDob = [
                { id: 1, firstName: 'John', lastName: 'Doe', dateOfBirth: '1990-01-01' },
                { id: 2, firstName: 'Jane', lastName: 'Smith', dateOfBirth: '1992-05-15' }
            ];

            mockRequest.body = {
                sourceCandidates: candidatesWithDob,
                targetCandidates: validTargetCandidates
            };

            mockService.findBestMatches.mockReturnValue(mockBestMatchResults);

            await controller.findBestMatches(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(responseObject.success).toBe(true);
            expect(mockService.findBestMatches).toHaveBeenCalledWith(
                candidatesWithDob,
                validTargetCandidates,
                undefined
            );
        });
    });

    describe('validateCandidates', () => {
        test('devrait valider des candidats corrects', () => {
            const validCandidates = [
                { id: 1, firstName: 'John', lastName: 'Doe' },
                { id: 0, firstName: 'Jane', lastName: 'Smith' },
                { id: '123', firstName: 'Alice', lastName: 'Jones' }  // ID as string should be valid
            ];

            const result = (controller as any).validateCandidates(validCandidates);
            expect(result).toBe(true);
        });

        test('devrait rejeter des candidats sans id', () => {
            const invalidCandidates = [
                { firstName: 'John', lastName: 'Doe' },
                { id: 2, firstName: 'Jane', lastName: 'Smith' }
            ];

            const result = (controller as any).validateCandidates(invalidCandidates);
            expect(result).toBe(false);
        });

        test('devrait rejeter des candidats avec firstName non-string', () => {
            const invalidCandidates = [
                { id: 1, firstName: 123, lastName: 'Doe' },
                { id: 2, firstName: 'Jane', lastName: 'Smith' }
            ];

            const result = (controller as any).validateCandidates(invalidCandidates);
            expect(result).toBe(false);
        });

        test('devrait rejeter des candidats avec lastName non-string', () => {
            const invalidCandidates = [
                { id: 1, firstName: 'John', lastName: true },
                { id: 2, firstName: 'Jane', lastName: 'Smith' }
            ];

            const result = (controller as any).validateCandidates(invalidCandidates);
            expect(result).toBe(false);
        });

        test('devrait rejeter un tableau contenant un candidat null', () => {
            const invalidCandidates = [
                { id: 1, firstName: 'John', lastName: 'Doe' },
                null
            ];

            const result = (controller as any).validateCandidates(invalidCandidates);
            expect(result).toBe(false);
        });

        test('devrait valider un tableau vide', () => {
            const result = (controller as any).validateCandidates([]);
            expect(result).toBe(true);
        });

        test('devrait accepter des candidats avec des champs supplémentaires', () => {
            const candidates = [
                { id: 1, firstName: 'John', lastName: 'Doe', extra: 'field', age: 30 }
            ];

            const result = (controller as any).validateCandidates(candidates);
            expect(result).toBe(true);
        });
    });
});