import express from 'express';
import { MonMasterNormalizationController } from '../controllers/monmaster-normalization.controller';

const router = express.Router();
const controller = new MonMasterNormalizationController();

/**
 * @swagger
 * /api/monmaster-normalization/process/{fileId}:
 *   post:
 *     summary: Process a MonMaster file to extract normalized candidate data
 *     tags: [MonMaster Normalization]
 *     parameters:
 *       - in: path
 *         name: fileId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the MonMaster file to process
 *     responses:
 *       200:
 *         description: MonMaster file processed successfully
 *       400:
 *         description: Invalid file ID or file type
 *       404:
 *         description: File not found
 *       409:
 *         description: File has already been normalized
 *       500:
 *         description: Server error
 */
router.post('/process/:fileId', async (req, res, next) => {
    try {
        await controller.processMonMasterFile(req, res);
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /api/monmaster-normalization/data/{fileId}:
 *   get:
 *     summary: Get normalized data from a processed MonMaster file
 *     tags: [MonMaster Normalization]
 *     parameters:
 *       - in: path
 *         name: fileId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the MonMaster file
 *     responses:
 *       200:
 *         description: Normalized candidate data retrieved successfully
 *       400:
 *         description: Invalid file ID
 *       404:
 *         description: No normalized data found for this file
 *       500:
 *         description: Server error
 */
router.get('/data/:fileId', async (req, res, next) => {
    try {
        await controller.getNormalizedData(req, res);
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /api/monmaster-normalization/candidates/search:
 *   get:
 *     summary: Search for candidates based on criteria
 *     tags: [MonMaster Normalization]
 *     parameters:
 *       - in: query
 *         name: firstName
 *         schema:
 *           type: string
 *         description: First name to search for
 *       - in: query
 *         name: lastName
 *         schema:
 *           type: string
 *         description: Last name to search for
 *       - in: query
 *         name: candidateNumber
 *         schema:
 *           type: string
 *         description: Candidate number to search for
 *       - in: query
 *         name: monmasterFileId
 *         schema:
 *           type: integer
 *         description: MonMaster file ID to filter by
 *     responses:
 *       200:
 *         description: Candidates retrieved successfully
 *       500:
 *         description: Server error
 */
router.get('/candidates/search', async (req, res, next) => {
    try {
        await controller.searchCandidates(req, res);
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /api/monmaster-normalization/candidates/{candidateId}:
 *   get:
 *     summary: Get detailed information about a specific candidate
 *     tags: [MonMaster Normalization]
 *     parameters:
 *       - in: path
 *         name: candidateId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the candidate
 *     responses:
 *       200:
 *         description: Candidate data retrieved successfully
 *       400:
 *         description: Invalid candidate ID
 *       404:
 *         description: Candidate not found
 *       500:
 *         description: Server error
 */
router.get('/candidates/:candidateId', async (req, res, next) => {
    try {
        await controller.getCandidateById(req, res);
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /api/monmaster-normalization/data/{fileId}:
 *   delete:
 *     summary: Delete all normalized data for a specific MonMaster file
 *     tags: [MonMaster Normalization]
 *     parameters:
 *       - in: path
 *         name: fileId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the MonMaster file
 *     responses:
 *       200:
 *         description: Normalized data deleted successfully
 *       400:
 *         description: Invalid file ID
 *       404:
 *         description: No normalized data found for this file or deletion failed
 *       500:
 *         description: Server error
 */
router.delete('/data/:fileId', async (req, res, next) => {
    try {
        await controller.deleteNormalizedData(req, res);
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /api/monmaster-normalization/fields/{fileId}:
 *   get:
 *     summary: Get available fields from a normalized MonMaster file for mapping
 *     tags: [MonMaster Normalization]
 *     parameters:
 *       - in: path
 *         name: fileId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the normalized MonMaster file
 *     responses:
 *       200:
 *         description: Available MonMaster fields retrieved successfully
 *       400:
 *         description: Invalid file ID
 *       404:
 *         description: No normalized data found for this file
 *       500:
 *         description: Server error
 */
router.get('/fields/:fileId', async (req, res, next) => {
    try {
        await controller.getAvailableMonMasterFields(req, res);
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /api/monmaster-normalization/indexed-records/{fileId}:
 *   get:
 *     summary: Get normalized MonMaster data as indexed records for mapping
 *     tags: [MonMaster Normalization]
 *     parameters:
 *       - in: path
 *         name: fileId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the normalized MonMaster file
 *     responses:
 *       200:
 *         description: Indexed records retrieved successfully
 *       400:
 *         description: Invalid file ID
 *       404:
 *         description: No normalized data found for this file
 *       500:
 *         description: Server error
 */
router.get('/indexed-records/:fileId', async (req, res, next) => {
    try {
        await controller.getNormalizedDataAsIndexedRecords(req, res);
    } catch (error) {
        next(error);
    }
});

export default router;
