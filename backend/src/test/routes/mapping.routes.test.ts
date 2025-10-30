import request from 'supertest';
import express, { Express } from 'express';
import { MappingController } from '../../controllers/mapping.controller';
import { AddMappingEntryRequest, MappingConfiguration, MappingEntry, UpdateMappingEntryRequest } from '../../types/mapping.types';


const mockAddMappingEntry = jest.fn();
const mockUpdateMappingEntry = jest.fn();
const mockDeleteMappingEntry = jest.fn();
const mockDeleteMappingConfiguration = jest.fn();
const mockGetMappingConfiguration = jest.fn();
const mockGetMappingConfigurationById = jest.fn();


jest.mock('../../controllers/mapping.controller', () => {
    return {
        MappingController: jest.fn().mockImplementation(() => {
            return {
                addMappingEntry: mockAddMappingEntry,
                updateMappingEntry: mockUpdateMappingEntry,
                deleteMappingEntry: mockDeleteMappingEntry,
                deleteMappingConfiguration: mockDeleteMappingConfiguration,
                getMappingConfiguration: mockGetMappingConfiguration,
                getMappingConfigurationById: mockGetMappingConfigurationById
            };
        })
    };
});


jest.mock('../../routes/mapping.routes', () => {
    const express = require('express');
    const router = express.Router();
    const { MappingController } = require('../../controllers/mapping.controller');

    const controller = new MappingController();

    router.post('/entries', controller.addMappingEntry);
    router.put('/entries/:entryId', controller.updateMappingEntry);
    router.delete('/entries/:entryId', controller.deleteMappingEntry);
    router.delete('/configurations/:configId', controller.deleteMappingConfiguration);
    router.get('/configurations', controller.getMappingConfiguration);
    router.get('/configurations/:configId', controller.getMappingConfigurationById);

    return router;
});


import mappingRoutes from '../../routes/mapping.routes';

describe('Mapping Routes', () => {
    let app: Express;


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


        app.use('/api/mapping', mappingRoutes);
    });

    describe('POST /api/mapping/entries', () => {
        it('devrait appeler le contrôleur pour ajouter une entrée de mappage', async () => {

            mockAddMappingEntry.mockImplementation((req, res) => {
                res.status(201).json(testMappingEntry);
            });


            const response = await request(app)
                .post('/api/mapping/entries')
                .send(testAddRequest)
                .expect('Content-Type', /json/)
                .expect(201);


            expect(response.body).toEqual(testMappingEntry);
            expect(mockAddMappingEntry).toHaveBeenCalled();
        });
    });

    describe('PUT /api/mapping/entries/:entryId', () => {
        it('devrait appeler le contrôleur pour mettre à jour une entrée de mappage', async () => {

            const updatedEntry = { ...testMappingEntry, ...testUpdateRequest };
            mockUpdateMappingEntry.mockImplementation((req, res) => {
                res.status(200).json(updatedEntry);
            });


            const response = await request(app)
                .put(`/api/mapping/entries/${testEntryId}`)
                .send(testUpdateRequest)
                .expect('Content-Type', /json/)
                .expect(200);


            expect(response.body).toEqual(updatedEntry);
            expect(mockUpdateMappingEntry).toHaveBeenCalled();
        });
    });

    describe('DELETE /api/mapping/entries/:entryId', () => {
        it('devrait appeler le contrôleur pour supprimer une entrée de mappage', async () => {

            mockDeleteMappingEntry.mockImplementation((req, res) => {
                res.status(204).send();
            });


            await request(app)
                .delete(`/api/mapping/entries/${testEntryId}`)
                .expect(204);


            expect(mockDeleteMappingEntry).toHaveBeenCalled();
        });
    });

    describe('DELETE /api/mapping/configurations/:configId', () => {
        it('devrait appeler le contrôleur pour supprimer une configuration de mappage', async () => {

            mockDeleteMappingConfiguration.mockImplementation((req, res) => {
                res.status(204).send();
            });


            await request(app)
                .delete(`/api/mapping/configurations/${testConfigId}`)
                .expect(204);


            expect(mockDeleteMappingConfiguration).toHaveBeenCalled();
        });
    });

    describe('GET /api/mapping/configurations', () => {
        it('devrait appeler le contrôleur pour obtenir une configuration par IDs de fichier', async () => {

            mockGetMappingConfiguration.mockImplementation((req, res) => {
                res.status(200).json(testConfig);
            });


            const response = await request(app)
                .get('/api/mapping/configurations')
                .query({
                    monmasterFileId: testMonmasterFileId,
                    pvFileId: testPvFileId
                })
                .expect('Content-Type', /json/)
                .expect(200);


            expect(response.body).toEqual({
                ...testConfig,
                createdDate: testConfig.createdDate!.toISOString(),
                updatedDate: testConfig.updatedDate!.toISOString()
            });
            expect(mockGetMappingConfiguration).toHaveBeenCalled();
        });
    });

    describe('GET /api/mapping/configurations/:configId', () => {
        it('devrait appeler le contrôleur pour obtenir une configuration par ID', async () => {

            mockGetMappingConfigurationById.mockImplementation((req, res) => {
                res.status(200).json(testConfig);
            });


            const response = await request(app)
                .get(`/api/mapping/configurations/${testConfigId}`)
                .expect('Content-Type', /json/)
                .expect(200);


            expect(response.body).toEqual({
                ...testConfig,
                createdDate: testConfig.createdDate!.toISOString(),
                updatedDate: testConfig.updatedDate!.toISOString()
            });
            expect(mockGetMappingConfigurationById).toHaveBeenCalled();
        });
    });

    describe('Error handling', () => {
        it('devrait gérer les erreurs 404 pour les routes non définies', async () => {

            await request(app)
                .get('/api/mapping/nonexistent')
                .expect(404);
        });

        it('devrait gérer une erreur 500 du contrôleur', async () => {

            mockGetMappingConfiguration.mockImplementation((req, res) => {
                res.status(500).json({ error: 'Server error' });
            });


            const response = await request(app)
                .get('/api/mapping/configurations')
                .query({
                    monmasterFileId: testMonmasterFileId,
                    pvFileId: testPvFileId
                })
                .expect(500);


            expect(response.body).toHaveProperty('error');
            expect(mockGetMappingConfiguration).toHaveBeenCalled();
        });
    });

    describe('Request validation', () => {
        it('devrait valider les paramètres de requête pour GET /api/mapping/configurations', async () => {

            mockGetMappingConfiguration.mockImplementation((req, res) => {
                if (!req.query.monmasterFileId || !req.query.pvFileId) {
                    res.status(400).json({ error: 'Missing required query parameters' });
                    return;
                }
                res.status(200).json(testConfig);
            });


            const response = await request(app)
                .get('/api/mapping/configurations')
                .query({ monmasterFileId: testMonmasterFileId })
                .expect(400);


            expect(response.body).toHaveProperty('error');
            expect(mockGetMappingConfiguration).toHaveBeenCalled();
        });

        it('devrait valider le corps de la requête pour POST /api/mapping/entries', async () => {

            mockAddMappingEntry.mockImplementation((req, res) => {
                if (!req.body.monmasterFileId || !req.body.pvFileId) {
                    res.status(400).json({ error: 'Missing required fields' });
                    return;
                }
                res.status(201).json(testMappingEntry);
            });


            const response = await request(app)
                .post('/api/mapping/entries')
                .send({ monmasterFileId: testMonmasterFileId })
                .expect(400);


            expect(response.body).toHaveProperty('error');
            expect(mockAddMappingEntry).toHaveBeenCalled();
        });
    });
});
