import express from 'express';
import { ColumnSelectionController } from '../controllers/column-selection.controller';

const router = express.Router();
const controller = new ColumnSelectionController();

/**
 * @swagger
 * /api/column-selection/save:
 *   post:
 *     summary: Save column selection for a file
 *     tags: [Column Selection]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fileId
 *               - selectedColumns
 *             properties:
 *               fileId:
 *                 type: number
 *                 description: ID of the file
 *               selectedColumns:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     index:
 *                       type: number
 *                       description: Index of the column
 *                     name:
 *                       type: string
 *                       description: Name of the column
 *     responses:
 *       201:
 *         description: Column selection saved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ColumnSelectionEntry'
 *       400:
 *         description: Invalid request format
 *       500:
 *         description: Failed to save column selection
 */
router.post('/save', (req, res) => controller.saveColumnSelection(req, res));

/**
 * @swagger
 * /api/column-selection/{fileId}:
 *   get:
 *     summary: Get column selections for a file
 *     tags: [Column Selection]
 *     parameters:
 *       - in: path
 *         name: fileId
 *         required: true
 *         schema:
 *           type: number
 *         description: ID of the file
 *     responses:
 *       200:
 *         description: Column selections retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ColumnSelectionEntry'
 *       400:
 *         description: Invalid file ID
 *       500:
 *         description: Failed to get column selection
 */
router.get('/:fileId', (req, res) => controller.getColumnSelection(req, res));

/**
 * @swagger
 * /api/column-selection/toggle:
 *   post:
 *     summary: Toggle column selection for a file
 *     tags: [Column Selection]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fileId
 *               - column
 *             properties:
 *               fileId:
 *                 type: number
 *                 description: ID of the file
 *               column:
 *                 type: object
 *                 properties:
 *                   index:
 *                     type: number
 *                     description: Index of the column
 *                   name:
 *                     type: string
 *                     description: Name of the column
 *     responses:
 *       200:
 *         description: Column selection toggled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   description: Indicates if the operation was successful
 *                 selected:
 *                   type: boolean
 *                   description: Indicates if the column is now selected
 *                 column:
 *                   $ref: '#/components/schemas/ColumnSelectionEntry'
 *       400:
 *         description: Invalid request format
 *       500:
 *         description: Failed to toggle column selection
 */
router.post('/toggle', (req, res) => controller.toggleColumnSelection(req, res));


/**
 * @swagger
 * /api/column-selection/{fileId}/original:
 *   get:
 *     summary: Get original column for a file
 *     tags: [Column Selection]
 *     parameters:
 *       - in: path
 *         name: fileId
 *         required: true
 *         schema:
 *           type: number
 *         description: ID of the file
 *     responses:
 *       200:
 *         description: Columns retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/FileColumn'
 *       400:
 *         description: Invalid file ID
 *       500:
 *         description: Failed to get column selection
 */
router.get('/:fileId/original', (req, res) => controller.getColumnMaster(req, res));


/**
 * @swagger
 * /api/column-selection/{fileId}/extract:
 *   get:
 *     summary: Extract selected columns from a file
 *     tags: [Column Selection]
 *     parameters:
 *       - in: path
 *         name: fileId
 *         required: true
 *         schema:
 *           type: number
 *         description: ID of the file
 *     responses:
 *       200:
 *         description: Extracted columns successfully retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: array
 *                 items:
 *                   type: string
 *       400:
 *         description: Invalid file ID
 *       500:
 *         description: Failed to extract selected columns
 */
router.get('/:fileId/extract', (req, res) => controller.extractSelectedColumns(req, res));

export default router;