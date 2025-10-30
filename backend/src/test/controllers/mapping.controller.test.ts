import express, { Express } from 'express';
import request from 'supertest';
import { MappingController } from '../../controllers/mapping.controller';
import { MappingService } from '../../services/mapping.service';
import { AddMappingEntryRequest, MappingConfiguration, MappingEntry, UpdateMappingEntryRequest } from '../../types/mapping.types';


jest.mock('../../services/mapping.service');

describe('MappingController', () => {
    let app: Express;
    let mockService: jest.Mocked<MappingService>;


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
        createdDate: new Date('2023-01-01'),
        updatedDate: new Date('2023-01-01')
    };

    const testAddRequest: AddMappingEntryRequest = {
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


        app = express();
        app.use(express.json());


        mockService = new MappingService() as jest.Mocked<MappingService>;
        const controller = new MappingController();


        Object.defineProperty(controller, 'service', {
            value: mockService
        });


        app.post('/api/mapping/entries', (req, res) => controller.addMappingEntry(req, res));
        app.put('/api/mapping/entries/:entryId', (req, res) => controller.updateMappingEntry(req, res));
        app.delete('/api/mapping/entries/:entryId', (req, res) => controller.deleteMappingEntry(req, res));
        app.delete('/api/mapping/configurations/:configId', (req, res) => controller.deleteMappingConfiguration(req, res));
        app.get('/api/mapping/configurations', (req, res) => controller.getMappingConfiguration(req, res));
        app.get('/api/mapping/configurations/:configId', (req, res) => controller.getMappingConfigurationById(req, res));
    });

    describe('addMappingEntry', () => {
        it('devrait créer une nouvelle entrée de mappage et retourner 201', async () => {

            mockService.addMappingEntry = jest.fn().mockResolvedValueOnce(testMappingEntry);


            const response = await request(app)
                .post('/api/mapping/entries')
                .send(testAddRequest)
                .expect(201);


            expect(response.body).toEqual(testMappingEntry);
            expect(mockService.addMappingEntry).toHaveBeenCalledWith(testAddRequest);
        });

        it('devrait retourner 400 si des champs requis sont manquants', async () => {

            const response = await request(app)
                .post('/api/mapping/entries')
                .send({
                    monmasterFileId: testMonmasterFileId,

                    masterColumnIndex: 5,
                    masterColumnName: 'TestMasterColumn',
                    pvColumnIndex: 5,
                    pvColumnName: 'TestPvColumn'
                })
                .expect(400);


            expect(response.body).toHaveProperty('error');
            expect(mockService.addMappingEntry).not.toHaveBeenCalled();
        });

        it('devrait retourner 409 en cas de conflit de mappage', async () => {

            mockService.addMappingEntry = jest.fn().mockRejectedValueOnce(
                new Error('This MonMaster column is already mapped to a PV column')
            );


            const response = await request(app)
                .post('/api/mapping/entries')
                .send(testAddRequest)
                .expect(409);


            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toBe('This MonMaster column is already mapped to a PV column');
            expect(mockService.addMappingEntry).toHaveBeenCalledWith(testAddRequest);
        });

        it('devrait retourner 500 en cas d\'erreur serveur', async () => {

            mockService.addMappingEntry = jest.fn().mockRejectedValueOnce(new Error('Database error'));


            const response = await request(app)
                .post('/api/mapping/entries')
                .send(testAddRequest)
                .expect(500);


            expect(response.body).toHaveProperty('error');
            expect(mockService.addMappingEntry).toHaveBeenCalledWith(testAddRequest);
        });


        it('devrait gérer les erreurs de violation de contrainte unique pour les colonnes MonMaster', async () => {

            const constraintError: any = new Error('Duplicate key value violates unique constraint');
            constraintError.code = '23505';
            constraintError.constraint = 'uq_master_column_mapping';

            mockService.addMappingEntry = jest.fn().mockRejectedValueOnce(constraintError);

            const response = await request(app)
                .post('/api/mapping/entries')
                .send(testAddRequest)
                .expect(409);

            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toBe('This MonMaster column is already mapped to a PV column');
            expect(mockService.addMappingEntry).toHaveBeenCalledWith(testAddRequest);
        });

        it('devrait gérer les erreurs de violation de contrainte unique pour les colonnes PV', async () => {

            const constraintError: any = new Error('Duplicate key value violates unique constraint');
            constraintError.code = '23505';
            constraintError.constraint = 'uq_pv_column_mapping';

            mockService.addMappingEntry = jest.fn().mockRejectedValueOnce(constraintError);

            const response = await request(app)
                .post('/api/mapping/entries')
                .send(testAddRequest)
                .expect(409);

            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toBe('This PV column is already mapped to a MonMaster column');
            expect(mockService.addMappingEntry).toHaveBeenCalledWith(testAddRequest);
        });
    });

    describe('updateMappingEntry', () => {
        it('devrait mettre à jour une entrée existante et retourner 200', async () => {

            const updatedEntry = {
                ...testMappingEntry,
                masterColumnName: testUpdateRequest.masterColumnName,
                pvColumnName: testUpdateRequest.pvColumnName
            };


            mockService.updateMappingEntry = jest.fn().mockResolvedValueOnce(updatedEntry);


            const response = await request(app)
                .put(`/api/mapping/entries/${testEntryId}`)
                .send(testUpdateRequest)
                .expect(200);


            expect(response.body).toEqual(updatedEntry);
            expect(mockService.updateMappingEntry).toHaveBeenCalledWith(testEntryId, testUpdateRequest);
        });

        it('devrait retourner 400 pour un ID d\'entrée invalide', async () => {

            const response = await request(app)
                .put('/api/mapping/entries/invalid-id')
                .send(testUpdateRequest)
                .expect(400);


            expect(response.body).toHaveProperty('error');
            expect(mockService.updateMappingEntry).not.toHaveBeenCalled();
        });

        it('devrait retourner 404 si l\'entrée n\'existe pas', async () => {

            mockService.updateMappingEntry = jest.fn().mockResolvedValueOnce(null);


            const response = await request(app)
                .put(`/api/mapping/entries/${testEntryId}`)
                .send(testUpdateRequest)
                .expect(404);


            expect(response.body).toHaveProperty('error');
            expect(mockService.updateMappingEntry).toHaveBeenCalledWith(testEntryId, testUpdateRequest);
        });

        it('devrait retourner 409 en cas de conflit de mappage', async () => {

            mockService.updateMappingEntry = jest.fn().mockRejectedValueOnce(
                new Error('This MonMaster column is already mapped to a PV column')
            );


            const response = await request(app)
                .put(`/api/mapping/entries/${testEntryId}`)
                .send(testUpdateRequest)
                .expect(409);


            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toBe('This MonMaster column is already mapped to a PV column');
        });


        it('devrait gérer les erreurs de violation de contrainte unique lors de la mise à jour pour les colonnes MonMaster', async () => {

            const constraintError: any = new Error('Duplicate key value violates unique constraint');
            constraintError.code = '23505';
            constraintError.constraint = 'uq_master_column_mapping';

            mockService.updateMappingEntry = jest.fn().mockRejectedValueOnce(constraintError);

            const response = await request(app)
                .put(`/api/mapping/entries/${testEntryId}`)
                .send(testUpdateRequest)
                .expect(409);

            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toBe('This MonMaster column is already mapped to a PV column');
            expect(mockService.updateMappingEntry).toHaveBeenCalledWith(testEntryId, testUpdateRequest);
        });

        it('devrait gérer les erreurs de violation de contrainte unique lors de la mise à jour pour les colonnes PV', async () => {

            const constraintError: any = new Error('Duplicate key value violates unique constraint');
            constraintError.code = '23505';
            constraintError.constraint = 'uq_pv_column_mapping';

            mockService.updateMappingEntry = jest.fn().mockRejectedValueOnce(constraintError);

            const response = await request(app)
                .put(`/api/mapping/entries/${testEntryId}`)
                .send(testUpdateRequest)
                .expect(409);

            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toBe('This PV column is already mapped to a MonMaster column');
            expect(mockService.updateMappingEntry).toHaveBeenCalledWith(testEntryId, testUpdateRequest);
        });

        it('devrait gérer une erreur 500 interne lors de la mise à jour', async () => {

            mockService.updateMappingEntry = jest.fn().mockRejectedValueOnce(new Error('Database connection failed'));

            const response = await request(app)
                .put(`/api/mapping/entries/${testEntryId}`)
                .send(testUpdateRequest)
                .expect(500);

            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toBe('Failed to update mapping entry');
            expect(mockService.updateMappingEntry).toHaveBeenCalledWith(testEntryId, testUpdateRequest);
        });
    });

    describe('deleteMappingEntry', () => {
        it('devrait supprimer une entrée et retourner 204', async () => {

            mockService.deleteMappingEntry = jest.fn().mockResolvedValueOnce(true);


            await request(app)
                .delete(`/api/mapping/entries/${testEntryId}`)
                .expect(204);


            expect(mockService.deleteMappingEntry).toHaveBeenCalledWith(testEntryId);
        });

        it('devrait retourner 400 pour un ID d\'entrée invalide', async () => {

            const response = await request(app)
                .delete('/api/mapping/entries/invalid-id')
                .expect(400);


            expect(response.body).toHaveProperty('error');
            expect(mockService.deleteMappingEntry).not.toHaveBeenCalled();
        });

        it('devrait retourner 404 si l\'entrée n\'existe pas', async () => {

            mockService.deleteMappingEntry = jest.fn().mockResolvedValueOnce(false);


            const response = await request(app)
                .delete(`/api/mapping/entries/${testEntryId}`)
                .expect(404);


            expect(response.body).toHaveProperty('error');
            expect(mockService.deleteMappingEntry).toHaveBeenCalledWith(testEntryId);
        });

        it('devrait retourner 500 en cas d\'erreur serveur', async () => {

            mockService.deleteMappingEntry = jest.fn().mockRejectedValueOnce(new Error('Database error'));


            const response = await request(app)
                .delete(`/api/mapping/entries/${testEntryId}`)
                .expect(500);


            expect(response.body).toHaveProperty('error');
            expect(mockService.deleteMappingEntry).toHaveBeenCalledWith(testEntryId);
        });
    });

    describe('deleteMappingConfiguration', () => {
        it('devrait supprimer une configuration et retourner 204', async () => {

            mockService.deleteMappingConfiguration = jest.fn().mockResolvedValueOnce(true);


            await request(app)
                .delete(`/api/mapping/configurations/${testConfigId}`)
                .expect(204);


            expect(mockService.deleteMappingConfiguration).toHaveBeenCalledWith(testConfigId);
        });

        it('devrait retourner 400 pour un ID de configuration invalide', async () => {

            const response = await request(app)
                .delete('/api/mapping/configurations/invalid-id')
                .expect(400);


            expect(response.body).toHaveProperty('error');
            expect(mockService.deleteMappingConfiguration).not.toHaveBeenCalled();
        });

        it('devrait retourner 404 si la configuration n\'existe pas', async () => {

            mockService.deleteMappingConfiguration = jest.fn().mockResolvedValueOnce(false);


            const response = await request(app)
                .delete(`/api/mapping/configurations/${testConfigId}`)
                .expect(404);


            expect(response.body).toHaveProperty('error');
            expect(mockService.deleteMappingConfiguration).toHaveBeenCalledWith(testConfigId);
        });

        it('devrait gérer une erreur 500 lors de la suppression d\'une configuration', async () => {

            mockService.deleteMappingConfiguration = jest.fn().mockRejectedValueOnce(new Error('Database error'));

            const response = await request(app)
                .delete(`/api/mapping/configurations/${testConfigId}`)
                .expect(500);

            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toBe('Failed to delete mapping configuration');
            expect(mockService.deleteMappingConfiguration).toHaveBeenCalledWith(testConfigId);
        });
    });

    describe('getMappingConfiguration', () => {
        it('devrait récupérer une configuration par IDs de fichier et retourner 200', async () => {

            mockService.getMappingConfiguration = jest.fn().mockResolvedValueOnce(testConfig);


            const response = await request(app)
                .get('/api/mapping/configurations')
                .query({
                    monmasterFileId: testMonmasterFileId,
                    pvFileId: testPvFileId
                })
                .expect(200);


            expect(response.body).toEqual({
                ...testConfig,
                createdDate: testConfig.createdDate!.toISOString(),
                updatedDate: testConfig.updatedDate!.toISOString()
            });
            expect(mockService.getMappingConfiguration).toHaveBeenCalledWith(
                testMonmasterFileId,
                testPvFileId
            );
        });

        it('devrait retourner 400 pour des IDs de fichier invalides', async () => {

            const response = await request(app)
                .get('/api/mapping/configurations')
                .query({
                    monmasterFileId: 'invalid',
                    pvFileId: testPvFileId
                })
                .expect(400);


            expect(response.body).toHaveProperty('error');
            expect(mockService.getMappingConfiguration).not.toHaveBeenCalled();
        });

        it('devrait retourner 404 si la configuration n\'existe pas', async () => {

            mockService.getMappingConfiguration = jest.fn().mockResolvedValueOnce(null);


            const response = await request(app)
                .get('/api/mapping/configurations')
                .query({
                    monmasterFileId: 999,
                    pvFileId: 999
                })
                .expect(404);


            expect(response.body).toHaveProperty('error');
            expect(mockService.getMappingConfiguration).toHaveBeenCalledWith(999, 999);
        });

        it('devrait gérer une erreur 500 lors de la récupération d\'une configuration par IDs', async () => {

            mockService.getMappingConfiguration = jest.fn().mockRejectedValueOnce(new Error('Database error'));

            const response = await request(app)
                .get('/api/mapping/configurations')
                .query({
                    monmasterFileId: testMonmasterFileId,
                    pvFileId: testPvFileId
                })
                .expect(500);

            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toBe('Failed to get mapping configuration');
            expect(mockService.getMappingConfiguration).toHaveBeenCalledWith(testMonmasterFileId, testPvFileId);
        });
    });

    describe('getMappingConfigurationById', () => {
        it('devrait récupérer une configuration par ID et retourner 200', async () => {

            mockService.getMappingConfigurationById = jest.fn().mockResolvedValueOnce(testConfig);


            const response = await request(app)
                .get(`/api/mapping/configurations/${testConfigId}`)
                .expect(200);


            expect(response.body).toEqual({
                ...testConfig,
                createdDate: testConfig.createdDate!.toISOString(),
                updatedDate: testConfig.updatedDate!.toISOString()
            });
            expect(mockService.getMappingConfigurationById).toHaveBeenCalledWith(testConfigId);
        });

        it('devrait retourner 400 pour un ID de configuration invalide', async () => {

            const response = await request(app)
                .get('/api/mapping/configurations/invalid-id')
                .expect(400);


            expect(response.body).toHaveProperty('error');
            expect(mockService.getMappingConfigurationById).not.toHaveBeenCalled();
        });

        it('devrait retourner 404 si la configuration n\'existe pas', async () => {

            mockService.getMappingConfigurationById = jest.fn().mockResolvedValueOnce(null);


            const response = await request(app)
                .get(`/api/mapping/configurations/${testConfigId}`)
                .expect(404);


            expect(response.body).toHaveProperty('error');
            expect(mockService.getMappingConfigurationById).toHaveBeenCalledWith(testConfigId);
        });

        it('devrait gérer une erreur 500 lors de la récupération d\'une configuration par ID', async () => {

            mockService.getMappingConfigurationById = jest.fn().mockRejectedValueOnce(new Error('Database error'));

            const response = await request(app)
                .get(`/api/mapping/configurations/${testConfigId}`)
                .expect(500);

            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toBe('Failed to get mapping configuration');
            expect(mockService.getMappingConfigurationById).toHaveBeenCalledWith(testConfigId);
        });
    });
});
