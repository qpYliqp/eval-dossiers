import express from "express";
import { createMasterProgram, deleteMasterProgram, getAllMasterPrograms, getMasterProgramById, updateMasterProgram } from "../controllers/master-program.controller";

const router = express.Router();

/**
 * @swagger
 * /api/master-programs:
 *   post:
 *     summary: Create a new master program
 *     tags:
 *       - Master Programs
 *     description: Creates a new master program with the provided information
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               masterName:
 *                 type: string
 *                 description: Name of the master program
 *               academicUnit:
 *                 type: string
 *                 description: Academic unit the program belongs to
 *             required:
 *               - masterName
 *               - academicUnit
 *     responses:
 *       201:
 *         description: Master program successfully created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 space:
 *                   $ref: '#/components/schemas/MasterProgram'
 *       400:
 *         description: Missing required fields
 *       500:
 *         description: Server error
 */
router.post("/", createMasterProgram);

/**
 * @swagger
 * /api/master-programs/{id}:
 *   delete:
 *     summary: Delete a master program
 *     tags:
 *       - Master Programs
 *     description: Deletes a master program with the specified ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the master program to delete
 *     responses:
 *       200:
 *         description: Master program successfully deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 deletedSpace:
 *                   $ref: '#/components/schemas/MasterProgram'
 *       404:
 *         description: Master program not found
 *       500:
 *         description: Server error
 */
router.delete("/:id", deleteMasterProgram);

/**
 * @swagger
 * /api/master-programs:
 *   get:
 *     summary: Get all master programs
 *     tags:
 *       - Master Programs
 *     description: Returns a list of all master programs
 *     responses:
 *       200:
 *         description: A list of master programs
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/MasterProgram'
 *       500:
 *         description: Server error
 */
router.get("/", getAllMasterPrograms);

/**
 * @swagger
 * /api/master-programs/{id}:
 *   get:
 *     summary: Get a master program by ID
 *     tags:
 *       - Master Programs
 *     description: Returns a single master program by its ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the master program to retrieve
 *     responses:
 *       200:
 *         description: Master program details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MasterProgram'
 *       404:
 *         description: Master program not found
 *       500:
 *         description: Server error
 */
router.get("/:id", getMasterProgramById);

/**
 * @swagger
 * /api/master-programs/{id}:
 *   put:
 *     summary: Update a master program
 *     tags:
 *       - Master Programs
 *     description: Updates a master program with the specified ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the master program to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: New name for the master program
 *               academicUnit:
 *                 type: string
 *                 description: New academic unit for the master program
 *             required:
 *               - name
 *               - academicUnit
 *     responses:
 *       200:
 *         description: Master program successfully updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 updatedSpace:
 *                   $ref: '#/components/schemas/MasterProgram'
 *       400:
 *         description: Missing required fields
 *       404:
 *         description: Master program not found
 *       500:
 *         description: Server error
 */
router.put("/:id", updateMasterProgram);

export default router;
