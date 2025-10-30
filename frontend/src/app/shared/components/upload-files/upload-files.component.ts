import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'upload-files',
  imports: [CommonModule],
  templateUrl: './upload-files.component.html',
  styleUrl: './upload-files.component.scss'
})
export class UploadFilesComponent {
  @Input() acceptedFormats: string = '.xls,.xlsx'; 
  @Input() maxFileSize: number = 10 * 1024 * 1024; 
  @Input() uploadText: string = 'Déposez vos fichiers ici, ou parcourir'; 

  @Output() fileSelected = new EventEmitter<File>();

  fileName: string | null = null;

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];

      if (file.size <= this.maxFileSize) {
        this.fileName = file.name;
        this.fileSelected.emit(file);
      } else {
        alert(`Le fichier est trop volumineux (max ${this.maxFileSize / (1024 * 1024)}MB).`);
      }
    }
  }
}
