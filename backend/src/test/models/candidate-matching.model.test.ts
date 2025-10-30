import { CandidateMatchingModel } from '../../models/candidate-matching.model';
import { CandidateMatch } from '../../types/grade-comparison.types';
import pool from '../../config/db';

jest.mock('../../config/db', () => ({
    query: jest.fn(),
    connect: jest.fn(),
    release: jest.fn(),
}));

const mockedPool = pool as jest.Mocked<typeof pool>;

describe('CandidateMatchingModel', () => {
    let candidateMatchingModel: CandidateMatchingModel;

    beforeEach(() => {
        jest.clearAllMocks();
        candidateMatchingModel = new CandidateMatchingModel();
    });

    describe('saveCandidateMatches', () => {
        it('should save multiple candidate matches and return them', async () => {
            const matches: CandidateMatch[] = [
                {
                    monmasterFileId: 1,
                    pvFileId: 2,
                    monmasterCandidateId: 101,
                    pvStudentDataId: 201,
                    createdAt: new Date(),
                },
                {
                    monmasterFileId: 1,
                    pvFileId: 2,
                    monmasterCandidateId: 102,
                    pvStudentDataId: 202,
                    createdAt: new Date(),
                },
            ];

            const mockSavedMatches = matches.map((match, index) => ({
                ...match,
                matchId: index + 1,
            }));

            const mockClient = {
                query: jest.fn()
                    .mockResolvedValueOnce({}) // BEGIN
                    .mockResolvedValueOnce({ rows: [mockSavedMatches[0]] }) // INSERT du 1er match
                    .mockResolvedValueOnce({ rows: [mockSavedMatches[1]] }) // INSERT du 2ème match
                    .mockResolvedValueOnce({}), // COMMIT
                release: jest.fn(),
            };

            // Correction du typage en castant le retour en "any"
            (mockedPool.connect as jest.Mock).mockResolvedValue(mockClient as any);

            const result = await candidateMatchingModel.saveCandidateMatches(matches);

            expect(result).toEqual(mockSavedMatches);
            expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
            expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
        });

        it('should return an empty array if no matches are provided', async () => {
            const result = await candidateMatchingModel.saveCandidateMatches([]);
            expect(result).toEqual([]);
        });

        it('should rollback transaction on error', async () => {
            const matches: CandidateMatch[] = [
                {
                    monmasterFileId: 1,
                    pvFileId: 2,
                    monmasterCandidateId: 101,
                    pvStudentDataId: 201,
                    createdAt: new Date(),
                },
            ];

            const mockClient = {
                query: jest.fn().mockRejectedValue(new Error('Database error')),
                release: jest.fn(),
            };

            (mockedPool.connect as jest.Mock).mockResolvedValue(mockClient as any);

            await expect(candidateMatchingModel.saveCandidateMatches(matches)).rejects.toThrow('Database error');
            expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
            expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
        });
    });

    describe('getCandidateMatches', () => {
        it('should return candidate matches for given MonMaster and PV file IDs', async () => {
            const mockMatches = [
                {
                    matchId: 1,
                    monmasterFileId: 1,
                    pvFileId: 2,
                    monmasterCandidateId: 101,
                    pvStudentDataId: 201,
                    createdAt: new Date(),
                },
            ];

            (mockedPool.query as jest.Mock).mockResolvedValue({ rows: mockMatches });
            const result = await candidateMatchingModel.getCandidateMatches(1, 2);
            expect(result).toEqual(mockMatches);
            expect(mockedPool.query).toHaveBeenCalledWith(
                'SELECT * FROM "CandidateMatches" WHERE "monmasterFileId" = $1 AND "pvFileId" = $2',
                [1, 2]
            );
        });

        it('should return an empty array if no matches are found', async () => {
            (mockedPool.query as jest.Mock).mockResolvedValue({ rows: [] });
            const result = await candidateMatchingModel.getCandidateMatches(1, 2);
            expect(result).toEqual([]);
        });
    });

    describe('getCandidateMatchById', () => {
        it('should return a candidate match for a given match ID', async () => {
            const mockMatch = {
                matchId: 1,
                monmasterFileId: 1,
                pvFileId: 2,
                monmasterCandidateId: 101,
                pvStudentDataId: 201,
                createdAt: new Date(),
            };

            (mockedPool.query as jest.Mock).mockResolvedValue({ rows: [mockMatch] });
            const result = await candidateMatchingModel.getCandidateMatchById(1);
            expect(result).toEqual(mockMatch);
            expect(mockedPool.query).toHaveBeenCalledWith(
                'SELECT * FROM "CandidateMatches" WHERE "matchId" = $1',
                [1]
            );
        });

        it('should return null if no match is found', async () => {
            (mockedPool.query as jest.Mock).mockResolvedValue({ rows: [] });
            const result = await candidateMatchingModel.getCandidateMatchById(1);
            expect(result).toBeNull();
        });
    });

    describe('deleteCandidateMatch', () => {
        it('should delete a candidate match and return true if successful', async () => {
            (mockedPool.query as jest.Mock).mockResolvedValue({ rowCount: 1 });
            const result = await candidateMatchingModel.deleteCandidateMatch(1);
            expect(result).toBe(true);
            expect(mockedPool.query).toHaveBeenCalledWith(
                'DELETE FROM "CandidateMatches" WHERE "matchId" = $1',
                [1]
            );
        });

        it('should return false if no match is deleted', async () => {
            (mockedPool.query as jest.Mock).mockResolvedValue({ rowCount: 0 });
            const result = await candidateMatchingModel.deleteCandidateMatch(1);
            expect(result).toBe(false);
        });
    });

    describe('getCandidateDetailsForMatch', () => {
        it('should return candidate details for a given match ID', async () => {
            const mockDetails = {
                candidateId: 101,
                monmasterFileId: 1,
                lastName: 'Doe',
                firstName: 'John',
                fullName: 'John Doe',
                candidateNumber: 'C123',
                dateOfBirth: new Date('2000-01-01'),
                processedDate: new Date(),
                name: 'John Doe',
                pvDateOfBirth: new Date('2000-01-01'),
                studentNumber: 'S456',
            };

            (mockedPool.query as jest.Mock).mockResolvedValue({ rows: [mockDetails] });
            const result = await candidateMatchingModel.getCandidateDetailsForMatch(1);
            expect(result).toEqual({
                monmasterCandidate: {
                    candidateId: mockDetails.candidateId,
                    monmasterFileId: mockDetails.monmasterFileId,
                    lastName: mockDetails.lastName,
                    firstName: mockDetails.firstName,
                    fullName: mockDetails.fullName,
                    candidateNumber: mockDetails.candidateNumber,
                    dateOfBirth: mockDetails.dateOfBirth,
                    processedDate: mockDetails.processedDate,
                },
                pvStudent: {
                    name: mockDetails.name,
                    dateOfBirth: mockDetails.pvDateOfBirth,
                    studentNumber: mockDetails.studentNumber,
                    semesterResults: [],
                },
            });
        });

        it('should return null if no details are found', async () => {
            (mockedPool.query as jest.Mock).mockResolvedValue({ rows: [] });
            const result = await candidateMatchingModel.getCandidateDetailsForMatch(1);
            expect(result).toBeNull();
        });
    });
});
