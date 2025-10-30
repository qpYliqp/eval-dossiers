import request from 'supertest';
import express from 'express';
import router from '../../routes/master-program.routes';
import { createMasterProgram, deleteMasterProgram, getAllMasterPrograms, getMasterProgramById, updateMasterProgram } from '../../controllers/master-program.controller';

jest.mock('../../controllers/master-program.controller');

const app = express();
app.use(express.json());
app.use('/api/master-programs', router);

describe('Routes des programmes de master', () => {
    const mockCreateMasterProgram = createMasterProgram as jest.MockedFunction<typeof createMasterProgram>;
    const mockDeleteMasterProgram = deleteMasterProgram as jest.MockedFunction<typeof deleteMasterProgram>;
    const mockGetAllMasterPrograms = getAllMasterPrograms as jest.MockedFunction<typeof getAllMasterPrograms>;
    const mockGetMasterProgramById = getMasterProgramById as jest.MockedFunction<typeof getMasterProgramById>;
    const mockUpdateMasterProgram = updateMasterProgram as jest.MockedFunction<typeof updateMasterProgram>;

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /api/master-programs', () => {
        test('devrait créer un nouveau programme de master', async () => {
            const mockProgram = {
                masterId: 1,
                masterName: 'Espace A',
                academicUnit: 'UF Informatique',
                createdDate: '2025-02-19T18:20:24.315Z',
            };

            mockCreateMasterProgram.mockImplementationOnce(async (req, res) => {
                res.status(201).json(mockProgram);
            });

            const response = await request(app)
                .post('/api/master-programs')
                .send({
                    masterName: 'Espace A',
                    academicUnit: 'UF Informatique',
                });

            expect(response.status).toBe(201);
            expect(response.body).toEqual(mockProgram);
        });

        test('devrait retourner 400 si des champs obligatoires sont manquants', async () => {
            mockCreateMasterProgram.mockImplementationOnce(async (req, res) => {
                res.status(400).json({ message: 'Tous les champs sont obligatoires' });
            });

            const response = await request(app)
                .post('/api/master-programs')
                .send({ masterName: 'Espace A' });

            expect(response.status).toBe(400);
            expect(response.body.message).toBe('Tous les champs sont obligatoires');
        });

        test('devrait retourner 500 en cas d\'erreur serveur', async () => {
            mockCreateMasterProgram.mockImplementationOnce(async (req, res) => {
                res.status(500).json({ message: 'Erreur interne du serveur' });
            });

            const response = await request(app)
                .post('/api/master-programs')
                .send({
                    masterName: 'Espace A',
                    academicUnit: 'UF Informatique',
                });

            expect(response.status).toBe(500);
            expect(response.body.message).toBe('Erreur interne du serveur');
        });
    });

    describe('DELETE /api/master-programs/:id', () => {
        test('devrait supprimer un programme de master', async () => {
            mockDeleteMasterProgram.mockImplementationOnce(async (req, res) => {
                res.status(200).json({ message: 'Programme de master supprimé avec succès' });
            });

            const response = await request(app).delete('/api/master-programs/1');

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Programme de master supprimé avec succès');
        });

        test('devrait retourner 404 si le programme de master n\'est pas trouvé', async () => {
            mockDeleteMasterProgram.mockImplementationOnce(async (req, res) => {
                res.status(404).json({ message: 'Programme de master non trouvé' });
            });

            const response = await request(app).delete('/api/master-programs/999');

            expect(response.status).toBe(404);
            expect(response.body.message).toBe('Programme de master non trouvé');
        });
    });

    describe('GET /api/master-programs', () => {
        test('devrait retourner tous les programmes de master', async () => {
            const mockPrograms = [
                { masterId: 1, masterName: 'Espace A', academicUnit: 'UF Informatique' },
                { masterId: 2, masterName: 'Espace B', academicUnit: 'UF Mathématiques' },
            ];

            mockGetAllMasterPrograms.mockImplementationOnce(async (req, res) => {
                res.status(200).json(mockPrograms);
            });

            const response = await request(app).get('/api/master-programs');

            expect(response.status).toBe(200);
            expect(response.body).toEqual(mockPrograms);
        });

        test('devrait retourner 500 en cas d\'erreur serveur', async () => {
            mockGetAllMasterPrograms.mockImplementationOnce(async (req, res) => {
                res.status(500).json({ message: 'Erreur interne du serveur' });
            });

            const response = await request(app).get('/api/master-programs');

            expect(response.status).toBe(500);
            expect(response.body.message).toBe('Erreur interne du serveur');
        });
    });

    describe('GET /api/master-programs/:id', () => {
        test('devrait retourner un programme de master par ID', async () => {
            const mockProgram = { masterId: 1, masterName: 'Espace A', academicUnit: 'UF Informatique' };

            mockGetMasterProgramById.mockImplementationOnce(async (req, res) => {
                res.status(200).json(mockProgram);
            });

            const response = await request(app).get('/api/master-programs/1');

            expect(response.status).toBe(200);
            expect(response.body).toEqual(mockProgram);
        });

        test('devrait retourner 404 si le programme de master n\'est pas trouvé', async () => {
            mockGetMasterProgramById.mockImplementationOnce(async (req, res) => {
                res.status(404).json({ message: 'Programme de master non trouvé' });
            });

            const response = await request(app).get('/api/master-programs/999');

            expect(response.status).toBe(404);
            expect(response.body.message).toBe('Programme de master non trouvé');
        });
    });

    describe('PUT /api/master-programs/:id', () => {
        test('devrait mettre à jour un programme de master', async () => {
            const mockProgram = { masterId: 1, masterName: 'Espace A', academicUnit: 'UF Informatique' };

            mockUpdateMasterProgram.mockImplementationOnce(async (req, res) => {
                res.status(200).json({ message: 'Programme de master mis à jour avec succès', updatedSpace: mockProgram });
            });

            const response = await request(app)
                .put('/api/master-programs/1')
                .send({
                    masterName: 'Espace A',
                    academicUnit: 'UF Informatique',
                });

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Programme de master mis à jour avec succès');
            expect(response.body.updatedSpace).toEqual(mockProgram);
        });

        test('devrait retourner 400 si des champs obligatoires sont manquants', async () => {
            mockUpdateMasterProgram.mockImplementationOnce(async (req, res) => {
                res.status(400).json({ message: 'Tous les champs sont obligatoires' });
            });

            const response = await request(app)
                .put('/api/master-programs/1')
                .send({ masterName: 'Espace A' });

            expect(response.status).toBe(400);
            expect(response.body.message).toBe('Tous les champs sont obligatoires');
        });

        test('devrait retourner 404 si le programme de master n\'est pas trouvé', async () => {
            mockUpdateMasterProgram.mockImplementationOnce(async (req, res) => {
                res.status(404).json({ message: 'Programme de master non trouvé' });
            });

            const response = await request(app)
                .put('/api/master-programs/999')
                .send({
                    masterName: 'Espace A',
                    academicUnit: 'UF Informatique',
                });

            expect(response.status).toBe(404);
            expect(response.body.message).toBe('Programme de master non trouvé');
        });

        test('devrait retourner 500 en cas d\'erreur serveur', async () => {
            mockUpdateMasterProgram.mockImplementationOnce(async (req, res) => {
                res.status(500).json({ message: 'Erreur interne du serveur' });
            });

            const response = await request(app)
                .put('/api/master-programs/1')
                .send({
                    masterName: 'Espace A',
                    academicUnit: 'UF Informatique',
                });

            expect(response.status).toBe(500);
            expect(response.body.message).toBe('Erreur interne du serveur');
        });
    });
});