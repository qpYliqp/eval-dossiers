import { PvNormalizationModel } from '../../models/pv-normalization.model';
import { NormalizedStudentData } from '../../types/pv-normalization.types';
import pool from '../../config/db';


jest.mock('../../config/db', () => ({
    connect: jest.fn(),
    query: jest.fn(),
}));

describe('PvNormalizationModel', () => {
    let model: PvNormalizationModel;
    const mockClient = {
        query: jest.fn(),
        release: jest.fn(),
    };


    const mockPvFileId = 1;
    const mockNormalizedData: NormalizedStudentData[] = [
        {
            name: 'John Doe',
            dateOfBirth: '1995-05-15',
            studentNumber: '12345678',
            semesterResults: [
                { semesterName: 'Fall 2020', grade: 8.5 },
                { semesterName: 'Spring 2021', grade: 9.0 },
            ],
        },
        {
            name: 'Jane Smith',
            dateOfBirth: '1996-03-20',
            studentNumber: '87654321',
            semesterResults: [
                { semesterName: 'Fall 2020', grade: 7.5 },
                { semesterName: 'Spring 2021', grade: 8.0 },
            ],
        },
    ];

    beforeEach(() => {
        jest.clearAllMocks();
        model = new PvNormalizationModel();
        (pool.connect as jest.Mock).mockResolvedValue(mockClient);
    });

    describe('saveNormalizedData', () => {
        it('devrait enregistrer les données normalisées avec succès', async () => {

            mockClient.query.mockImplementation((query: string) => {
                if (query.includes('INSERT INTO "NormalizedStudentData"')) {
                    return { rows: [{ studentDataId: 1 }] };
                }
                return { rows: [] };
            });

            const result = await model.saveNormalizedData(mockPvFileId, mockNormalizedData);

            expect(result).toBe(true);
            expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
            expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
            expect(mockClient.release).toHaveBeenCalled();

            expect(mockClient.query).toHaveBeenCalledTimes(8);
        });


        it('devrait annuler la transaction et retourner false en cas d\'erreur', async () => {

            mockClient.query.mockImplementationOnce(() => Promise.resolve())
                .mockImplementationOnce(() => Promise.reject(new Error('Database error')));

            const result = await model.saveNormalizedData(mockPvFileId, mockNormalizedData);

            expect(result).toBe(false);
            expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
            expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
            expect(mockClient.release).toHaveBeenCalled();
        });
    });

    describe('getNormalizedDataByPvFileId', () => {
        it('devrait récupérer les données normalisées avec succès', async () => {

            const mockStudentRows = [
                { studentDataId: 1, name: 'John Doe', dateOfBirth: '1995-05-15', studentNumber: '12345678' },
                { studentDataId: 2, name: 'Jane Smith', dateOfBirth: '1996-03-20', studentNumber: '87654321' }
            ];


            const mockResultsMap: { [key: number]: any[] } = {
                1: [
                    { semesterName: 'Fall 2020', grade: '8.5' },
                    { semesterName: 'Spring 2021', grade: '9.0' }
                ],
                2: [
                    { semesterName: 'Fall 2020', grade: '7.5' },
                    { semesterName: 'Spring 2021', grade: '8.0' }
                ]
            };

            (pool.query as jest.Mock).mockImplementation((query: string, params: any[]) => {
                if (query.includes('NormalizedStudentData')) {
                    return Promise.resolve({ rows: mockStudentRows });
                } else if (query.includes('SemesterResults')) {
                    const studentDataId = params[0];
                    return Promise.resolve({ rows: mockResultsMap[studentDataId] });
                }
                return Promise.resolve({ rows: [] });
            });

            const result = await model.getNormalizedDataByPvFileId(mockPvFileId);

            expect(result).toHaveLength(2);
            expect(result[0].name).toBe('John Doe');
            expect(result[0].semesterResults).toHaveLength(2);
            expect(result[0].semesterResults[0].grade).toBe(8.5);
            expect(result[1].name).toBe('Jane Smith');
        });

        it('devrait retourner un tableau vide en cas d\'erreur', async () => {
            (pool.query as jest.Mock).mockRejectedValue(new Error('Database error'));

            const result = await model.getNormalizedDataByPvFileId(mockPvFileId);

            expect(result).toEqual([]);
        });
    });

    describe('isFileAlreadyNormalized', () => {
        it('devrait retourner true si le fichier est déjà normalisé', async () => {
            (pool.query as jest.Mock).mockResolvedValue({ rows: [{ count: '5' }] });

            const result = await model.isFileAlreadyNormalized(mockPvFileId);

            expect(result).toBe(true);
        });

        it('devrait retourner false si le fichier n\'est pas normalisé', async () => {
            (pool.query as jest.Mock).mockResolvedValue({ rows: [{ count: '0' }] });

            const result = await model.isFileAlreadyNormalized(mockPvFileId);

            expect(result).toBe(false);
        });

        it('devrait retourner false en cas d\'erreur', async () => {
            (pool.query as jest.Mock).mockRejectedValue(new Error('Database error'));

            const result = await model.isFileAlreadyNormalized(mockPvFileId);

            expect(result).toBe(false);
        });
    });

    describe('deleteNormalizedData', () => {
        it('devrait supprimer les données normalisées avec succès', async () => {
            mockClient.query.mockResolvedValueOnce({})
                .mockResolvedValueOnce({})
                .mockResolvedValueOnce({});

            const result = await model.deleteNormalizedData(mockPvFileId);

            expect(result).toBe(true);
            expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
            expect(mockClient.query).toHaveBeenCalledWith(
                expect.stringContaining('DELETE FROM "NormalizedStudentData"'),
                [mockPvFileId]
            );
            expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
            expect(mockClient.release).toHaveBeenCalled();
        });

        it('devrait annuler et retourner false en cas d\'erreur', async () => {
            mockClient.query.mockResolvedValueOnce({})
                .mockRejectedValueOnce(new Error('Database error'));

            const result = await model.deleteNormalizedData(mockPvFileId);

            expect(result).toBe(false);
            expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
            expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
            expect(mockClient.release).toHaveBeenCalled();
        });
    });
});
