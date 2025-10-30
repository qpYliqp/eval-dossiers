import { GradeComparisonService } from '../../services/grade-comparison.service';
import { GradeComparisonModel } from '../../models/grade-comparison.model';
import { MonMasterNormalizationModel } from '../../models/monmaster-normalization.model';
import { PvNormalizationModel } from '../../models/pv-normalization.model';
import { FuzzyMatchingService } from '../../services/fuzzy-matching.service';
import { MappingService } from '../../services/mapping.service';
import { FileService } from '../../services/file.service';
import {
    CandidateMatch,
    ComparisonResult,
    ComparisonSummary,
    ComparisonReport,
    VerificationStatus,
    CandidateMatchingResult
} from '../../types/grade-comparison.types';
import { NormalizedCandidate, AcademicRecord, CandidateScore } from '../../types/monmaster-normalization.types';
import { NormalizedStudentData, SemesterResult } from '../../types/pv-normalization.types';
import { FileOrigin } from '../../types/file.types';


jest.mock('../../models/grade-comparison.model');
jest.mock('../../models/monmaster-normalization.model');
jest.mock('../../models/pv-normalization.model');
jest.mock('../../services/fuzzy-matching.service');
jest.mock('../../services/mapping.service');
jest.mock('../../services/monmaster-normalization.service');
jest.mock('../../services/pv-normalization.service');
jest.mock('../../services/file.service');

