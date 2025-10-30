const mockSaveColumnSelection = jest.fn();
const mockGetColumnSelection = jest.fn();
const mockToggleColumnSelection = jest.fn();

jest.mock('../../controllers/column-selection.controller', () => {
    return {
        ColumnSelectionController: jest.fn().mockImplementation(() => {
            return {
                saveColumnSelection: mockSaveColumnSelection,
                getColumnSelection: mockGetColumnSelection,
                toggleColumnSelection: mockToggleColumnSelection
            };
        })
    };
});

import request from 'supertest';
import express, { Express } from 'express';
import columnSelectionRoutes from '../../routes/column-selection.routes';

describe('Column Selection Routes', () => {
    let app: Express;

    beforeEach(() => {
        jest.clearAllMocks();

        app = express();
        app.use(express.json());
        app.use('/api/column-selection', columnSelectionRoutes);
    });

    describe('POST /toggle', () => {
        it('should toggle column selection (add new column)', async () => {
            const requestBody = {
                fileId: 1,
                column: {
                    index: 0,
                    name: 'Column1'
                }
            };

            const expectedResponse = {
                success: true,
                selected: true,
                column: {
                    fileId: 1,
                    columnIndex: 0,
                    columnName: 'Column1'
                }
            };

            mockToggleColumnSelection.mockImplementation((req, res) => {
                res.status(200).json(expectedResponse);
            });

            const response = await request(app)
                .post('/api/column-selection/toggle')
                .send(requestBody)
                .expect('Content-Type', /json/)
                .expect(200);

            expect(response.body).toEqual(expectedResponse);
            expect(mockToggleColumnSelection).toHaveBeenCalled();
        });

        it('should toggle column selection (remove existing column)', async () => {
            const requestBody = {
                fileId: 1,
                column: {
                    index: 0,
                    name: 'Column1'
                }
            };

            const expectedResponse = {
                success: true,
                selected: false,
                column: null
            };

            mockToggleColumnSelection.mockImplementation((req, res) => {
                res.status(200).json(expectedResponse);
            });

            const response = await request(app)
                .post('/api/column-selection/toggle')
                .send(requestBody)
                .expect('Content-Type', /json/)
                .expect(200);

            expect(response.body).toEqual(expectedResponse);
            expect(mockToggleColumnSelection).toHaveBeenCalled();
        });

        it('should handle invalid toggle request format', async () => {
            const invalidRequest = {
                fileId: 1
                // missing column data
            };

            mockToggleColumnSelection.mockImplementation((req, res) => {
                res.status(400).json({ error: 'Invalid request format' });
            });

            const response = await request(app)
                .post('/api/column-selection/toggle')
                .send(invalidRequest)
                .expect('Content-Type', /json/)
                .expect(400);

            expect(response.body).toEqual({ error: 'Invalid request format' });
            expect(mockToggleColumnSelection).toHaveBeenCalled();
        });
    });

    describe('POST /save', () => {
        it('should save column selections', async () => {
            const requestBody = {
                fileId: 1,
                selectedColumns: [
                    { columnIndex: 0, columnName: 'Column1' },
                    { columnIndex: 1, columnName: 'Column2' }
                ]
            };

            const expectedResponse = requestBody.selectedColumns.map((col: any) => ({
                ...col,
                fileId: requestBody.fileId
            }));

            mockSaveColumnSelection.mockImplementation((req, res) => {
                res.status(201).json(expectedResponse);
            });

            const response = await request(app)
                .post('/api/column-selection/save')
                .send(requestBody)
                .expect('Content-Type', /json/)
                .expect(201);

            expect(response.body).toEqual(expectedResponse);
            expect(mockSaveColumnSelection).toHaveBeenCalled();
        });

        it('should handle invalid request format', async () => {
            const invalidRequest = {
                invalidField: 'test'
            };

            mockSaveColumnSelection.mockImplementation((req, res) => {
                res.status(400).json({ error: 'Invalid request format' });
            });

            const response = await request(app)
                .post('/api/column-selection/save')
                .send(invalidRequest)
                .expect('Content-Type', /json/)
                .expect(400);

            expect(response.body).toEqual({ error: 'Invalid request format' });
            expect(mockSaveColumnSelection).toHaveBeenCalled();
        });
    });

    describe('GET /:fileId', () => {
        it('should get column selections for valid file ID', async () => {
            const fileId = 1;
            const expectedSelections = [
                { fileId: 1, columnIndex: 0, columnName: 'Column1' },
                { fileId: 1, columnIndex: 1, columnName: 'Column2' }
            ];

            mockGetColumnSelection.mockImplementation((req, res) => {
                res.status(200).json(expectedSelections);
            });

            const response = await request(app)
                .get(`/api/column-selection/${fileId}`)
                .expect('Content-Type', /json/)
                .expect(200);

            expect(response.body).toEqual(expectedSelections);
            expect(mockGetColumnSelection).toHaveBeenCalled();
        });

        it('should handle invalid file ID', async () => {
            mockGetColumnSelection.mockImplementation((req, res) => {
                res.status(400).json({ error: 'Invalid file ID' });
            });

            const response = await request(app)
                .get('/api/column-selection/invalid')
                .expect('Content-Type', /json/)
                .expect(400);

            expect(response.body).toEqual({ error: 'Invalid file ID' });
            expect(mockGetColumnSelection).toHaveBeenCalled();
        });
    });
});