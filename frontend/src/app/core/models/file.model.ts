export class File {
  fileId: number;
  fileName: string;
  fileType: string;
  uploadDate: string;
  universityName: string;
  academicUnitName: string;
  session: string;
  academicYear: string;
  fileOrigin: string;

  constructor(
    fileOrigin: string,
    fileId: number,
    fileName: string,
    fileType: string,
    uploadDate: string,
    universityName: string,
    academicUnitName: string,
    session: string,
    academicYear: string
  ) {
    this.fileOrigin = fileOrigin;
    this.fileId = fileId;
    this.fileName = fileName;
    this.fileType = fileType;
    this.uploadDate = uploadDate;
    this.universityName = universityName;
    this.academicUnitName = academicUnitName;
    this.session = session;
    this.academicYear = academicYear;
  }

  get fullName(): string {
    return this.fileName + " " + this.fileType;
  }
}
