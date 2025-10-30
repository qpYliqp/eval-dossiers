import { FileModel } from '../../models/file.model';
import { FileOrigin, FileSession, IFileMetadata } from '../../types/file.types';
import pool from '../../config/db';

jest.mock('../../config/db', () => ({
    query: jest.fn(),
}));

describe('FileModel', () => {
    const sampleFileMetadata: IFileMetadata = {
        fileName: 'test-file.pdf',
        fileType: 'pdf',
        filePath: '/path/to/test-file.pdf',
        fileOrigin: FileOrigin.StudentDocuments,
        uploadedBy: 1,
        masterId: 1,
        university: 'Test University',
        formation: 'Test Formation',
        yearAcademic: '2023-2024',
        session: FileSession.Session1
    };

    const sampleFileWithId: IFileMetadata = {
        fileId: 1,
        ...sampleFileMetadata,
        uploadDate: new Date('2023-01-01T00:00:00.000Z')
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('createFile', () => {
        it('devrait créer un fichier dans la base de données', async () => {
            (pool.query as jest.Mock).mockResolvedValueOnce({
                rows: [sampleFileWithId],
            });

            const result = await FileModel.createFile(sampleFileMetadata);

            expect(pool.query).toHaveBeenCalledWith(
                expect.stringContaining('INSERT INTO "Files"'),
                [
                    sampleFileMetadata.masterId,
                    sampleFileMetadata.fileName,
                    sampleFileMetadata.fileType,
                    sampleFileMetadata.filePath,
                    sampleFileMetadata.university,
                    sampleFileMetadata.formation,
                    sampleFileMetadata.yearAcademic,
                    sampleFileMetadata.fileOrigin,
                    sampleFileMetadata.session,
                    sampleFileMetadata.uploadedBy
                ]
            );

            expect(result).toEqual(sampleFileWithId);
        });

        it('devrait gérer correctement les valeurs null', async () => {
            const fileDataWithNulls: IFileMetadata = {
                fileName: 'test-file.pdf',
                fileType: 'pdf',
                filePath: '/path/to/test-file.pdf',
                fileOrigin: FileOrigin.StudentDocuments,
                uploadedBy: 1
            };

            (pool.query as jest.Mock).mockResolvedValueOnce({
                rows: [{ ...fileDataWithNulls, fileId: 1 }],
            });

            await FileModel.createFile(fileDataWithNulls);

            expect(pool.query).toHaveBeenCalledWith(
                expect.stringContaining('INSERT INTO "Files"'),
                expect.arrayContaining([null])
            );
        });
    });

    describe('getFileById', () => {
        it('devrait renvoyer un fichier lorsqu\'il existe', async () => {
            (pool.query as jest.Mock).mockResolvedValueOnce({
                rows: [sampleFileWithId],
            });

            const result = await FileModel.getFileById(1);

            expect(pool.query).toHaveBeenCalledWith(
                expect.stringContaining('SELECT * FROM "Files" WHERE "fileId" = $1'),
                [1]
            );

            expect(result).toEqual(sampleFileWithId);
        });

        it('devrait renvoyer null lorsque le fichier n\'existe pas', async () => {
            (pool.query as jest.Mock).mockResolvedValueOnce({
                rows: [],
            });

            const result = await FileModel.getFileById(999);

            expect(result).toBeNull();
        });
    });

    describe('getFilesByMasterId', () => {
        it('devrait renvoyer les fichiers pour un ID master donné', async () => {
            const multipleFiles = [
                { ...sampleFileWithId, fileId: 1 },
                { ...sampleFileWithId, fileId: 2, fileName: 'test-file-2.pdf' }
            ];

            (pool.query as jest.Mock).mockResolvedValueOnce({
                rows: multipleFiles,
            });

            const result = await FileModel.getFilesByMasterId(1);

            expect(pool.query).toHaveBeenCalledWith(
                expect.stringContaining('SELECT * FROM "Files" WHERE "masterId" = $1'),
                [1]
            );

            expect(result).toEqual(multipleFiles);
            expect(result.length).toBe(2);
        });

        it('devrait renvoyer un tableau vide lorsqu\'aucun fichier n\'existe pour l\'ID master', async () => {
            (pool.query as jest.Mock).mockResolvedValueOnce({
                rows: [],
            });

            const result = await FileModel.getFilesByMasterId(999);

            expect(result).toEqual([]);
            expect(result.length).toBe(0);
        });
    });

    describe('getFilesByOrigin', () => {
        it('devrait renvoyer les fichiers pour une origine donnée', async () => {
            const multipleFiles = [
                { ...sampleFileWithId, fileId: 1 },
                { ...sampleFileWithId, fileId: 2, fileName: 'test-file-2.pdf' }
            ];

            (pool.query as jest.Mock).mockResolvedValueOnce({
                rows: multipleFiles,
            });

            const result = await FileModel.getFilesByOrigin(FileOrigin.StudentDocuments);

            expect(pool.query).toHaveBeenCalledWith(
                expect.stringContaining('SELECT * FROM "Files" WHERE "fileOrigin" = $1'),
                [FileOrigin.StudentDocuments]
            );

            expect(result).toEqual(multipleFiles);
            expect(result.length).toBe(2);
        });

        it('devrait renvoyer un tableau vide lorsqu\'aucun fichier n\'existe pour l\'origine', async () => {
            (pool.query as jest.Mock).mockResolvedValueOnce({
                rows: [],
            });

            const result = await FileModel.getFilesByOrigin(FileOrigin.MonMaster);

            expect(result).toEqual([]);
            expect(result.length).toBe(0);
        });
    });

    describe('getFilesByMasterIdAndOrigin', () => {
        it('devrait renvoyer les fichiers pour un ID master et une origine spécifiques', async () => {
            const multipleFiles = [
                { ...sampleFileWithId, fileId: 1 },
                { ...sampleFileWithId, fileId: 2, fileName: 'test-file-2.pdf' }
            ];

            (pool.query as jest.Mock).mockResolvedValueOnce({
                rows: multipleFiles,
            });

            const result = await FileModel.getFilesByMasterIdAndOrigin(1, FileOrigin.StudentDocuments);

            expect(pool.query).toHaveBeenCalledWith(
                expect.stringContaining('SELECT * FROM "Files" WHERE "masterId" = $1 AND "fileOrigin" = $2'),
                [1, FileOrigin.StudentDocuments]
            );

            expect(result).toEqual(multipleFiles);
            expect(result.length).toBe(2);
        });

        it('devrait renvoyer un tableau vide lorsqu\'aucun fichier ne correspond aux critères', async () => {
            (pool.query as jest.Mock).mockResolvedValueOnce({
                rows: [],
            });

            const result = await FileModel.getFilesByMasterIdAndOrigin(999, FileOrigin.MonMaster);

            expect(result).toEqual([]);
            expect(result.length).toBe(0);
        });

        it('devrait gérer les erreurs de base de données', async () => {
            const dbError = new Error('Database connection failed');
            (pool.query as jest.Mock).mockRejectedValueOnce(dbError);

            await expect(FileModel.getFilesByMasterIdAndOrigin(1, FileOrigin.StudentDocuments))
                .rejects.toThrow('Database connection failed');
        });
    });

    describe('deleteFile', () => {
        it('devrait supprimer un fichier et renvoyer les données du fichier supprimé', async () => {
            (pool.query as jest.Mock).mockResolvedValueOnce({
                rows: [sampleFileWithId],
                rowCount: 1
            });

            const result = await FileModel.deleteFile(1);

            expect(pool.query).toHaveBeenCalledWith(
                expect.stringContaining('DELETE FROM "Files"'),
                [1]
            );

            expect(result).toEqual(sampleFileWithId);
        });

        it('devrait renvoyer null lorsque le fichier n\'existe pas', async () => {
            (pool.query as jest.Mock).mockResolvedValueOnce({
                rows: [],
                rowCount: 0
            });

            const result = await FileModel.deleteFile(999);

            expect(result).toBeNull();
        });

        it('devrait gérer correctement un résultat null de la requête', async () => {
            (pool.query as jest.Mock).mockResolvedValueOnce(null);

            const result = await FileModel.deleteFile(1);

            expect(result).toBeNull();
        });
    });

    describe('fileExistsForMaster', () => {
        it('devrait retourner true lorsqu\'un fichier existe pour le master et l\'origine spécifiés', async () => {
            (pool.query as jest.Mock).mockResolvedValueOnce({
                rows: [{ count: '1' }]
            });

            const result = await FileModel.fileExistsForMaster(1, FileOrigin.MonMaster);

            expect(pool.query).toHaveBeenCalledWith(
                expect.stringContaining('SELECT COUNT(*) FROM "Files" WHERE "masterId" = $1 AND "fileOrigin" = $2'),
                [1, FileOrigin.MonMaster]
            );

            expect(result).toBe(true);
        });

        it('devrait retourner false lorsqu\'aucun fichier n\'existe pour le master et l\'origine spécifiés', async () => {
            (pool.query as jest.Mock).mockResolvedValueOnce({
                rows: [{ count: '0' }]
            });

            const result = await FileModel.fileExistsForMaster(1, FileOrigin.MonMaster);

            expect(result).toBe(false);
        });

        it('devrait convertir correctement la valeur de comptage en booléen', async () => {
            (pool.query as jest.Mock).mockResolvedValueOnce({
                rows: [{ count: '0' }]
            });
            const resultFalse = await FileModel.fileExistsForMaster(1, FileOrigin.MonMaster);
            expect(resultFalse).toBe(false);

            (pool.query as jest.Mock).mockResolvedValueOnce({
                rows: [{ count: '5' }]
            });
            const resultTrue = await FileModel.fileExistsForMaster(1, FileOrigin.MonMaster);
            expect(resultTrue).toBe(true);
        });
    });

    describe("FileModel.findStudentDocument", () => {
        const masterId = 1;
        const candidateNumber = "123456";
    
        afterEach(() => {
            jest.clearAllMocks();
        });
    
        test("Retourne un fichier si trouvé", async () => {
            const mockFile = {
                masterId,
                fileName: "123456_transcript.pdf",
                filePath: "/uploads/123456_transcript.pdf",
                fileOrigin: "studentDocuments",
            };
    
            (pool.query as jest.Mock).mockResolvedValueOnce({ rows: [mockFile], rowCount: 1 });
    
            const file = await FileModel.findStudentDocument(masterId, candidateNumber);
    
            expect(file).toEqual(mockFile);
            expect(pool.query).toHaveBeenCalledWith(
                expect.stringContaining("SELECT * FROM"),
                [masterId, "123456.pdf"]
            );
        });
    
        test("Retourne null si aucun fichier trouvé", async () => {
            (pool.query as jest.Mock).mockResolvedValueOnce({ rows: [], rowCount: 0 });
    
            const file = await FileModel.findStudentDocument(masterId, candidateNumber);
    
            expect(file).toBeNull();
            expect(pool.query).toHaveBeenCalledWith(
                expect.stringContaining("SELECT * FROM"),
                [masterId, "123456.pdf"]
            );
        });
    
        test("Gère une erreur SQL proprement", async () => {
            (pool.query as jest.Mock).mockRejectedValueOnce(new Error("Erreur SQL"));
    
            await expect(FileModel.findStudentDocument(masterId, candidateNumber)).rejects.toThrow("Erreur SQL");
        });
    });
});