describe('GradeComparisonService', () => {
    let service: GradeComparisonService;
    let gradeComparisonModel: jest.Mocked<GradeComparisonModel>;
    let monmasterModel: jest.Mocked<MonMasterNormalizationModel>;
    let pvModel: jest.Mocked<PvNormalizationModel>;
    let fuzzyMatchingService: jest.Mocked<FuzzyMatchingService>;
    let mappingService: jest.Mocked<MappingService>;


    const mockCandidateMatch: CandidateMatch = {
        matchId: 1,
        monmasterFileId: 1,
        pvFileId: 2,
        monmasterCandidateId: 3,
        pvStudentDataId: 4
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

    const mockAcademicRecord: AcademicRecord = {
        recordId: 1,
        candidateId: 3,
        academicYear: '2022-2023',
        programType: 'Master',
        curriculumYear: '1',
        specialization: 'Computer Science',
        coursePath: 'General',
        gradeSemester1: 15.5,
        gradeSemester2: 16.0,
        institution: 'University Example'
    };

    const mockCandidateScore: CandidateScore = {
        scoreId: 1,
        candidateId: 3,
        scoreLabel: 'Average Score',
        scoreValue: '15.75'
    };

    const mockSemesterResult: SemesterResult = {
        semesterName: 'Semester 1',
        grade: 15.5
    };

    const mockNormalizedStudent: NormalizedStudentData = {
        studentDataId: 4,
        name: 'John Doe',
        dateOfBirth: '01/01/1990',
        studentNumber: '12345',
        semesterResults: [mockSemesterResult]
    };

    const mockComparisonResult: ComparisonResult = {
        resultId: 1,
        matchId: 1,
        fieldName: 'Average Score -> Semester 1',
        monmasterValue: '15.75',
        pvValue: '15.5',
        similarityScore: 0.95,
        verificationStatus: VerificationStatus.FULLY_VERIFIED
    };

    const mockComparisonSummary: ComparisonSummary = {
        summaryId: 1,
        matchId: 1,
        averageSimilarity: 0.95,
        overallVerificationStatus: VerificationStatus.FULLY_VERIFIED
    };

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

    const mockCandidateMatchingResult: CandidateMatchingResult = {
        monmasterFileId: 1,
        pvFileId: 2,
        matches: [{
            monmasterCandidateId: 3,
            pvStudentDataId: 4,
            score: 0.95
        }]
    };

    beforeEach(() => {

        jest.clearAllMocks();


        service = new GradeComparisonService();


        gradeComparisonModel = service['model'] as jest.Mocked<GradeComparisonModel>;
        monmasterModel = service['monmasterModel'] as jest.Mocked<MonMasterNormalizationModel>;
        pvModel = service['pvModel'] as jest.Mocked<PvNormalizationModel>;
        fuzzyMatchingService = service['fuzzyMatchingService'] as jest.Mocked<FuzzyMatchingService>;
        mappingService = service['mappingService'] as jest.Mocked<MappingService>;
    });

    describe('mockCandidateMatching', () => {
        it('devrait trouver des correspondances entre les candidats MonMaster et les étudiants PV', async () => {

            monmasterModel.getNormalizedDataByFileId.mockResolvedValueOnce({
                candidates: [mockNormalizedCandidate],
                academicRecords: [mockAcademicRecord],
                candidateScores: [mockCandidateScore]
            });

            pvModel.getNormalizedDataByPvFileId.mockResolvedValueOnce([mockNormalizedStudent]);


            fuzzyMatchingService.findBestMatches.mockReturnValueOnce([
                {
                    source: { id: 3, firstName: 'John', lastName: 'Doe', dateOfBirth: '01/01/1990' },
                    target: { id: 4, firstName: '', lastName: 'John Doe', dateOfBirth: '01/01/1990' },
                    score: 0.95,
                    nameScore: 0.9,
                    dateScore: 1.0
                }
            ]);

            const result = await service.mockCandidateMatching(1, 2);

            expect(monmasterModel.getNormalizedDataByFileId).toHaveBeenCalledWith(1);
            expect(pvModel.getNormalizedDataByPvFileId).toHaveBeenCalledWith(2);
            expect(fuzzyMatchingService.findBestMatches).toHaveBeenCalled();
            expect(result).toEqual({
                monmasterFileId: 1,
                pvFileId: 2,
                matches: [{
                    monmasterCandidateId: 3,
                    pvStudentDataId: 4,
                    score: 0.95
                }]
            });
        });

        it('devrait retourner null quand les données MonMaster sont manquantes', async () => {
            monmasterModel.getNormalizedDataByFileId.mockResolvedValueOnce(null);

            const result = await service.mockCandidateMatching(1, 2);

            expect(result).toBeNull();
        });

        it('devrait retourner null quand les données PV sont manquantes', async () => {
            monmasterModel.getNormalizedDataByFileId.mockResolvedValueOnce({
                candidates: [mockNormalizedCandidate],
                academicRecords: [mockAcademicRecord],
                candidateScores: [mockCandidateScore]
            });

            pvModel.getNormalizedDataByPvFileId.mockResolvedValueOnce([]);

            const result = await service.mockCandidateMatching(1, 2);

            expect(result).toBeNull();
        });

        it('devrait gérer les erreurs lors de la recherche de correspondances', async () => {

            monmasterModel.getNormalizedDataByFileId.mockResolvedValueOnce({
                candidates: [mockNormalizedCandidate],
                academicRecords: [mockAcademicRecord],
                candidateScores: [mockCandidateScore]
            });

            pvModel.getNormalizedDataByPvFileId.mockResolvedValueOnce([mockNormalizedStudent]);


            fuzzyMatchingService.findBestMatches.mockImplementationOnce(() => {
                throw new Error('Fuzzy matching error');
            });

            const result = await service.mockCandidateMatching(1, 2);

            expect(result).toBeNull();
        });
    });

    describe('createCandidateMatches', () => {
        it('devrait créer des correspondances de candidats à partir des résultats de matching', async () => {
            gradeComparisonModel.createCandidateMatches.mockResolvedValueOnce([mockCandidateMatch]);

            const result = await service.createCandidateMatches(mockCandidateMatchingResult);

            expect(gradeComparisonModel.createCandidateMatches).toHaveBeenCalledWith([{
                monmasterFileId: 1,
                pvFileId: 2,
                monmasterCandidateId: 3,
                pvStudentDataId: 4
            }]);
            expect(result).toEqual([mockCandidateMatch]);
        });
    });

    describe('processGradeComparison', () => {
        it('devrait traiter et enregistrer la comparaison de notes pour une correspondance', async () => {

            gradeComparisonModel.getCandidateMatchById.mockResolvedValueOnce(mockCandidateMatch);


            monmasterModel.getCandidateById.mockResolvedValueOnce({
                candidate: mockNormalizedCandidate,
                academicRecords: [mockAcademicRecord],
                scores: [mockCandidateScore]
            });


            pvModel.getNormalizedDataByPvFileId.mockResolvedValueOnce([mockNormalizedStudent]);


            jest.spyOn<any, any>(service, 'compareGrades').mockResolvedValueOnce({
                results: [mockComparisonResult],
                averageSimilarity: 0.95,
                overallVerificationStatus: VerificationStatus.FULLY_VERIFIED
            });


            gradeComparisonModel.saveComparisonResults.mockResolvedValueOnce([mockComparisonResult]);
            gradeComparisonModel.saveComparisonSummary.mockResolvedValueOnce(mockComparisonSummary);

            const result = await service.processGradeComparison(1);

            expect(gradeComparisonModel.getCandidateMatchById).toHaveBeenCalledWith(1);
            expect(monmasterModel.getCandidateById).toHaveBeenCalledWith(3);
            expect(pvModel.getNormalizedDataByPvFileId).toHaveBeenCalledWith(2);
            expect(service['compareGrades']).toHaveBeenCalled();
            expect(gradeComparisonModel.saveComparisonResults).toHaveBeenCalled();
            expect(gradeComparisonModel.saveComparisonSummary).toHaveBeenCalledWith({
                matchId: 1,
                averageSimilarity: 0.95,
                overallVerificationStatus: VerificationStatus.FULLY_VERIFIED
            });
            expect(result).toBe(true);
        });

        it('devrait retourner false quand la correspondance n\'est pas trouvée', async () => {
            gradeComparisonModel.getCandidateMatchById.mockResolvedValueOnce(null);

            const result = await service.processGradeComparison(999);

            expect(result).toBe(false);
        });

        it('devrait retourner false quand les données du candidat MonMaster ne sont pas trouvées', async () => {
            gradeComparisonModel.getCandidateMatchById.mockResolvedValueOnce(mockCandidateMatch);
            monmasterModel.getCandidateById.mockResolvedValueOnce(null);

            const result = await service.processGradeComparison(1);

            expect(result).toBe(false);
        });

        it('devrait retourner false quand les données PV ne sont pas trouvées', async () => {
            gradeComparisonModel.getCandidateMatchById.mockResolvedValueOnce(mockCandidateMatch);
            monmasterModel.getCandidateById.mockResolvedValueOnce({
                candidate: mockNormalizedCandidate,
                academicRecords: [mockAcademicRecord],
                scores: [mockCandidateScore]
            });
            pvModel.getNormalizedDataByPvFileId.mockResolvedValueOnce([]);

            const result = await service.processGradeComparison(1);

            expect(result).toBe(false);
        });

        it('devrait gérer les erreurs pendant le processus de comparaison des notes', async () => {

            gradeComparisonModel.getCandidateMatchById.mockResolvedValueOnce(mockCandidateMatch);
            monmasterModel.getCandidateById.mockResolvedValueOnce({
                candidate: mockNormalizedCandidate,
                academicRecords: [mockAcademicRecord],
                scores: [mockCandidateScore]
            });
            pvModel.getNormalizedDataByPvFileId.mockResolvedValueOnce([mockNormalizedStudent]);


            jest.spyOn<any, any>(service, 'compareGrades').mockRejectedValueOnce(new Error('Comparison error'));

            const result = await service.processGradeComparison(1);

            expect(result).toBe(false);
        });
    });

    describe('processFileComparisons', () => {
        it('devrait créer et traiter des correspondances entre les fichiers', async () => {

            gradeComparisonModel.getCandidateMatches.mockResolvedValueOnce([]);


            const mockCandidateMatchingSpy = jest.spyOn(service, 'mockCandidateMatching').mockResolvedValueOnce(mockCandidateMatchingResult);
            const createCandidateMatchesSpy = jest.spyOn(service, 'createCandidateMatches').mockResolvedValueOnce([mockCandidateMatch]);


            const processGradeComparisonSpy = jest.spyOn(service, 'processGradeComparison').mockResolvedValueOnce(true);

            const result = await service.processFileComparisons(1, 2);

            expect(mockCandidateMatchingSpy).toHaveBeenCalledWith(1, 2);
            expect(createCandidateMatchesSpy).toHaveBeenCalledWith(mockCandidateMatchingResult);
            expect(processGradeComparisonSpy).toHaveBeenCalledWith(1);
            expect(result).toBe(true);
        });

        it('devrait utiliser les correspondances existantes s\'il y en a', async () => {

            gradeComparisonModel.getCandidateMatches.mockResolvedValueOnce([mockCandidateMatch]);


            const mockCandidateMatchingSpy = jest.spyOn(service, 'mockCandidateMatching');
            const createCandidateMatchesSpy = jest.spyOn(service, 'createCandidateMatches');
            const processGradeComparisonSpy = jest.spyOn(service, 'processGradeComparison').mockResolvedValueOnce(true);

            const result = await service.processFileComparisons(1, 2);


            expect(mockCandidateMatchingSpy).not.toHaveBeenCalled();
            expect(createCandidateMatchesSpy).not.toHaveBeenCalled();

            expect(processGradeComparisonSpy).toHaveBeenCalledWith(1);
            expect(result).toBe(true);
        });

        it('devrait retourner false quand aucune correspondance n\'est trouvée', async () => {
            gradeComparisonModel.getCandidateMatches.mockResolvedValueOnce([]);
            const mockCandidateMatchingSpy = jest.spyOn(service, 'mockCandidateMatching').mockResolvedValueOnce(null);

            const result = await service.processFileComparisons(1, 2);

            expect(result).toBe(false);
        });

        it('devrait gérer les erreurs lors du traitement des comparaisons', async () => {
            gradeComparisonModel.getCandidateMatches.mockRejectedValueOnce(new Error('Database error'));

            const result = await service.processFileComparisons(1, 2);

            expect(result).toBe(false);
        });
    });

    describe('getComparisonReport', () => {
        it('devrait obtenir un rapport de comparaison par ID de correspondance', async () => {
            gradeComparisonModel.getComparisonReport.mockResolvedValueOnce(mockComparisonReport);

            const result = await service.getComparisonReport(1);

            expect(gradeComparisonModel.getComparisonReport).toHaveBeenCalledWith(1);
            expect(result).toEqual(mockComparisonReport);
        });
    });

    describe('getComparisonReports', () => {
        it('devrait obtenir tous les rapports de comparaison pour les fichiers donnés', async () => {
            gradeComparisonModel.getComparisonReportsByFileIds.mockResolvedValueOnce([mockComparisonReport]);

            const result = await service.getComparisonReports(1, 2);

            expect(gradeComparisonModel.getComparisonReportsByFileIds).toHaveBeenCalledWith(1, 2);
            expect(result).toEqual([mockComparisonReport]);
        });
    });

    describe('getComparisonReportsByCandidateId', () => {
        it('devrait obtenir tous les rapports de comparaison pour un candidat spécifique', async () => {
            gradeComparisonModel.getComparisonReportsByCandidateId.mockResolvedValueOnce([mockComparisonReport]);

            const result = await service.getComparisonReportsByCandidateId(3);

            expect(gradeComparisonModel.getComparisonReportsByCandidateId).toHaveBeenCalledWith(3);
            expect(result).toEqual([mockComparisonReport]);
        });
    });

    describe('getComparisonReportsByMasterId', () => {
        it('devrait obtenir tous les rapports de comparaison pour un programme de master', async () => {

            (FileService.getFilesByMasterIdAndOrigin as jest.Mock)
                .mockResolvedValueOnce([{ fileId: 1 }])
                .mockResolvedValueOnce([{ fileId: 2 }]);


            jest.spyOn(service, 'getComparisonReports').mockResolvedValueOnce([mockComparisonReport]);

            const result = await service.getComparisonReportsByMasterId(1);

            expect(FileService.getFilesByMasterIdAndOrigin).toHaveBeenCalledWith(1, FileOrigin.MonMaster);
            expect(FileService.getFilesByMasterIdAndOrigin).toHaveBeenCalledWith(1, FileOrigin.PV);
            expect(service.getComparisonReports).toHaveBeenCalledWith(1, 2);
            expect(result).toEqual([mockComparisonReport]);
        });

        it('devrait retourner un tableau vide quand aucun fichier MonMaster n\'est trouvé', async () => {
            (FileService.getFilesByMasterIdAndOrigin as jest.Mock)
                .mockResolvedValueOnce([]);

            const result = await service.getComparisonReportsByMasterId(1);

            expect(result).toEqual([]);
        });

        it('devrait retourner un tableau vide quand aucun fichier PV n\'est trouvé', async () => {
            (FileService.getFilesByMasterIdAndOrigin as jest.Mock)
                .mockResolvedValueOnce([{ fileId: 1 }])
                .mockResolvedValueOnce([]);

            const result = await service.getComparisonReportsByMasterId(1);

            expect(result).toEqual([]);
        });

        it('devrait gérer les erreurs lors de la récupération des rapports', async () => {

            (FileService.getFilesByMasterIdAndOrigin as jest.Mock).mockRejectedValueOnce(new Error('File service error'));

            const result = await service.getComparisonReportsByMasterId(1);

            expect(result).toEqual([]);
        });

        it('devrait gérer les erreurs lors de la récupération des rapports pour une combinaison spécifique', async () => {

            (FileService.getFilesByMasterIdAndOrigin as jest.Mock)
                .mockResolvedValueOnce([{ fileId: 1 }])
                .mockResolvedValueOnce([{ fileId: 2 }]);


            jest.spyOn(service, 'getComparisonReports').mockRejectedValueOnce(new Error('Comparison report error'));

            const result = await service.getComparisonReportsByMasterId(1);

            expect(result).toEqual([]);
        });
    });

    describe('getCandidateMatches', () => {
        it('devrait obtenir toutes les correspondances de candidats pour les fichiers donnés', async () => {
            gradeComparisonModel.getCandidateMatches.mockResolvedValueOnce([mockCandidateMatch]);

            const result = await service.getCandidateMatches(1, 2);

            expect(gradeComparisonModel.getCandidateMatches).toHaveBeenCalledWith(1, 2);
            expect(result).toEqual([mockCandidateMatch]);
        });
    });

    describe('deleteComparison', () => {
        it('devrait supprimer une comparaison et ses données associées', async () => {
            gradeComparisonModel.deleteComparisonDataForMatch.mockResolvedValueOnce(true);

            const result = await service.deleteComparison(1);

            expect(gradeComparisonModel.deleteComparisonDataForMatch).toHaveBeenCalledWith(1);
            expect(result).toBe(true);
        });
    });

    describe('processMasterProgramComparisons', () => {
        it('devrait traiter les comparaisons pour tous les fichiers dans un programme de master', async () => {

            (FileService.getFilesByMasterIdAndOrigin as jest.Mock)
                .mockResolvedValueOnce([{ fileId: 1 }])
                .mockResolvedValueOnce([{ fileId: 2 }, { fileId: 3 }]);


            jest.spyOn(service, 'processFileComparisons')
                .mockResolvedValueOnce(true)
                .mockResolvedValueOnce(true);

            const result = await service.processMasterProgramComparisons(1);

            expect(FileService.getFilesByMasterIdAndOrigin).toHaveBeenCalledWith(1, FileOrigin.MonMaster);
            expect(FileService.getFilesByMasterIdAndOrigin).toHaveBeenCalledWith(1, FileOrigin.PV);
            expect(service.processFileComparisons).toHaveBeenCalledTimes(2);
            expect(result).toEqual({
                success: true,
                message: 'Processed 2 file combinations for master program ID 1. Previously deleted undefined existing comparisons.',
                results: [
                    { monmasterFileId: 1, pvFileId: 2, success: true },
                    { monmasterFileId: 1, pvFileId: 3, success: true }
                ]
            });
        });

        it('devrait retourner failure quand aucun fichier MonMaster n\'est trouvé', async () => {
            (FileService.getFilesByMasterIdAndOrigin as jest.Mock)
                .mockResolvedValueOnce([]);

            const result = await service.processMasterProgramComparisons(1);

            expect(result.success).toBe(false);
            expect(result.message).toContain('No MonMaster file found');
        });

        it('devrait retourner failure quand aucun fichier PV n\'est trouvé', async () => {
            (FileService.getFilesByMasterIdAndOrigin as jest.Mock)
                .mockResolvedValueOnce([{ fileId: 1 }])
                .mockResolvedValueOnce([]);

            const result = await service.processMasterProgramComparisons(1);

            expect(result.success).toBe(false);
            expect(result.message).toContain('No PV files found');
        });

        it('devrait gérer les erreurs lors du traitement des comparaisons pour une combinaison spécifique', async () => {

            (FileService.getFilesByMasterIdAndOrigin as jest.Mock)
                .mockResolvedValueOnce([{ fileId: 1 }])
                .mockResolvedValueOnce([{ fileId: 2 }]);


            jest.spyOn(service, 'processFileComparisons').mockRejectedValueOnce(new Error('Processing error'));

            const result = await service.processMasterProgramComparisons(1);

            expect(result.success).toBe(false);
            expect(result.results).toContainEqual({
                monmasterFileId: 1,
                pvFileId: 2,
                success: false
            });
        });
    });

    describe('getStudentTableData', () => {
        it('devrait retourner les données structurées des étudiants pour le rendu frontend', async () => {

            (FileService.getFilesByMasterIdAndOrigin as jest.Mock)
                .mockResolvedValueOnce([{ fileId: 1 }]);


            monmasterModel.getNormalizedDataByFileId.mockResolvedValueOnce({
                candidates: [mockNormalizedCandidate],
                academicRecords: [mockAcademicRecord],
                candidateScores: [mockCandidateScore]
            });


            gradeComparisonModel.getComparisonReportsByCandidateId.mockResolvedValueOnce([{
                ...mockComparisonReport,
                overallVerificationStatus: VerificationStatus.FULLY_VERIFIED
            }]);

            const result = await service.getStudentTableData(1);

            expect(FileService.getFilesByMasterIdAndOrigin).toHaveBeenCalledWith(1, FileOrigin.MonMaster);
            expect(monmasterModel.getNormalizedDataByFileId).toHaveBeenCalledWith(1);
            expect(gradeComparisonModel.getComparisonReportsByCandidateId).toHaveBeenCalledWith(3);


            expect(result).toHaveProperty('columns');
            expect(result).toHaveProperty('students');
            expect(result.students).toHaveLength(1);
            expect(result.students[0]).toHaveProperty('candidateId', 3);
            expect(result.students[0]).toHaveProperty('fullName', 'Doe John');
            expect(result.students[0]).toHaveProperty('verificationStatus', VerificationStatus.FULLY_VERIFIED);
        });

        it('devrait retourner des données vides quand aucun fichier MonMaster n\'est trouvé', async () => {
            (FileService.getFilesByMasterIdAndOrigin as jest.Mock)
                .mockResolvedValueOnce([]);

            const result = await service.getStudentTableData(1);

            expect(result).toEqual({ columns: [], students: [] });
        });

        it('devrait retourner des données vides quand les données MonMaster sont manquantes', async () => {
            (FileService.getFilesByMasterIdAndOrigin as jest.Mock)
                .mockResolvedValueOnce([{ fileId: 1 }]);

            monmasterModel.getNormalizedDataByFileId.mockResolvedValueOnce(null);

            const result = await service.getStudentTableData(1);

            expect(result).toEqual({ columns: [], students: [] });
        });

        it('devrait récupérer correctement un candidat avec plusieurs enregistrements académiques', async () => {

            (FileService.getFilesByMasterIdAndOrigin as jest.Mock)
                .mockResolvedValueOnce([{ fileId: 1 }]);


            monmasterModel.getNormalizedDataByFileId.mockResolvedValueOnce({
                candidates: [mockNormalizedCandidate],
                academicRecords: [

                    {
                        ...mockAcademicRecord,
                        academicYear: '2021-2022',
                        institution: 'Old University'
                    },
                    {
                        ...mockAcademicRecord,
                        academicYear: '2022-2023',
                        institution: 'New University'
                    }
                ],
                candidateScores: [mockCandidateScore]
            });


            gradeComparisonModel.getComparisonReportsByCandidateId.mockResolvedValueOnce([{
                ...mockComparisonReport,
                overallVerificationStatus: VerificationStatus.FULLY_VERIFIED
            }]);

            const result = await service.getStudentTableData(1);

            expect(result.students[0].latestInstitution).toBe('New University');
        });

        it('devrait gérer les erreurs lors de la récupération des données', async () => {

            (FileService.getFilesByMasterIdAndOrigin as jest.Mock)
                .mockRejectedValueOnce(new Error('File service error'));

            const result = await service.getStudentTableData(1);

            expect(result).toEqual({ columns: [], students: [] });
        });

        it('devrait gérer les erreurs lors de la récupération des rapports de comparaison', async () => {

            (FileService.getFilesByMasterIdAndOrigin as jest.Mock)
                .mockResolvedValueOnce([{ fileId: 1 }]);


            monmasterModel.getNormalizedDataByFileId.mockResolvedValueOnce({
                candidates: [mockNormalizedCandidate],
                academicRecords: [mockAcademicRecord],
                candidateScores: [mockCandidateScore]
            });


            gradeComparisonModel.getComparisonReportsByCandidateId.mockRejectedValueOnce(new Error('Comparison report error'));

            const result = await service.getStudentTableData(1);


            expect(result.students).toHaveLength(1);
            expect(result.students[0].verificationStatus).toBe(VerificationStatus.CANNOT_VERIFY);
        });
    });

    describe('compareGrades', () => {
        it('devrait comparer les notes entre un candidat MonMaster et un étudiant PV', async () => {

            mappingService.getMappingConfiguration.mockResolvedValueOnce({
                configurationId: 1,
                monmasterFileId: 1,
                pvFileId: 2,
                entries: [{
                    entryId: 1,
                    configurationId: 1,
                    masterColumnIndex: 2,
                    masterColumnName: 'Average Score',
                    pvColumnIndex: 3,
                    pvColumnName: 'Semester 1'
                }]
            });


            (service['monmasterService'] as jest.Mocked<any>).getSingleCandidateAsIndexedRecord.mockResolvedValueOnce({
                0: 'Doe John',
                1: '01/01/1990',
                2: '15.75'
            });

            (service['pvService'] as jest.Mocked<any>).getSingleStudentAsIndexedRecord.mockResolvedValueOnce({
                0: 'John Doe',
                1: '01/01/1990',
                2: '12345',
                3: '15.5'
            });

            const result = await (service as any).compareGrades(
                {
                    candidate: mockNormalizedCandidate,
                    academicRecords: [mockAcademicRecord],
                    scores: [mockCandidateScore]
                },
                mockNormalizedStudent,
                1,
                2
            );

            expect(result).toHaveProperty('results');
            expect(result).toHaveProperty('averageSimilarity');
            expect(result).toHaveProperty('overallVerificationStatus');
            expect(result.results.length).toBeGreaterThan(0);
        });

        it('devrait gérer le cas où aucune configuration de mapping n\'existe', async () => {

            mappingService.getMappingConfiguration.mockResolvedValueOnce(null);

            const result = await (service as any).compareGrades(
                {
                    candidate: mockNormalizedCandidate,
                    academicRecords: [mockAcademicRecord],
                    scores: [mockCandidateScore]
                },
                mockNormalizedStudent,
                1,
                2
            );

            expect(result).toEqual({
                results: [],
                averageSimilarity: 0,
                overallVerificationStatus: VerificationStatus.CANNOT_VERIFY
            });
        });

        it('devrait gérer le cas où les enregistrements indexés ne peuvent pas être récupérés', async () => {

            mappingService.getMappingConfiguration.mockResolvedValueOnce({
                configurationId: 1,
                monmasterFileId: 1,
                pvFileId: 2,
                entries: [{
                    entryId: 1,
                    configurationId: 1,
                    masterColumnIndex: 2,
                    masterColumnName: 'Average Score',
                    pvColumnIndex: 3,
                    pvColumnName: 'Semester 1'
                }]
            });


            (service['monmasterService'] as jest.Mocked<any>).getSingleCandidateAsIndexedRecord.mockResolvedValueOnce(null);
            (service['pvService'] as jest.Mocked<any>).getSingleStudentAsIndexedRecord.mockResolvedValueOnce({
                0: 'John Doe',
                1: '01/01/1990',
                2: '12345',
                3: '15.5'
            });

            const result = await (service as any).compareGrades(
                {
                    candidate: mockNormalizedCandidate,
                    academicRecords: [mockAcademicRecord],
                    scores: [mockCandidateScore]
                },
                mockNormalizedStudent,
                1,
                2
            );

            expect(result).toEqual({
                results: [],
                averageSimilarity: 0,
                overallVerificationStatus: VerificationStatus.CANNOT_VERIFY
            });
        });

        it('devrait gérer les erreurs lors de la comparaison des notes', async () => {

            mappingService.getMappingConfiguration.mockRejectedValueOnce(new Error('Mapping error'));

            const result = await (service as any).compareGrades(
                {
                    candidate: mockNormalizedCandidate,
                    academicRecords: [mockAcademicRecord],
                    scores: [mockCandidateScore]
                },
                mockNormalizedStudent,
                1,
                2
            );

            expect(result).toEqual({
                results: [],
                averageSimilarity: 0,
                overallVerificationStatus: VerificationStatus.CANNOT_VERIFY
            });
        });

        it('devrait gérer les valeurs manquantes lors de la comparaison des champs', async () => {

            mappingService.getMappingConfiguration.mockResolvedValueOnce({
                configurationId: 1,
                monmasterFileId: 1,
                pvFileId: 2,
                entries: [{
                    entryId: 1,
                    configurationId: 1,
                    masterColumnIndex: 2,
                    masterColumnName: 'Average Score',
                    pvColumnIndex: 3,
                    pvColumnName: 'Semester 1'
                }]
            });


            (service['monmasterService'] as jest.Mocked<any>).getSingleCandidateAsIndexedRecord.mockResolvedValueOnce({
                0: 'Doe John',
                1: '01/01/1990',

            });

            (service['pvService'] as jest.Mocked<any>).getSingleStudentAsIndexedRecord.mockResolvedValueOnce({
                0: 'John Doe',
                1: '01/01/1990',
                2: '12345',

            });

            const result = await (service as any).compareGrades(
                {
                    candidate: mockNormalizedCandidate,
                    academicRecords: [mockAcademicRecord],
                    scores: [mockCandidateScore]
                },
                mockNormalizedStudent,
                1,
                2
            );

            expect(result.results.length).toBeGreaterThan(0);
            expect(result.results[0].verificationStatus).toBe(VerificationStatus.CANNOT_VERIFY);
        });

        it('devrait gérer les valeurs non numériques lors de la comparaison des notes', async () => {

            mappingService.getMappingConfiguration.mockResolvedValueOnce({
                configurationId: 1,
                monmasterFileId: 1,
                pvFileId: 2,
                entries: [{
                    entryId: 1,
                    configurationId: 1,
                    masterColumnIndex: 2,
                    masterColumnName: 'Average Score',
                    pvColumnIndex: 3,
                    pvColumnName: 'Semester 1'
                }]
            });


            (service['monmasterService'] as jest.Mocked<any>).getSingleCandidateAsIndexedRecord.mockResolvedValueOnce({
                0: 'Doe John',
                1: '01/01/1990',
                2: 'Not a number'
            });

            (service['pvService'] as jest.Mocked<any>).getSingleStudentAsIndexedRecord.mockResolvedValueOnce({
                0: 'John Doe',
                1: '01/01/1990',
                2: '12345',
                3: 'ABC'
            });

            const result = await (service as any).compareGrades(
                {
                    candidate: mockNormalizedCandidate,
                    academicRecords: [mockAcademicRecord],
                    scores: [mockCandidateScore]
                },
                mockNormalizedStudent,
                1,
                2
            );

            expect(result.results.length).toBeGreaterThan(0);
            expect(result.results[0].verificationStatus).toBe(VerificationStatus.CANNOT_VERIFY);
        });
    });

    describe('calculateGradeSimilarity and determineVerificationStatus', () => {
        it('devrait calculer correctement la similarité entre deux notes', () => {

            const similarity = (service as any).calculateGradeSimilarity(15.5, 15.75);
            expect(similarity).toBeGreaterThan(0.9);

            const lowSimilarity = (service as any).calculateGradeSimilarity(5, 15);
            expect(lowSimilarity).toBeLessThan(0.6);

            const zeroSimilarity = (service as any).calculateGradeSimilarity(null, 15);
            expect(zeroSimilarity).toBe(0);
        });

        it('devrait déterminer correctement le statut de vérification en fonction du score de similarité', () => {

            const fullyVerified = (service as any).determineVerificationStatus(0.96);
            expect(fullyVerified).toBe(VerificationStatus.FULLY_VERIFIED);


            const partiallyVerified = (service as any).determineVerificationStatus(0.85);
            expect(partiallyVerified).toBe(VerificationStatus.PARTIALLY_VERIFIED);


            const fraud = (service as any).determineVerificationStatus(0.5);
            expect(fraud).toBe(VerificationStatus.FRAUD);


            const cannotVerify = (service as any).determineVerificationStatus(0);
            expect(cannotVerify).toBe(VerificationStatus.CANNOT_VERIFY);
        });
    });
});
