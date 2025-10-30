jest.mock('../../models/pv-normalization.model');
jest.mock('../../models/file.model');
jest.mock('../../plugins/normalizer-registry');
jest.mock('fs');


const mockReadFileAsync = jest.fn();
jest.mock('util', () => ({
    ...jest.requireActual('util'),

    promisify: jest.fn().mockReturnValue(mockReadFileAsync)
}));


import { PvNormalizationService } from '../../services/pv-normalization.service';
import { PvNormalizationModel } from '../../models/pv-normalization.model';
import { FileModel } from '../../models/file.model';
import { NormalizerRegistry } from '../../plugins/normalizer-registry';
import { NormalizationError, NormalizedStudentData } from '../../types/pv-normalization.types';
import fs from 'fs';
import { promisify } from 'util';

const mockFileId = 1;
const mockFilePath = '/path/to/file.xml';
const mockXmlContent = '<xml>test content</xml>';
const mockNormalizedData: NormalizedStudentData[] = [
    {
        name: 'John Doe',
        dateOfBirth: '1995-05-15',
        studentNumber: '12345678',
        semesterResults: [
            { semesterName: 'Fall 2020', grade: 8.5 }
        ]
    }
];

describe('PvNormalizationService', () => {
    let service: PvNormalizationService;
    let mockPvNormalizationModel: jest.Mocked<PvNormalizationModel>;

    beforeEach(() => {
        jest.clearAllMocks();
        mockPvNormalizationModel = new PvNormalizationModel() as jest.Mocked<PvNormalizationModel>;
        service = new PvNormalizationService();

        Object.defineProperty(service, 'model', {
            value: mockPvNormalizationModel
        });

        (FileModel.getFileById as jest.Mock).mockResolvedValue({
            fileId: mockFileId,
            filePath: mockFilePath,
            fileName: 'test_file.xml'
        });


        mockReadFileAsync.mockResolvedValue(mockXmlContent);

        (NormalizerRegistry.initialize as jest.Mock).mockImplementation(() => { });
        (NormalizerRegistry.findSuitableNormalizer as jest.Mock).mockReturnValue({
            normalize: jest.fn().mockResolvedValue({
                success: true,
                data: mockNormalizedData
            })
        });
    });

    describe('processPvFile', () => {
        it('devrait traiter un fichier PV avec succès', async () => {

            (mockPvNormalizationModel.isFileAlreadyNormalized as jest.Mock).mockResolvedValue(false);
            (mockPvNormalizationModel.saveNormalizedData as jest.Mock).mockResolvedValue(true);

            const result = await service.processPvFile(mockFileId);

            expect(result).not.toBeNull();
            expect(result?.fileId).toBe(mockFileId);
            expect(result?.normalizedData).toEqual(mockNormalizedData);

            expect(FileModel.getFileById).toHaveBeenCalledWith(mockFileId);
            expect(promisify(fs.readFile)).toHaveBeenCalled();
            expect(NormalizerRegistry.findSuitableNormalizer).toHaveBeenCalledWith(mockXmlContent);
            expect(mockPvNormalizationModel.saveNormalizedData).toHaveBeenCalledWith(
                mockFileId,
                mockNormalizedData
            );
        });

        it('devrait lancer une erreur si le fichier est déjà normalisé', async () => {
            (mockPvNormalizationModel.isFileAlreadyNormalized as jest.Mock).mockResolvedValue(true);

            await expect(service.processPvFile(mockFileId)).rejects.toThrow(
                NormalizationError.ALREADY_NORMALIZED
            );

            expect(FileModel.getFileById).not.toHaveBeenCalled();
        });

        it('devrait retourner null si les métadonnées du fichier ne sont pas trouvées', async () => {
            (mockPvNormalizationModel.isFileAlreadyNormalized as jest.Mock).mockResolvedValue(false);
            (FileModel.getFileById as jest.Mock).mockResolvedValue(null);

            const result = await service.processPvFile(mockFileId);

            expect(result).toBeNull();
        });

        it('devrait retourner null si aucun normaliseur approprié n\'est trouvé', async () => {
            (mockPvNormalizationModel.isFileAlreadyNormalized as jest.Mock).mockResolvedValue(false);
            (NormalizerRegistry.findSuitableNormalizer as jest.Mock).mockReturnValue(null);

            const result = await service.processPvFile(mockFileId);

            expect(result).toBeNull();
        });

        it('devrait retourner null si la normalisation échoue', async () => {
            (mockPvNormalizationModel.isFileAlreadyNormalized as jest.Mock).mockResolvedValue(false);
            (NormalizerRegistry.findSuitableNormalizer as jest.Mock).mockReturnValue({
                normalize: jest.fn().mockResolvedValue({
                    success: false,
                    errorMessage: 'Normalization failed'
                })
            });

            const result = await service.processPvFile(mockFileId);

            expect(result).toBeNull();
        });

        it('devrait retourner null si l\'enregistrement des données normalisées échoue', async () => {
            (mockPvNormalizationModel.isFileAlreadyNormalized as jest.Mock).mockResolvedValue(false);
            (mockPvNormalizationModel.saveNormalizedData as jest.Mock).mockResolvedValue(false);

            const result = await service.processPvFile(mockFileId);

            expect(result).toBeNull();
        });

        it('devrait retourner null si une erreur se produit pendant le traitement', async () => {
            (mockPvNormalizationModel.isFileAlreadyNormalized as jest.Mock).mockRejectedValue(
                new Error('Unexpected error')
            );

            const result = await service.processPvFile(mockFileId);

            expect(result).toBeNull();
        });
    });

    describe('getNormalizedDataByPvFileId', () => {
        it('devrait retourner les données normalisées pour un fichier', async () => {
            (mockPvNormalizationModel.getNormalizedDataByPvFileId as jest.Mock).mockResolvedValue(mockNormalizedData);

            const result = await service.getNormalizedDataByPvFileId(mockFileId);

            expect(result).toEqual(mockNormalizedData);
            expect(mockPvNormalizationModel.getNormalizedDataByPvFileId).toHaveBeenCalledWith(mockFileId);
        });
    });

    describe('deleteNormalizedDataByPvFileId', () => {
        it('devrait supprimer les données normalisées avec succès', async () => {
            (mockPvNormalizationModel.isFileAlreadyNormalized as jest.Mock).mockResolvedValue(true);
            (mockPvNormalizationModel.deleteNormalizedData as jest.Mock).mockResolvedValue(true);

            const result = await service.deleteNormalizedDataByPvFileId(mockFileId);

            expect(result).toBe(true);
            expect(mockPvNormalizationModel.isFileAlreadyNormalized).toHaveBeenCalledWith(mockFileId);
            expect(mockPvNormalizationModel.deleteNormalizedData).toHaveBeenCalledWith(mockFileId);
        });

        it('devrait retourner false si le fichier n\'est pas normalisé', async () => {
            (mockPvNormalizationModel.isFileAlreadyNormalized as jest.Mock).mockResolvedValue(false);

            const result = await service.deleteNormalizedDataByPvFileId(mockFileId);

            expect(result).toBe(false);
            expect(mockPvNormalizationModel.deleteNormalizedData).not.toHaveBeenCalled();
        });

        it('devrait retourner false si une erreur se produit pendant la suppression', async () => {
            (mockPvNormalizationModel.isFileAlreadyNormalized as jest.Mock).mockRejectedValue(
                new Error('Database error')
            );

            const result = await service.deleteNormalizedDataByPvFileId(mockFileId);

            expect(result).toBe(false);
        });
    });
});
