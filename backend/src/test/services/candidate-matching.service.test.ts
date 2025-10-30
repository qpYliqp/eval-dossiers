import { CandidateMatchingService } from '../../services/candidate-matching.service';
import { CandidateMatchingModel } from '../../models/candidate-matching.model';
import { FuzzyMatchingService } from '../../services/fuzzy-matching.service';
import { CandidateMatch } from '../../types/grade-comparison.types';

jest.mock('../../models/candidate-matching.model');
jest.mock('../../services/fuzzy-matching.service');

const MockedCandidateMatchingModel = CandidateMatchingModel as jest.MockedClass<typeof CandidateMatchingModel>;
const MockedFuzzyMatchingService = FuzzyMatchingService as jest.MockedClass<typeof FuzzyMatchingService>;

describe('CandidateMatchingService', () => {
    let candidateMatchingService: CandidateMatchingService;
    let candidateMatchingModel: jest.Mocked<CandidateMatchingModel>;
    let fuzzyMatchingService: jest.Mocked<FuzzyMatchingService>;

    beforeEach(() => {
        candidateMatchingModel = new MockedCandidateMatchingModel() as jest.Mocked<CandidateMatchingModel>;
        fuzzyMatchingService = new MockedFuzzyMatchingService() as jest.Mocked<FuzzyMatchingService>;
        
        // Créer le service et injecter manuellement les dépendances mockées
        candidateMatchingService = new CandidateMatchingService();
        (candidateMatchingService as any).candidateMatchingModel = candidateMatchingModel;
        (candidateMatchingService as any).fuzzyMatchingService = fuzzyMatchingService;

        jest.clearAllMocks();
    });

    describe('generateCandidateMatches', () => {
        it('should generate and save candidate matches', async () => {
            const monmasterFileId = 1;
            const pvFileId = 2;

            const candidates = [
                { candidateId: 101, fullName: 'John Doe', dateOfBirth: '1990-01-01' },
                { candidateId: 102, fullName: 'Jane Smith', dateOfBirth: '1992-05-15' },
            ];

            const students = [
                { studentDataId: 201, name: 'John Doe', dateOfBirth: '1990-01-01' },
                { studentDataId: 202, name: 'Alice Johnson', dateOfBirth: '1993-07-20' },
            ];

            const sourceCandidates = [
                { id: 101, firstName: 'John', lastName: 'Doe', dateOfBirth: '1990-01-01' },
                { id: 102, firstName: 'Jane', lastName: 'Smith', dateOfBirth: '1992-05-15' },
            ];

            const targetCandidates = [
                { id: 201, firstName: 'John', lastName: 'Doe', dateOfBirth: '1990-01-01' },
                { id: 202, firstName: 'Alice', lastName: 'Johnson', dateOfBirth: '1993-07-20' },
            ];

            const mockMatches = [
                { 
                    source: { id: 101, firstName: 'John', lastName: 'Doe', dateOfBirth: '1990-01-01' }, 
                    target: { id: 201, firstName: 'John', lastName: 'Doe', dateOfBirth: '1990-01-01' }, 
                    score: 0.9, 
                    nameScore: 0.8 
                },
                { 
                    source: { id: 102, firstName: 'Jane', lastName: 'Smith', dateOfBirth: '1992-05-15' }, 
                    target: { id: 202, firstName: 'Alice', lastName: 'Johnson', dateOfBirth: '1993-07-20' }, 
                    score: 0.85, 
                    nameScore: 0.75 
                },
            ];

            const expectedCandidateMatches: CandidateMatch[] = [
                {
                    monmasterFileId,
                    pvFileId,
                    monmasterCandidateId: 101,
                    pvStudentDataId: 201,
                    createdAt: expect.any(Date),
                },
                {
                    monmasterFileId,
                    pvFileId,
                    monmasterCandidateId: 102,
                    pvStudentDataId: 202,
                    createdAt: expect.any(Date),
                },
            ];

            fuzzyMatchingService.findBestMatches.mockReturnValue(mockMatches);
            candidateMatchingModel.saveCandidateMatches.mockResolvedValue(expectedCandidateMatches);

            const result = await candidateMatchingService.generateCandidateMatches(monmasterFileId, pvFileId, candidates, students);

            expect(fuzzyMatchingService.findBestMatches).toHaveBeenCalledWith(
                sourceCandidates,
                targetCandidates
            );

            expect(candidateMatchingModel.saveCandidateMatches).toHaveBeenCalledWith(expect.arrayContaining([
                expect.objectContaining({
                    monmasterFileId,
                    pvFileId,
                    monmasterCandidateId: 101,
                    pvStudentDataId: 201,
                    createdAt: expect.any(Date),
                }),
                expect.objectContaining({
                    monmasterFileId,
                    pvFileId,
                    monmasterCandidateId: 102,
                    pvStudentDataId: 202,
                    createdAt: expect.any(Date),
                })
            ]));
            
            expect(result).toEqual(expectedCandidateMatches);
        });

        it('should return an empty array if no matches are found', async () => {
            const monmasterFileId = 1;
            const pvFileId = 2;

            const candidates = [
                { candidateId: 101, fullName: 'John Doe', dateOfBirth: '1990-01-01' },
            ];

            const students = [
                { studentDataId: 201, name: 'Alice Johnson', dateOfBirth: '1993-07-20' },
            ];
            
            const sourceCandidates = [
                { id: 101, firstName: 'John', lastName: 'Doe', dateOfBirth: '1990-01-01' },
            ];
            
            const targetCandidates = [
                { id: 201, firstName: 'Alice', lastName: 'Johnson', dateOfBirth: '1993-07-20' },
            ];

            fuzzyMatchingService.findBestMatches.mockReturnValue([]);
            candidateMatchingModel.saveCandidateMatches.mockResolvedValue([]);

            const result = await candidateMatchingService.generateCandidateMatches(monmasterFileId, pvFileId, candidates, students);

            expect(fuzzyMatchingService.findBestMatches).toHaveBeenCalledWith(sourceCandidates, targetCandidates);
            expect(candidateMatchingModel.saveCandidateMatches).toHaveBeenCalledWith([]);
            expect(result).toEqual([]);
        });

        it('should throw an error if saving matches fails', async () => {
            const monmasterFileId = 1;
            const pvFileId = 2;

            const candidates = [
                { candidateId: 101, fullName: 'John Doe', dateOfBirth: '1990-01-01' },
            ];

            const students = [
                { studentDataId: 201, name: 'John Doe', dateOfBirth: '1990-01-01' },
            ];
            
            const sourceCandidates = [
                { id: 101, firstName: 'John', lastName: 'Doe', dateOfBirth: '1990-01-01' },
            ];
            
            const targetCandidates = [
                { id: 201, firstName: 'John', lastName: 'Doe', dateOfBirth: '1990-01-01' },
            ];

            const mockMatches = [
                { 
                    source: { id: 101, firstName: 'John', lastName: 'Doe', dateOfBirth: '1990-01-01' }, 
                    target: { id: 201, firstName: 'John', lastName: 'Doe', dateOfBirth: '1990-01-01' }, 
                    score: 0.9, 
                    nameScore: 0.8 
                },
            ];

            const expectedCandidateMatches: CandidateMatch[] = [
                {
                    monmasterFileId,
                    pvFileId,
                    monmasterCandidateId: 101,
                    pvStudentDataId: 201,
                    createdAt: expect.any(Date),
                },
            ];

            fuzzyMatchingService.findBestMatches.mockReturnValue(mockMatches);
            candidateMatchingModel.saveCandidateMatches.mockRejectedValue(new Error('Database error'));

            await expect(
                candidateMatchingService.generateCandidateMatches(monmasterFileId, pvFileId, candidates, students)
            ).rejects.toThrow('Database error');

            expect(fuzzyMatchingService.findBestMatches).toHaveBeenCalledWith(sourceCandidates, targetCandidates);
            expect(candidateMatchingModel.saveCandidateMatches).toHaveBeenCalledWith(
                expect.arrayContaining([
                    expect.objectContaining({
                        monmasterFileId,
                        pvFileId,
                        monmasterCandidateId: 101,
                        pvStudentDataId: 201,
                    })
                ])
            );
        });
    });
});