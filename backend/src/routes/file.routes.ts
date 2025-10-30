import express from 'express';
import { FileController } from '../controllers/file.controller';
import { uploadFile } from '../middleware/upload.middleware';

const router = express.Router();

/**
 * @swagger
 * /api/files/upload:
 *   post:
 *     summary: Upload a new file
 *     tags: [Files]
 *     consumes:
 *       - multipart/form-data
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: The file to upload
 *               fileOrigin:
 *                 type: string
 *                 enum: [MonMaster, PV, StudentDocuments]
 *                 description: Origin of the file (REQUIRED)
 *               masterId:
 *                 type: integer
 *                 description: ID of the associated master program (REQUIRED for MonMaster, PV and StudentDocuments)
 *               university:
 *                 type: string
 *                 description: University name (REQUIRED for PV)
 *               formation:
 *                 type: string
 *                 description: Formation name (REQUIRED for PV)
 *               yearAcademic:
 *                 type: string
 *                 description: Academic year (REQUIRED for PV)
 *               session:
 *                 type: integer
 *                 enum: [1, 2]
 *                 description: Session (1=SESSION1, 2=SESSION2) (REQUIRED for PV)
 *             required:
 *               - file
 *               - fileOrigin
 *     responses:
 *       201:
 *         description: File uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FileUploadResponse'
 *       400:
 *         description: Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Error uploading file
 */
router.post('/upload', uploadFile, FileController.uploadFile);

/**
 * @swagger
 * /api/files/master/{masterId}:
 *   get:
 *     summary: Get files by master program ID
 *     tags: [Files]
 *     parameters:
 *       - in: path
 *         name: masterId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The master program ID
 *     responses:
 *       200:
 *         description: List of files for the specified master program
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 files:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/FileMetadata'
 *       400:
 *         description: Invalid master ID
 *       500:
 *         description: Server error
 */
router.get('/master/:masterId', FileController.getFilesByMaster);

/**
 * @swagger
 * /api/files/origin/{origin}:
 *   get:
 *     summary: Get files by origin
 *     tags: [Files]
 *     parameters:
 *       - in: path
 *         name: origin
 *         required: true
 *         schema:
 *           type: string
 *           enum: [MonMaster, PV, StudentDocuments]
 *         description: The file origin type
 *     responses:
 *       200:
 *         description: List of files for the specified origin
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 files:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/FileMetadata'
 *       400:
 *         description: Invalid file origin
 *       500:
 *         description: Server error
 */
router.get('/origin/:origin', FileController.getFilesByOrigin);

/**
 * @swagger
 * /api/files/master/{masterId}/origin/{origin}:
 *   get:
 *     summary: Get files by master program ID and origin
 *     tags: [Files]
 *     parameters:
 *       - in: path
 *         name: masterId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The master program ID
 *       - in: path
 *         name: origin
 *         required: true
 *         schema:
 *           type: string
 *           enum: [MonMaster, PV, StudentDocuments]
 *         description: The file origin type
 *     responses:
 *       200:
 *         description: List of files for the specified master program and origin
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 files:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/FileMetadata'
 *       400:
 *         description: Invalid master ID or file origin
 *       500:
 *         description: Server error
 */
router.get('/master/:masterId/origin/:origin', FileController.getFilesByMasterIdAndOrigin);

/**
 * @swagger
 * /api/files/{fileId}:
 *   get:
 *     summary: Get a file by ID
 *     tags: [Files]
 *     parameters:
 *       - in: path
 *         name: fileId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The file ID
 *     responses:
 *       200:
 *         description: File retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 file:
 *                   $ref: '#/components/schemas/FileMetadata'
 *       400:
 *         description: Invalid file ID
 *       404:
 *         description: File not found
 *       500:
 *         description: Server error
 */
router.get('/:fileId', FileController.getFileById);

/**
 * @swagger
 * /api/files/{fileId}/download:
 *   get:
 *     summary: Download a file by ID
 *     tags: [Files]
 *     parameters:
 *       - in: path
 *         name: fileId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The file ID to download
 *     responses:
 *       200:
 *         description: Returns the file as a download
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: Invalid file ID
 *       404:
 *         description: File not found
 *       500:
 *         description: Server error
 */
router.get('/:fileId/download', FileController.downloadFile);

/**
 * @swagger
 * /api/files/{fileId}:
 *   delete:
 *     summary: Delete a file by ID
 *     tags: [Files]
 *     parameters:
 *       - in: path
 *         name: fileId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The file ID
 *     responses:
 *       200:
 *         description: File deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: File deleted successfully
 *                 file:
 *                   $ref: '#/components/schemas/FileMetadata'
 *       400:
 *         description: Invalid file ID
 *       404:
 *         description: File not found
 *       500:
 *         description: Server error
 */
router.delete('/:fileId', FileController.deleteFile);

/**
 * @swagger
 * /api/files/student-document/{masterId}/{candidateNumber}:
 *   get:
 *     summary: Retrieve a student's document
 *     description: Fetches a document associated with a student in a master program.
 *     tags: [Files]
 *     parameters:
 *       - in: path
 *         name: masterId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the master program.
 *       - in: path
 *         name: candidateNumber
 *         required: true
 *         schema:
 *           type: string
 *         description: The candidate's number (matches the file name without extension).
 *     responses:
 *       200:
 *         description: Document retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 filePath:
 *                   type: string
 *                   description: The path of the file.
 *                 fileName:
 *                   type: string
 *                   description: The name of the file.
 *       400:
 *         description: Missing masterId or candidateNumber.
 *       404:
 *         description: Document not found.
 *       500:
 *         description: Server error.
 */
router.get('/student-document/:masterId/:candidateNumber',FileController.getStudentDocument);


export default router;
