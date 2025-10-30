import { Listable } from "../../../../core/interfaces/listable";
import { File } from "../../../../core/models/file.model";
import { FileColumn } from "../../../../features/file-upload/models/FileColumn";


export class columnMasterEntry implements Listable {

private static columns : {key: string, label: string}[] = []
private values: Record<string, any> = {};

constructor(labels: string[]) {
  columnMasterEntry.columns.forEach((column, index) => {
    this.values[column.key] = labels[index]; // Associe chaque label à la clé correspondante
  });
}

  static getColumns() {
    return this.columns;
  }

  static setColumns(newColumns: FileColumn[]) {
    this.columns = newColumns.map(column => ({
      key: column.columnName, // key prend la valeur de columnName
      label: column.columnName // label prend la valeur de columnName
    }));
  }

  getValues() {
    return this.values
  }

}

