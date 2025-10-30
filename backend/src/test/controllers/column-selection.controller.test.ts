import { Request, Response } from 'express';
import { ColumnSelectionController } from '../../controllers/column-selection.controller';
import { ColumnSelectionService } from '../../services/column-selection.service';
import { ColumnSelectionEntry } from '../../types/column-selection.types';

jest.mock('../../services/column-selection.service');

describe('ColumnSelectionController', () => {
    let controller: ColumnSelectionController;
    let mockService: jest.Mocked<ColumnSelectionService>;
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let jsonSpy: jest.Mock;
    let statusSpy: jest.Mock;

    beforeEach(() => {
        mockService = new ColumnSelectionService() as jest.Mocked<ColumnSelectionService>;
        controller = new ColumnSelectionController();
        (controller as any).service = mockService;

        jsonSpy = jest.fn();
        statusSpy = jest.fn().mockReturnValue({ json: jsonSpy });
        mockResponse = {
            status: statusSpy,
            json: jsonSpy
        };
    });

    describe('toggleColumnSelection', () => {
        it('should toggle column selection (add new column)', async () => {
            const requestBody = {
                fileId: 1,
                column: {
                    index: 0,
                    name: 'Column1'
                }
            };

            mockRequest = {
                body: requestBody
            };

            const expectedResponse: ColumnSelectionEntry = {
                fileId: requestBody.fileId,
                columnIndex: requestBody.column.index,
                columnName: requestBody.column.name
            };

            mockService.toggleColumn.mockResolvedValue(expectedResponse);

            await controller.toggleColumnSelection(mockRequest as Request, mockResponse as Response);

            expect(mockService.toggleColumn).toHaveBeenCalledWith(requestBody.fileId, requestBody.column);
            expect(statusSpy).toHaveBeenCalledWith(200);
            expect(jsonSpy).toHaveBeenCalledWith({
                success: true,
                selected: true,
                column: expectedResponse
            });
        });

        it('should toggle column selection (remove existing column)', async () => {
            const requestBody = {
                fileId: 1,
                column: {
                    index: 0,
                    name: 'Column1'
                }
            };

            mockRequest = {
                body: requestBody
            };

            mockService.toggleColumn.mockResolvedValue(null);

            await controller.toggleColumnSelection(mockRequest as Request, mockResponse as Response);

            expect(mockService.toggleColumn).toHaveBeenCalledWith(requestBody.fileId, requestBody.column);
            expect(statusSpy).toHaveBeenCalledWith(200);
            expect(jsonSpy).toHaveBeenCalledWith({
                success: true,
                selected: false,
                column: null
            });
        });

        it('should return 400 for invalid request format', async () => {
            mockRequest = {
                body: { fileId: 1 }
            };

            await controller.toggleColumnSelection(mockRequest as Request, mockResponse as Response);

            expect(statusSpy).toHaveBeenCalledWith(400);
            expect(jsonSpy).toHaveBeenCalledWith({ error: 'Invalid request format' });
        });

        it('should return 500 for service errors', async () => {
            const requestBody = {
                fileId: 1,
                column: {
                    index: 0,
                    name: 'Column1'
                }
            };

            mockRequest = {
                body: requestBody
            };

            mockService.toggleColumn.mockRejectedValue(new Error('Service error'));

            await controller.toggleColumnSelection(mockRequest as Request, mockResponse as Response);

            expect(statusSpy).toHaveBeenCalledWith(500);
            expect(jsonSpy).toHaveBeenCalledWith({ error: 'Failed to toggle column selection' });
        });
    });


    describe('saveColumnSelection', () => {
        it('should save valid column selections', async () => {
            const requestBody = {
                fileId: 1,
                selectedColumns: [
                    { columnIndex: 0, columnName: 'Column1' },
                    { columnIndex: 1, columnName: 'Column2' }
                ]
            };

            mockRequest = {
                body: requestBody
            };
            const expectedResponse: ColumnSelectionEntry[] = requestBody.selectedColumns.map(col => ({
                fileId: requestBody.fileId,
                columnIndex: col.columnIndex,
                columnName: col.columnName
            }));
            
            mockService.saveColumnSelection.mockResolvedValue(expectedResponse);

            await controller.saveColumnSelection(mockRequest as Request, mockResponse as Response);

            expect(mockService.saveColumnSelection).toHaveBeenCalledWith(requestBody);
            expect(statusSpy).toHaveBeenCalledWith(201);
            expect(jsonSpy).toHaveBeenCalledWith(expectedResponse);
        });

        it('should return 400 for invalid request format', async () => {
            mockRequest = {
                body: { invalid: 'data' }
            };

            await controller.saveColumnSelection(mockRequest as Request, mockResponse as Response);

            expect(statusSpy).toHaveBeenCalledWith(400);
            expect(jsonSpy).toHaveBeenCalledWith({ error: 'Invalid request format' });
        });
    });

    describe('getColumnSelection', () => {
        it('should return column selections for valid file ID', async () => {
            const fileId = '1';
            const expectedSelections = [
                { fileId: 1, columnIndex: 0, columnName: 'Column1' }
            ];

            mockRequest = {
                params: { fileId }
            };

            mockService.getColumnSelection.mockResolvedValue(expectedSelections);

            await controller.getColumnSelection(mockRequest as Request, mockResponse as Response);

            expect(mockService.getColumnSelection).toHaveBeenCalledWith(1);
            expect(statusSpy).toHaveBeenCalledWith(200);
            expect(jsonSpy).toHaveBeenCalledWith(expectedSelections);
        });

        it('should return 400 for invalid file ID', async () => {
            mockRequest = {
                params: { fileId: 'invalid' }
            };

            await controller.getColumnSelection(mockRequest as Request, mockResponse as Response);

            expect(statusSpy).toHaveBeenCalledWith(400);
            expect(jsonSpy).toHaveBeenCalledWith({ error: 'Invalid file ID' });
        });
    });
});