import request from 'supertest';
import express from 'express';
import { Request, Response } from 'express';
import { FuzzyMatchingController } from '../../controllers/fuzzy-matching.controller';
import { Candidate, MatchResult } from '../../types/fuzzy-matching.types';

// Mock the controller class before importing routes
jest.mock('../../controllers/fuzzy-matching.controller');

// Import routes after mocking
import fuzzyMatchingRoutes from '../../routes/fuzzy-matching.routes';

const app = express();
app.use(express.json());
app.use('/api/fuzzy-matching', fuzzyMatchingRoutes);

describe('Fuzzy Matching Routes', () => {
    // Create test data
    const validSourceCandidates: Candidate[] = [
        { id: 1, firstName: 'John', lastName: 'Doe' },
        { id: 2, firstName: 'Jane', lastName: 'Smith' }
    ];

    const validTargetCandidates: Candidate[] = [
        { id: 101, firstName: 'Johnny', lastName: 'Doez' },
        { id: 102, firstName: 'Janet', lastName: 'Smithers' }
    ];

    const mockMatchResults: MatchResult[] = [
        {
            source: validSourceCandidates[0],
            target: validTargetCandidates[0],
            score: 0.85,
            nameScore: 0.85
        },
        {
            source: validSourceCandidates[1],
            target: validTargetCandidates[1],
            score: 0.8,
            nameScore: 0.8
        }
    ];

    // Setup mocks before each test
    beforeEach(() => {
        jest.clearAllMocks();
        
        // Reset the mock implementation of the constructor
        (FuzzyMatchingController as jest.MockedClass<typeof FuzzyMatchingController>).mockClear();
    });

    describe('POST /api/fuzzy-matching/matches', () => {
        test('devrait trouver toutes les correspondances possibles', async () => {
            // Setup the mock implementation for this test
            (FuzzyMatchingController.prototype.findMatches as jest.Mock).mockImplementation((req: Request, res: Response) => {
                res.status(200).json({
                    success: true,
                    matches: mockMatchResults,
                    totalMatches: mockMatchResults.length
                });
            });

            const response = await request(app)
                .post('/api/fuzzy-matching/matches')
                .send({
                    sourceCandidates: validSourceCandidates,
                    targetCandidates: validTargetCandidates,
                    options: { threshold: 0.7 }
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.matches).toHaveLength(2);
            expect(response.body.totalMatches).toBe(2);
            expect(FuzzyMatchingController.prototype.findMatches).toHaveBeenCalled();
        });

        test('devrait retourner une erreur 400 quand la source n\'est pas un tableau', async () => {
            (FuzzyMatchingController.prototype.findMatches as jest.Mock).mockImplementation((req: Request, res: Response) => {
                res.status(400).json({
                    success: false,
                    message: 'Both sourceCandidates and targetCandidates must be arrays'
                });
            });

            const response = await request(app)
                .post('/api/fuzzy-matching/matches')
                .send({
                    sourceCandidates: "not an array",
                    targetCandidates: validTargetCandidates
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('must be arrays');
        });

        test('devrait retourner une erreur 400 quand les candidats ne sont pas valides', async () => {
            (FuzzyMatchingController.prototype.findMatches as jest.Mock).mockImplementation((req: Request, res: Response) => {
                res.status(400).json({
                    success: false,
                    message: 'Each candidate must have id, firstName, and lastName fields'
                });
            });

            const response = await request(app)
                .post('/api/fuzzy-matching/matches')
                .send({
                    sourceCandidates: [{ id: 1, firstName: 'Missing lastName' }],
                    targetCandidates: validTargetCandidates
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('must have id, firstName, and lastName');
        });

        test('devrait retourner une erreur 500 en cas d\'erreur serveur', async () => {
            (FuzzyMatchingController.prototype.findMatches as jest.Mock).mockImplementation((req: Request, res: Response) => {
                res.status(500).json({
                    success: false,
                    message: 'Server error while finding matches'
                });
            });

            const response = await request(app)
                .post('/api/fuzzy-matching/matches')
                .send({
                    sourceCandidates: validSourceCandidates,
                    targetCandidates: validTargetCandidates
                });

            expect(response.status).toBe(500);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('Server error');
        });
    });

    describe('POST /api/fuzzy-matching/best-matches', () => {
        test('devrait trouver la meilleure correspondance pour chaque candidat source', async () => {
            // Setup the mock implementation for this test
            (FuzzyMatchingController.prototype.findBestMatches as jest.Mock).mockImplementation((req: Request, res: Response) => {
                // Only return the best match for each source
                const bestMatches = [mockMatchResults[0]]; 
                res.status(200).json({
                    success: true,
                    matches: bestMatches,
                    totalMatches: bestMatches.length
                });
            });

            const response = await request(app)
                .post('/api/fuzzy-matching/best-matches')
                .send({
                    sourceCandidates: validSourceCandidates,
                    targetCandidates: validTargetCandidates,
                    options: { threshold: 0.7 }
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.matches).toHaveLength(1);
            expect(response.body.totalMatches).toBe(1);
            expect(FuzzyMatchingController.prototype.findBestMatches).toHaveBeenCalled();
        });

        test('devrait retourner une erreur 400 quand la cible n\'est pas un tableau', async () => {
            (FuzzyMatchingController.prototype.findBestMatches as jest.Mock).mockImplementation((req: Request, res: Response) => {
                res.status(400).json({
                    success: false,
                    message: 'Both sourceCandidates and targetCandidates must be arrays'
                });
            });

            const response = await request(app)
                .post('/api/fuzzy-matching/best-matches')
                .send({
                    sourceCandidates: validSourceCandidates,
                    targetCandidates: null
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('must be arrays');
        });

        test('devrait retourner une erreur 400 quand les candidats ne sont pas valides', async () => {
            (FuzzyMatchingController.prototype.findBestMatches as jest.Mock).mockImplementation((req: Request, res: Response) => {
                res.status(400).json({
                    success: false,
                    message: 'Each candidate must have id, firstName, and lastName fields'
                });
            });

            const response = await request(app)
                .post('/api/fuzzy-matching/best-matches')
                .send({
                    sourceCandidates: validSourceCandidates,
                    targetCandidates: [{ lastName: 'Missing id and firstName' }]
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('must have id, firstName, and lastName');
        });

        test('devrait retourner une erreur 500 en cas d\'erreur serveur', async () => {
            (FuzzyMatchingController.prototype.findBestMatches as jest.Mock).mockImplementation((req: Request, res: Response) => {
                res.status(500).json({
                    success: false,
                    message: 'Server error while finding best matches'
                });
            });

            const response = await request(app)
                .post('/api/fuzzy-matching/best-matches')
                .send({
                    sourceCandidates: validSourceCandidates,
                    targetCandidates: validTargetCandidates
                });

            expect(response.status).toBe(500);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('Server error');
        });

        test('devrait accepter des candidats avec des dates de naissance', async () => {
            const candidatesWithDob: Candidate[] = [
                { id: 1, firstName: 'John', lastName: 'Doe', dateOfBirth: '1990-01-01' },
                { id: 2, firstName: 'Jane', lastName: 'Smith', dateOfBirth: '1992-05-15' }
            ];

            const resultsWithDateScore: MatchResult[] = [
                {
                    source: candidatesWithDob[0],
                    target: validTargetCandidates[0],
                    score: 0.9,
                    nameScore: 0.85,
                    dateScore: 1.0
                }
            ];

            (FuzzyMatchingController.prototype.findBestMatches as jest.Mock).mockImplementation((req: Request, res: Response) => {
                res.status(200).json({
                    success: true,
                    matches: resultsWithDateScore,
                    totalMatches: resultsWithDateScore.length
                });
            });

            const response = await request(app)
                .post('/api/fuzzy-matching/best-matches')
                .send({
                    sourceCandidates: candidatesWithDob,
                    targetCandidates: validTargetCandidates,
                    options: { 
                        threshold: 0.7,
                        nameWeight: 0.7,
                        dateWeight: 0.3,
                        fuzzyDateMatching: true
                    }
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.matches[0]).toHaveProperty('dateScore');
            expect(FuzzyMatchingController.prototype.findBestMatches).toHaveBeenCalled();
        });
    });

    test('devrait gérer les requêtes avec un corps vide', async () => {
        (FuzzyMatchingController.prototype.findMatches as jest.Mock).mockImplementation((req: Request, res: Response) => {
            res.status(400).json({
                success: false,
                message: 'Both sourceCandidates and targetCandidates must be arrays'
            });
        });

        const response = await request(app)
            .post('/api/fuzzy-matching/matches')
            .send({});

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
    });

    test('devrait gérer les requêtes à une route inexistante', async () => {
        const response = await request(app)
            .post('/api/fuzzy-matching/nonexistent-route')
            .send({
                sourceCandidates: validSourceCandidates,
                targetCandidates: validTargetCandidates
            });

        expect(response.status).toBe(404);
    });

    test('devrait gérer la méthode incorrecte (GET au lieu de POST)', async () => {
        const response = await request(app)
            .get('/api/fuzzy-matching/matches')
            .query({
                sourceCandidates: validSourceCandidates,
                targetCandidates: validTargetCandidates
            });

        expect(response.status).toBe(404);
    });
});