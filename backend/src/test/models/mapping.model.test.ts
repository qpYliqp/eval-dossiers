import { MappingModel } from '../../models/mapping.model';
import { MappingEntry, MappingConfiguration } from '../../types/mapping.types';
import pool from '../../config/db';
import { QueryResult } from 'pg';


jest.mock('../../config/db', () => {
    return {
        query: jest.fn(),
        end: jest.fn()
    };
});


const mockedPool = pool as unknown as {
    query: jest.Mock<Promise<QueryResult<any>>>;
    end: jest.Mock;
};

describe('MappingModel', () => {
    let mappingModel: MappingModel;


    const testMonmasterFileId = 1;
    const testPvFileId = 4;
    const testConfigId = 1001;


    const testEntry: MappingEntry = {
        configurationId: 1001,
        masterColumnIndex: 5,
        masterColumnName: 'TestMasterColumn',
        pvColumnIndex: 5,
        pvColumnName: 'TestPvColumn'
    };

    const testEntryWithId: MappingEntry = {
        entryId: 101,
        ...testEntry
    };

    beforeEach(() => {

        jest.clearAllMocks();
        mappingModel = new MappingModel();
    });

    describe('Configuration methods', () => {
        it('devrait créer une nouvelle configuration de mappage', async () => {

            mockedPool.query.mockResolvedValueOnce({
                rows: [{ configurationId: testConfigId }],
                rowCount: 1,
                command: '',
                oid: 0,
                fields: []
            } as QueryResult<any>);

            const configId = await mappingModel.createConfiguration(testMonmasterFileId, testPvFileId);

            expect(configId).toBe(testConfigId);
            expect(mockedPool.query).toHaveBeenCalledWith(
                expect.stringContaining('INSERT INTO "MappingConfigurations"'),
                [testMonmasterFileId, testPvFileId]
            );
        });

        it('devrait obtenir une configuration par les IDs de fichiers monmaster et pv', async () => {

            mockedPool.query.mockResolvedValueOnce({
                rows: [{
                    configurationId: testConfigId,
                    monmasterFileId: testMonmasterFileId,
                    pvFileId: testPvFileId,
                    createdDate: new Date(),
                    updatedDate: new Date()
                }],
                rowCount: 1,
                command: '',
                oid: 0,
                fields: []
            } as QueryResult<any>);

            mockedPool.query.mockResolvedValueOnce({
                rows: [testEntryWithId],
                rowCount: 1,
                command: '',
                oid: 0,
                fields: []
            } as QueryResult<any>);

            const config = await mappingModel.getConfiguration(testMonmasterFileId, testPvFileId);

            expect(config).not.toBeNull();
            expect(config!.configurationId).toBe(testConfigId);
            expect(config!.monmasterFileId).toBe(testMonmasterFileId);
            expect(config!.pvFileId).toBe(testPvFileId);
            expect(Array.isArray(config!.entries)).toBe(true);
            expect(config!.entries!.length).toBe(1);
            expect(mockedPool.query).toHaveBeenCalledTimes(2);
        });

        it('devrait retourner null lors de la récupération d\'une configuration inexistante', async () => {

            mockedPool.query.mockResolvedValueOnce({
                rows: [],
                rowCount: 0,
                command: '',
                oid: 0,
                fields: []
            } as QueryResult<any>);

            const config = await mappingModel.getConfiguration(9999, 9999);

            expect(config).toBeNull();
            expect(mockedPool.query).toHaveBeenCalledTimes(1);
        });

        it('devrait obtenir une configuration par ID', async () => {

            mockedPool.query.mockResolvedValueOnce({
                rows: [{
                    configurationId: testConfigId,
                    monmasterFileId: testMonmasterFileId,
                    pvFileId: testPvFileId,
                    createdDate: new Date(),
                    updatedDate: new Date()
                }],
                rowCount: 1,
                command: '',
                oid: 0,
                fields: []
            } as QueryResult<any>);

            mockedPool.query.mockResolvedValueOnce({
                rows: [testEntryWithId],
                rowCount: 1,
                command: '',
                oid: 0,
                fields: []
            } as QueryResult<any>);

            const config = await mappingModel.getConfigurationById(testConfigId);

            expect(config).not.toBeNull();
            expect(config!.configurationId).toBe(testConfigId);
            expect(config!.entries!.length).toBe(1);
            expect(mockedPool.query).toHaveBeenCalledWith(
                expect.stringContaining('SELECT * FROM "MappingConfigurations"'),
                [testConfigId]
            );
        });

        it('devrait mettre à jour la date de modification lors de la création d\'une configuration', async () => {

            const timestamp = new Date();

            mockedPool.query.mockResolvedValueOnce({
                rows: [{
                    configurationId: testConfigId,
                    updatedDate: timestamp
                }],
                rowCount: 1,
                command: '',
                oid: 0,
                fields: []
            } as QueryResult<any>);

            const configId = await mappingModel.createConfiguration(testMonmasterFileId, testPvFileId);

            expect(configId).toBe(testConfigId);
            expect(mockedPool.query).toHaveBeenCalledWith(
                expect.stringContaining('CURRENT_TIMESTAMP'),
                [testMonmasterFileId, testPvFileId]
            );
        });
    });

    describe('Entry methods', () => {
        it('devrait ajouter une nouvelle entrée de mappage', async () => {

            mockedPool.query.mockResolvedValueOnce({
                rows: [],
                rowCount: 0,
                command: '',
                oid: 0,
                fields: []
            } as QueryResult<any>);


            mockedPool.query.mockResolvedValueOnce({
                rows: [],
                rowCount: 0,
                command: '',
                oid: 0,
                fields: []
            } as QueryResult<any>);


            mockedPool.query.mockResolvedValueOnce({
                rows: [testEntryWithId],
                rowCount: 1,
                command: '',
                oid: 0,
                fields: []
            } as QueryResult<any>);


            mockedPool.query.mockResolvedValueOnce({
                rows: [],
                rowCount: 1,
                command: '',
                oid: 0,
                fields: []
            } as QueryResult<any>);

            const result = await mappingModel.addEntry(testEntry);

            expect(result).toEqual(testEntryWithId);
            expect(mockedPool.query).toHaveBeenCalledTimes(4);
            expect(mockedPool.query).toHaveBeenNthCalledWith(
                1,
                expect.stringContaining('SELECT * FROM "MappingEntries"'),
                [testEntry.configurationId, testEntry.masterColumnIndex]
            );
        });

        it('devrait empêcher les mappages de colonnes MonMaster en double', async () => {

            mockedPool.query.mockResolvedValueOnce({
                rows: [{ entryId: 102 }],
                rowCount: 1,
                command: '',
                oid: 0,
                fields: []
            } as QueryResult<any>);

            await expect(mappingModel.addEntry(testEntry))
                .rejects
                .toThrow('This MonMaster column is already mapped to a PV column');

            expect(mockedPool.query).toHaveBeenCalledTimes(1);
        });

        it('devrait empêcher les mappages de colonnes PV en double', async () => {

            mockedPool.query.mockResolvedValueOnce({
                rows: [],
                rowCount: 0,
                command: '',
                oid: 0,
                fields: []
            } as QueryResult<any>);


            mockedPool.query.mockResolvedValueOnce({
                rows: [{ entryId: 103 }],
                rowCount: 1,
                command: '',
                oid: 0,
                fields: []
            } as QueryResult<any>);

            await expect(mappingModel.addEntry(testEntry))
                .rejects
                .toThrow('This PV column is already mapped to a MonMaster column');

            expect(mockedPool.query).toHaveBeenCalledTimes(2);
        });

        it('devrait obtenir les entrées par ID de configuration', async () => {
            mockedPool.query.mockResolvedValueOnce({
                rows: [testEntryWithId],
                rowCount: 1,
                command: '',
                oid: 0,
                fields: []
            } as QueryResult<any>);

            const entries = await mappingModel.getEntriesByConfigId(testConfigId);

            expect(entries.length).toBe(1);
            expect(entries[0]).toEqual(testEntryWithId);
            expect(mockedPool.query).toHaveBeenCalledWith(
                expect.stringContaining('SELECT * FROM "MappingEntries"'),
                [testConfigId]
            );
        });

        it('devrait mettre à jour une entrée de mappage', async () => {
            const updatedEntry = {
                ...testEntryWithId,
                masterColumnName: 'UpdatedColumn',
                pvColumnName: 'UpdatedPvColumn'
            };

            const spy = jest.spyOn(mappingModel, 'updateEntry');
            spy.mockResolvedValueOnce(updatedEntry);

            const updates = {
                masterColumnName: 'UpdatedColumn',
                pvColumnName: 'UpdatedPvColumn'
            };

            const result = await mappingModel.updateEntry(testEntryWithId.entryId!, updates);

            expect(result).toEqual(updatedEntry);
            expect(spy).toHaveBeenCalledWith(testEntryWithId.entryId!, updates);
        });

        it('devrait empêcher les mises à jour conflictuelles', async () => {
            const errorMessage = 'This MonMaster column is already mapped to a PV column';

            const spy = jest.spyOn(mappingModel, 'updateEntry');
            spy.mockRejectedValueOnce(new Error(errorMessage));

            const updates = { masterColumnIndex: 6 };

            await expect(mappingModel.updateEntry(testEntryWithId.entryId!, updates))
                .rejects
                .toThrow(errorMessage);

            expect(spy).toHaveBeenCalledWith(testEntryWithId.entryId!, updates);
        });

        it('devrait supprimer une entrée de mappage', async () => {

            mockedPool.query.mockResolvedValueOnce({
                rows: [{ configurationId: testConfigId }],
                rowCount: 1,
                command: '',
                oid: 0,
                fields: []
            } as QueryResult<any>);


            mockedPool.query.mockResolvedValueOnce({
                rows: [testEntryWithId],
                rowCount: 1,
                command: '',
                oid: 0,
                fields: []
            } as QueryResult<any>);


            mockedPool.query.mockResolvedValueOnce({
                rows: [],
                rowCount: 1,
                command: '',
                oid: 0,
                fields: []
            } as QueryResult<any>);

            const result = await mappingModel.deleteEntry(testEntryWithId.entryId!);

            expect(result).toBe(true);
            expect(mockedPool.query).toHaveBeenCalledTimes(3);
            expect(mockedPool.query).toHaveBeenNthCalledWith(
                2,
                expect.stringContaining('DELETE FROM "MappingEntries"'),
                [testEntryWithId.entryId]
            );
        });

        it('devrait retourner false lors de la suppression d\'une entrée inexistante', async () => {

            const spy = jest.spyOn(mappingModel, 'deleteEntry');
            spy.mockResolvedValueOnce(false);

            const result = await mappingModel.deleteEntry(999);

            expect(result).toBe(false);
            expect(spy).toHaveBeenCalledWith(999);
        });

        describe('updateEntry method tests', () => {


            it('devrait gérer correctement les mises à jour d\'entrée avec masterColumnIndex uniquement', async () => {

                mockedPool.query.mockResolvedValueOnce({
                    rows: [testEntryWithId],
                    rowCount: 1,
                    command: '',
                    oid: 0,
                    fields: []
                } as QueryResult<any>);


                mockedPool.query.mockResolvedValueOnce({
                    rows: [],
                    rowCount: 0,
                    command: '',
                    oid: 0,
                    fields: []
                } as QueryResult<any>);


                const updatedEntry = {
                    ...testEntryWithId,
                    masterColumnIndex: 10
                };
                mockedPool.query.mockResolvedValueOnce({
                    rows: [updatedEntry],
                    rowCount: 1,
                    command: '',
                    oid: 0,
                    fields: []
                } as QueryResult<any>);


                mockedPool.query.mockResolvedValueOnce({
                    rows: [],
                    rowCount: 1,
                    command: '',
                    oid: 0,
                    fields: []
                } as QueryResult<any>);

                const updates = { masterColumnIndex: 10 };
                const result = await mappingModel.updateEntry(testEntryWithId.entryId!, updates);

                expect(result).toEqual(updatedEntry);
                expect(mockedPool.query).toHaveBeenCalledTimes(4);

                expect(mockedPool.query).toHaveBeenNthCalledWith(
                    3,
                    expect.stringContaining('"masterColumnIndex" = $'),
                    expect.arrayContaining([10, testEntryWithId.entryId])
                );
            });

            it('devrait gérer correctement les mises à jour d\'entrée avec pvColumnIndex uniquement', async () => {

                mockedPool.query.mockResolvedValueOnce({
                    rows: [testEntryWithId],
                    rowCount: 1,
                    command: '',
                    oid: 0,
                    fields: []
                } as QueryResult<any>);


                mockedPool.query.mockResolvedValueOnce({
                    rows: [],
                    rowCount: 0,
                    command: '',
                    oid: 0,
                    fields: []
                } as QueryResult<any>);


                const updatedEntry = {
                    ...testEntryWithId,
                    pvColumnIndex: 12
                };
                mockedPool.query.mockResolvedValueOnce({
                    rows: [updatedEntry],
                    rowCount: 1,
                    command: '',
                    oid: 0,
                    fields: []
                } as QueryResult<any>);


                mockedPool.query.mockResolvedValueOnce({
                    rows: [],
                    rowCount: 1,
                    command: '',
                    oid: 0,
                    fields: []
                } as QueryResult<any>);

                const updates = { pvColumnIndex: 12 };
                const result = await mappingModel.updateEntry(testEntryWithId.entryId!, updates);

                expect(result).toEqual(updatedEntry);
                expect(mockedPool.query).toHaveBeenCalledTimes(4);

                expect(mockedPool.query).toHaveBeenNthCalledWith(
                    3,
                    expect.stringContaining('"pvColumnIndex" = $'),
                    expect.arrayContaining([12, testEntryWithId.entryId])
                );
            });

            it('devrait gérer correctement une mise à jour complète de tous les champs', async () => {

                mockedPool.query.mockResolvedValueOnce({
                    rows: [testEntryWithId],
                    rowCount: 1,
                    command: '',
                    oid: 0,
                    fields: []
                } as QueryResult<any>);


                mockedPool.query.mockResolvedValueOnce({
                    rows: [],
                    rowCount: 0,
                    command: '',
                    oid: 0,
                    fields: []
                } as QueryResult<any>);


                mockedPool.query.mockResolvedValueOnce({
                    rows: [],
                    rowCount: 0,
                    command: '',
                    oid: 0,
                    fields: []
                } as QueryResult<any>);


                const updatedEntry = {
                    ...testEntryWithId,
                    masterColumnIndex: 10,
                    masterColumnName: 'UpdatedMasterCol',
                    pvColumnIndex: 12,
                    pvColumnName: 'UpdatedPvCol'
                };
                mockedPool.query.mockResolvedValueOnce({
                    rows: [updatedEntry],
                    rowCount: 1,
                    command: '',
                    oid: 0,
                    fields: []
                } as QueryResult<any>);


                mockedPool.query.mockResolvedValueOnce({
                    rows: [],
                    rowCount: 1,
                    command: '',
                    oid: 0,
                    fields: []
                } as QueryResult<any>);

                const updates = {
                    masterColumnIndex: 10,
                    masterColumnName: 'UpdatedMasterCol',
                    pvColumnIndex: 12,
                    pvColumnName: 'UpdatedPvCol'
                };
                const result = await mappingModel.updateEntry(testEntryWithId.entryId!, updates);

                expect(result).toEqual(updatedEntry);
                expect(mockedPool.query).toHaveBeenCalledTimes(5);

                expect(mockedPool.query).toHaveBeenNthCalledWith(
                    4,
                    expect.stringMatching(/UPDATE "MappingEntries" SET "masterColumnIndex" = \$\d+, "masterColumnName" = \$\d+, "pvColumnIndex" = \$\d+, "pvColumnName" = \$\d+ WHERE "entryId" = \$\d+ RETURNING \*/),
                    expect.arrayContaining([10, 'UpdatedMasterCol', 12, 'UpdatedPvCol', testEntryWithId.entryId])
                );
            });

            it('devrait retourner null lorsque l\'entrée à mettre à jour n\'existe pas', async () => {

                mockedPool.query.mockResolvedValueOnce({
                    rows: [],
                    rowCount: 0,
                    command: '',
                    oid: 0,
                    fields: []
                } as QueryResult<any>);

                const updates = { masterColumnName: 'UpdatedName' };
                const result = await mappingModel.updateEntry(999, updates);

                expect(result).toBeNull();
                expect(mockedPool.query).toHaveBeenCalledTimes(1);
            });

            it('devrait retourner null lorsqu\'aucun champ à mettre à jour n\'est fourni', async () => {

                mockedPool.query.mockResolvedValueOnce({
                    rows: [testEntryWithId],
                    rowCount: 1,
                    command: '',
                    oid: 0,
                    fields: []
                } as QueryResult<any>);

                const updates = {};
                const result = await mappingModel.updateEntry(testEntryWithId.entryId!, updates);

                expect(result).toBeNull();
                expect(mockedPool.query).toHaveBeenCalledTimes(1);

            });

            it('devrait détecter les conflits de pvColumnIndex lors de la mise à jour', async () => {

                mockedPool.query.mockResolvedValueOnce({
                    rows: [testEntryWithId],
                    rowCount: 1,
                    command: '',
                    oid: 0,
                    fields: []
                } as QueryResult<any>);




                mockedPool.query.mockResolvedValueOnce({
                    rows: [{ entryId: 102, configurationId: testConfigId }],
                    rowCount: 1,
                    command: '',
                    oid: 0,
                    fields: []
                } as QueryResult<any>);

                const updates = { pvColumnIndex: 8 };

                await expect(mappingModel.updateEntry(testEntryWithId.entryId!, updates))
                    .rejects
                    .toThrow('This PV column is already mapped to a MonMaster column');

                expect(mockedPool.query).toHaveBeenCalledTimes(2);
            });

            it('devrait détecter les erreurs SQL lors de la mise à jour', async () => {

                mockedPool.query.mockResolvedValueOnce({
                    rows: [testEntryWithId],
                    rowCount: 1,
                    command: '',
                    oid: 0,
                    fields: []
                } as QueryResult<any>);


                mockedPool.query.mockResolvedValueOnce({
                    rows: [],
                    rowCount: 0,
                    command: '',
                    oid: 0,
                    fields: []
                } as QueryResult<any>);


                const error = new Error('Database error');
                mockedPool.query.mockRejectedValueOnce(error);

                const updates = { masterColumnIndex: 10 };

                await expect(mappingModel.updateEntry(testEntryWithId.entryId!, updates))
                    .rejects
                    .toThrow('Database error');

                expect(mockedPool.query).toHaveBeenCalledTimes(3);
            });

            it('devrait retourner null si l\'entrée mise à jour n\'est pas trouvée', async () => {

                mockedPool.query.mockResolvedValueOnce({
                    rows: [testEntryWithId],
                    rowCount: 1,
                    command: '',
                    oid: 0,
                    fields: []
                } as QueryResult<any>);


                mockedPool.query.mockResolvedValueOnce({
                    rows: [],
                    rowCount: 0,
                    command: '',
                    oid: 0,
                    fields: []
                } as QueryResult<any>);


                mockedPool.query.mockResolvedValueOnce({
                    rows: [],
                    rowCount: 0,
                    command: '',
                    oid: 0,
                    fields: []
                } as QueryResult<any>);

                const updates = { masterColumnIndex: 10 };
                const result = await mappingModel.updateEntry(testEntryWithId.entryId!, updates);

                expect(result).toBeNull();
                expect(mockedPool.query).toHaveBeenCalledTimes(3);
            });
        });
    });

    describe('Delete configuration', () => {
        it('devrait supprimer une configuration et toutes ses entrées', async () => {

            mockedPool.query.mockResolvedValueOnce({
                rows: [{ configurationId: testConfigId }],
                rowCount: 1,
                command: '',
                oid: 0,
                fields: []
            } as QueryResult<any>);

            const result = await mappingModel.deleteConfiguration(testConfigId);

            expect(result).toBe(true);
            expect(mockedPool.query).toHaveBeenCalledWith(
                expect.stringContaining('DELETE FROM "MappingConfigurations"'),
                [testConfigId]
            );
        });

        it('devrait retourner false lors de la suppression d\'une configuration inexistante', async () => {

            mockedPool.query.mockResolvedValueOnce({
                rows: [],
                rowCount: 0,
                command: '',
                oid: 0,
                fields: []
            } as QueryResult<any>);

            const result = await mappingModel.deleteConfiguration(9999);

            expect(result).toBe(false);
            expect(mockedPool.query).toHaveBeenCalledTimes(1);
        });
    });
});
