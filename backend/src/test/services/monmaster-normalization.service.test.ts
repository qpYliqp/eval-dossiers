import { MonMasterNormalizationService } from '../../services/monmaster-normalization.service';
import { MonMasterNormalizationModel } from '../../models/monmaster-normalization.model';
import { FileModel } from '../../models/file.model';
import * as XLSX from 'xlsx';
import { FileOrigin } from '../../types/file.types';
import { MonMasterNormalizationError } from '../../types/monmaster-normalization.types';


jest.mock('../../models/monmaster-normalization.model');
jest.mock('../../models/file.model');
jest.mock('xlsx');


jest.mock('fs', () => ({
    readFile: jest.fn()
}));


jest.mock('util', () => ({
    ...jest.requireActual('util'),
    promisify: jest.fn((fn) => {

        return jest.fn().mockResolvedValue(Buffer.from('mock xlsx content'));
    })
}));

describe('MonMasterNormalizationService', () => {
    let service: MonMasterNormalizationService;
    let mockMonMasterNormalizationModel: jest.Mocked<MonMasterNormalizationModel>;

    beforeEach(() => {

        jest.clearAllMocks();


        mockMonMasterNormalizationModel = new MonMasterNormalizationModel() as jest.Mocked<MonMasterNormalizationModel>;


        service = new MonMasterNormalizationService();
        (service as any).model = mockMonMasterNormalizationModel;
    });

    describe('processMonMasterFile', () => {
        const fileId = 123;
        const mockFilePath = '/path/to/monmaster/file.xlsx';

        const mockWorkbook = {
            SheetNames: ['Sheet1'],
            Sheets: {
                Sheet1: {}
            }
        };

        const mockRawData = [
            {
                'Nom de naissance': 'Smith',
                'Prénom': 'John',
                'Numéro de candidat': 'C12345',
                'Date de naissance': '15/05/1990',
                'Année universitaire': '2022-2023',
                'Type de formation ou de diplôme préparé': 'Master',
                'Année dans le cursus': '1',
                'Mention ou spécialité': 'Computer Science',
                'Parcours': 'Software Engineering',
                'Moyenne au premier semestre': 15.5,
                'Moyenne au second semestre': 16.2,
                'Établissement': 'Test University',
                'Moyenne générale': 15.85
            }
        ];

        const mockNormalizedData = {
            candidates: [
                {
                    candidateId: -1,
                    monmasterFileId: fileId,
                    lastName: 'Smith',
                    firstName: 'John',
                    candidateNumber: 'C12345',
                    dateOfBirth: '15/05/1990'
                }
            ],
            academicRecords: [
                {
                    candidateId: -1,
                    academicYear: '2022-2023',
                    programType: 'Master',
                    curriculumYear: '1',
                    specialization: 'Computer Science',
                    coursePath: 'Software Engineering',
                    gradeSemester1: 15.5,
                    gradeSemester2: 16.2,
                    institution: 'Test University'
                }
            ],
            candidateScores: [
                {
                    candidateId: -1,
                    scoreLabel: 'Moyenne générale',
                    scoreValue: '15.85'
                }
            ]
        };

        it('devrait traiter un fichier MonMaster avec succès', async () => {

            mockMonMasterNormalizationModel.isFileAlreadyNormalized = jest.fn().mockResolvedValue(false);
            mockMonMasterNormalizationModel.saveNormalizedData = jest.fn().mockResolvedValue(true);
            mockMonMasterNormalizationModel.prepareDataForInsertionWithRowIndex = jest.fn().mockReturnValue(mockNormalizedData);

            (FileModel.getFileById as jest.Mock).mockResolvedValue({
                fileId,
                filePath: mockFilePath,
                fileOrigin: FileOrigin.MonMaster
            });

            (XLSX.read as jest.Mock).mockReturnValue(mockWorkbook);
            (XLSX.utils.sheet_to_json as jest.Mock).mockReturnValue(mockRawData);


            const result = await service.processMonMasterFile(fileId);


            expect(mockMonMasterNormalizationModel.isFileAlreadyNormalized).toHaveBeenCalledWith(fileId);
            expect(FileModel.getFileById).toHaveBeenCalledWith(fileId);
            expect(XLSX.read).toHaveBeenCalled();
            expect(XLSX.utils.sheet_to_json).toHaveBeenCalled();
            expect(mockMonMasterNormalizationModel.prepareDataForInsertionWithRowIndex).toHaveBeenCalled();
            expect(mockMonMasterNormalizationModel.saveNormalizedData).toHaveBeenCalledWith(
                fileId,
                mockNormalizedData.candidates,
                mockNormalizedData.academicRecords,
                mockNormalizedData.candidateScores
            );
            expect(result).toEqual({
                fileId,
                normalizedData: mockNormalizedData
            });
        });

        it('devrait retourner la structure de résultat attendue', async () => {

            mockMonMasterNormalizationModel.isFileAlreadyNormalized = jest.fn().mockResolvedValue(false);
            mockMonMasterNormalizationModel.saveNormalizedData = jest.fn().mockResolvedValue(true);
            mockMonMasterNormalizationModel.prepareDataForInsertionWithRowIndex = jest.fn().mockReturnValue(mockNormalizedData);

            (FileModel.getFileById as jest.Mock).mockResolvedValue({
                fileId,
                filePath: mockFilePath,
                fileOrigin: FileOrigin.MonMaster
            });

            (XLSX.read as jest.Mock).mockReturnValue(mockWorkbook);
            (XLSX.utils.sheet_to_json as jest.Mock).mockReturnValue(mockRawData);


            const result = await service.processMonMasterFile(fileId);


            expect(result).toBeDefined();
            expect(result).toEqual({
                fileId: fileId,
                normalizedData: mockNormalizedData
            });
            expect(result?.fileId).toBe(fileId);
            expect(result?.normalizedData).toBe(mockNormalizedData);
            expect(result?.normalizedData.candidates).toHaveLength(1);
            expect(result?.normalizedData.academicRecords).toHaveLength(1);
            expect(result?.normalizedData.candidateScores).toHaveLength(1);
        });

        it('devrait lancer une erreur si le fichier est déjà normalisé', async () => {

            mockMonMasterNormalizationModel.isFileAlreadyNormalized = jest.fn().mockResolvedValue(true);


            await expect(service.processMonMasterFile(fileId)).rejects.toThrow(
                MonMasterNormalizationError.ALREADY_NORMALIZED
            );
            expect(mockMonMasterNormalizationModel.isFileAlreadyNormalized).toHaveBeenCalledWith(fileId);
        });

        it('devrait lancer une erreur si le fichier n\'est pas trouvé', async () => {

            mockMonMasterNormalizationModel.isFileAlreadyNormalized = jest.fn().mockResolvedValue(false);
            (FileModel.getFileById as jest.Mock).mockResolvedValue(null);


            await expect(service.processMonMasterFile(fileId)).rejects.toThrow(
                MonMasterNormalizationError.FILE_NOT_FOUND
            );
            expect(mockMonMasterNormalizationModel.isFileAlreadyNormalized).toHaveBeenCalledWith(fileId);
            expect(FileModel.getFileById).toHaveBeenCalledWith(fileId);
        });

        it('devrait lancer une erreur si le fichier n\'est pas un fichier MonMaster', async () => {

            mockMonMasterNormalizationModel.isFileAlreadyNormalized = jest.fn().mockResolvedValue(false);
            (FileModel.getFileById as jest.Mock).mockResolvedValue({
                fileId,
                filePath: mockFilePath,
                fileOrigin: 'CV'
            });


            await expect(service.processMonMasterFile(fileId)).rejects.toThrow(
                MonMasterNormalizationError.INVALID_FILE_TYPE
            );
        });

        it('devrait lancer une erreur si la lecture du fichier XLSX échoue', async () => {

            mockMonMasterNormalizationModel.isFileAlreadyNormalized = jest.fn().mockResolvedValue(false);
            (FileModel.getFileById as jest.Mock).mockResolvedValue({
                fileId,
                filePath: mockFilePath,
                fileOrigin: FileOrigin.MonMaster
            });
            (XLSX.read as jest.Mock).mockImplementation(() => {
                throw new Error('Failed to read XLSX file');
            });


            await expect(service.processMonMasterFile(fileId)).rejects.toThrow(
                MonMasterNormalizationError.PROCESSING_ERROR
            );
        });

        it('devrait lancer une erreur lorsque la lecture du fichier XLSX échoue', async () => {

            mockMonMasterNormalizationModel.isFileAlreadyNormalized = jest.fn().mockResolvedValue(false);

            (FileModel.getFileById as jest.Mock).mockResolvedValue({
                fileId,
                filePath: mockFilePath,
                fileOrigin: FileOrigin.MonMaster
            });


            const fsModule = require('fs');
            const utilModule = require('util');
            (utilModule.promisify as jest.Mock).mockReturnValue(jest.fn().mockRejectedValue(new Error('Failed to read file')));


            await expect(service.processMonMasterFile(fileId)).rejects.toThrow(
                MonMasterNormalizationError.PROCESSING_ERROR
            );


            jest.restoreAllMocks();
        });

        it('devrait lancer une erreur si le fichier XLSX n\'a pas de données', async () => {

            mockMonMasterNormalizationModel.isFileAlreadyNormalized = jest.fn().mockResolvedValue(false);
            (FileModel.getFileById as jest.Mock).mockResolvedValue({
                fileId,
                filePath: mockFilePath,
                fileOrigin: FileOrigin.MonMaster
            });
            (XLSX.read as jest.Mock).mockReturnValue(mockWorkbook);
            (XLSX.utils.sheet_to_json as jest.Mock).mockReturnValue([]);


            await expect(service.processMonMasterFile(fileId)).rejects.toThrow(
                MonMasterNormalizationError.PROCESSING_ERROR
            );
        });

        it('devrait lancer une erreur si l\'enregistrement des données normalisées échoue', async () => {

            mockMonMasterNormalizationModel.isFileAlreadyNormalized = jest.fn().mockResolvedValue(false);
            mockMonMasterNormalizationModel.prepareDataForInsertionWithRowIndex = jest.fn().mockReturnValue(mockNormalizedData);
            mockMonMasterNormalizationModel.saveNormalizedData = jest.fn().mockResolvedValue(false);

            (FileModel.getFileById as jest.Mock).mockResolvedValue({
                fileId,
                filePath: mockFilePath,
                fileOrigin: FileOrigin.MonMaster
            });
            (XLSX.read as jest.Mock).mockReturnValue(mockWorkbook);
            (XLSX.utils.sheet_to_json as jest.Mock).mockReturnValue(mockRawData);


            await expect(service.processMonMasterFile(fileId)).rejects.toThrow(
                MonMasterNormalizationError.PROCESSING_ERROR
            );
            expect(mockMonMasterNormalizationModel.saveNormalizedData).toHaveBeenCalled();
        });

        it('devrait gérer les erreurs inattendues pendant la normalisation', async () => {

            mockMonMasterNormalizationModel.isFileAlreadyNormalized = jest.fn().mockResolvedValue(false);
            (FileModel.getFileById as jest.Mock).mockResolvedValue({
                fileId,
                filePath: mockFilePath,
                fileOrigin: FileOrigin.MonMaster
            });
            (XLSX.read as jest.Mock).mockReturnValue(mockWorkbook);
            (XLSX.utils.sheet_to_json as jest.Mock).mockReturnValue(mockRawData);


            jest.spyOn(service as any, 'normalizeMonMasterData').mockImplementation(() => {
                throw new Error(MonMasterNormalizationError.PROCESSING_ERROR);
            });


            await expect(service.processMonMasterFile(fileId)).rejects.toThrow(
                MonMasterNormalizationError.PROCESSING_ERROR
            );
        });
    });

    describe('getNormalizedDataByFileId', () => {
        it('devrait retourner les données normalisées pour un fichier', async () => {
            const fileId = 123;
            const mockData = {
                candidates: [{ candidateId: 1, firstName: 'John', lastName: 'Doe' }],
                academicRecords: [{ recordId: 1, candidateId: 1 }],
                candidateScores: [{ scoreId: 1, candidateId: 1 }]
            };

            mockMonMasterNormalizationModel.getNormalizedDataByFileId = jest.fn().mockResolvedValue(mockData);

            const result = await service.getNormalizedDataByFileId(fileId);

            expect(mockMonMasterNormalizationModel.getNormalizedDataByFileId).toHaveBeenCalledWith(fileId);
            expect(result).toEqual(mockData);
        });

        it('devrait retourner null quand aucune donnée n\'est trouvée', async () => {
            const fileId = 456;
            mockMonMasterNormalizationModel.getNormalizedDataByFileId = jest.fn().mockResolvedValue(null);

            const result = await service.getNormalizedDataByFileId(fileId);

            expect(mockMonMasterNormalizationModel.getNormalizedDataByFileId).toHaveBeenCalledWith(fileId);
            expect(result).toBeNull();
        });
    });

    describe('deleteNormalizedDataByFileId', () => {
        it('devrait supprimer les données normalisées pour un fichier', async () => {
            const fileId = 123;
            mockMonMasterNormalizationModel.isFileAlreadyNormalized = jest.fn().mockResolvedValue(true);
            mockMonMasterNormalizationModel.deleteNormalizedData = jest.fn().mockResolvedValue(true);

            const result = await service.deleteNormalizedDataByFileId(fileId);

            expect(mockMonMasterNormalizationModel.isFileAlreadyNormalized).toHaveBeenCalledWith(fileId);
            expect(mockMonMasterNormalizationModel.deleteNormalizedData).toHaveBeenCalledWith(fileId);
            expect(result).toBe(true);
        });

        it('devrait retourner false si le fichier n\'est pas normalisé', async () => {
            const fileId = 456;
            mockMonMasterNormalizationModel.isFileAlreadyNormalized = jest.fn().mockResolvedValue(false);

            const result = await service.deleteNormalizedDataByFileId(fileId);

            expect(mockMonMasterNormalizationModel.isFileAlreadyNormalized).toHaveBeenCalledWith(fileId);
            expect(mockMonMasterNormalizationModel.deleteNormalizedData).not.toHaveBeenCalled();
            expect(result).toBe(false);
        });

        it('devrait retourner false si la suppression échoue', async () => {
            const fileId = 789;
            mockMonMasterNormalizationModel.isFileAlreadyNormalized = jest.fn().mockResolvedValue(true);
            mockMonMasterNormalizationModel.deleteNormalizedData = jest.fn().mockResolvedValue(false);

            const result = await service.deleteNormalizedDataByFileId(fileId);

            expect(mockMonMasterNormalizationModel.deleteNormalizedData).toHaveBeenCalledWith(fileId);
            expect(result).toBe(false);
        });

        it('devrait retourner false si une erreur survient', async () => {
            const fileId = 789;
            mockMonMasterNormalizationModel.isFileAlreadyNormalized = jest.fn().mockImplementation(() => {
                throw new Error('Database error');
            });

            const result = await service.deleteNormalizedDataByFileId(fileId);

            expect(result).toBe(false);
        });
    });

    describe('searchCandidates', () => {
        it('devrait rechercher des candidats avec les critères fournis', async () => {
            const searchParams = { firstName: 'John', lastName: 'Doe' };
            const mockCandidates = [
                { candidateId: 1, firstName: 'John', lastName: 'Doe' }
            ];

            mockMonMasterNormalizationModel.searchCandidates = jest.fn().mockResolvedValue(mockCandidates);

            const result = await service.searchCandidates(searchParams);

            expect(mockMonMasterNormalizationModel.searchCandidates).toHaveBeenCalledWith(searchParams);
            expect(result).toEqual(mockCandidates);
        });

        it('devrait retourner un tableau vide si la recherche génère une erreur', async () => {
            const searchParams = { firstName: 'Error' };
            mockMonMasterNormalizationModel.searchCandidates = jest.fn().mockImplementation(() => {
                throw new Error('Search error');
            });

            const result = await service.searchCandidates(searchParams);

            expect(mockMonMasterNormalizationModel.searchCandidates).toHaveBeenCalledWith(searchParams);
            expect(result).toEqual([]);
        });
    });

    describe('getCandidateById', () => {
        it('devrait récupérer les données d\'un candidat par ID', async () => {
            const candidateId = 1;
            const mockCandidateData = {
                candidate: { candidateId: 1, firstName: 'John', lastName: 'Doe' },
                academicRecords: [{ recordId: 1, candidateId: 1 }],
                scores: [{ scoreId: 1, candidateId: 1 }]
            };

            mockMonMasterNormalizationModel.getCandidateById = jest.fn().mockResolvedValue(mockCandidateData);

            const result = await service.getCandidateById(candidateId);

            expect(mockMonMasterNormalizationModel.getCandidateById).toHaveBeenCalledWith(candidateId);
            expect(result).toEqual(mockCandidateData);
        });

        it('devrait retourner null si le candidat n\'est pas trouvé', async () => {
            const candidateId = 999;
            mockMonMasterNormalizationModel.getCandidateById = jest.fn().mockResolvedValue(null);

            const result = await service.getCandidateById(candidateId);

            expect(mockMonMasterNormalizationModel.getCandidateById).toHaveBeenCalledWith(candidateId);
            expect(result).toBeNull();
        });

        it('devrait retourner null si une erreur survient', async () => {
            const candidateId = 1;
            mockMonMasterNormalizationModel.getCandidateById = jest.fn().mockImplementation(() => {
                throw new Error('Database error');
            });

            const result = await service.getCandidateById(candidateId);

            expect(mockMonMasterNormalizationModel.getCandidateById).toHaveBeenCalledWith(candidateId);
            expect(result).toBeNull();
        });

        it('devrait gérer des types d\'erreurs spécifiques lors de la récupération d\'un candidat par ID', async () => {
            const candidateId = 1;

            mockMonMasterNormalizationModel.getCandidateById = jest.fn().mockImplementation(() => {
                throw new TypeError('Invalid candidate ID type');
            });


            const consoleErrorSpy = jest.spyOn(console, 'error');

            const result = await service.getCandidateById(candidateId);


            expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Error getting candidate by ID:'));
            expect(result).toBeNull();


            consoleErrorSpy.mockRestore();
        });

        it('devrait gérer différentes instances d\'erreur lors de la récupération d\'un candidat par ID', async () => {
            const candidateId = 1;

            class CustomError extends Error {
                constructor() {
                    super('Custom database error');
                    this.name = 'CustomError';
                }
            }

            mockMonMasterNormalizationModel.getCandidateById = jest.fn().mockImplementation(() => {
                throw new CustomError();
            });


            const consoleErrorSpy = jest.spyOn(console, 'error');

            const result = await service.getCandidateById(candidateId);


            expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Error getting candidate by ID:'));
            expect(result).toBeNull();


            consoleErrorSpy.mockRestore();
        });
    });


    describe('readXlsxFile (private method)', () => {
        it('devrait lancer PROCESSING_ERROR quand la lecture du fichier échoue', async () => {

            const readXlsxFile = MonMasterNormalizationService.readXlsxFile;

            (XLSX.read as jest.Mock).mockImplementationOnce(() => {
                throw new Error('Failed to read XLSX file');
            });

            const consoleErrorSpy = jest.spyOn(console, 'error');

            await expect(readXlsxFile('/nonexistent/file.xlsx')).rejects.toThrow(
                MonMasterNormalizationError.PROCESSING_ERROR
            );

            expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Error reading XLSX file:'));

            consoleErrorSpy.mockRestore();
        });
    });
});
