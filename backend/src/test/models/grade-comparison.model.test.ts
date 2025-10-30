import { GradeComparisonModel } from '../../models/grade-comparison.model';
import pool from '../../config/db';
import {
    CandidateMatch,
    ComparisonResult,
    ComparisonSummary,
    VerificationStatus
} from '../../types/grade-comparison.types';
import { NormalizedCandidate } from '../../types/monmaster-normalization.types';
import { NormalizedStudentData } from '../../types/pv-normalization.types';


jest.mock('../../config/db', () => ({
    query: jest.fn(),
    connect: jest.fn()
}));

describe('GradeComparisonModel', () => {
    let gradeComparisonModel: GradeComparisonModel;


    const mockCandidateMatch: CandidateMatch = {
        monmasterFileId: 1,
        pvFileId: 2,
        monmasterCandidateId: 3,
        pvStudentDataId: 4
    };

    const mockComparisonResult: ComparisonResult = {
        matchId: 1,
        fieldName: 'fullName',
        monmasterValue: 'John Doe',
        pvValue: 'John Doe',
        similarityScore: 1.0,
        verificationStatus: VerificationStatus.FULLY_VERIFIED
    };

    const mockComparisonSummary: ComparisonSummary = {
        matchId: 1,
        averageSimilarity: 0.9,
        overallVerificationStatus: VerificationStatus.FULLY_VERIFIED
    };

    const mockNormalizedCandidate: NormalizedCandidate = {
        candidateId: 3,
        monmasterFileId: 1,
        lastName: 'Doe',
        firstName: 'John',
        fullName: 'Doe John',
        candidateNumber: '12345',
        dateOfBirth: '01/01/1990',
        processedDate: new Date()
    };

    const mockNormalizedStudent: NormalizedStudentData = {
        studentDataId: 4,
        name: 'John Doe',
        dateOfBirth: '01/01/1990',
        studentNumber: '12345',
        semesterResults: []
    };

    beforeEach(() => {
        gradeComparisonModel = new GradeComparisonModel();
        jest.clearAllMocks();
    });

    describe('createCandidateMatch', () => {
        it('devrait créer une correspondance de candidat', async () => {
            (pool.query as jest.Mock).mockResolvedValueOnce({
                rows: [{ ...mockCandidateMatch, matchId: 1 }]
            });

            const result = await gradeComparisonModel.createCandidateMatch(mockCandidateMatch);

            expect(pool.query).toHaveBeenCalledWith(
                'INSERT INTO "CandidateMatches" ("monmasterFileId", "pvFileId", "monmasterCandidateId", "pvStudentDataId") ' +
                'VALUES ($1, $2, $3, $4) RETURNING *',
                [mockCandidateMatch.monmasterFileId, mockCandidateMatch.pvFileId,
                mockCandidateMatch.monmasterCandidateId, mockCandidateMatch.pvStudentDataId]
            );
            expect(result).toEqual({ ...mockCandidateMatch, matchId: 1 });
        });
    });

    describe('createCandidateMatches', () => {
        it('devrait créer plusieurs correspondances de candidats dans une transaction', async () => {
            const mockClient = {
                query: jest.fn(),
                release: jest.fn()
            };

            (pool.connect as jest.Mock).mockResolvedValueOnce(mockClient);
            mockClient.query.mockResolvedValueOnce(undefined)
                .mockResolvedValueOnce({ rows: [{ ...mockCandidateMatch, matchId: 1 }] })
                .mockResolvedValueOnce({ rows: [{ ...mockCandidateMatch, matchId: 2 }] })
                .mockResolvedValueOnce(undefined);

            const result = await gradeComparisonModel.createCandidateMatches([mockCandidateMatch, mockCandidateMatch]);

            expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
            expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
            expect(mockClient.release).toHaveBeenCalled();
            expect(result).toEqual([
                { ...mockCandidateMatch, matchId: 1 },
                { ...mockCandidateMatch, matchId: 2 }
            ]);
        });

        it('devrait annuler la transaction en cas d\'erreur', async () => {
            const mockClient = {
                query: jest.fn(),
                release: jest.fn()
            };

            (pool.connect as jest.Mock).mockResolvedValueOnce(mockClient);
            mockClient.query.mockResolvedValueOnce(undefined)
                .mockRejectedValueOnce(new Error('Database error'));

            await expect(gradeComparisonModel.createCandidateMatches([mockCandidateMatch]))
                .rejects.toThrow('Database error');

            expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
            expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
            expect(mockClient.release).toHaveBeenCalled();
        });
    });

    describe('getCandidateMatches', () => {
        it('devrait obtenir les correspondances de candidats par IDs de fichier', async () => {
            (pool.query as jest.Mock).mockResolvedValueOnce({
                rows: [{ ...mockCandidateMatch, matchId: 1 }]
            });

            const result = await gradeComparisonModel.getCandidateMatches(1, 2);

            expect(pool.query).toHaveBeenCalledWith(
                'SELECT * FROM "CandidateMatches" WHERE "monmasterFileId" = $1 AND "pvFileId" = $2',
                [1, 2]
            );
            expect(result).toEqual([{ ...mockCandidateMatch, matchId: 1 }]);
        });
    });

    describe('getCandidateMatchById', () => {
        it('devrait obtenir une correspondance de candidat par ID', async () => {
            (pool.query as jest.Mock).mockResolvedValueOnce({
                rows: [{ ...mockCandidateMatch, matchId: 1 }]
            });

            const result = await gradeComparisonModel.getCandidateMatchById(1);

            expect(pool.query).toHaveBeenCalledWith(
                'SELECT * FROM "CandidateMatches" WHERE "matchId" = $1',
                [1]
            );
            expect(result).toEqual({ ...mockCandidateMatch, matchId: 1 });
        });

        it('devrait retourner null quand la correspondance n\'est pas trouvée', async () => {
            (pool.query as jest.Mock).mockResolvedValueOnce({
                rows: []
            });

            const result = await gradeComparisonModel.getCandidateMatchById(999);

            expect(result).toBeNull();
        });
    });

    describe('getCandidateDetailsForMatch', () => {
        it('devrait obtenir les détails du candidat pour une correspondance', async () => {
            (pool.query as jest.Mock).mockResolvedValueOnce({
                rows: [{
                    ...mockNormalizedCandidate,
                    ...mockNormalizedStudent,
                    pvDateOfBirth: mockNormalizedStudent.dateOfBirth
                }]
            });

            const result = await gradeComparisonModel.getCandidateDetailsForMatch(1);

            expect(pool.query).toHaveBeenCalledWith(expect.stringContaining('FROM "CandidateMatches" cm'), [1]);
            expect(result).toEqual({
                monmasterCandidate: {
                    candidateId: mockNormalizedCandidate.candidateId,
                    monmasterFileId: mockNormalizedCandidate.monmasterFileId,
                    lastName: mockNormalizedCandidate.lastName,
                    firstName: mockNormalizedCandidate.firstName,
                    fullName: mockNormalizedCandidate.fullName,
                    candidateNumber: mockNormalizedCandidate.candidateNumber,
                    dateOfBirth: mockNormalizedCandidate.dateOfBirth,
                    processedDate: mockNormalizedCandidate.processedDate
                },
                pvStudent: {
                    name: mockNormalizedStudent.name,
                    dateOfBirth: mockNormalizedStudent.dateOfBirth,
                    studentNumber: mockNormalizedStudent.studentNumber,
                    semesterResults: []
                }
            });
        });

        it('devrait retourner null quand la correspondance n\'est pas trouvée', async () => {
            (pool.query as jest.Mock).mockResolvedValueOnce({
                rows: []
            });

            const result = await gradeComparisonModel.getCandidateDetailsForMatch(999);

            expect(result).toBeNull();
        });
    });

    describe('deleteCandidateMatch', () => {
        it('devrait supprimer une correspondance de candidat', async () => {
            (pool.query as jest.Mock).mockResolvedValueOnce({
                rowCount: 1
            });

            const result = await gradeComparisonModel.deleteCandidateMatch(1);

            expect(pool.query).toHaveBeenCalledWith(
                'DELETE FROM "CandidateMatches" WHERE "matchId" = $1',
                [1]
            );
            expect(result).toBe(true);
        });

        it('devrait retourner false quand la correspondance n\'est pas trouvée', async () => {
            (pool.query as jest.Mock).mockResolvedValueOnce({
                rowCount: 0
            });

            const result = await gradeComparisonModel.deleteCandidateMatch(999);

            expect(result).toBe(false);
        });
    });

    describe('saveComparisonResult', () => {
        it('devrait enregistrer un résultat de comparaison', async () => {
            (pool.query as jest.Mock).mockResolvedValueOnce({
                rows: [{ ...mockComparisonResult, resultId: 1 }]
            });

            const result = await gradeComparisonModel.saveComparisonResult(mockComparisonResult);

            expect(pool.query).toHaveBeenCalledWith(
                'INSERT INTO "ComparisonResults" ("matchId", "fieldName", "monmasterValue", "pvValue", "similarityScore", "verificationStatus") ' +
                'VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
                [
                    mockComparisonResult.matchId,
                    mockComparisonResult.fieldName,
                    mockComparisonResult.monmasterValue,
                    mockComparisonResult.pvValue,
                    mockComparisonResult.similarityScore,
                    mockComparisonResult.verificationStatus
                ]
            );
            expect(result).toEqual({ ...mockComparisonResult, resultId: 1 });
        });
    });

    describe('saveComparisonResults', () => {
        it('devrait enregistrer plusieurs résultats de comparaison dans une transaction', async () => {
            const mockClient = {
                query: jest.fn(),
                release: jest.fn()
            };

            (pool.connect as jest.Mock).mockResolvedValueOnce(mockClient);
            mockClient.query.mockResolvedValueOnce(undefined)
                .mockResolvedValueOnce({ rows: [{ ...mockComparisonResult, resultId: 1 }] })
                .mockResolvedValueOnce({ rows: [{ ...mockComparisonResult, resultId: 2 }] })
                .mockResolvedValueOnce(undefined);

            const result = await gradeComparisonModel.saveComparisonResults([mockComparisonResult, mockComparisonResult]);

            expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
            expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
            expect(mockClient.release).toHaveBeenCalled();
            expect(result).toEqual([
                { ...mockComparisonResult, resultId: 1 },
                { ...mockComparisonResult, resultId: 2 }
            ]);
        });

        it('devrait retourner un tableau vide quand aucun résultat n\'est fourni', async () => {
            const result = await gradeComparisonModel.saveComparisonResults([]);

            expect(result).toEqual([]);
            expect(pool.connect).not.toHaveBeenCalled();
        });

        it('devrait annuler la transaction en cas d\'erreur', async () => {
            const mockClient = {
                query: jest.fn(),
                release: jest.fn()
            };

            (pool.connect as jest.Mock).mockResolvedValueOnce(mockClient);
            mockClient.query.mockResolvedValueOnce(undefined)
                .mockRejectedValueOnce(new Error('Database error'));

            await expect(gradeComparisonModel.saveComparisonResults([mockComparisonResult]))
                .rejects.toThrow('Database error');

            expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
            expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
            expect(mockClient.release).toHaveBeenCalled();
        });
    });

    describe('getComparisonResultsByMatchId', () => {
        it('devrait obtenir les résultats de comparaison par ID de correspondance', async () => {
            (pool.query as jest.Mock).mockResolvedValueOnce({
                rows: [{ ...mockComparisonResult, resultId: 1 }]
            });

            const result = await gradeComparisonModel.getComparisonResultsByMatchId(1);

            expect(pool.query).toHaveBeenCalledWith(
                'SELECT * FROM "ComparisonResults" WHERE "matchId" = $1 ORDER BY "fieldName"',
                [1]
            );
            expect(result).toEqual([{ ...mockComparisonResult, resultId: 1 }]);
        });
    });

    describe('saveComparisonSummary', () => {
        it('devrait créer un nouveau résumé de comparaison si aucun n\'existe', async () => {
            (pool.query as jest.Mock)
                .mockResolvedValueOnce({ rows: [] })
                .mockResolvedValueOnce({ rows: [{ ...mockComparisonSummary, summaryId: 1 }] });

            const result = await gradeComparisonModel.saveComparisonSummary(mockComparisonSummary);

            expect(pool.query).toHaveBeenCalledWith(
                'INSERT INTO "ComparisonSummary" ("matchId", "averageSimilarity", "overallVerificationStatus") ' +
                'VALUES ($1, $2, $3) RETURNING *',
                [
                    mockComparisonSummary.matchId,
                    mockComparisonSummary.averageSimilarity,
                    mockComparisonSummary.overallVerificationStatus
                ]
            );
            expect(result).toEqual({ ...mockComparisonSummary, summaryId: 1 });
        });

        it('devrait mettre à jour un résumé de comparaison existant', async () => {
            (pool.query as jest.Mock)
                .mockResolvedValueOnce({ rows: [{ ...mockComparisonSummary, summaryId: 1 }] })
                .mockResolvedValueOnce({ rows: [{ ...mockComparisonSummary, summaryId: 1, averageSimilarity: 0.95 }] });

            const result = await gradeComparisonModel.saveComparisonSummary({
                ...mockComparisonSummary,
                averageSimilarity: 0.95
            });

            expect(pool.query).toHaveBeenCalledWith(
                'UPDATE "ComparisonSummary" SET "averageSimilarity" = $1, "overallVerificationStatus" = $2 ' +
                'WHERE "matchId" = $3 RETURNING *',
                [0.95, mockComparisonSummary.overallVerificationStatus, mockComparisonSummary.matchId]
            );
            expect(result).toEqual({ ...mockComparisonSummary, summaryId: 1, averageSimilarity: 0.95 });
        });
    });

    describe('getComparisonSummaryByMatchId', () => {
        it('devrait obtenir un résumé de comparaison par ID de correspondance', async () => {
            (pool.query as jest.Mock).mockResolvedValueOnce({
                rows: [{ ...mockComparisonSummary, summaryId: 1 }]
            });

            const result = await gradeComparisonModel.getComparisonSummaryByMatchId(1);

            expect(pool.query).toHaveBeenCalledWith(
                'SELECT * FROM "ComparisonSummary" WHERE "matchId" = $1',
                [1]
            );
            expect(result).toEqual({ ...mockComparisonSummary, summaryId: 1 });
        });

        it('devrait retourner null quand le résumé n\'est pas trouvé', async () => {
            (pool.query as jest.Mock).mockResolvedValueOnce({
                rows: []
            });

            const result = await gradeComparisonModel.getComparisonSummaryByMatchId(999);

            expect(result).toBeNull();
        });
    });

    describe('getComparisonReport', () => {
        it('devrait obtenir un rapport de comparaison complet', async () => {

            (pool.query as jest.Mock).mockResolvedValueOnce({
                rows: [{
                    matchId: 1,
                    monmasterFileId: 1,
                    pvFileId: 2,
                    monmasterCandidateId: 3,
                    pvStudentDataId: 4,
                    monmasterFullName: 'Doe John',
                    monmasterDateOfBirth: '01/01/1990',
                    pvName: 'John Doe',
                    pvDateOfBirth: '01/01/1990'
                }]
            });


            (pool.query as jest.Mock).mockResolvedValueOnce({
                rows: [{
                    summaryId: 1,
                    matchId: 1,
                    averageSimilarity: 0.9,
                    overallVerificationStatus: VerificationStatus.FULLY_VERIFIED
                }]
            });


            (pool.query as jest.Mock).mockResolvedValueOnce({
                rows: [{
                    resultId: 1,
                    matchId: 1,
                    fieldName: 'fullName',
                    monmasterValue: 'Doe John',
                    pvValue: 'John Doe',
                    similarityScore: 0.9,
                    verificationStatus: VerificationStatus.FULLY_VERIFIED
                }]
            });

            const result = await gradeComparisonModel.getComparisonReport(1);

            expect(result).toEqual({
                candidate: {
                    monmasterCandidateId: 3,
                    pvStudentDataId: 4,
                    fullName: 'Doe John',
                    dateOfBirth: '01/01/1990'
                },
                monmasterFileId: 1,
                pvFileId: 2,
                averageSimilarity: 0.9,
                overallVerificationStatus: VerificationStatus.FULLY_VERIFIED,
                fields: [{
                    fieldName: 'fullName',
                    monmasterValue: 'Doe John',
                    pvValue: 'John Doe',
                    similarityScore: 0.9,
                    verificationStatus: VerificationStatus.FULLY_VERIFIED
                }]
            });
        });

        it('devrait retourner null quand la correspondance n\'est pas trouvée', async () => {
            (pool.query as jest.Mock).mockResolvedValueOnce({
                rows: []
            });

            const result = await gradeComparisonModel.getComparisonReport(999);

            expect(result).toBeNull();
        });

        it('devrait retourner null quand le résumé n\'est pas trouvé', async () => {
            (pool.query as jest.Mock).mockResolvedValueOnce({
                rows: [{
                    matchId: 1,
                    monmasterFileId: 1,
                    pvFileId: 2,
                    monmasterCandidateId: 3,
                    pvStudentDataId: 4,
                    monmasterFullName: 'Doe John',
                    monmasterDateOfBirth: '01/01/1990'
                }]
            }).mockResolvedValueOnce({
                rows: []
            });

            const result = await gradeComparisonModel.getComparisonReport(1);

            expect(result).toBeNull();
        });
    });

    describe('getComparisonReportsByFileIds', () => {
        it('devrait obtenir tous les rapports de comparaison pour des IDs de fichier spécifiques', async () => {

            (pool.query as jest.Mock).mockResolvedValueOnce({
                rows: [{ matchId: 1 }, { matchId: 2 }]
            });


            const mockReport = {
                candidate: {
                    monmasterCandidateId: 3,
                    pvStudentDataId: 4,
                    fullName: 'Doe John',
                    dateOfBirth: '01/01/1990'
                },
                monmasterFileId: 1,
                pvFileId: 2,
                averageSimilarity: 0.9,
                overallVerificationStatus: VerificationStatus.FULLY_VERIFIED,
                fields: []
            };


            jest.spyOn(gradeComparisonModel, 'getComparisonReport')
                .mockResolvedValueOnce(mockReport)
                .mockResolvedValueOnce(mockReport);

            const result = await gradeComparisonModel.getComparisonReportsByFileIds(1, 2);

            expect(pool.query).toHaveBeenCalledWith(
                'SELECT "matchId" FROM "CandidateMatches" WHERE "monmasterFileId" = $1 AND "pvFileId" = $2',
                [1, 2]
            );
            expect(gradeComparisonModel.getComparisonReport).toHaveBeenCalledTimes(2);
            expect(result).toEqual([mockReport, mockReport]);
        });

        it('devrait retourner un tableau vide quand aucune correspondance n\'est trouvée', async () => {
            (pool.query as jest.Mock).mockResolvedValueOnce({
                rows: []
            });

            const result = await gradeComparisonModel.getComparisonReportsByFileIds(1, 2);

            expect(result).toEqual([]);
        });
    });

    describe('getComparisonReportsByCandidateId', () => {
        it('devrait obtenir tous les rapports de comparaison pour un candidat spécifique', async () => {

            (pool.query as jest.Mock).mockResolvedValueOnce({
                rows: [{ matchId: 1 }, { matchId: 2 }]
            });


            const mockReport = {
                candidate: {
                    monmasterCandidateId: 3,
                    pvStudentDataId: 4,
                    fullName: 'Doe John',
                    dateOfBirth: '01/01/1990'
                },
                monmasterFileId: 1,
                pvFileId: 2,
                averageSimilarity: 0.9,
                overallVerificationStatus: VerificationStatus.FULLY_VERIFIED,
                fields: []
            };


            jest.spyOn(gradeComparisonModel, 'getComparisonReport')
                .mockResolvedValueOnce(mockReport)
                .mockResolvedValueOnce(mockReport);

            const result = await gradeComparisonModel.getComparisonReportsByCandidateId(3);

            expect(pool.query).toHaveBeenCalledWith(
                'SELECT "matchId" FROM "CandidateMatches" WHERE "monmasterCandidateId" = $1',
                [3]
            );
            expect(gradeComparisonModel.getComparisonReport).toHaveBeenCalledTimes(2);
            expect(result).toEqual([mockReport, mockReport]);
        });

        it('devrait retourner un tableau vide quand aucune correspondance n\'est trouvée', async () => {
            (pool.query as jest.Mock).mockResolvedValueOnce({
                rows: []
            });

            const result = await gradeComparisonModel.getComparisonReportsByCandidateId(999);

            expect(result).toEqual([]);
        });
    });

    describe('deleteComparisonDataForMatch', () => {
        it('devrait supprimer toutes les données de comparaison pour une correspondance', async () => {
            const mockClient = {
                query: jest.fn(),
                release: jest.fn()
            };

            (pool.connect as jest.Mock).mockResolvedValueOnce(mockClient);
            mockClient.query.mockResolvedValueOnce(undefined)
                .mockResolvedValueOnce(undefined)
                .mockResolvedValueOnce(undefined)
                .mockResolvedValueOnce({ rowCount: 1 })
                .mockResolvedValueOnce(undefined);

            const result = await gradeComparisonModel.deleteComparisonDataForMatch(1);

            expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
            expect(mockClient.query).toHaveBeenCalledWith('DELETE FROM "ComparisonSummary" WHERE "matchId" = $1', [1]);
            expect(mockClient.query).toHaveBeenCalledWith('DELETE FROM "ComparisonResults" WHERE "matchId" = $1', [1]);
            expect(mockClient.query).toHaveBeenCalledWith('DELETE FROM "CandidateMatches" WHERE "matchId" = $1', [1]);
            expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
            expect(mockClient.release).toHaveBeenCalled();
            expect(result).toBe(true);
        });

        it('devrait retourner false quand la correspondance n\'est pas trouvée', async () => {
            const mockClient = {
                query: jest.fn(),
                release: jest.fn()
            };

            (pool.connect as jest.Mock).mockResolvedValueOnce(mockClient);
            mockClient.query.mockResolvedValueOnce(undefined)
                .mockResolvedValueOnce(undefined)
                .mockResolvedValueOnce(undefined)
                .mockResolvedValueOnce({ rowCount: 0 })
                .mockResolvedValueOnce(undefined);

            const result = await gradeComparisonModel.deleteComparisonDataForMatch(999);

            expect(result).toBe(false);
        });

        it('devrait annuler la transaction en cas d\'erreur', async () => {
            const mockClient = {
                query: jest.fn(),
                release: jest.fn()
            };

            (pool.connect as jest.Mock).mockResolvedValueOnce(mockClient);
            mockClient.query.mockResolvedValueOnce(undefined)
                .mockRejectedValueOnce(new Error('Database error'));

            await expect(gradeComparisonModel.deleteComparisonDataForMatch(1))
                .rejects.toThrow('Database error');

            expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
            expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
            expect(mockClient.release).toHaveBeenCalled();
        });
    });
});
