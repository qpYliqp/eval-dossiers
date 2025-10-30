import request from 'supertest';
import express from 'express';
import { createMasterProgram, deleteMasterProgram, getAllMasterPrograms, getMasterProgramById, updateMasterProgram } from '../../controllers/master-program.controller';
import { createMasterProgramService, deleteMasterProgramService, getAllMasterProgramsService, getMasterProgramByIdService, updateMasterProgramService } from '../../services/master-programs.service';

jest.mock('../../services/master-programs.service');

const app = express();
app.use(express.json());
app.post('/espace', createMasterProgram);
app.delete('/espace/:id', deleteMasterProgram);
app.get('/espace', getAllMasterPrograms);
app.get('/espace/:id', getMasterProgramById);
app.put("/espace/:id", updateMasterProgram);

describe('Space Controller', () => {
  describe('POST /espace', () => {
    it('devrait créer un programme master et retourner une réponse avec le programme master créé', async () => {
      const mockSpace = {
        masterId: 1,
        masterName: 'Espace A',
        academicUnit: 'UF Informatique',
        createdDate: '2025-02-19T18:20:24.315Z',
      };

      (createMasterProgramService as jest.Mock).mockResolvedValueOnce(mockSpace);

      const response = await request(app)
        .post('/espace')
        .send({
          masterName: 'Espace A',
          academicUnit: 'UF Informatique',
        })
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Programme Master créé avec succès');
      expect(response.body.space).toEqual(mockSpace);
    });

    it('devrait renvoyer une erreur si un champ obligatoire manque', async () => {
      (createMasterProgramService as jest.Mock).mockRejectedValueOnce(new Error('Tous les champs sont obligatoires'));

      const response = await request(app)
        .post('/espace')
        .send({
          masterName: 'Espace A',
          // academicUnit est manquant
        })
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(500);
      expect(response.body.message).toBe('Erreur interne du serveur');
    });

    it('devrait renvoyer une erreur interne si une exception se produit lors de la création de l\'espace', async () => {
      (createMasterProgramService as jest.Mock).mockRejectedValueOnce(new Error('Database error'));

      const response = await request(app)
        .post('/espace')
        .send({
          masterName: 'Espace A',
          academicUnit: 'UF Informatique',
        })
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(500);
      expect(response.body.message).toBe('Erreur interne du serveur');
    });
  });

  describe('DELETE /espace/:id', () => {
    it('devrait supprimer un programme master et retourner une réponse avec le programme master supprimé', async () => {
      const mockDeletedSpace = {
        masterId: 1,
        masterName: 'Espace A',
        academicUnit: 'UF Informatique',
        createdDate: '2025-02-19T18:20:24.315Z',
      };

      (deleteMasterProgramService as jest.Mock).mockResolvedValueOnce(mockDeletedSpace);

      const response = await request(app)
        .delete('/espace/1')
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Programme Master supprimé avec succès');
      expect(response.body.deletedSpace).toEqual(mockDeletedSpace);
    });

    it('devrait renvoyer une erreur si l\'ID est invalide', async () => {
      (deleteMasterProgramService as jest.Mock).mockRejectedValueOnce(new Error('ID est invalide'));

      const response = await request(app)
        .delete('/espace/invalid')
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(500);
      expect(response.body.message).toBe('Erreur interne du serveur');
    });

    it('devrait renvoyer une erreur si le programme master n\'est pas trouvé', async () => {
      (deleteMasterProgramService as jest.Mock).mockRejectedValueOnce(new Error('Programme Master non trouvé'));

      const response = await request(app)
        .delete('/espace/999')
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(500);
      expect(response.body.message).toBe('Erreur interne du serveur');
    });
  });
});

