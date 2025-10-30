import { insertMasterProgram, removeMasterProgram, getAllMasterPrograms, getMasterProgramById, updateMasterProgramInDB } from "../models/master-program.model";
import { MasterProgram, MasterProgramCreateDto, MasterProgramUpdateDto } from "../types/master-programs.types";

export const createMasterProgramService = async (dto: MasterProgramCreateDto): Promise<MasterProgram> => {
    if (!dto.masterName || !dto.academicUnit || !dto.createdBy) {
        throw new Error("Tous les champs sont obligatoires");
    }

    const newMasterProgram = await insertMasterProgram(dto);
    return newMasterProgram;
};

export const deleteMasterProgramService = async (id: number): Promise<MasterProgram> => {
    if (isNaN(id)) {
        throw new Error("ID est invalide");
    }

    const deletedMasterProgram = await removeMasterProgram(id);
    if (!deletedMasterProgram) {
        throw new Error("Programme Master non trouvé");
    }

    return deletedMasterProgram;
};

export const getAllMasterProgramsService = async (): Promise<MasterProgram[]> => {
    return await getAllMasterPrograms();
};

export const getMasterProgramByIdService = async (id: number): Promise<MasterProgram> => {
    if (isNaN(id)) {
        throw new Error("ID est invalide");
    }

    const masterProgram = await getMasterProgramById(id);
    if (!masterProgram) {
        throw new Error("Programme Master non trouvé");
    }

    return masterProgram;
};

export const updateMasterProgramService = async (
    id: number,
    dto: MasterProgramUpdateDto
): Promise<MasterProgram> => {
    if (!id || isNaN(id) || !dto.masterName || !dto.academicUnit) {
        throw new Error("Tous les champs sont obligatoires");
    }

    const updatedMasterProgram = await updateMasterProgramInDB(id, dto);

    if (!updatedMasterProgram) {
        throw new Error("Programme Master non trouvé");
    }

    return updatedMasterProgram;
};
