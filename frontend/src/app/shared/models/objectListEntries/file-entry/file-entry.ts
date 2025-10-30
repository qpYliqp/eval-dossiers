import { Listable } from "../../../../core/interfaces/listable";
import { File } from "../../../../core/models/file.model";

export class fileEntry implements Listable {
  constructor(private file: File) {}

  static getColumns() {
    return [
      { key: 'fileName',          label: 'Nom du fichier' },
      { key: 'fileType',          label: 'Type' },
      { key: 'uploadDate',        label: 'Date de téléchargement' },
      { key: 'universityName',    label: 'Nom de l\'université' },
      { key: 'academicUnitName',  label: 'Nom de l\'unité académique' },
      { key: 'session',           label: 'Session' },
      { key: 'academicYear',      label: 'Année universitaire' }
    ];
  }

  getValues() {
    return {
      fileName: this.file.fileName,
      fileType: this.file.fileType,
      uploadDate: this.file.uploadDate,
      universityName: this.file.universityName || (this.file as any).university,
      academicUnitName: this.file.academicUnitName || (this.file as any).formation,
      session: this.file.session,
      academicYear: this.file.academicYear || (this.file as any).yearAcademic
    };
  }

  getFile(): File {
    return this.file;
  }
}

