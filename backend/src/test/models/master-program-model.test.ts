import pool from '../../config/db';
import { insertMasterProgram, removeMasterProgram, updateMasterProgramInDB, getAllMasterPrograms, getMasterProgramById } from '../../models/master-program.model';
import { MasterProgramCreateDto, MasterProgramUpdateDto } from '../../types/master-programs.types';

jest.mock("../../config/db");

describe('Master Program Model', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('insertMasterProgram', () => {
    it('devrait insérer un programme master et retourner le programme créé', async () => {
      const dto: MasterProgramCreateDto = {
        masterName: 'Espace A',
        academicUnit: 'UF Informatique',
        createdBy: 1
      };
      const mockResult = {
        rows: [{
          masterId: 1,
          masterName: 'Espace A',
          academicUnit: 'UF Informatique',
          createdDate: '2025-02-19T18:20:24.315Z',
          lastUpdated: '2025-02-19T18:20:24.315Z',
          createdBy: {
            id: 1,
            firstName: 'John',
            lastName: 'Doe',
            mailAdress: 'john.doe@example.com',
            role: 'creator'
          },
          examiners: []
        }]
      };
      (pool.query as jest.Mock).mockResolvedValueOnce(mockResult);

      const result = await insertMasterProgram(dto);

      expect(result).toEqual(mockResult.rows[0]);
      expect(pool.query).toHaveBeenCalledWith(expect.any(String), [dto.masterName, dto.academicUnit, dto.createdBy]);
    });

    it('devrait renvoyer une erreur si un champ obligatoire manque', async () => {
      const dto: MasterProgramCreateDto = {
        masterName: 'Espace A',
        academicUnit: '',
        createdBy: 1
      };
      (pool.query as jest.Mock).mockRejectedValueOnce(new Error('Tous les champs sont obligatoires'));

      await expect(insertMasterProgram(dto)).rejects.toThrow('Tous les champs sont obligatoires');
      expect(pool.query).toHaveBeenCalledWith(expect.any(String), [dto.masterName, dto.academicUnit, dto.createdBy]);
    });

    it('devrait renvoyer une erreur interne si une exception se produit lors de l\'insertion', async () => {
      const dto: MasterProgramCreateDto = {
        masterName: 'Espace A',
        academicUnit: 'UF Informatique',
        createdBy: 1
      };
      (pool.query as jest.Mock).mockRejectedValueOnce(new Error('Database error'));

      await expect(insertMasterProgram(dto)).rejects.toThrow('Database error');
      expect(pool.query).toHaveBeenCalledWith(expect.any(String), [dto.masterName, dto.academicUnit, dto.createdBy]);
    });
  });
});
describe('removeMasterProgram', () => {
  it('devrait supprimer un programme master et retourner le programme supprimé', async () => {
    const mockResult = {
      rows: [{
        masterId: 1,
        masterName: 'Espace A',
        academicUnit: 'UF Informatique',
        createdDate: '2025-02-19T18:20:24.315Z',
        lastUpdated: '2025-02-19T18:20:24.315Z',
        createdBy: {
          id: 1,
          firstName: 'John',
          lastName: 'Doe',
          mailAdress: 'john.doe@example.com',
          role: 'creator'
        },
        examiners: []
      }],
      rowCount: 1
    };
    (pool.query as jest.Mock).mockResolvedValueOnce(mockResult);

    const result = await removeMasterProgram(1);

    expect(result).toEqual(mockResult.rows[0]);
    expect(pool.query).toHaveBeenCalledWith(expect.any(String), [1]);
  });

  it('devrait renvoyer null si le programme master n\'est pas trouvé', async () => {
    const mockResult = {
      rows: [],
      rowCount: 0
    };
    (pool.query as jest.Mock).mockResolvedValueOnce(mockResult);

    const result = await removeMasterProgram(999);

    expect(result).toBeNull();
    expect(pool.query).toHaveBeenCalledWith(expect.any(String), [999]);
  });

  it('devrait renvoyer une erreur interne si une exception se produit lors de la suppression', async () => {
    (pool.query as jest.Mock).mockRejectedValueOnce(new Error('Database error'));

    await expect(removeMasterProgram(1)).rejects.toThrow('Database error');
    expect(pool.query).toHaveBeenCalledWith(expect.any(String), [1]);
  });
});
describe('updateMasterProgramInDB', () => {
  it('devrait mettre à jour un programme master et retourner le programme mis à jour', async () => {
    const dto: MasterProgramUpdateDto = {
      masterName: 'Espace B',
      academicUnit: 'UF Mathématiques'
    };
    const mockResult = {
      rows: [{
        masterId: 1,
        masterName: 'Espace B',
        academicUnit: 'UF Mathématiques',
        createdDate: '2025-02-19T18:20:24.315Z',
        lastUpdated: '2025-02-20T18:20:24.315Z',
        createdBy: {
          id: 1,
          firstName: 'John',
          lastName: 'Doe',
          mailAdress: 'john.doe@example.com',
          role: 'creator'
        },
        examiners: []
      }],
      rowCount: 1
    };
    (pool.query as jest.Mock).mockResolvedValueOnce(mockResult);

    const result = await updateMasterProgramInDB(1, dto);

    expect(result).toEqual(mockResult.rows[0]);
    expect(pool.query).toHaveBeenCalledWith(expect.any(String), [dto.masterName, dto.academicUnit, 1]);
  });

  it('devrait renvoyer null si le programme master à mettre à jour n\'est pas trouvé', async () => {
    const dto: MasterProgramUpdateDto = {
      masterName: 'Espace B',
      academicUnit: 'UF Mathématiques'
    };
    const mockResult = {
      rows: [],
      rowCount: 0
    };
    (pool.query as jest.Mock).mockResolvedValueOnce(mockResult);

    const result = await updateMasterProgramInDB(999, dto);

    expect(result).toBeNull();
    expect(pool.query).toHaveBeenCalledWith(expect.any(String), [dto.masterName, dto.academicUnit, 999]);
  });

  it('devrait renvoyer une erreur interne si une exception se produit lors de la mise à jour', async () => {
    const dto: MasterProgramUpdateDto = {
      masterName: 'Espace B',
      academicUnit: 'UF Mathématiques'
    };
    (pool.query as jest.Mock).mockRejectedValueOnce(new Error('Database error'));

    await expect(updateMasterProgramInDB(1, dto)).rejects.toThrow('Database error');
    expect(pool.query).toHaveBeenCalledWith(expect.any(String), [dto.masterName, dto.academicUnit, 1]);
  });
});
describe('getAllMasterPrograms', () => {
  it('devrait retourner tous les programmes master', async () => {
    const mockResult = {
      rows: [{
        masterId: 1,
        masterName: 'Espace A',
        academicUnit: 'UF Informatique',
        createdDate: '2025-02-19T18:20:24.315Z',
        lastUpdated: '2025-02-19T18:20:24.315Z',
        createdBy: {
          id: 1,
          firstName: 'John',
          lastName: 'Doe',
          mailAdress: 'john.doe@example.com',
          role: 'creator'
        },
        examiners: []
      }, {
        masterId: 2,
        masterName: 'Espace B',
        academicUnit: 'UF Mathématiques',
        createdDate: '2025-02-20T18:20:24.315Z',
        lastUpdated: '2025-02-20T18:20:24.315Z',
        createdBy: {
          id: 2,
          firstName: 'Jane',
          lastName: 'Doe',
          mailAdress: 'jane.doe@example.com',
          role: 'creator'
        },
        examiners: []
      }]
    };
    (pool.query as jest.Mock).mockResolvedValueOnce(mockResult);

    const result = await getAllMasterPrograms();

    expect(result).toEqual(mockResult.rows);
    expect(pool.query).toHaveBeenCalledWith(expect.any(String));
  });

  it('devrait renvoyer une erreur interne si une exception se produit lors de la récupération des programmes', async () => {
    (pool.query as jest.Mock).mockRejectedValueOnce(new Error('Database error'));

    await expect(getAllMasterPrograms()).rejects.toThrow('Database error');
    expect(pool.query).toHaveBeenCalledWith(expect.any(String));
  });
});
describe('getMasterProgramById', () => {
  it('devrait retourner un programme master par ID', async () => {
    const mockResult = {
      rows: [{
        masterId: 1,
        masterName: 'Espace A',
        academicUnit: 'UF Informatique',
        createdDate: '2025-02-19T18:20:24.315Z',
        lastUpdated: '2025-02-19T18:20:24.315Z',
        createdBy: {
          id: 1,
          firstName: 'John',
          lastName: 'Doe',
          mailAdress: 'john.doe@example.com',
          role: 'creator'
        },
        examiners: []
      }],
      rowCount: 1
    };
    (pool.query as jest.Mock).mockResolvedValueOnce(mockResult);

    const result = await getMasterProgramById(1);

    expect(result).toEqual(mockResult.rows[0]);
    expect(pool.query).toHaveBeenCalledWith(expect.any(String), [1]);
  });

  it('devrait renvoyer null si le programme master par ID n\'est pas trouvé', async () => {
    const mockResult = {
      rows: [],
      rowCount: 0
    };
    (pool.query as jest.Mock).mockResolvedValueOnce(mockResult);

    const result = await getMasterProgramById(999);

    expect(result).toBeNull();
    expect(pool.query).toHaveBeenCalledWith(expect.any(String), [999]);
  });

  it('devrait renvoyer une erreur interne si une exception se produit lors de la récupération par ID', async () => {
    (pool.query as jest.Mock).mockRejectedValueOnce(new Error('Database error'));

    await expect(getMasterProgramById(1)).rejects.toThrow('Database error');
    expect(pool.query).toHaveBeenCalledWith(expect.any(String), [1]);
  });
});
