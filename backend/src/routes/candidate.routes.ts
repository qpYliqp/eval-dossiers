import { Router } from "express";
import { CandidateModificationController } from "../controllers/candidate-modification.controller";

const router = Router();
const controller = new CandidateModificationController();

/**
 * @swagger
 * /api/candidates/{candidateId}/first-name:
 *   put:
 *     summary: Met à jour le prénom d'un candidat
 *     tags: [Candidats]
 *     parameters:
 *       - in: path
 *         name: candidateId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID du candidat
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *                 example: "Jean"
 *     responses:
 *       200:
 *         description: Prénom mis à jour avec succès
 *       400:
 *         description: Requête invalide (ID ou prénom manquant)
 *       404:
 *         description: Candidat non trouvé
 */
router.put("/:candidateId/first-name", (req, res) => controller.updateFirstName(req, res));

/**
 * @swagger
 * /api/candidates/update-last-name:
 *   put:
 *     summary: Met à jour le nom de famille d'un candidat
 *     tags: [Candidats]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               candidateId:
 *                 type: integer
 *                 example: 1
 *               lastName:
 *                 type: string
 *                 example: "Dupont"
 *     responses:
 *       200:
 *         description: Nom de famille mis à jour avec succès
 *       400:
 *         description: Requête invalide (ID ou nom manquant)
 *       404:
 *         description: Candidat non trouvé
 */
router.put("/update-last-name", (req, res) => controller.updateLastName(req, res));

/**
 * @swagger
 * /api/candidates/academic-records/update:
 *   put:
 *     summary: Met à jour les notes d'un relevé académique spécifique
 *     tags: [Relevés académiques]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               recordId:
 *                 type: integer
 *                 example: 5
 *               gradeSemester1:
 *                 type: number
 *                 nullable: true
 *                 example: 15.5
 *               gradeSemester2:
 *                 type: number
 *                 nullable: true
 *                 example: 14.0
 *     responses:
 *       200:
 *         description: Relevé académique mis à jour avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AcademicRecord'
 *       400:
 *         description: Requête invalide (ID ou notes manquants)
 *       404:
 *         description: Relevé académique non trouvé
 */
router.put("/academic-records/update", (req, res) => controller.updateAcademicRecord(req, res));

/**
 * @swagger
 * /api/candidates/candidate-scores/update:
 *   put:
 *     summary: Met à jour le score d'un candidat
 *     tags: [Scores des candidats]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               scoreId:
 *                 type: integer
 *                 example: 10
 *               scoreValue:
 *                 type: string
 *                 example: "87.5"
 *     responses:
 *       200:
 *         description: Score mis à jour avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CandidateScore'
 *       400:
 *         description: Requête invalide (ID ou score manquant)
 *       404:
 *         description: Score non trouvé
 */
router.put("/candidate-scores/update", (req, res) => controller.updateCandidateScore(req, res));

export default router;