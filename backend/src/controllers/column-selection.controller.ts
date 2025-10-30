import { Request, Response } from 'express';
import { ColumnSelectionService } from '../services/column-selection.service';

/**
 * Controller for handling column selection operations.
 * Provides functionalities for toggling column selection,
 * saving selected columns, retrieving selected columns, and extracting data.
 */
export class ColumnSelectionController {
    private service: ColumnSelectionService;

    constructor() {
        this.service = new ColumnSelectionService();
    }
    
    /**
     * Toggles the selection of a specific column in a file.
     * @param {Request} req - The HTTP request object.
     * @param {Response} res - The HTTP response object.
     * @returns {Promise<void>}
     */
    async toggleColumnSelection(req: Request, res: Response): Promise<void> {
        try {
            const { fileId, column } = req.body;

            if (!fileId ||  !column || column.index === undefined || !column?.name) {
                res.status(400).json({ error: 'Invalid request format' });
                return;
            }

            const result = await this.service.toggleColumn(fileId, column);
            res.status(200).json({
                success: true,
                selected: result !== null,
                column: result
            });
        } catch (error) {
            console.error('Error toggling column selection:', error);
            res.status(500).json({ error: 'Failed to toggle column selection' });
        }
    }

    /**
     * Saves the selected columns for a specific file.
     * @param {Request} req - The HTTP request object.
     * @param {Response} res - The HTTP response object.
     * @returns {Promise<void>}
     */
    async saveColumnSelection(req: Request, res: Response): Promise<void> {
        try {
            const request = req.body;

            if (!request.fileId || !Array.isArray(request.selectedColumns)) {
                res.status(400).json({ error: 'Invalid request format' });
                return;
            }

            const result = await this.service.saveColumnSelection(request);
            res.status(201).json(result);
        } catch (error) {
            console.error('Error saving column selection:', error);
            res.status(500).json({ error: 'Failed to save column selection' });
        }
    }

    /**
     * Retrieves the selected columns for a given file.
     * @param {Request} req - The HTTP request object.
     * @param {Response} res - The HTTP response object.
     * @returns {Promise<void>}
     */
    async getColumnSelection(req: Request, res: Response): Promise<void> {
        try {
            const fileId = parseInt(req.params.fileId);

            if (isNaN(fileId)) {
                res.status(400).json({ error: 'Invalid file ID' });
                return;
            }

            const result = await this.service.getColumnSelection(fileId);
            res.status(200).json(result);
        } catch (error) {
            console.error('Error getting column selection:', error);
            res.status(500).json({ error: 'Failed to get column selection' });
        }
    }


    /**
     * Retrieves the original columns of a file before any modifications.
     * @param {Request} req - The HTTP request object.
     * @param {Response} res - The HTTP response object.
     * @returns {Promise<void>}
     */
    async getColumnMaster(req: Request, res: Response): Promise<void> {
        try {
            const fileId = parseInt(req.params.fileId);

            if (isNaN(fileId)) {
                res.status(400).json({ error: 'Invalid file ID' });
                return;
            }

            const result = await this.service.getColumnMaster(fileId);
            res.status(200).json(result);
        } catch (error) {
            console.error('Error getting original column :', error);
            res.status(500).json({ error: 'Failed to get original column' });
        }
    }

    /**
     * Extracts and returns data from a file based on the selected columns.
     * @param {Request} req - The HTTP request object.
     * @param {Response} res - The HTTP response object.
     * @returns {Promise<void>}
     */
    async extractSelectedColumns(req: Request, res: Response): Promise<void> {
        try {
            const fileId = parseInt(req.params.fileId);

            if (isNaN(fileId)) {
                res.status(400).json({ error: 'Invalid file ID' });
                return;
            }

            const extractedData = await this.service.extractSelectedColumns(fileId);
            res.status(200).json({ success: true, data: extractedData });
        } catch (error) {
            console.error('Error extracting selected columns:', error);
            res.status(500).json({ error: 'Failed to extract selected columns' });
        }
    }
}