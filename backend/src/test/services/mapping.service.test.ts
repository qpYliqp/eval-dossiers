import { MappingService } from '../../services/mapping.service';
import { MappingModel } from '../../models/mapping.model';
import { AddMappingEntryRequest, MappingConfiguration, MappingEntry, UpdateMappingEntryRequest } from '../../types/mapping.types';


jest.mock('../../models/mapping.model');

describe('MappingService', () => {
    let service: MappingService;

    const MockedMappingModel = MappingModel as jest.MockedClass<typeof MappingModel>;


    const testMonmasterFileId = 1;
    const testPvFileId = 4;
    const testConfigId = 1001;
    const testEntryId = 101;

    const testMappingEntry: MappingEntry = {
        entryId: testEntryId,
        configurationId: testConfigId,
        masterColumnIndex: 5,
        masterColumnName: 'TestMasterColumn',
        pvColumnIndex: 5,
        pvColumnName: 'TestPvColumn'
    };

    const testConfig: MappingConfiguration = {
        configurationId: testConfigId,
        monmasterFileId: testMonmasterFileId,
        pvFileId: testPvFileId,
        entries: [testMappingEntry],
        createdDate: new Date(),
        updatedDate: new Date()
    };

    const testAddMappingEntryRequest: AddMappingEntryRequest = {
        monmasterFileId: testMonmasterFileId,
        pvFileId: testPvFileId,
        masterColumnIndex: 5,
        masterColumnName: 'TestMasterColumn',
        pvColumnIndex: 5,
        pvColumnName: 'TestPvColumn'
    };

    const testUpdateRequest: UpdateMappingEntryRequest = {
        masterColumnName: 'UpdatedColumn',
        pvColumnName: 'UpdatedPvColumn'
    };

    beforeEach(() => {

        jest.clearAllMocks();


        service = new MappingService();
    });

    describe('addMappingEntry', () => {
        it('devrait ajouter une entrée de mappage lorsque la configuration existe', async () => {

            MockedMappingModel.prototype.getConfiguration.mockResolvedValueOnce(testConfig);
            MockedMappingModel.prototype.addEntry.mockResolvedValueOnce(testMappingEntry);

            const result = await service.addMappingEntry(testAddMappingEntryRequest);

            expect(MockedMappingModel.prototype.getConfiguration).toHaveBeenCalledWith(
                testMonmasterFileId,
                testPvFileId
            );

            expect(MockedMappingModel.prototype.addEntry).toHaveBeenCalledWith({
                configurationId: testConfigId,
                masterColumnIndex: testAddMappingEntryRequest.masterColumnIndex,
                masterColumnName: testAddMappingEntryRequest.masterColumnName,
                pvColumnIndex: testAddMappingEntryRequest.pvColumnIndex,
                pvColumnName: testAddMappingEntryRequest.pvColumnName
            });

            expect(result).toEqual(testMappingEntry);
        });

        it('devrait créer une nouvelle configuration lorsqu\'elle n\'existe pas', async () => {

            MockedMappingModel.prototype.getConfiguration.mockResolvedValueOnce(null);
            MockedMappingModel.prototype.createConfiguration.mockResolvedValueOnce(testConfigId);
            MockedMappingModel.prototype.addEntry.mockResolvedValueOnce(testMappingEntry);

            const result = await service.addMappingEntry(testAddMappingEntryRequest);

            expect(MockedMappingModel.prototype.getConfiguration).toHaveBeenCalledWith(
                testMonmasterFileId,
                testPvFileId
            );

            expect(MockedMappingModel.prototype.createConfiguration).toHaveBeenCalledWith(
                testMonmasterFileId,
                testPvFileId
            );

            expect(MockedMappingModel.prototype.addEntry).toHaveBeenCalledWith({
                configurationId: testConfigId,
                masterColumnIndex: testAddMappingEntryRequest.masterColumnIndex,
                masterColumnName: testAddMappingEntryRequest.masterColumnName,
                pvColumnIndex: testAddMappingEntryRequest.pvColumnIndex,
                pvColumnName: testAddMappingEntryRequest.pvColumnName
            });

            expect(result).toEqual(testMappingEntry);
        });

        it('devrait propager les erreurs du référentiel', async () => {
            const errorMessage = 'This MonMaster column is already mapped to a PV column';


            MockedMappingModel.prototype.getConfiguration.mockResolvedValueOnce(testConfig);
            MockedMappingModel.prototype.addEntry.mockRejectedValueOnce(new Error(errorMessage));

            await expect(service.addMappingEntry(testAddMappingEntryRequest))
                .rejects
                .toThrow(errorMessage);
        });
    });

    describe('updateMappingEntry', () => {
        it('devrait mettre à jour une entrée de mappage', async () => {
            const updatedEntry = {
                ...testMappingEntry,
                masterColumnName: 'UpdatedColumn',
                pvColumnName: 'UpdatedPvColumn'
            };


            MockedMappingModel.prototype.updateEntry.mockResolvedValueOnce(updatedEntry);

            const result = await service.updateMappingEntry(testEntryId, testUpdateRequest);

            expect(MockedMappingModel.prototype.updateEntry).toHaveBeenCalledWith(
                testEntryId,
                testUpdateRequest
            );

            expect(result).toEqual(updatedEntry);
        });

        it('devrait retourner null lorsque l\'entrée n\'est pas trouvée', async () => {

            MockedMappingModel.prototype.updateEntry.mockResolvedValueOnce(null);

            const result = await service.updateMappingEntry(999, testUpdateRequest);

            expect(MockedMappingModel.prototype.updateEntry).toHaveBeenCalledWith(
                999,
                testUpdateRequest
            );

            expect(result).toBeNull();
        });

        it('devrait propager les erreurs du référentiel', async () => {
            const errorMessage = 'This MonMaster column is already mapped to a PV column';


            MockedMappingModel.prototype.updateEntry.mockRejectedValueOnce(new Error(errorMessage));

            await expect(service.updateMappingEntry(testEntryId, testUpdateRequest))
                .rejects
                .toThrow(errorMessage);
        });
    });

    describe('deleteMappingEntry', () => {
        it('devrait supprimer une entrée de mappage', async () => {

            MockedMappingModel.prototype.deleteEntry.mockResolvedValueOnce(true);

            const result = await service.deleteMappingEntry(testEntryId);

            expect(MockedMappingModel.prototype.deleteEntry).toHaveBeenCalledWith(testEntryId);
            expect(result).toBe(true);
        });

        it('devrait retourner false lorsque l\'entrée n\'est pas trouvée', async () => {

            MockedMappingModel.prototype.deleteEntry.mockResolvedValueOnce(false);

            const result = await service.deleteMappingEntry(999);

            expect(MockedMappingModel.prototype.deleteEntry).toHaveBeenCalledWith(999);
            expect(result).toBe(false);
        });
    });

    describe('deleteMappingConfiguration', () => {
        it('devrait supprimer une configuration de mappage', async () => {

            MockedMappingModel.prototype.deleteConfiguration.mockResolvedValueOnce(true);

            const result = await service.deleteMappingConfiguration(testConfigId);

            expect(MockedMappingModel.prototype.deleteConfiguration).toHaveBeenCalledWith(testConfigId);
            expect(result).toBe(true);
        });

        it('devrait retourner false lorsque la configuration n\'est pas trouvée', async () => {

            MockedMappingModel.prototype.deleteConfiguration.mockResolvedValueOnce(false);

            const result = await service.deleteMappingConfiguration(999);

            expect(MockedMappingModel.prototype.deleteConfiguration).toHaveBeenCalledWith(999);
            expect(result).toBe(false);
        });
    });

    describe('getMappingConfiguration', () => {
        it('devrait obtenir une configuration de mappage par les IDs de fichiers monmaster et pv', async () => {

            MockedMappingModel.prototype.getConfiguration.mockResolvedValueOnce(testConfig);

            const result = await service.getMappingConfiguration(testMonmasterFileId, testPvFileId);

            expect(MockedMappingModel.prototype.getConfiguration).toHaveBeenCalledWith(
                testMonmasterFileId,
                testPvFileId
            );

            expect(result).toEqual(testConfig);
        });

        it('devrait retourner null lorsque la configuration n\'est pas trouvée', async () => {

            MockedMappingModel.prototype.getConfiguration.mockResolvedValueOnce(null);

            const result = await service.getMappingConfiguration(999, 999);

            expect(MockedMappingModel.prototype.getConfiguration).toHaveBeenCalledWith(999, 999);
            expect(result).toBeNull();
        });
    });

    describe('getMappingConfigurationById', () => {
        it('devrait obtenir une configuration de mappage par ID', async () => {

            MockedMappingModel.prototype.getConfigurationById.mockResolvedValueOnce(testConfig);

            const result = await service.getMappingConfigurationById(testConfigId);

            expect(MockedMappingModel.prototype.getConfigurationById).toHaveBeenCalledWith(testConfigId);
            expect(result).toEqual(testConfig);
        });

        it('devrait retourner null lorsque la configuration n\'est pas trouvée', async () => {

            MockedMappingModel.prototype.getConfigurationById.mockResolvedValueOnce(null);

            const result = await service.getMappingConfigurationById(999);

            expect(MockedMappingModel.prototype.getConfigurationById).toHaveBeenCalledWith(999);
            expect(result).toBeNull();
        });
    });
});
