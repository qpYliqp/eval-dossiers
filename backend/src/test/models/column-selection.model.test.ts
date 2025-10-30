import { ColumnSelectionModel } from '../../models/column-selection.model';
import pool from '../../config/db';
import { ColumnSelectionEntry } from '../../types/column-selection.types';

jest.mock('../../config/db', () => ({
    connect: jest.fn(),
    query: jest.fn()
}));

describe('ColumnSelectionModel', () => {
    let model: ColumnSelectionModel;
    let mockClient: any;

    beforeEach(() => {
        model = new ColumnSelectionModel();
        mockClient = {
            query: jest.fn(),
            release: jest.fn()
        };
        (pool.connect as jest.Mock).mockResolvedValue(mockClient);
    });
    
    describe('addColumn', () => {
        it('should add new column successfully', async () => {
            const entry: ColumnSelectionEntry = {
                fileId: 1,
                columnIndex: 0,
                columnName: 'Column1'
            };

            mockClient.query
                .mockResolvedValueOnce({}) // BEGIN
                .mockResolvedValueOnce({ rows: [] }) // SELECT
                .mockResolvedValueOnce({ rows: [entry] }) // INSERT
                .mockResolvedValueOnce({}); // COMMIT

            const result = await model.addColumn(entry);

            expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
            expect(mockClient.query).toHaveBeenCalledWith(
                'SELECT * FROM "ColumnSelections" WHERE "fileId" = $1 AND "columnIndex" = $2',
                [entry.fileId, entry.columnIndex]
            );
            expect(mockClient.query).toHaveBeenCalledWith(
                'INSERT INTO "ColumnSelections" ("fileId", "columnIndex", "columnName", "createdAt") VALUES ($1, $2, $3, CURRENT_TIMESTAMP) RETURNING *',
                [entry.fileId, entry.columnIndex, entry.columnName]
            );
            expect(result).toEqual(entry);
        });

        it('should update existing column', async () => {
            const entry: ColumnSelectionEntry = {
                fileId: 1,
                columnIndex: 0,
                columnName: 'UpdatedColumn'
            };

            mockClient.query
                .mockResolvedValueOnce({}) // BEGIN
                .mockResolvedValueOnce({ rows: [{ ...entry, columnName: 'OldColumn' }] }) // SELECT
                .mockResolvedValueOnce({ rows: [entry] }) // UPDATE
                .mockResolvedValueOnce({}); // COMMIT

            const result = await model.addColumn(entry);

            expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
            expect(mockClient.query).toHaveBeenCalledWith(
                'SELECT * FROM "ColumnSelections" WHERE "fileId" = $1 AND "columnIndex" = $2',
                [entry.fileId, entry.columnIndex]
            );
            expect(mockClient.query).toHaveBeenCalledWith(
                'UPDATE "ColumnSelections" SET "columnName" = $1, "createdAt" = CURRENT_TIMESTAMP WHERE "fileId" = $2 AND "columnIndex" = $3 RETURNING *',
                [entry.columnName, entry.fileId, entry.columnIndex]
            );
            expect(result).toEqual(entry);
        });
    });

    describe('removeColumn', () => {
        it('should remove column successfully', async () => {
            const fileId = 1;
            const columnIndex = 0;

            (pool.query as jest.Mock).mockResolvedValue({ rowCount: 1 });

            const result = await model.removeColumn(fileId, columnIndex);

            expect(pool.query).toHaveBeenCalledWith(
                'DELETE FROM "ColumnSelections" WHERE "fileId" = $1 AND "columnIndex" = $2',
                [fileId, columnIndex]
            );
            expect(result).toBe(true);
        });

        it('should return false when column not found', async () => {
            const fileId = 1;
            const columnIndex = 0;

            (pool.query as jest.Mock).mockResolvedValue({ rowCount: 0 });

            const result = await model.removeColumn(fileId, columnIndex);

            expect(pool.query).toHaveBeenCalledWith(
                'DELETE FROM "ColumnSelections" WHERE "fileId" = $1 AND "columnIndex" = $2',
                [fileId, columnIndex]
            );
            expect(result).toBe(false);
        });
    });

    describe('createSelection', () => {
        it('should create column selections successfully', async () => {
            const entries: ColumnSelectionEntry[] = [
                { fileId: 1, columnIndex: 0, columnName: 'Column1' }
            ];

            mockClient.query.mockResolvedValueOnce({}) // BEGIN
                .mockResolvedValueOnce({}) // DELETE
                .mockResolvedValueOnce({ rows: [entries[0]] }) // INSERT
                .mockResolvedValueOnce({}); // COMMIT

            const result = await model.createSelection(entries);

            expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
            expect(mockClient.query).toHaveBeenCalledWith(
                'DELETE FROM "ColumnSelections" WHERE "fileId" = $1',
                [1]
            );
            expect(result).toEqual(entries);
            expect(mockClient.release).toHaveBeenCalled();
        });

        it('should rollback transaction on error', async () => {
            const entries: ColumnSelectionEntry[] = [
                { fileId: 1, columnIndex: 0, columnName: 'Column1' }
            ];

            mockClient.query.mockRejectedValueOnce(new Error('DB Error'));

            await expect(model.createSelection(entries)).rejects.toThrow('DB Error');
            expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
            expect(mockClient.release).toHaveBeenCalled();
        });
    });

    describe('getSelectionsByFileId', () => {
        it('should return column selections for a file', async () => {
            const expectedSelections = [
                { fileId: 1, columnIndex: 0, columnName: 'Column1' }
            ];

            (pool.query as jest.Mock).mockResolvedValue({ rows: expectedSelections });

            const result = await model.getSelectionsByFileId(1);

            expect(pool.query).toHaveBeenCalledWith(
                expect.stringContaining('SELECT * FROM "ColumnSelections"'),
                [1]
            );
            expect(result).toEqual(expectedSelections);
        });
    });
});