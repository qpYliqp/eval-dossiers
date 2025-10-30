import express from 'express';
import { FuzzyMatchingController } from '../controllers/fuzzy-matching.controller';

const router = express.Router();
const controller = new FuzzyMatchingController();

/**
 * @swagger
 * /api/fuzzy-matching/matches:
 *   post:
 *     summary: Find all possible matches between source and target candidates
 *     tags: [Fuzzy Matching]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sourceCandidates
 *               - targetCandidates
 *             properties:
 *               sourceCandidates:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/MatchCandidate'
 *               targetCandidates:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/MatchCandidate'
 *               options:
 *                 $ref: '#/components/schemas/MatchingOptions'
 *     responses:
 *       200:
 *         description: Matches found successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 matches:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/MatchResult'
 *                 totalMatches:
 *                   type: integer
 *                   description: Total number of matches found
 *       400:
 *         description: Invalid request format
 *       500:
 *         description: Server error
 */
router.post('/matches', (req, res) => controller.findMatches(req, res));

/**
 * @swagger
 * /api/fuzzy-matching/best-matches:
 *   post:
 *     summary: Find the best match for each source candidate
 *     tags: [Fuzzy Matching]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sourceCandidates
 *               - targetCandidates
 *             properties:
 *               sourceCandidates:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/MatchCandidate'
 *               targetCandidates:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/MatchCandidate'
 *               options:
 *                 $ref: '#/components/schemas/MatchingOptions'
 *     responses:
 *       200:
 *         description: Best matches found successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 matches:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/MatchResult'
 *                 totalMatches:
 *                   type: integer
 *                   description: Total number of matches found
 *       400:
 *         description: Invalid request format
 *       500:
 *         description: Server error
 */
router.post('/best-matches', (req, res) => controller.findBestMatches(req, res));

export default router;