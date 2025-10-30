import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LargeButtonComponent } from '../../../shared/components/buttons/large-button/large-button.component';
import { File } from '../../../core/models/file.model';
import { UploadSectionComponent, SelectedFile } from './upload-section/upload-section.component';
import { UploadMetadataSectionComponent } from './upload-metadata-section/upload-metadata-section.component';
import { FileUploadService, FileUploadDto } from '../services/file-upload.service';
import { HttpEvent, HttpEventType } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { fileEntry } from '../../../shared/models/objectListEntries/file-entry/file-entry';
import { ViewingListComponent } from '../../../shared/components/lists/viewing-list/viewing-list.component';
import { ListAction } from '../../../core/interfaces/listAction';
import { ValidationFormComponent } from '../../../shared/components/forms/validation-form/validation-form.component';
import { SelectColumnMasterComponent } from '../../../shared/components/lists/select-column-master/select-column-master.component';
// import { FileMasterService } from '../services/file-master.service';

@Component({
  selector: 'file-upload',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LargeButtonComponent,
    UploadSectionComponent,
    UploadMetadataSectionComponent,
    ViewingListComponent,
    ValidationFormComponent,
    SelectColumnMasterComponent
  ],
  templateUrl: './file-upload.component.html',
  styleUrls: ['./file-upload.component.scss']
})
export class FileUploadComponent implements OnInit {
  // Viewing list properties
  fileEntries!: fileEntry[];
  fileColumns = fileEntry.getColumns();

  // userActions generated based on activeTab
  userActions: ListAction<fileEntry>[] = this.getActionsForFile();

  // Selection column for monMaster File
  isSelectingMasterColumn: boolean = false;
  fileIdXLSX: number | null = null;

  // Getter to filter file entries based on active tab.
  get filteredFileEntries(): fileEntry[] {
    return (this.fileEntries || []).filter(entry => {
      const origin = entry.getFile().fileOrigin;
      if (this.activeTab === 'Documents') {
        return origin === 'StudentDocuments';
      } else if (this.activeTab === 'MonMaster') {
        return origin === 'MonMaster';
      } else {
        return origin === 'PV';
      }
    });
  }

  // Tab navigation: 'PV', 'MonMaster', 'Documents'
  activeTab: 'PV' | 'MonMaster' | 'Documents' = 'PV';

  // Selected files for each section
  pvSelectedFile: SelectedFile | null = null;
  mmSelectedFile: SelectedFile | null = null;
  docSelectedFile: SelectedFile | null = null;

  // Upload status tracking
  isUploading = false;
  uploadProgress = 0;
  uploadCompleted = false;
  uploadError = false;

  // Metadata lists (for PV only)
  universityList: string[] = [
    'université de Bordeaux',
    'université de Paris',
    'université de Lyon',
    'université de L'
  ];
  academicYearList: string[] = ['2022-2023', '2023-2024', '2024-2025'];
  academicUnitList: string[] = ['Informatique', 'Mathématiques', 'Physique'];

  // Metadata selections for PV
  pvSelectedUniversity = '';
  pvSelectedAcademicYear = '';
  pvSelectedAcademicUnit = '';
  pvSelectedSession = 'session1';

  // Master Program ID from route
  masterId!: number;

  // Array to hold uploaded files for this master
  uploadedFiles: File[] = [];

  // Variables for deletion validation
  FileToDelete: number | null = null;
  isDeletingFile: boolean = false;