describe('GET /espace', () => {
  it('devrait récupérer tous les espaces avec succès', async () => {
    const mockSpaces = [
      {
        masterId: 1,
        masterName: 'Espace A',
        academicUnit: 'UF Informatique',
        createdDate: '2025-02-19T18:20:24.315Z',
      },
      {
        masterId: 2,
        masterName: 'Espace B',
        academicUnit: 'UF Mathématiques',
        createdDate: '2025-02-19T18:20:24.315Z',
      }
    ];

    (getAllMasterProgramsService as jest.Mock).mockResolvedValueOnce(mockSpaces);

    const response = await request(app)
      .get('/espace')
      .set('Content-Type', 'application/json');

    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockSpaces);
  });

  it('devrait renvoyer une erreur 500 si une erreur se produit lors de la récupération', async () => {
    (getAllMasterProgramsService as jest.Mock).mockRejectedValueOnce(new Error('Database error'));

    const response = await request(app)
      .get('/espace')
      .set('Content-Type', 'application/json');

    expect(response.status).toBe(500);
    expect(response.body.message).toBe('Erreur interne du serveur');
  });
});

describe('GET /espace/:id', () => {
  it('devrait récupérer un programme master spécifique avec succès', async () => {
    const mockSpace = {
      masterId: 1,
      masterName: 'Espace A',
      academicUnit: 'UF Informatique',
      createdDate: '2025-02-19T18:20:24.315Z',
    };

    (getMasterProgramByIdService as jest.Mock).mockResolvedValueOnce(mockSpace);

    const response = await request(app)
      .get('/espace/1')
      .set('Content-Type', 'application/json');

    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockSpace);
  });

  it('devrait renvoyer une erreur 404 si le programme master n\'est pas trouvé', async () => {
    (getMasterProgramByIdService as jest.Mock).mockRejectedValueOnce(new Error('Programme Master non trouvé'));

    const response = await request(app)
      .get('/espace/999')
      .set('Content-Type', 'application/json');

    expect(response.status).toBe(404);
    expect(response.body.message).toBe('Programme Master non trouvé');
  });

  it('devrait renvoyer une erreur 500 si l\'ID est invalide', async () => {
    (getMasterProgramByIdService as jest.Mock).mockRejectedValueOnce(new Error('ID est invalide'));

    const response = await request(app)
      .get('/espace/invalid')
      .set('Content-Type', 'application/json');

    expect(response.status).toBe(500);
    expect(response.body.message).toBe('Erreur interne du serveur');
  });
});

describe('PUT /espace/:id', () => {
  it('devrait mettre à jour un espace et retourner la nouvelle version', async () => {
    const mockEspace = {
      masterId: 5,
      masterName: "Espace Modifié",
      academicUnit: "UF Mathématiques",
      updatedBy: "user",
      updatedDate: "2025-02-19T18:20:24.315Z"
    };

    (updateMasterProgramService as jest.Mock).mockResolvedValue(mockEspace);

    const response = await request(app)
      .put('/espace/5')
      .send({
        masterName: "Espace Modifié",
        academicUnit: "UF Mathématiques",
      })
      .set('Content-Type', 'application/json');

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Programme Master mis à jour avec succès');
    expect(response.body.updatedSpace).toEqual(mockEspace);
  });

  it("devrait renvoyer une erreur si le programme master n'existe pas", async () => {
    (updateMasterProgramService as jest.Mock).mockRejectedValue(new Error("Programme Master non trouvé"));

    const response = await request(app)
      .put('/espace/99')
      .send({
        masterName: "Espace Inexistant",
        academicUnit: "UF Histoire",
      })
      .set('Content-Type', 'application/json');

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("Programme Master non trouvé");
  });

  it("devrait renvoyer une erreur si un champ est manquant", async () => {
    (updateMasterProgramService as jest.Mock).mockRejectedValue(new Error("Tous les champs sont obligatoires"));

    const response = await request(app)
      .put('/espace/5')
      .send({
        masterName: "Espace Modifié",
        // academicUnit manquant
      })
      .set('Content-Type', 'application/json');

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Tous les champs sont obligatoires");
  });

  it("devrait renvoyer une erreur en cas de problème avec la base de données", async () => {
    (updateMasterProgramService as jest.Mock).mockRejectedValue(new Error("Erreur interne"));

    const response = await request(app)
      .put('/espace/5')
      .send({
        masterName: "Espace Modifié",
        academicUnit: "UF Mathématiques",
      })
      .set('Content-Type', 'application/json');

    expect(response.status).toBe(500);
    expect(response.body.message).toBe("Erreur interne du serveur");
  });
});
