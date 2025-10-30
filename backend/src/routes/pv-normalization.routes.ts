import express from 'express';
import { PvNormalizationController } from '../controllers/pv-normalization.controller';

const router = express.Router();
const controller = new PvNormalizationController();

/**
 * @swagger
 * /api/pv-normalization/process/{fileId}:
 *   post:
 *     summary: Process a PV file to extract normalized student data
 *     tags: [PV Normalization]
 *     parameters:
 *       - in: path
 *         name: fileId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the PV file to process
 *     responses:
 *       200:
 *         description: PV file processed successfully
 *       400:
 *         description: Invalid file ID
 *       500:
 *         description: Server error
 */
router.post('/process/:fileId', async (req, res, next) => {
    try {
        await controller.processPvFile(req, res);
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /api/pv-normalization/data/{fileId}:
 *   get:
 *     summary: Get normalized data from a processed PV file
 *     tags: [PV Normalization]
 *     parameters:
 *       - in: path
 *         name: fileId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the PV file
 *     responses:
 *       200:
 *         description: Normalized student data retrieved successfully
 *       400:
 *         description: Invalid file ID
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
 * /api/pv-normalization/data/{fileId}:
 *   delete:
 *     summary: Delete all normalized data for a specific PV file
 *     tags: [PV Normalization]
 *     parameters:
 *       - in: path
 *         name: fileId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the PV file
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
 * /api/pv-normalization/fields/{fileId}:
 *   get:
 *     summary: Get available fields from a normalized PV file for mapping
 *     tags: [PV Normalization]
 *     parameters:
 *       - in: path
 *         name: fileId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the normalized PV file
 *     responses:
 *       200:
 *         description: Available PV fields retrieved successfully
 *       400:
 *         description: Invalid file ID
 *       404:
 *         description: No normalized data found for this file
 *       500:
 *         description: Server error
 */
router.get('/fields/:fileId', async (req, res, next) => {
    try {
        await controller.getAvailablePvFields(req, res);
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /api/pv-normalization/indexed-records/{fileId}:
 *   get:
 *     summary: Get normalized data as indexed records for mapping
 *     tags: [PV Normalization]
 *     parameters:
 *       - in: path
 *         name: fileId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the normalized PV file
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