  constructor(
    private fileUploadService: FileUploadService,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.masterId = +params['masterId'];
      this.refreshFiles();
    });

    this.fileUploadService.files$.subscribe(files => {
      this.uploadedFiles = files;
      this.fileEntries = files.map(file => new fileEntry(file));
      console.log('Uploaded files:', files);
    });
  }

  getActionsForFile(): ListAction<fileEntry>[] {
    let actions: ListAction<fileEntry>[] = [
      {
        id: 'delete',
        icon: 'assets/icons/delete-icon.svg',
        label: 'Supprimer',
        execute: (entry: fileEntry) => {
          const fileData = entry.getFile();
          const fileId = (fileData as any).fileId || fileData.fileId;
          if (!fileId) {
            console.error("File ID not found in file data:", fileData);
            return;
          }
          console.log("Requesting deletion for file:", fileData.fullName, "ID:", fileId);
          this.FileToDelete = fileId;
          this.isDeletingFile = true;
        }
      },
      {
        id: 'download',
        icon: 'assets/icons/download-icon.svg',
        label: 'Télécharger',
        execute: (entry: fileEntry) => this.downloadFile(entry, "PV")
      }
    ];
    if (this.activeTab === 'MonMaster') {
      actions.push({
        id: 'column-monmaster',
        icon: 'assets/icons/modify-icon.svg',
        label: 'Sélectionner les colonnes du fichier MonMaster',
        execute: (entry: fileEntry) => {
          const fileData = entry.getFile();
          const fileId = (fileData as any).fileId || fileData.fileId;
          console.log("File ID:", fileId);
          this.selectColumnMaster(fileId);
        }
      });
    }
    return actions;
  }

  selectColumnMaster(fileId: number) {
    this.fileIdXLSX = fileId;
    this.isSelectingMasterColumn = true;
  }

  cancelSelectColumnMaster() {
    this.fileIdXLSX = null;
    this.isSelectingMasterColumn = false;
  }

  onFileSelected(selectedFile: SelectedFile, section: 'PV' | 'MonMaster' | 'Documents'): void {
    if (section === 'PV') {
      this.pvSelectedFile = selectedFile;
    } else if (section === 'MonMaster') {
      this.mmSelectedFile = selectedFile;
    } else {
      this.docSelectedFile = selectedFile;
    }
  }

  clearSelectedFile(section: 'PV' | 'MonMaster' | 'Documents'): void {
    if (section === 'PV') {
      this.pvSelectedFile = null;
    } else if (section === 'MonMaster') {
      this.mmSelectedFile = null;
    } else {
      this.docSelectedFile = null;
    }
  }

  uploadFile(section: 'PV' | 'MonMaster' | 'Documents'): void {
    if (section === 'PV' && this.pvSelectedFile && this.canUploadPV()) {
      this.performUpload(this.pvSelectedFile, section);
    } else if (section === 'MonMaster' && this.mmSelectedFile && this.canUploadMM()) {
      this.performUpload(this.mmSelectedFile, section);
    } else if (section === 'Documents' && this.docSelectedFile && this.canUploadDocuments()) {
      this.performUpload(this.docSelectedFile, section);
    }
  }

  private performUpload(selectedFile: SelectedFile, section: 'PV' | 'MonMaster' | 'Documents'): void {
    this.isUploading = true;
    this.uploadProgress = 0;
    this.uploadCompleted = false;
    this.uploadError = false;

    let dto: FileUploadDto;
    if (section === 'PV') {
      dto = {
        file: selectedFile.file,
        fileOrigin: 'PV',
        masterId: this.masterId,
        university: this.pvSelectedUniversity,
        formation: this.pvSelectedAcademicUnit,
        yearAcademic: this.pvSelectedAcademicYear,
        session: this.pvSelectedSession === 'session1' ? 1 : 2
      };
    } else if (section === 'MonMaster') {
      dto = {
        file: selectedFile.file,
        fileOrigin: 'MonMaster',
        masterId: this.masterId
      };
    } else {
      dto = {
        file: selectedFile.file,
        fileOrigin: 'StudentDocuments',
        masterId: this.masterId
      };
    }

    this.fileUploadService.uploadFile(dto).subscribe({
      next: (event: HttpEvent<any>) => {
        if (event.type === HttpEventType.UploadProgress && event.total) {
          this.uploadProgress = Math.round((100 * event.loaded) / event.total);
        } else if (event.type === HttpEventType.Response) {
          this.uploadCompleted = true;
          this.isUploading = false;
          this.uploadError = false;
          if (section === 'PV') {
            this.pvSelectedFile = null;
          } else if (section === 'MonMaster') {
            this.mmSelectedFile = null;
          } else {
            this.docSelectedFile = null;
          }
          console.log('Upload response:', event.body);
          this.refreshFiles();
          setTimeout(() => {
            this.uploadCompleted = false;
          }, 1500);
        }
      },
      error: (error) => {
        console.error('Upload error:', error);
        this.isUploading = false;
        this.uploadError = true;
        setTimeout(() => {
          this.uploadError = false;
        }, 3000);
      }
    });
  }

  refreshFiles(): void {
    if (this.masterId) {
      this.fileUploadService.getFilesByMaster(this.masterId).subscribe({
        next: (files) => {
          this.uploadedFiles = files;
          this.fileEntries = files.map(file => new fileEntry(file));
          console.log('Files for master:', files);
        },
        error: (err) => {
          console.error('Error fetching files:', err);
        }
      });
    }
  }

  canUploadPV(): boolean {
    return !!(
      this.pvSelectedFile &&
      this.pvSelectedUniversity &&
      this.pvSelectedAcademicYear &&
      this.pvSelectedAcademicUnit &&
      this.masterId
    );
  }

  canUploadMM(): boolean {
    return !!this.mmSelectedFile;
  }

  canUploadDocuments(): boolean {
    if (!this.docSelectedFile || !this.masterId) return false;
    return this.docSelectedFile.type === 'pdf';
  }

  switchTab(tab: 'PV' | 'MonMaster' | 'Documents'): void {
    this.activeTab = tab;
  }

  downloadFile(entry: fileEntry, section: 'PV' | 'MonMaster' | 'Documents'): void {
    const fileData = entry.getFile();
    const fileId = (fileData as any).fileId || fileData.fileId;
    if (!fileId) {
      console.error("File ID not found in file data:", fileData);
      return;
    }
    this.fileUploadService.downloadFile(fileId).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileData.fileName;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        console.error("Error downloading file:", err);
      }
    });
  }

  confirmDelete(): void {
    if (this.FileToDelete) {
      this.fileUploadService.deleteFile(this.FileToDelete).subscribe({
        next: (res) => {
          console.log("Deleted file:", res.message);
          this.refreshFiles();
          this.cancelDelete();
        },
        error: (err) => {
          console.error("Error deleting file:", err);
          this.cancelDelete();
        }
      });
    }
  }

  cancelDelete(): void {
    this.isDeletingFile = false;
    this.FileToDelete = null;
  }
}
