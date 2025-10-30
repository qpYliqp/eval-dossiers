import { ColumnSelectionService } from '../../services/column-selection.service';
import { ColumnSelectionModel } from '../../models/column-selection.model';
import { AddColumnSelectionRequest, ColumnSelectionEntry } from '../../types/column-selection.types';

jest.mock('../../models/column-selection.model');

describe('ColumnSelectionService', () => {
    let service: ColumnSelectionService;
    let mockRepository: jest.Mocked<ColumnSelectionModel>;

    beforeEach(() => {
        mockRepository = new ColumnSelectionModel() as jest.Mocked<ColumnSelectionModel>;
        service = new ColumnSelectionService();
        (service as any).repository = mockRepository;
    });

    describe('toggleColumn', () => {
        it('should add new column when not already selected', async () => {
            const fileId = 1;
            const column = { index: 0, name: 'Column1' };
            const expectedEntry = { 
                fileId, 
                columnIndex: column.index, 
                columnName: column.name 
            };

            mockRepository.getSelectionsByFileId.mockResolvedValue([]);
            mockRepository.addColumn.mockResolvedValue(expectedEntry);

            const result = await service.toggleColumn(fileId, column);

            expect(mockRepository.getSelectionsByFileId).toHaveBeenCalledWith(fileId);
            expect(mockRepository.addColumn).toHaveBeenCalledWith(expectedEntry);
            expect(result).toEqual(expectedEntry);
        });

        it('should remove column when already selected', async () => {
            const fileId = 1;
            const column = { index: 0, name: 'Column1' };
            const existingColumns = [{ 
                fileId, 
                columnIndex: column.index, 
                columnName: column.name 
            }];

            mockRepository.getSelectionsByFileId.mockResolvedValue(existingColumns);
            mockRepository.removeColumn.mockResolvedValue(true);

            const result = await service.toggleColumn(fileId, column);

            expect(mockRepository.getSelectionsByFileId).toHaveBeenCalledWith(fileId);
            expect(mockRepository.removeColumn).toHaveBeenCalledWith(fileId, column.index);
            expect(result).toBeNull();
        });

        it('should handle errors when adding a column', async () => {
            const fileId = 1;
            const column = { index: 0, name: 'Column1' };

            mockRepository.getSelectionsByFileId.mockResolvedValue([]);
            mockRepository.addColumn.mockRejectedValue(new Error('DB Error'));

            await expect(service.toggleColumn(fileId, column)).rejects.toThrow('DB Error');
        });

        it('should handle errors when removing a column', async () => {
            const fileId = 1;
            const column = { index: 0, name: 'Column1' };
            const existingColumns = [{ 
                fileId, 
                columnIndex: column.index, 
                columnName: column.name 
            }];

            mockRepository.getSelectionsByFileId.mockResolvedValue(existingColumns);
            mockRepository.removeColumn.mockRejectedValue(new Error('DB Error'));

            await expect(service.toggleColumn(fileId, column)).rejects.toThrow('DB Error');
        });
    });
    
    describe('saveColumnSelection', () => {
        it('should transform and save column selections', async () => {
            const request: AddColumnSelectionRequest = {
                fileId: 1,
                selectedColumns: [
                    { index: 0, name: 'Column1' },
                    { index: 1, name: 'Column2' }
                ]
            };

            const expectedEntries: ColumnSelectionEntry[] = [
                { fileId: 1, columnIndex: 0, columnName: 'Column1' },
                { fileId: 1, columnIndex: 1, columnName: 'Column2' }
            ];

            mockRepository.createSelection.mockResolvedValue(expectedEntries);

            const result = await service.saveColumnSelection(request);

            expect(mockRepository.createSelection).toHaveBeenCalledWith(expectedEntries);
            expect(result).toEqual(expectedEntries);
        });
    });

    describe('getColumnSelection', () => {
        it('should return column selections for a file', async () => {
            const fileId = 1;
            const expectedSelections: ColumnSelectionEntry[] = [
                { fileId: 1, columnIndex: 0, columnName: 'Column1' },
                { fileId: 1, columnIndex: 1, columnName: 'Column2' }
            ];

            mockRepository.getSelectionsByFileId.mockResolvedValue(expectedSelections);

            const result = await service.getColumnSelection(fileId);

            expect(mockRepository.getSelectionsByFileId).toHaveBeenCalledWith(fileId);
            expect(result).toEqual(expectedSelections);
        });
    });
});