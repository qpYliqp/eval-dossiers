import { Request, Response } from "express";
import { createMasterProgramService, deleteMasterProgramService, getAllMasterProgramsService, getMasterProgramByIdService, updateMasterProgramService } from "../services/master-programs.service";
import { MasterProgramCreateDto, MasterProgramUpdateDto } from "../types/master-programs.types";

/**
 * Creates a new Master Program
 * @param {Request} req - The HTTP request object containing the master program data in the body.
 * @param {Response} res - The HTTP response object used to send the response.
 * @returns {Promise<void>}
 */
export const createMasterProgram = async (req: Request, res: Response): Promise<void> => {
    try {
        const { masterName, academicUnit } = req.body;
        const random = 1;

        const dto: MasterProgramCreateDto = {
            masterName,
            academicUnit,
            createdBy: random
        };

        const newMasterProgram = await createMasterProgramService(dto);

        res.status(201).json({ message: "Programme Master créé avec succès", space: newMasterProgram });
    } catch (error) {
        console.error('Erreur lors de la création du programme master :', error);
        res.status(500).json({ message: 'Erreur interne du serveur' });
    }
};

/**
 * Deletes a Master Program by ID
 * @param {Request} req - The HTTP request object containing the ID of the master program to delete.
 * @param {Response} res - The HTTP response object used to send the response.
 * @returns {Promise<void>}
 */
export const deleteMasterProgram = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const deletedMasterProgram = await deleteMasterProgramService(parseInt(id));

        res.status(200).json({ message: "Programme Master supprimé avec succès", deletedSpace: deletedMasterProgram });
    } catch (error) {
        console.error("Erreur lors de la suppression :", error);
        res.status(500).json({ message: "Erreur interne du serveur" });
    }
};

/**
 * Retrieves all Master Programs
 * @param {Request} req - The HTTP request object.
 * @param {Response} res - The HTTP response object used to send the response with a list of all master programs.
 * @returns {Promise<void>}
 */
export const getAllMasterPrograms = async (req: Request, res: Response): Promise<void> => {
    try {
        const masterPrograms = await getAllMasterProgramsService();
        res.status(200).json(masterPrograms);
    } catch (error) {
        console.error('Erreur lors de la récupération des programmes master :', error);
        res.status(500).json({ message: 'Erreur interne du serveur' });
    }
};

/**
 * Retrieves a specific Master Program by ID
 * @param {Request} req - The HTTP request object containing the ID of the master program to retrieve.
 * @param {Response} res - The HTTP response object used to send the response with the master program details.
 * @returns {Promise<void>}
 */
export const getMasterProgramById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const masterProgram = await getMasterProgramByIdService(parseInt(id));
        res.status(200).json(masterProgram);
    } catch (error) {
        if (error instanceof Error && error.message === "Programme Master non trouvé") {
            res.status(404).json({ message: error.message });
        } else {
            console.error('Erreur lors de la récupération du programme master :', error);
            res.status(500).json({ message: 'Erreur interne du serveur' });
        }
    }
};

/**
 * Updates an existing Master Program by ID
 * @param {Request} req - The HTTP request object containing the ID of the master program to update, along with the updated data in the body.
 * @param {Response} res - The HTTP response object used to send the response with the updated master program.
 * @returns {Promise<void>}
 */
export const updateMasterProgram = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { name, academicUnit } = req.body;

        const dto: MasterProgramUpdateDto = {
            masterName: name,
            academicUnit
        };

        const updatedMasterProgram = await updateMasterProgramService(parseInt(id), dto);
        res.status(200).json({ message: "Programme Master mis à jour avec succès", updatedSpace: updatedMasterProgram });
    } catch (error: any) {
        console.error("Erreur lors de la mise à jour :", error);
        if (error.message === "Tous les champs sont obligatoires") {
            res.status(400).json({ message: error.message });
        } else if (error.message === "Programme Master non trouvé") {
            res.status(404).json({ message: error.message });
        } else {
            res.status(500).json({ message: "Erreur interne du serveur" });
        }
    }
};
