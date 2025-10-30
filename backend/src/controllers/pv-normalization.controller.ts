import { Request, Response } from 'express';
import { PvNormalizationService } from '../services/pv-normalization.service';
import { NormalizationError } from '../types/pv-normalization.types';

export class PvNormalizationController {
    private service = new PvNormalizationService();

    /**
     * Processes a PV file based on the provided file ID.
     * The service will process the file and normalize its data.
     * @param {Request} req - The HTTP request object containing the file ID as a parameter.
     * @param {Response} res - The HTTP response object used to send the response.
     * @returns {Promise<void>}
     */
    async processPvFile(req: Request, res: Response) {
        try {
            const fileId = parseInt(req.params.fileId);

            if (isNaN(fileId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid file ID'
                });
            }

            const result = await this.service.processPvFile(fileId);

            if (!result) {
                return res.status(500).json({
                    success: false,
                    message: 'Failed to process PV file'
                });
            }

            return res.status(200).json({
                success: true,
                message: 'PV file processed successfully',
                data: {
                    fileId: result.fileId,
                    studentsCount: result.normalizedData.length
                }
            });
        } catch (error) {
            console.error(`Error in processPvFile controller: ${error}`);

            if (error instanceof Error && error.message === NormalizationError.ALREADY_NORMALIZED) {
                return res.status(409).json({
                    success: false,
                    message: NormalizationError.ALREADY_NORMALIZED
                });
            }

            return res.status(500).json({
                success: false,
                message: 'Server error while processing PV file'
            });
        }
    }

    /**
     * Retrieves the normalized data for a given PV file ID.
     * @param {Request} req - The HTTP request object containing the file ID as a parameter.
     * @param {Response} res - The HTTP response object used to send the response.
     * @returns {Promise<void>}
     */
    async getNormalizedData(req: Request, res: Response) {
        try {
            const fileId = parseInt(req.params.fileId);

            if (isNaN(fileId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid file ID'
                });
            }

            const normalizedData = await this.service.getNormalizedDataByPvFileId(fileId);

            return res.status(200).json({
                success: true,
                data: normalizedData
            });
        } catch (error) {
            console.error(`Error in getNormalizedData controller: ${error}`);
            return res.status(500).json({
                success: false,
                message: 'Server error while retrieving normalized data'
            });
        }
    }

    /**
     * Deletes the normalized data for a given PV file ID.
     * @param {Request} req - The HTTP request object containing the file ID as a parameter.
     * @param {Response} res - The HTTP response object used to send the response.
     * @returns {Promise<void>}
     */
    async deleteNormalizedData(req: Request, res: Response) {
        try {
            const fileId = parseInt(req.params.fileId);

            if (isNaN(fileId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid file ID'
                });
            }

            const result = await this.service.deleteNormalizedDataByPvFileId(fileId);

            if (!result) {
                return res.status(404).json({
                    success: false,
                    message: 'No normalized data found for this file or deletion failed'
                });
            }

            return res.status(200).json({
                success: true,
                message: 'Normalized data deleted successfully'
            });
        } catch (error) {
            console.error(`Error in deleteNormalizedData controller: ${error}`);
            return res.status(500).json({
                success: false,
                message: 'Server error while deleting normalized data'
            });
        }
    }

    /**
     * Retrieves the available indexed fields from a normalized PV file.
     * This is used by the mapping service to know which fields can be mapped.
     * @param {Request} req - The HTTP request object containing the file ID as a parameter.
     * @param {Response} res - The HTTP response object used to send the response with the available fields.
     * @returns {Promise<void>}
     */
    async getAvailablePvFields(req: Request, res: Response) {
        try {
            const fileId = parseInt(req.params.fileId);

            if (isNaN(fileId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid file ID'
                });
            }

            const fields = await this.service.getAvailablePvFields(fileId);

            if (!fields) {
                return res.status(404).json({
                    success: false,
                    message: 'No normalized data found for this file or file has not been processed yet'
                });
            }

            return res.status(200).json({
                success: true,
                data: fields
            });
        } catch (error) {
            console.error(`Error in getAvailablePvFields controller: ${error}`);
            return res.status(500).json({
                success: false,
                message: 'Server error while retrieving PV fields'
            });
        }
    }

    /**
     * Retrieves the normalized data as indexed records for mapping purposes.
     * @param {Request} req - The HTTP request object containing the file ID as a parameter.
     * @param {Response} res - The HTTP response object used to send the response with the indexed records.
     * @returns {Promise<void>}
     */
    async getNormalizedDataAsIndexedRecords(req: Request, res: Response) {
        try {
            const fileId = parseInt(req.params.fileId);

            if (isNaN(fileId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid file ID'
                });
            }

            const records = await this.service.getNormalizedDataAsIndexedRecords(fileId);

            if (!records) {
                return res.status(404).json({
                    success: false,
                    message: 'No normalized data found for this file or file has not been processed yet'
                });
            }

            return res.status(200).json({
                success: true,
                data: records
            });
        } catch (error) {
            console.error(`Error in getNormalizedDataAsIndexedRecords controller: ${error}`);
            return res.status(500).json({
                success: false,
                message: 'Server error while retrieving indexed records'
            });
        }
    }
}
