import express from 'express';
import { MappingController } from '../controllers/mapping.controller';

const router = express.Router();
const controller = new MappingController();

/**
 * @swagger
 * /api/mapping/entries:
 *   post:
 *     summary: Add a new mapping entry
 *     tags: [Mapping]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AddMappingEntryRequest'
 *     responses:
 *       201:
 *         description: Mapping entry created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MappingEntry'
 *       400:
 *         description: Missing required fields
 *       500:
 *         description: Server error
 */
router.post('/entries', (req, res) => controller.addMappingEntry(req, res));

/**
 * @swagger
 * /api/mapping/entries/{entryId}:
 *   put:
 *     summary: Update a mapping entry
 *     tags: [Mapping]
 *     parameters:
 *       - in: path
 *         name: entryId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the mapping entry to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateMappingEntryRequest'
 *     responses:
 *       200:
 *         description: Mapping entry updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MappingEntry'
 *       400:
 *         description: Invalid entry ID
 *       404:
 *         description: Mapping entry not found
 *       500:
 *         description: Server error
 */
router.put('/entries/:entryId', (req, res) => controller.updateMappingEntry(req, res));

/**
 * @swagger
 * /api/mapping/entries/{entryId}:
 *   delete:
 *     summary: Delete a mapping entry
 *     tags: [Mapping]
 *     parameters:
 *       - in: path
 *         name: entryId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the mapping entry to delete
 *     responses:
 *       204:
 *         description: Mapping entry deleted successfully
 *       400:
 *         description: Invalid entry ID
 *       404:
 *         description: Mapping entry not found
 *       500:
 *         description: Server error
 */
router.delete('/entries/:entryId', (req, res) => controller.deleteMappingEntry(req, res));

/**
 * @swagger
 * /api/mapping/configurations/{configId}:
 *   delete:
 *     summary: Delete a mapping configuration
 *     tags: [Mapping]
 *     parameters:
 *       - in: path
 *         name: configId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the mapping configuration to delete
 *     responses:
 *       204:
 *         description: Mapping configuration deleted successfully
 *       400:
 *         description: Invalid configuration ID
 *       404:
 *         description: Mapping configuration not found
 *       500:
 *         description: Server error
 */
router.delete('/configurations/:configId', (req, res) => controller.deleteMappingConfiguration(req, res));

/**
 * @swagger
 * /api/mapping/configurations:
 *   get:
 *     summary: Get mapping configuration by MonMaster file ID and PV file ID
 *     tags: [Mapping]
 *     parameters:
 *       - in: query
 *         name: monmasterFileId
 *         required: true
 *         schema:
 *           type: integer
 *         description: MonMaster file ID
 *       - in: query
 *         name: pvFileId
 *         required: true
 *         schema:
 *           type: integer
 *         description: PV file ID
 *     responses:
 *       200:
 *         description: Mapping configuration retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MappingConfiguration'
 *       400:
 *         description: Invalid file IDs
 *       404:
 *         description: Mapping configuration not found
 *       500:
 *         description: Server error
 */
router.get('/configurations', (req, res) => controller.getMappingConfiguration(req, res));

/**
 * @swagger
 * /api/mapping/configurations/{configId}:
 *   get:
 *     summary: Get mapping configuration by ID
 *     tags: [Mapping]
 *     parameters:
 *       - in: path
 *         name: configId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the mapping configuration to get
 *     responses:
 *       200:
 *         description: Mapping configuration retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MappingConfiguration'
 *       400:
 *         description: Invalid configuration ID
 *       404:
 *         description: Mapping configuration not found
 *       500:
 *         description: Server error
 */
router.get('/configurations/:configId', (req, res) => controller.getMappingConfigurationById(req, res));

/**
 * @swagger
 * /api/mapping/configurations:
 *   post:
 *     summary: Create a new mapping configuration
 *     tags: [Mapping]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - monmasterFileId
 *               - pvFileId
 *             properties:
 *               monmasterFileId:
 *                 type: integer
 *                 description: ID of the MonMaster file
 *               pvFileId:
 *                 type: integer
 *                 description: ID of the PV file
 *     responses:
 *       201:
 *         description: Mapping configuration created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MappingConfiguration'
 *       400:
 *         description: Missing required fields
 *       500:
 *         description: Server error
 */
router.post('/configurations', (req, res) => controller.createMappingConfiguration(req, res));

export default router;
