import { ColumnSelectionModel } from '../models/column-selection.model';
import { AddColumnSelectionRequest, ColumnSelectionEntry, FileColumn } from '../types/column-selection.types';

export class ColumnSelectionService {
    private repository: ColumnSelectionModel;

    constructor() {
        this.repository = new ColumnSelectionModel();
    }

    async toggleColumn(fileId: number, column: { index: number, name: string }): Promise<ColumnSelectionEntry | null> {
        const existingColumns = await this.repository.getSelectionsByFileId(fileId);
        const isSelected = existingColumns.some(col => col.columnIndex === column.index);

        if (isSelected) {
            // Si la colonne est déjà sélectionnée, la supprimer
            await this.repository.removeColumn(fileId, column.index);
            return null;
        } else {
            // Sinon, l'ajouter
            return await this.repository.addColumn({
                fileId,
                columnIndex: column.index,
                columnName: column.name
            });
        }
    }

    async saveColumnSelection(request: AddColumnSelectionRequest): Promise<ColumnSelectionEntry[]> {
        const entries: ColumnSelectionEntry[] = request.selectedColumns.map(col => ({
            fileId: request.fileId,
            columnIndex: col.index,
            columnName: col.name
        }));

        return await this.repository.createSelection(entries);
    }

    async getColumnSelection(fileId: number): Promise<ColumnSelectionEntry[]> {
        return await this.repository.getSelectionsByFileId(fileId);
    }



    async getColumnMaster(fileId: number): Promise<FileColumn[]> {
        return await this.repository.getColumnsByFileId(fileId);
    }

    async extractSelectedColumns(fileId: number):Promise<any[]>
    {
        return await this.repository.extractSelectedColumns(fileId)
    }


}