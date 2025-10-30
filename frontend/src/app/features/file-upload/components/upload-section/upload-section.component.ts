import { Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface SelectedFile {
  file: File;
  name: string;
  type: string;
  size: string;
}

@Component({
  selector: 'app-upload-section',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './upload-section.component.html',
  styleUrls: ['./upload-section.component.scss']  
})
export class UploadSectionComponent {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  @Input() fileTypes: string = '.pdf';
  @Input() acceptedFormatsText: string = 'PDF';
  @Input() selectedFile: SelectedFile | null = null;
  @Input() isUploading: boolean = false;
  @Input() uploadProgress: number = 0;
  @Input() uploadCompleted: boolean = false;
  @Input() uploadError: boolean = false;

  @Output() fileSelected = new EventEmitter<SelectedFile>();
  @Output() fileClear = new EventEmitter<void>();

  triggerFileInput(): void {
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const file = input.files[0];
    const selectedFile = {
      file: file,
      name: file.name,
      type: this.getExtension(file.name),
      size: this.formatFileSize(file.size)
    };
    this.fileSelected.emit(selectedFile);
    input.value = '';
  }

  clearSelectedFile(): void {
    this.fileClear.emit();
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  getFileIcon(fileType: string): string {
    const type = fileType.toLowerCase();
    if (type === 'pdf') return 'assets/icons/pdf.svg';
    if (['xlsx', 'xls'].includes(type)) return 'assets/icons/xls.svg';
    if (type === 'xml') return 'assets/icons/xml.svg';
    return 'assets/icons/file.svg';
  }

  private getExtension(filename: string): string {
    const parts = filename.split('.');
    return parts.length > 1 ? parts.pop()!.toLowerCase() : '';
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    const target = event.target as HTMLElement;
    const container = this.findAncestor(target, 'drag-drop-container');
    if (container) {
      container.classList.add('active');
    }
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    const target = event.target as HTMLElement;
    const container = this.findAncestor(target, 'drag-drop-container');
    if (container) {
      container.classList.remove('active');
    }
  }

  onFileDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    const target = event.target as HTMLElement;
    const container = this.findAncestor(target, 'drag-drop-container');
    if (container) {
      container.classList.remove('active');
    }
    if (event.dataTransfer?.files?.length) {
      const file = event.dataTransfer.files[0];
      const selectedFile = {
        file: file,
        name: file.name,
        type: this.getExtension(file.name),
        size: this.formatFileSize(file.size)
      };
      this.fileSelected.emit(selectedFile);
    }
  }

  private findAncestor(el: HTMLElement, cls: string): HTMLElement | null {
    while (el && !el.classList.contains(cls)) {
      el = el.parentElement as HTMLElement;
      if (!el) return null;
    }
    return el;
  }
}
