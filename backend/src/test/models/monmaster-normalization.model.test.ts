import { MonMasterNormalizationModel } from '../../models/monmaster-normalization.model';
import {
    NormalizedCandidate,
    AcademicRecord,
    CandidateScore,
    MonMasterNormalizationResult
} from '../../types/monmaster-normalization.types';

const mockQuery = jest.fn();
const mockRelease = jest.fn();
const mockClient = { query: mockQuery, release: mockRelease };
const mockConnect = jest.fn().mockResolvedValue(mockClient);
const mockPoolQuery = jest.fn();

jest.mock('../../config/db', () => ({
    connect: () => mockConnect(),
    query: (...args: any[]) => mockPoolQuery(...args)
}));

describe('MonMasterNormalizationModel', () => {
    let model: MonMasterNormalizationModel;

    beforeEach(() => {
        model = new MonMasterNormalizationModel();


        jest.clearAllMocks();


        mockQuery.mockImplementation((query: string, params?: any[]) => {
            if (query.includes('INSERT INTO "NormalizedCandidates"')) {
                return Promise.resolve({ rows: [{ candidateId: 100 }] });
            }
            return Promise.resolve({ rows: [] });
        });
    });

    describe('saveNormalizedData', () => {

        const monmasterFileId = 123;
        const testCandidates: NormalizedCandidate[] = [
            {
                candidateId: 1,
                monmasterFileId: monmasterFileId,
                lastName: 'Smith',
                firstName: 'John',
                fullName: 'Smith John',
                candidateNumber: 'C12345',
                dateOfBirth: '01/01/1990'
            }
        ];

        const testAcademicRecords: AcademicRecord[] = [
            {
                candidateId: 1,
                academicYear: '2022-2023',
                programType: 'Master',
                curriculumYear: '1',
                specialization: 'Computer Science',
                coursePath: 'Software Engineering',
                gradeSemester1: 14.5,
                gradeSemester2: 15.2,
                institution: 'Test University'
            }
        ];

        const testCandidateScores: CandidateScore[] = [
            {
                candidateId: 1,
                scoreLabel: 'GPA',
                scoreValue: '3.8'
            }
        ];

        it('should successfully save normalized data', async () => {
            const result = await model.saveNormalizedData(
                monmasterFileId,
                testCandidates,
                testAcademicRecords,
                testCandidateScores
            );


            expect(mockQuery).toHaveBeenCalledWith('BEGIN');


            expect(mockQuery).toHaveBeenCalledWith(
                expect.stringContaining('INSERT INTO "NormalizedCandidates"'),
                expect.arrayContaining([
                    monmasterFileId,
                    'Smith',
                    'John',
                    'C12345',
                    '01/01/1990'
                ])
            );


            expect(mockQuery).toHaveBeenCalledWith(
                expect.stringContaining('INSERT INTO "AcademicRecords"'),
                expect.arrayContaining([
                    100,
                    '2022-2023',
                    'Master',
                    '1',
                    'Computer Science',
                    'Software Engineering',
                    14.5,
                    15.2,
                    'Test University'
                ])
            );


            expect(mockQuery).toHaveBeenCalledWith(
                expect.stringContaining('INSERT INTO "CandidateScores"'),
                expect.arrayContaining([
                    100,
                    'GPA',
                    '3.8'
                ])
            );


            expect(mockQuery).toHaveBeenCalledWith('COMMIT');


            expect(mockRelease).toHaveBeenCalled();


            expect(result).toBe(true);
        });

        it('should rollback transaction and return false on error', async () => {

            mockQuery.mockImplementationOnce(() => Promise.resolve({}))
                .mockImplementationOnce(() => {
                    throw new Error('Database error');
                });

            const result = await model.saveNormalizedData(
                monmasterFileId,
                testCandidates,
                testAcademicRecords,
                testCandidateScores
            );


            expect(mockQuery).toHaveBeenCalledWith('ROLLBACK');


            expect(mockRelease).toHaveBeenCalled();


            expect(result).toBe(false);
        });

        it('should gracefully handle empty arrays', async () => {
            const result = await model.saveNormalizedData(
                monmasterFileId,
                [],
                [],
                []
            );


            expect(mockQuery).toHaveBeenCalledWith('BEGIN');
            expect(mockQuery).toHaveBeenCalledWith('COMMIT');


            expect(mockQuery).not.toHaveBeenCalledWith(
                expect.stringContaining('INSERT INTO'),
                expect.anything()
            );


            expect(result).toBe(true);
        });
    });

    describe('isFileAlreadyNormalized', () => {
        it('should return true if file is already normalized', async () => {

            mockPoolQuery.mockResolvedValueOnce({
                rows: [{ count: '5' }]
            });

            const monmasterFileId = 123;
            const result = await model.isFileAlreadyNormalized(monmasterFileId);


            expect(mockPoolQuery).toHaveBeenCalledWith(
                expect.stringContaining('SELECT COUNT(*) as count FROM "NormalizedCandidates"'),
                [monmasterFileId]
            );


            expect(result).toBe(true);
        });

        it('should return false if file is not normalized', async () => {

            mockPoolQuery.mockResolvedValueOnce({
                rows: [{ count: '0' }]
            });

            const monmasterFileId = 456;
            const result = await model.isFileAlreadyNormalized(monmasterFileId);


            expect(mockPoolQuery).toHaveBeenCalledWith(
                expect.stringContaining('SELECT COUNT(*) as count FROM "NormalizedCandidates"'),
                [monmasterFileId]
            );


            expect(result).toBe(false);
        });

        it('should return false if an error occurs', async () => {

            mockPoolQuery.mockImplementationOnce(() => {
                throw new Error('Database query failed');
            });


            const originalConsoleError = console.error;
            console.error = jest.fn();

            const monmasterFileId = 789;
            const result = await model.isFileAlreadyNormalized(monmasterFileId);


            expect(result).toBe(false);


            expect(console.error).toHaveBeenCalled();


            console.error = originalConsoleError;
        });
    });

    describe('getNormalizedDataByFileId', () => {
        it('should return normalized data when candidates exist', async () => {

            const mockCandidates: NormalizedCandidate[] = [
                {
                    candidateId: 100,
                    monmasterFileId: 123,
                    lastName: 'Doe',
                    firstName: 'Jane',
                    fullName: 'Doe Jane',
                    candidateNumber: 'C54321',
                    dateOfBirth: '15/05/1992',
                    processedDate: new Date('2023-01-15')
                },
                {
                    candidateId: 101,
                    monmasterFileId: 123,
                    lastName: 'Smith',
                    firstName: 'Bob',
                    fullName: 'Smith Bob',
                    candidateNumber: 'C98765',
                    dateOfBirth: '22/09/1991',
                    processedDate: new Date('2023-01-15')
                }
            ];

            const mockAcademicRecords: AcademicRecord[] = [
                {
                    recordId: 201,
                    candidateId: 100,
                    academicYear: '2022-2023',
                    programType: 'Master',
                    curriculumYear: '1',
                    specialization: 'Data Science',
                    coursePath: 'AI and Machine Learning',
                    gradeSemester1: 16.2,
                    gradeSemester2: 17.0,
                    institution: 'Tech University'
                },
                {
                    recordId: 202,
                    candidateId: 101,
                    academicYear: '2022-2023',
                    programType: 'Master',
                    curriculumYear: '2',
                    specialization: 'Computer Engineering',
                    coursePath: 'Systems Design',
                    gradeSemester1: 15.3,
                    gradeSemester2: 14.8,
                    institution: 'Engineering School'
                }
            ];

            const mockCandidateScores: CandidateScore[] = [
                {
                    scoreId: 301,
                    candidateId: 100,
                    scoreLabel: 'Overall GPA',
                    scoreValue: '16.6'
                },
                {
                    scoreId: 302,
                    candidateId: 101,
                    scoreLabel: 'Overall GPA',
                    scoreValue: '15.1'
                }
            ];


            mockPoolQuery
                .mockResolvedValueOnce({ rows: mockCandidates })
                .mockResolvedValueOnce({ rows: mockAcademicRecords })
                .mockResolvedValueOnce({ rows: mockCandidateScores });

            const monmasterFileId = 123;
            const result = await model.getNormalizedDataByFileId(monmasterFileId);


            expect(mockPoolQuery).toHaveBeenNthCalledWith(
                1,
                expect.stringContaining('SELECT * FROM "NormalizedCandidates" WHERE "monmasterFileId" = $1'),
                [monmasterFileId]
            );


            expect(mockPoolQuery).toHaveBeenNthCalledWith(
                2,
                expect.stringContaining('SELECT * FROM "AcademicRecords" WHERE "candidateId" = ANY($1)'),
                [[100, 101]]
            );


            expect(mockPoolQuery).toHaveBeenNthCalledWith(
                3,
                expect.stringContaining('SELECT * FROM "CandidateScores" WHERE "candidateId" = ANY($1)'),
                [[100, 101]]
            );


            expect(result).not.toBeNull();
            expect(result).toEqual({
                candidates: mockCandidates,
                academicRecords: mockAcademicRecords,
                candidateScores: mockCandidateScores
            });
        });

        it('should return null when no candidates are found', async () => {

            mockPoolQuery.mockResolvedValueOnce({ rows: [] });

            const monmasterFileId = 456;
            const result = await model.getNormalizedDataByFileId(monmasterFileId);


            expect(mockPoolQuery).toHaveBeenCalledWith(
                expect.stringContaining('SELECT * FROM "NormalizedCandidates" WHERE "monmasterFileId" = $1'),
                [monmasterFileId]
            );


            expect(mockPoolQuery).toHaveBeenCalledTimes(1);


            expect(result).toBeNull();
        });

        it('should return null when an error occurs', async () => {

            mockPoolQuery.mockImplementationOnce(() => {
                throw new Error('Database query failed');
            });


            const originalConsoleError = console.error;
            console.error = jest.fn();

            const monmasterFileId = 789;
            const result = await model.getNormalizedDataByFileId(monmasterFileId);


            expect(mockPoolQuery).toHaveBeenCalledWith(
                expect.stringContaining('SELECT * FROM "NormalizedCandidates" WHERE "monmasterFileId" = $1'),
                [monmasterFileId]
            );


            expect(console.error).toHaveBeenCalled();


            expect(result).toBeNull();


            console.error = originalConsoleError;
        });
    });

    describe('getCandidateById', () => {
        it('should return candidate data when candidate exists', async () => {

            const mockCandidate: NormalizedCandidate = {
                candidateId: 100,
                monmasterFileId: 123,
                lastName: 'Johnson',
                firstName: 'Emma',
                fullName: 'Johnson Emma',
                candidateNumber: 'C76543',
                dateOfBirth: '10/12/1994',
                processedDate: new Date('2023-02-20')
            };


            const mockAcademicRecords: AcademicRecord[] = [
                {
                    recordId: 210,
                    candidateId: 100,
                    academicYear: '2022-2023',
                    programType: 'Master',
                    curriculumYear: '1',
                    specialization: 'Biology',
                    coursePath: 'Marine Biology',
                    gradeSemester1: 15.4,
                    gradeSemester2: 16.1,
                    institution: 'Science University'
                }
            ];


            const mockCandidateScores: CandidateScore[] = [
                {
                    scoreId: 310,
                    candidateId: 100,
                    scoreLabel: 'GPA',
                    scoreValue: '15.75'
                }
            ];


            mockPoolQuery
                .mockResolvedValueOnce({ rows: [mockCandidate] })
                .mockResolvedValueOnce({ rows: mockAcademicRecords })
                .mockResolvedValueOnce({ rows: mockCandidateScores });

            const candidateId = 100;
            const result = await model.getCandidateById(candidateId);


            expect(mockPoolQuery).toHaveBeenNthCalledWith(
                1,
                expect.stringContaining('SELECT * FROM "NormalizedCandidates" WHERE "candidateId" = $1'),
                [candidateId]
            );


            expect(mockPoolQuery).toHaveBeenNthCalledWith(
                2,
                expect.stringContaining('SELECT * FROM "AcademicRecords" WHERE "candidateId" = $1'),
                [candidateId]
            );


            expect(mockPoolQuery).toHaveBeenNthCalledWith(
                3,
                expect.stringContaining('SELECT * FROM "CandidateScores" WHERE "candidateId" = $1'),
                [candidateId]
            );


            expect(result).not.toBeNull();
            expect(result).toEqual({
                candidate: mockCandidate,
                academicRecords: mockAcademicRecords,
                scores: mockCandidateScores
            });
        });

        it('should return null when candidate does not exist', async () => {

            mockPoolQuery.mockResolvedValueOnce({ rows: [] });

            const candidateId = 999;
            const result = await model.getCandidateById(candidateId);


            expect(mockPoolQuery).toHaveBeenCalledWith(
                expect.stringContaining('SELECT * FROM "NormalizedCandidates" WHERE "candidateId" = $1'),
                [candidateId]
            );


            expect(mockPoolQuery).toHaveBeenCalledTimes(1);


            expect(result).toBeNull();
        });

        it('should return null when an error occurs', async () => {

            mockPoolQuery.mockImplementationOnce(() => {
                throw new Error('Database error');
            });


            const originalConsoleError = console.error;
            console.error = jest.fn();

            const candidateId = 100;
            const result = await model.getCandidateById(candidateId);


            expect(mockPoolQuery).toHaveBeenCalledWith(
                expect.stringContaining('SELECT * FROM "NormalizedCandidates" WHERE "candidateId" = $1'),
                [candidateId]
            );


            expect(console.error).toHaveBeenCalled();


            expect(result).toBeNull();


            console.error = originalConsoleError;
        });
    });

    describe('searchCandidates', () => {

        const mockCandidates: NormalizedCandidate[] = [
            {
                candidateId: 101,
                monmasterFileId: 123,
                lastName: 'Smith',
                firstName: 'John',
                fullName: 'Smith John',
                candidateNumber: 'C12345',
                dateOfBirth: '15/03/1992'
            },
            {
                candidateId: 102,
                monmasterFileId: 123,
                lastName: 'Smith',
                firstName: 'Jane',
                fullName: 'Smith Jane',
                candidateNumber: 'C67890',
                dateOfBirth: '22/07/1993'
            },
            {
                candidateId: 103,
                monmasterFileId: 456,
                lastName: 'Wilson',
                firstName: 'John',
                fullName: 'Wilson John',
                candidateNumber: 'C24680',
                dateOfBirth: '10/11/1990'
            }
        ];

        beforeEach(() => {

            mockPoolQuery.mockReset();
        });

        it('should search candidates by first name', async () => {

            const filteredResults = mockCandidates.filter(c =>
                c.firstName.toLowerCase().includes('john'.toLowerCase())
            );

            mockPoolQuery.mockResolvedValueOnce({ rows: filteredResults });

            const result = await model.searchCandidates({ firstName: 'john' });


            expect(mockPoolQuery).toHaveBeenCalledWith(
                expect.stringContaining('WHERE "firstName" ILIKE $1'),
                ['%john%']
            );


            expect(result).toEqual(filteredResults);
            expect(result.length).toBe(2);
            expect(result.every(c => c.firstName.toLowerCase().includes('john'.toLowerCase()))).toBe(true);
        });

        it('should search candidates by last name', async () => {

            const filteredResults = mockCandidates.filter(c =>
                c.lastName.toLowerCase().includes('smith'.toLowerCase())
            );

            mockPoolQuery.mockResolvedValueOnce({ rows: filteredResults });

            const result = await model.searchCandidates({ lastName: 'smith' });


            expect(mockPoolQuery).toHaveBeenCalledWith(
                expect.stringContaining('WHERE "lastName" ILIKE $1'),
                ['%smith%']
            );


            expect(result).toEqual(filteredResults);
            expect(result.length).toBe(2);
            expect(result.every(c => c.lastName.toLowerCase().includes('smith'.toLowerCase()))).toBe(true);
        });

        it('should search candidates by candidate number', async () => {

            const filteredResults = mockCandidates.filter(c =>
                c.candidateNumber.includes('C123')
            );

            mockPoolQuery.mockResolvedValueOnce({ rows: filteredResults });

            const result = await model.searchCandidates({ candidateNumber: 'C123' });


            expect(mockPoolQuery).toHaveBeenCalledWith(
                expect.stringContaining('WHERE "candidateNumber" ILIKE $1'),
                ['%C123%']
            );


            expect(result).toEqual(filteredResults);
        });

        it('should search candidates by monmasterFileId', async () => {

            const filteredResults = mockCandidates.filter(c => c.monmasterFileId === 123);

            mockPoolQuery.mockResolvedValueOnce({ rows: filteredResults });

            const result = await model.searchCandidates({ monmasterFileId: 123 });


            expect(mockPoolQuery).toHaveBeenCalledWith(
                expect.stringContaining('WHERE "monmasterFileId" = $1'),
                [123]
            );


            expect(result).toEqual(filteredResults);
            expect(result.length).toBe(2);
            expect(result.every(c => c.monmasterFileId === 123)).toBe(true);
        });

        it('should search candidates with multiple parameters', async () => {

            const filteredResults = mockCandidates.filter(c =>
                c.firstName.toLowerCase().includes('john'.toLowerCase()) &&
                c.lastName.toLowerCase().includes('smith'.toLowerCase())
            );

            mockPoolQuery.mockResolvedValueOnce({ rows: filteredResults });

            const result = await model.searchCandidates({
                firstName: 'john',
                lastName: 'smith'
            });


            expect(mockPoolQuery).toHaveBeenCalledWith(
                expect.stringContaining('WHERE "firstName" ILIKE $1 AND "lastName" ILIKE $2'),
                ['%john%', '%smith%']
            );


            expect(result).toEqual(filteredResults);
            expect(result.length).toBe(1);
            expect(result[0].firstName).toBe('John');
            expect(result[0].lastName).toBe('Smith');
        });

        it('should return all candidates when no search parameters are provided', async () => {
            mockPoolQuery.mockResolvedValueOnce({ rows: mockCandidates });

            const result = await model.searchCandidates({});


            expect(mockPoolQuery).toHaveBeenCalledWith(
                expect.not.stringContaining('WHERE'),
                []
            );


            expect(result).toEqual(mockCandidates);
            expect(result.length).toBe(mockCandidates.length);
        });

        it('should return an empty array when an error occurs', async () => {
            mockPoolQuery.mockImplementationOnce(() => {
                throw new Error('Database error');
            });


            const originalConsoleError = console.error;
            console.error = jest.fn();

            const result = await model.searchCandidates({ firstName: 'error' });


            expect(console.error).toHaveBeenCalled();


            expect(result).toEqual([]);


            console.error = originalConsoleError;
        });
    });

    describe('deleteNormalizedData', () => {
        beforeEach(() => {

            mockQuery.mockReset();
            mockQuery.mockResolvedValue({ rows: [] });
        });

        it('should successfully delete normalized data', async () => {

            mockQuery.mockResolvedValue({ rowCount: 5 });

            const monmasterFileId = 123;
            const result = await model.deleteNormalizedData(monmasterFileId);


            expect(mockQuery).toHaveBeenCalledWith('BEGIN');


            expect(mockQuery).toHaveBeenCalledWith(
                expect.stringContaining('DELETE FROM "NormalizedCandidates" WHERE "monmasterFileId" = $1'),
                [monmasterFileId]
            );


            expect(mockQuery).toHaveBeenCalledWith('COMMIT');


            expect(mockRelease).toHaveBeenCalled();


            expect(result).toBe(true);
        });

        it('should rollback transaction and return false on error', async () => {

            mockQuery
                .mockResolvedValueOnce({})
                .mockImplementationOnce(() => {
                    throw new Error('Database error during deletion');
                });

            const monmasterFileId = 123;
            const result = await model.deleteNormalizedData(monmasterFileId);


            expect(mockQuery).toHaveBeenCalledWith('BEGIN');


            expect(mockQuery).toHaveBeenCalledWith(
                expect.stringContaining('DELETE FROM "NormalizedCandidates" WHERE "monmasterFileId" = $1'),
                [monmasterFileId]
            );


            expect(mockQuery).toHaveBeenCalledWith('ROLLBACK');


            expect(mockRelease).toHaveBeenCalled();


            expect(result).toBe(false);
        });

        it('should handle case where no records exist to delete', async () => {

            mockQuery.mockImplementation((query) => {
                if (query.includes('DELETE')) {
                    return Promise.resolve({ rowCount: 0 });
                }
                return Promise.resolve({});
            });

            const monmasterFileId = 999;
            const result = await model.deleteNormalizedData(monmasterFileId);


            expect(mockQuery).toHaveBeenCalledWith('BEGIN');
            expect(mockQuery).toHaveBeenCalledWith('COMMIT');


            expect(mockRelease).toHaveBeenCalled();



            expect(result).toBe(true);
        });
    });

    describe('prepareDataForInsertion', () => {
        it('should assign temporary IDs and link records correctly', () => {

            model.prepareDataForInsertionWithRowIndex = jest.fn().mockImplementation(
                (
                    candidates: Omit<NormalizedCandidate, 'candidateId'>[],
                    academicRecordsWithRowIndex: { record: Omit<AcademicRecord, 'recordId' | 'candidateId'>, rowIndex: number }[],
                    candidateScoresWithRowIndex: { score: Omit<CandidateScore, 'scoreId' | 'candidateId'>, rowIndex: number }[]
                ) => {


                    const candidatesWithIds = candidates.map((candidate: Omit<NormalizedCandidate, 'candidateId'>, index: number) => ({
                        ...candidate,
                        candidateId: -(index + 1)
                    }));


                    const academicRecords = academicRecordsWithRowIndex.map(
                        ({ record }: { record: Omit<AcademicRecord, 'recordId' | 'candidateId'> }, index: number) => {

                            const candidateIndex = Math.min(index, candidatesWithIds.length - 1);
                            return {
                                ...record,
                                candidateId: candidatesWithIds[candidateIndex].candidateId
                            };
                        }
                    );


                    const candidateScores = candidateScoresWithRowIndex.map(
                        ({ score }: { score: Omit<CandidateScore, 'scoreId' | 'candidateId'> }, index: number) => {

                            const candidateIndex = Math.min(index, candidatesWithIds.length - 1);
                            return {
                                ...score,
                                candidateId: candidatesWithIds[candidateIndex].candidateId
                            };
                        }
                    );

                    return {
                        candidates: candidatesWithIds,
                        academicRecords,
                        candidateScores
                    };
                }
            );

            const rawCandidates = [
                {
                    monmasterFileId: 123,
                    lastName: 'Johnson',
                    firstName: 'Eric',
                    fullName: 'Johnson Eric',
                    candidateNumber: 'C11111',
                    dateOfBirth: '05/06/1995'
                },
                {
                    monmasterFileId: 123,
                    lastName: 'Williams',
                    firstName: 'Sarah',
                    fullName: 'Williams Sarah',
                    candidateNumber: 'C22222',
                    dateOfBirth: '12/03/1994'
                }
            ];


            const rawAcademicRecords = [
                {
                    academicYear: '2022-2023',
                    programType: 'Master',
                    curriculumYear: '1',
                    specialization: 'Physics',
                    coursePath: 'Quantum Physics',
                    gradeSemester1: 16.8,
                    gradeSemester2: 17.2,
                    institution: 'Physics Institute'
                },
                {
                    academicYear: '2022-2023',
                    programType: 'Master',
                    curriculumYear: '1',
                    specialization: 'Mathematics',
                    coursePath: 'Applied Mathematics',
                    gradeSemester1: 15.7,
                    gradeSemester2: 16.5,
                    institution: 'Math Academy'
                }
            ];


            const rawCandidateScores = [
                {
                    scoreLabel: 'Overall GPA',
                    scoreValue: '17.0'
                },
                {
                    scoreLabel: 'Overall GPA',
                    scoreValue: '16.1'
                }
            ];


            const result = model.prepareDataForInsertion(
                rawCandidates,
                rawAcademicRecords,
                rawCandidateScores
            );


            expect(result.candidates[0].candidateId).toBe(-1);
            expect(result.candidates[1].candidateId).toBe(-2);


            expect(result.academicRecords[0].candidateId).toBe(-1);
            expect(result.academicRecords[1].candidateId).toBe(-2);


            expect(result.candidateScores[0].candidateId).toBe(-1);
            expect(result.candidateScores[1].candidateId).toBe(-2);


            expect(result.candidates[0].firstName).toBe('Eric');
            expect(result.candidates[1].lastName).toBe('Williams');
            expect(result.academicRecords[0].specialization).toBe('Physics');
            expect(result.academicRecords[1].gradeSemester1).toBe(15.7);
            expect(result.candidateScores[0].scoreValue).toBe('17.0');
        });

        it('should gracefully handle empty arrays', () => {
            const result = model.prepareDataForInsertion([], [], []);

            expect(result.candidates).toEqual([]);
            expect(result.academicRecords).toEqual([]);
            expect(result.candidateScores).toEqual([]);
        });

        it('should handle uneven distribution of data', () => {

            const rawCandidates = [
                {
                    monmasterFileId: 123,
                    lastName: 'Johnson',
                    firstName: 'Eric',
                    fullName: 'Johnson Eric',
                    candidateNumber: 'C11111',
                    dateOfBirth: '05/06/1995'
                }
            ];


            const rawAcademicRecords = [
                {
                    academicYear: '2020-2021',
                    programType: 'Bachelor',
                    curriculumYear: '3',
                    specialization: 'Physics',
                    coursePath: 'General Physics',
                    gradeSemester1: 14.5,
                    gradeSemester2: 15.2,
                    institution: 'Physics Institute'
                },
                {
                    academicYear: '2021-2022',
                    programType: 'Master',
                    curriculumYear: '1',
                    specialization: 'Physics',
                    coursePath: 'Quantum Physics',
                    gradeSemester1: 16.8,
                    gradeSemester2: 17.2,
                    institution: 'Physics Institute'
                },
                {
                    academicYear: '2022-2023',
                    programType: 'Master',
                    curriculumYear: '2',
                    specialization: 'Physics',
                    coursePath: 'Theoretical Physics',
                    gradeSemester1: 17.5,
                    gradeSemester2: 18.0,
                    institution: 'Physics Institute'
                }
            ];


            const rawCandidateScores = [
                {
                    scoreLabel: 'Bachelor GPA',
                    scoreValue: '14.85'
                },
                {
                    scoreLabel: 'Master GPA',
                    scoreValue: '17.38'
                }
            ];


            const result = model.prepareDataForInsertion(
                rawCandidates,
                rawAcademicRecords,
                rawCandidateScores
            );


            expect(result.candidates[0].candidateId).toBe(-1);


            expect(result.academicRecords[0].candidateId).toBe(-1);
            expect(result.academicRecords[1].candidateId).toBe(-1);
            expect(result.academicRecords[2].candidateId).toBe(-1);


            expect(result.candidateScores[0].candidateId).toBe(-1);
            expect(result.candidateScores[1].candidateId).toBe(-1);
        });

        it('should handle more candidates than records', () => {

            const rawCandidates = [
                {
                    monmasterFileId: 123,
                    lastName: 'Johnson',
                    firstName: 'Eric',
                    fullName: 'Johnson Eric',
                    candidateNumber: 'C11111',
                    dateOfBirth: '05/06/1995'
                },
                {
                    monmasterFileId: 123,
                    lastName: 'Williams',
                    firstName: 'Sarah',
                    fullName: 'Williams Sarah',
                    candidateNumber: 'C22222',
                    dateOfBirth: '12/03/1994'
                },
                {
                    monmasterFileId: 123,
                    lastName: 'Brown',
                    firstName: 'Michael',
                    fullName: 'Brown Michael',
                    candidateNumber: 'C33333',
                    dateOfBirth: '22/11/1993'
                }
            ];


            const rawAcademicRecords = [
                {
                    academicYear: '2022-2023',
                    programType: 'Master',
                    curriculumYear: '1',
                    specialization: 'Computer Science',
                    coursePath: 'Data Science',
                    gradeSemester1: 16.0,
                    gradeSemester2: 17.0,
                    institution: 'Tech University'
                }
            ];


            const rawCandidateScores = [
                {
                    scoreLabel: 'Overall GPA',
                    scoreValue: '16.5'
                }
            ];

            const result = model.prepareDataForInsertion(
                rawCandidates,
                rawAcademicRecords,
                rawCandidateScores
            );


            expect(result.candidates[0].candidateId).toBe(-1);
            expect(result.candidates[1].candidateId).toBe(-2);
            expect(result.candidates[2].candidateId).toBe(-3);


            expect(result.academicRecords[0].candidateId).toBe(-1);


            expect(result.candidateScores[0].candidateId).toBe(-1);


            expect(result.candidates.length).toBe(3);
            expect(result.academicRecords.length).toBe(1);
            expect(result.candidateScores.length).toBe(1);
        });
    });
});
