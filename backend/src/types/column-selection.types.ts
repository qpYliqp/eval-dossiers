export interface ColumnSelectionEntry {
    selectionId?: number;
    fileId: number;
    columnIndex: number;
    columnName: string;
    createdAt?: Date;
}

export interface AddColumnSelectionRequest {
    fileId: number;
    selectedColumns: Array<{ index: number; name: string }>;
}

export interface FileColumn
{
    columnIndex: number;
    columnName: string;
}

