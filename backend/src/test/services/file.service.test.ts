import fs from 'fs';
import path from 'path';
import { FileService } from '../../services/file.service';
import { FileOrigin, FileSession, IFileMetadata, IFileUploadRequest } from '../../types/file.types';
import { FileModel } from '../../models/file.model';
import * as masterProgramModel from '../../models/master-program.model';

jest.mock('fs');
jest.mock('path');
jest.mock('uuid', () => ({
    v4: jest.fn().mockReturnValue('mocked-uuid')
}));
jest.mock('../../models/file.model');
jest.mock('../../models/master-program.model');

jest.mock('../../services/file.service', () => {
    const originalModule = jest.requireActual('../../services/file.service');
    originalModule.FileService.UPLOAD_DIR = 'uploads';
    return originalModule;
});

describe('FileService', () => {
    const mockedFs = fs as jest.Mocked<typeof fs>;
    const mockedPath = path as jest.Mocked<typeof path>;
    const mockedFileModel = FileModel as jest.Mocked<typeof FileModel>;
    const mockedMasterProgramModel = masterProgramModel as jest.Mocked<typeof masterProgramModel>;

    beforeEach(() => {
        jest.clearAllMocks();

        mockedPath.join.mockImplementation((...paths) => paths.join('/'));
        mockedPath.extname.mockImplementation((filename) => `.${filename.split('.').pop()}`);
        mockedPath.basename.mockImplementation((filename, ext) => {
            const baseName = filename.split('/').pop() || '';
            if (ext && baseName.endsWith(ext)) {
                return baseName.slice(0, -ext.length);
            }
            return baseName;
        });

        mockedFs.existsSync.mockReturnValue(true);
        mockedFs.mkdirSync.mockImplementation(() => undefined);
        mockedFs.writeFile.mockImplementation((path, data, callback) => {
            callback(null);
        });
        mockedFs.unlinkSync.mockImplementation(() => undefined);

        mockedMasterProgramModel.checkMasterProgramExists.mockResolvedValue(true);
    });

    describe('initializeStorage', () => {
        test('devrait créer des répertoires de téléchargement s\'ils n\'existent pas', () => {
            mockedFs.existsSync
                .mockReturnValueOnce(false)
                .mockReturnValueOnce(false)
                .mockReturnValueOnce(false)
                .mockReturnValueOnce(false);

            FileService.initializeStorage();

            expect(mockedFs.mkdirSync).toHaveBeenCalledWith('uploads', { recursive: true });
            expect(mockedFs.mkdirSync).toHaveBeenCalledTimes(4);
        });

        test('ne devrait pas créer des répertoires s\'ils existent déjà', () => {
            mockedFs.existsSync.mockReturnValue(true);

            FileService.initializeStorage();

            expect(mockedFs.mkdirSync).not.toHaveBeenCalled();
        });
    });

    describe('generateUniqueFileName', () => {
        test('devrait générer un nom de fichier unique avec horodatage et uuid', () => {
            jest.spyOn(Date, 'now').mockReturnValue(1234567890);
            mockedPath.extname.mockReturnValueOnce('.pdf');
            mockedPath.basename.mockReturnValueOnce('test_file');

            jest.mocked(jest.requireMock('uuid')).v4.mockReturnValueOnce('mocked-uuid');

            const result = FileService.generateUniqueFileName('test_file.pdf');

            expect(result).toEqual('test_file_1234567890_mocked-u.pdf');
        });

        test('devrait remplacer les caractères non alphanumériques dans le nom de fichier', () => {
            jest.spyOn(Date, 'now').mockReturnValue(1234567890);
            mockedPath.extname.mockReturnValueOnce('.xlsx');
            mockedPath.basename.mockReturnValueOnce('test file @#$');

            const result = FileService.generateUniqueFileName('test file @#$.xlsx');

            expect(result).toContain('test_file_____');
        });
    });

    describe('saveFile', () => {
        test('devrait sauvegarder le fichier dans l\'emplacement correct et renvoyer le chemin du fichier', async () => {
            const mockFile = {
                originalname: 'test.pdf',
                buffer: Buffer.from('test content')
            } as Express.Multer.File;

            const mockFilePath = 'uploads/studentdocs/unique_filename.pdf';
            jest.spyOn(FileService, 'generateUniqueFileName').mockReturnValueOnce('unique_filename.pdf');
            mockedPath.join
                .mockReturnValueOnce('uploads/studentdocs')
                .mockReturnValueOnce(mockFilePath);

            const result = await FileService.saveFile(mockFile, FileOrigin.StudentDocuments);

            expect(mockedFs.writeFile).toHaveBeenCalled();
            expect(result).toBe(mockFilePath);
        });

        test('devrait rejeter avec erreur si l\'écriture du fichier échoue', async () => {
            const mockFile = {
                originalname: 'test.pdf',
                buffer: Buffer.from('test content')
            } as Express.Multer.File;

            mockedFs.writeFile.mockImplementationOnce((path, data, callback) => {
                callback(new Error('Write error'));
            });

            await expect(FileService.saveFile(mockFile, FileOrigin.StudentDocuments))
                .rejects.toThrow('Write error');
        });
    });

    describe('validateFileMetadata', () => {
        test('devrait valider correctement un fichier MonMaster', () => {
            const mockFile = { originalname: 'data.xlsx' } as Express.Multer.File;
            const metadata: IFileUploadRequest = {
                fileOrigin: FileOrigin.MonMaster,
                masterId: 1
            };

            const result = FileService.validateFileMetadata(mockFile, metadata);

            expect(result).toBeNull();
        });

        test('devrait rejeter un fichier MonMaster avec une extension incorrecte', () => {
            const mockFile = { originalname: 'data.pdf' } as Express.Multer.File;
            const metadata: IFileUploadRequest = {
                fileOrigin: FileOrigin.MonMaster,
                masterId: 1
            };

            const result = FileService.validateFileMetadata(mockFile, metadata);

            expect(result).toContain('MonMaster files must be Excel (.xlsx) files');
        });

        test('devrait valider correctement un fichier PV', () => {
            const mockFile = { originalname: 'data.xml' } as Express.Multer.File;
            const metadata: IFileUploadRequest = {
                fileOrigin: FileOrigin.PV,
                masterId: 1,
                university: 'Test University',
                formation: 'Test Formation',
                yearAcademic: '2023-2024',
                session: FileSession.Session1
            };

            const result = FileService.validateFileMetadata(mockFile, metadata);

            expect(result).toBeNull();
        });

        test('devrait valider correctement un fichier StudentDocuments', () => {
            const mockFile = { originalname: 'document.pdf' } as Express.Multer.File;
            const metadata: IFileUploadRequest = {
                fileOrigin: FileOrigin.StudentDocuments,
                masterId: 1
            };

            const result = FileService.validateFileMetadata(mockFile, metadata);

            expect(result).toBeNull();
        });

        test('devrait rejeter un fichier avec origine manquante', () => {
            const mockFile = { originalname: 'document.pdf' } as Express.Multer.File;
            const metadata = {} as IFileUploadRequest;

            const result = FileService.validateFileMetadata(mockFile, metadata);

            expect(result).toBe('File origin is required');
        });
    });

    describe('processFileUpload', () => {
        test('devrait traiter correctement le téléchargement de fichier', async () => {
            const mockFile = {
                originalname: 'test.pdf',
                buffer: Buffer.from('test content')
            } as Express.Multer.File;

            const metadata: IFileUploadRequest = {
                fileOrigin: FileOrigin.StudentDocuments,
                masterId: 1
            };

            const expectedFileData: IFileMetadata = {
                fileName: 'test.pdf',
                fileType: 'pdf',
                filePath: 'uploads/studentdocs/unique_filename.pdf',
                fileOrigin: FileOrigin.StudentDocuments,
                masterId: 1,
                uploadedBy: 1
            };

            mockedFileModel.createFile.mockResolvedValueOnce({
                ...expectedFileData,
                fileId: 1
            });

            const result = await FileService.processFileUpload(mockFile, metadata, 1);

            expect(result).toHaveProperty('fileId', 1);
            expect(mockedFileModel.createFile).toHaveBeenCalledWith(expect.objectContaining({
                fileName: 'test.pdf',
                fileOrigin: FileOrigin.StudentDocuments
            }));
        });

        test('devrait lever une erreur lorsque la validation échoue', async () => {
            const mockFile = { originalname: 'test.pdf' } as Express.Multer.File;
            const metadata = { fileOrigin: FileOrigin.MonMaster } as IFileUploadRequest;

            await expect(FileService.processFileUpload(mockFile, metadata, 1))
                .rejects.toThrow('MonMaster files must be Excel (.xlsx) files');
        });

        test('devrait lever une erreur lorsque le programme master n\'existe pas', async () => {
            const mockFile = { originalname: 'test.xlsx' } as Express.Multer.File;
            const metadata = {
                fileOrigin: FileOrigin.MonMaster,
                masterId: 999
            } as IFileUploadRequest;

            mockedMasterProgramModel.checkMasterProgramExists.mockResolvedValueOnce(false);

            await expect(FileService.processFileUpload(mockFile, metadata, 1))
                .rejects.toThrow('Master program with ID 999 does not exist');
        });

        test('devrait rejeter le téléchargement d\'un fichier MonMaster si un fichier existe déjà pour ce master programme', async () => {
            const mockFile = {
                originalname: 'test.xlsx',
                buffer: Buffer.from('test content')
            } as Express.Multer.File;

            const metadata: IFileUploadRequest = {
                fileOrigin: FileOrigin.MonMaster,
                masterId: 1
            };

            mockedFileModel.fileExistsForMaster.mockResolvedValueOnce(true);

            await expect(FileService.processFileUpload(mockFile, metadata, 1))
                .rejects.toThrow('A MonMaster file already exists for Master program with ID 1. Only one MonMaster file is allowed per master program.');

            expect(mockedFileModel.fileExistsForMaster).toHaveBeenCalledWith(1, FileOrigin.MonMaster);
            expect(mockedFileModel.createFile).not.toHaveBeenCalled();
        });

        test('devrait permettre le téléchargement d\'un fichier MonMaster si aucun fichier n\'existe pour ce master programme', async () => {
            const mockFile = {
                originalname: 'test.xlsx',
                buffer: Buffer.from('test content')
            } as Express.Multer.File;

            const metadata: IFileUploadRequest = {
                fileOrigin: FileOrigin.MonMaster,
                masterId: 1
            };

            mockedFileModel.fileExistsForMaster.mockResolvedValueOnce(false);

            const expectedFileData: IFileMetadata = {
                fileName: 'test.xlsx',
                fileType: 'xlsx',
                filePath: 'uploads/monmaster/unique_filename.xlsx',
                fileOrigin: FileOrigin.MonMaster,
                masterId: 1,
                uploadedBy: 1
            };

            mockedFileModel.createFile.mockResolvedValueOnce({
                ...expectedFileData,
                fileId: 1
            });

            const result = await FileService.processFileUpload(mockFile, metadata, 1);

            expect(mockedFileModel.fileExistsForMaster).toHaveBeenCalledWith(1, FileOrigin.MonMaster);
            expect(result).toHaveProperty('fileId', 1);
            expect(mockedFileModel.createFile).toHaveBeenCalledWith(expect.objectContaining({
                fileName: 'test.xlsx',
                fileOrigin: FileOrigin.MonMaster
            }));
        });

        test('ne devrait pas vérifier l\'existence d\'un fichier MonMaster pour d\'autres types de fichiers', async () => {
            const mockFile = {
                originalname: 'test.pdf',
                buffer: Buffer.from('test content')
            } as Express.Multer.File;

            const metadata: IFileUploadRequest = {
                fileOrigin: FileOrigin.StudentDocuments,
                masterId: 1
            };

            const expectedFileData: IFileMetadata = {
                fileName: 'test.pdf',
                fileType: 'pdf',
                filePath: 'uploads/studentdocs/unique_filename.pdf',
                fileOrigin: FileOrigin.StudentDocuments,
                masterId: 1,
                uploadedBy: 1
            };

            mockedFileModel.createFile.mockResolvedValueOnce({
                ...expectedFileData,
                fileId: 1
            });

            await FileService.processFileUpload(mockFile, metadata, 1);

            expect(mockedFileModel.fileExistsForMaster).not.toHaveBeenCalled();
        });
    });

    describe('getFilesByMasterId', () => {
        test('devrait renvoyer les fichiers pour un ID master spécifique', async () => {
            const mockFiles: IFileMetadata[] = [
                {
                    fileId: 1,
                    masterId: 5,
                    fileName: 'test1.pdf',
                    fileType: 'pdf',
                    filePath: 'path/to/file1',
                    fileOrigin: FileOrigin.StudentDocuments,
                    uploadedBy: 1
                },
                {
                    fileId: 2,
                    masterId: 5,
                    fileName: 'test2.pdf',
                    fileType: 'pdf',
                    filePath: 'path/to/file2',
                    fileOrigin: FileOrigin.StudentDocuments,
                    uploadedBy: 1
                }
            ];

            mockedFileModel.getFilesByMasterId.mockResolvedValueOnce(mockFiles);

            const result = await FileService.getFilesByMasterId(5);

            expect(result).toHaveLength(2);
            expect(result[0].fileId).toBe(1);
            expect(result[1].fileId).toBe(2);
            expect(mockedFileModel.getFilesByMasterId).toHaveBeenCalledWith(5);
        });
    });

    describe('getFilesByOrigin', () => {
        test('devrait renvoyer les fichiers pour une origine spécifique', async () => {
            const mockFiles: IFileMetadata[] = [
                {
                    fileId: 1,
                    fileName: 'test1.xlsx',
                    fileType: 'xlsx',
                    filePath: 'path/to/file1',
                    fileOrigin: FileOrigin.MonMaster,
                    uploadedBy: 1
                }
            ];

            mockedFileModel.getFilesByOrigin.mockResolvedValueOnce(mockFiles);

            const result = await FileService.getFilesByOrigin(FileOrigin.MonMaster);

            expect(result).toHaveLength(1);
            expect(result[0].fileOrigin).toBe(FileOrigin.MonMaster);
            expect(mockedFileModel.getFilesByOrigin).toHaveBeenCalledWith(FileOrigin.MonMaster);
        });
    });

    describe('getFileById', () => {
        test('devrait renvoyer un fichier par ID', async () => {
            const mockFile: IFileMetadata = {
                fileId: 1,
                fileName: 'test.pdf',
                fileType: 'pdf',
                filePath: 'path/to/file',
                fileOrigin: FileOrigin.StudentDocuments,
                uploadedBy: 1
            };

            mockedFileModel.getFileById.mockResolvedValueOnce(mockFile);

            const result = await FileService.getFileById(1);

            expect(result).toEqual(mockFile);
            expect(mockedFileModel.getFileById).toHaveBeenCalledWith(1);
        });

        test('devrait renvoyer null lorsque le fichier n\'existe pas', async () => {
            mockedFileModel.getFileById.mockResolvedValueOnce(null);

            const result = await FileService.getFileById(999);

            expect(result).toBeNull();
        });
    });

    describe('deleteFile', () => {
        test('devrait supprimer le fichier de la base de données et du système de fichiers', async () => {
            const mockFile: IFileMetadata = {
                fileId: 1,
                fileName: 'test.pdf',
                fileType: 'pdf',
                filePath: 'path/to/file',
                fileOrigin: FileOrigin.StudentDocuments,
                uploadedBy: 1
            };

            mockedFileModel.getFileById.mockResolvedValueOnce(mockFile);
            mockedFileModel.deleteFile.mockResolvedValueOnce(mockFile);

            const result = await FileService.deleteFile(1);

            expect(result).toEqual(mockFile);
            expect(mockedFs.unlinkSync).toHaveBeenCalledWith('path/to/file');
            expect(mockedFileModel.deleteFile).toHaveBeenCalledWith(1);
        });

        test('devrait renvoyer null lorsque le fichier n\'existe pas', async () => {
            mockedFileModel.getFileById.mockResolvedValueOnce(null);

            const result = await FileService.deleteFile(999);

            expect(result).toBeNull();
            expect(mockedFileModel.deleteFile).not.toHaveBeenCalled();
        });

        test('devrait gérer le cas où le fichier existe dans la base de données mais pas dans le système de fichiers', async () => {
            const mockFile: IFileMetadata = {
                fileId: 1,
                fileName: 'test.pdf',
                fileType: 'pdf',
                filePath: 'path/to/file',
                fileOrigin: FileOrigin.StudentDocuments,
                uploadedBy: 1
            };

            mockedFileModel.getFileById.mockResolvedValueOnce(mockFile);
            mockedFileModel.deleteFile.mockResolvedValueOnce(mockFile);
            mockedFs.existsSync.mockReturnValueOnce(false);

            const result = await FileService.deleteFile(1);

            expect(result).toEqual(mockFile);
            expect(mockedFs.unlinkSync).not.toHaveBeenCalled();
        });

        test('devrait lever une erreur lorsque la suppression dans la base de données échoue', async () => {
            const mockFile: IFileMetadata = {
                fileId: 1,
                fileName: 'test.pdf',
                fileType: 'pdf',
                filePath: 'path/to/file',
                fileOrigin: FileOrigin.StudentDocuments,
                uploadedBy: 1
            };

            mockedFileModel.getFileById.mockResolvedValueOnce(mockFile);
            mockedFileModel.deleteFile.mockRejectedValueOnce(new Error('Database error'));

            await expect(FileService.deleteFile(1)).rejects.toThrow('Failed to delete file: Database error');
        });
    });

    describe('getFileForDownload', () => {
        test('devrait renvoyer les détails de téléchargement du fichier lorsque le fichier existe', async () => {
            const mockFile: IFileMetadata = {
                fileId: 1,
                fileName: 'test.pdf',
                fileType: 'pdf',
                filePath: '/path/to/file',
                fileOrigin: FileOrigin.StudentDocuments,
                uploadedBy: 1
            };

            mockedFileModel.getFileById.mockResolvedValueOnce(mockFile);
            mockedFs.existsSync.mockReturnValueOnce(true);

            const result = await FileService.getFileForDownload(1);

            expect(result).toEqual({
                fileName: 'test.pdf',
                fileType: 'pdf',
                filePath: '/path/to/file'
            });
            expect(mockedFileModel.getFileById).toHaveBeenCalledWith(1);
            expect(mockedFs.existsSync).toHaveBeenCalledWith('/path/to/file');
        });

        test('devrait renvoyer null quand le fichier n\'existe pas dans la base de données', async () => {
            mockedFileModel.getFileById.mockResolvedValueOnce(null);

            const result = await FileService.getFileForDownload(999);

            expect(result).toBeNull();
            expect(mockedFileModel.getFileById).toHaveBeenCalledWith(999);
            expect(mockedFs.existsSync).not.toHaveBeenCalled();
        });

        test('devrait lever une erreur quand le fichier existe dans la base de données mais pas sur le disque', async () => {
            const mockFile: IFileMetadata = {
                fileId: 1,
                fileName: 'test.pdf',
                fileType: 'pdf',
                filePath: '/path/to/missing/file',
                fileOrigin: FileOrigin.StudentDocuments,
                uploadedBy: 1
            };

            mockedFileModel.getFileById.mockResolvedValueOnce(mockFile);
            mockedFs.existsSync.mockReturnValueOnce(false);

            await expect(FileService.getFileForDownload(1)).rejects.toThrow(
                'File not found on disk: /path/to/missing/file'
            );
            expect(mockedFileModel.getFileById).toHaveBeenCalledWith(1);
            expect(mockedFs.existsSync).toHaveBeenCalledWith('/path/to/missing/file');
        });
    });

    describe('getFilesByMasterIdAndOrigin', () => {
        test('devrait renvoyer les fichiers pour un ID master et une origine spécifiques', async () => {
            const mockFiles: IFileMetadata[] = [
                {
                    fileId: 1,
                    masterId: 5,
                    fileName: 'test1.pdf',
                    fileType: 'pdf',
                    filePath: 'path/to/file1',
                    fileOrigin: FileOrigin.StudentDocuments,
                    uploadedBy: 1
                },
                {
                    fileId: 2,
                    masterId: 5,
                    fileName: 'test2.pdf',
                    fileType: 'pdf',
                    filePath: 'path/to/file2',
                    fileOrigin: FileOrigin.StudentDocuments,
                    uploadedBy: 1
                }
            ];

            mockedFileModel.getFilesByMasterIdAndOrigin.mockResolvedValueOnce(mockFiles);

            const result = await FileService.getFilesByMasterIdAndOrigin(5, FileOrigin.StudentDocuments);

            expect(result).toHaveLength(2);
            expect(result[0].masterId).toBe(5);
            expect(result[0].fileOrigin).toBe(FileOrigin.StudentDocuments);
            expect(result[1].masterId).toBe(5);
            expect(result[1].fileOrigin).toBe(FileOrigin.StudentDocuments);
            expect(mockedFileModel.getFilesByMasterIdAndOrigin).toHaveBeenCalledWith(5, FileOrigin.StudentDocuments);
        });

        test('devrait renvoyer un tableau vide quand aucun fichier ne correspond aux critères', async () => {
            mockedFileModel.getFilesByMasterIdAndOrigin.mockResolvedValueOnce([]);

            const result = await FileService.getFilesByMasterIdAndOrigin(999, FileOrigin.MonMaster);

            expect(result).toHaveLength(0);
            expect(mockedFileModel.getFilesByMasterIdAndOrigin).toHaveBeenCalledWith(999, FileOrigin.MonMaster);
        });

        test('devrait propager les erreurs de la base de données', async () => {
            const dbError = new Error('Database connection failed');
            mockedFileModel.getFilesByMasterIdAndOrigin.mockRejectedValueOnce(dbError);

            await expect(FileService.getFilesByMasterIdAndOrigin(5, FileOrigin.StudentDocuments))
                .rejects.toThrow('Database connection failed');
        });
    });

    describe("FileService.getStudentDocument", () => {
        const masterId = 1;
        const candidateNumber = "123456";
    
        afterEach(() => {
            jest.clearAllMocks();
        });
    
        test(" Retourne un fichier si trouvé", async () => {
            const mockFile = { fileName: "123456_transcript.pdf", filePath: "/uploads/123456_transcript.pdf" };
            (FileModel.findStudentDocument as jest.Mock).mockResolvedValue(mockFile);
    
            const file = await FileService.getStudentDocument(masterId, candidateNumber);
    
            expect(file).toEqual(mockFile);
            expect(FileModel.findStudentDocument).toHaveBeenCalledWith(masterId, candidateNumber);
        });
    
        test("Retourne null si aucun fichier trouvé", async () => {
            (FileModel.findStudentDocument as jest.Mock).mockResolvedValue(null);
    
            const file = await FileService.getStudentDocument(masterId, candidateNumber);
    
            expect(file).toBeNull();
        });
    
        test("Gère une erreur proprement", async () => {
            (FileModel.findStudentDocument as jest.Mock).mockRejectedValue(new Error("Erreur SQL"));
    
            await expect(FileService.getStudentDocument(masterId, candidateNumber)).rejects.toThrow("Erreur SQL");
        });
    });
});
