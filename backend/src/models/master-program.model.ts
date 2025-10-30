import pool from "../config/db";
import { MasterProgram, MasterProgramCreateDto, MasterProgramUpdateDto } from "../types/master-programs.types";

export const insertMasterProgram = async (dto: MasterProgramCreateDto): Promise<MasterProgram> => {
  const query = `
    WITH inserted AS (
      INSERT INTO "MasterProgramSpace" ("masterName", "academicUnit", "createdBy")
      VALUES ($1, $2, $3)
      RETURNING *
    )
    SELECT 
      i."masterId",
      i."masterName",
      i."academicUnit",
      i."createdDate",
      i."lastUpdated",
      json_build_object(
        'id', u."usersId",
        'firstName', u."firstName",
        'lastName', u."lastName",
        'mailAdress', u."email",
        'role', 'creator'
      ) as "createdBy",
      '[]'::json as examiners
    FROM inserted i
    JOIN "Users" u ON u."usersId" = i."createdBy"
  `;
  const result = await pool.query(query, [dto.masterName, dto.academicUnit, dto.createdBy]);
  return result.rows[0];
};

export const removeMasterProgram = async (id: number): Promise<MasterProgram | null> => {
  const query = `
    WITH deleted AS (
      DELETE FROM "MasterProgramSpace" WHERE "masterId" = $1 RETURNING *
    )
    SELECT 
      d."masterId",
      d."masterName",
      d."academicUnit",
      d."createdDate",
      d."lastUpdated",
      json_build_object(
        'id', u."usersId",
        'firstName', u."firstName",
        'lastName', u."lastName",
        'mailAdress', u."email",
        'role', 'creator'
      ) as "createdBy",
      COALESCE(
        (SELECT json_agg(
          json_build_object(
            'id', ex."usersId",
            'firstName', ex."firstName",
            'lastName', ex."lastName",
            'mailAdress', ex."email",
            'role', 'examiner'
          )
        )
        FROM "MasterProgramSpaceExaminers" mpe
        JOIN "Users" ex ON ex."usersId" = mpe."examinerId"
        WHERE mpe."masterProgramMasterId" = d."masterId"
        ), '[]'
      ) as examiners
    FROM deleted d
    JOIN "Users" u ON u."usersId" = d."createdBy"
    `;
  const result = await pool.query(query, [id]);
  return result.rowCount ? result.rows[0] : null;
};

export const updateMasterProgramInDB = async (id: number, dto: MasterProgramUpdateDto): Promise<MasterProgram | null> => {
  const query = `
    WITH updated AS (
      UPDATE "MasterProgramSpace"
      SET "masterName" = $1, "academicUnit" = $2, "lastUpdated" = NOW()
      WHERE "masterId" = $3
      RETURNING *
    )
    SELECT 
      u."masterId",
      u."masterName",
      u."academicUnit",
      u."createdDate",
      u."lastUpdated",
      json_build_object(
        'id', usr."usersId",
        'firstName', usr."firstName",
        'lastName', usr."lastName",
        'mailAdress', usr."email",
        'role', 'creator'
      ) as "createdBy",
      COALESCE(
        (SELECT json_agg(
          json_build_object(
            'id', ex."usersId",
            'firstName', ex."firstName",
            'lastName', ex."lastName",
            'mailAdress', ex."email",
            'role', 'examiner'
          )
        )
        FROM "MasterProgramSpaceExaminers" mpe
        JOIN "Users" ex ON ex."usersId" = mpe."examinerId"
        WHERE mpe."masterProgramMasterId" = u."masterId"
        ), '[]'
      ) as examiners
    FROM updated u
    JOIN "Users" usr ON usr."usersId" = u."createdBy"
  `;
  const values = [dto.masterName, dto.academicUnit, id];
  const result = await pool.query(query, values);
  return result.rowCount ? result.rows[0] : null;
};

export const getAllMasterPrograms = async (): Promise<MasterProgram[]> => {
  const query = `
    SELECT 
      s."masterId",
      s."masterName",
      s."academicUnit",
      s."createdDate",
      s."lastUpdated",
      json_build_object(
        'id', u."usersId",
        'firstName', u."firstName",
        'lastName', u."lastName",
        'mailAdress', u."email",
        'role', 'creator'
      ) as "createdBy",
      COALESCE(
        (SELECT json_agg(
          json_build_object(
            'id', ex."usersId",
            'firstName', ex."firstName",
            'lastName', ex."lastName",
            'mailAdress', ex."email",
            'role', 'examiner'
          )
        )
        FROM "MasterProgramSpaceExaminers" mpe
        JOIN "Users" ex ON ex."usersId" = mpe."examinerId"
        WHERE mpe."masterProgramMasterId" = s."masterId"
        ), '[]'
      ) as examiners
    FROM "MasterProgramSpace" s
    JOIN "Users" u ON u."usersId" = s."createdBy"
  `;
  const result = await pool.query(query);
  return result.rows;
};

export const getMasterProgramById = async (id: number): Promise<MasterProgram | null> => {
  const query = `
    SELECT 
      s."masterId",
      s."masterName",
      s."academicUnit",
      s."createdDate",
      s."lastUpdated",
      json_build_object(
        'id', u."usersId",
        'firstName', u."firstName",
        'lastName', u."lastName",
        'mailAdress', u."email",
        'role', 'creator'
      ) as "createdBy",
      COALESCE(
        (SELECT json_agg(
          json_build_object(
            'id', ex."usersId",
            'firstName', ex."firstName",
            'lastName', ex."lastName",
            'mailAdress', ex."email",
            'role', 'examiner'
          )
        )
        FROM "MasterProgramSpaceExaminers" mpe
        JOIN "Users" ex ON ex."usersId" = mpe."examinerId"
        WHERE mpe."masterProgramMasterId" = s."masterId"
        ), '[]'
      ) as examiners
    FROM "MasterProgramSpace" s
    JOIN "Users" u ON u."usersId" = s."createdBy"
    WHERE s."masterId" = $1
  `;
  const result = await pool.query(query, [id]);
  return result.rowCount ? result.rows[0] : null;
};

export const checkMasterProgramExists = async (id: number): Promise<boolean> => {
  const query = `SELECT COUNT(*) FROM "MasterProgramSpace" WHERE "masterId" = $1`;
  const result = await pool.query(query, [id]);
  return parseInt(result.rows[0].count) > 0;
};
