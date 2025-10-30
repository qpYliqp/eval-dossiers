import { Component, EventEmitter, Input, OnInit, OnDestroy, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { FileSelectService, File } from '../../services/file-select.service';

@Component({
  selector: 'file-select',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './file-select.component.html',
  styleUrls: ['./file-select.component.scss']
})
export class FileSelectComponent implements OnInit, OnDestroy {
  @Input() masterId?: number;
  @Output() filesSelected = new EventEmitter<{ monmasterFileId: number, pvFileId: number }>();


  pvFiles: File[] = [];


  monmasterFileId: number | null = null;
  monmasterFileName: string | null = null;


  selectedPvFile: number | null = null;


  loading = false;
  error: string | null = null;

  private subscription = new Subscription();

  constructor(private fileSelectService: FileSelectService) { }

  ngOnInit(): void {

    this.subscription.add(
      this.fileSelectService.state$.subscribe(state => {
        this.pvFiles = state.pvFiles;
        this.monmasterFileId = state.monmasterFileId;
        this.monmasterFileName = state.monmasterFileName;
        this.selectedPvFile = state.selectedPvFile;
        this.loading = state.loading;
        this.error = state.error;
      })
    );

    if (this.masterId) {

      this.fileSelectService.loadFilesForMaster(this.masterId).subscribe();
    } else {

      this.fileSelectService.loadPvFiles().subscribe();
    }
  }

  ngOnDestroy(): void {

    this.subscription.unsubscribe();
  }

  selectPvFile(fileId: number): void {
    this.fileSelectService.selectPvFile(fileId);
  }

  startMapping(): void {
    if (this.monmasterFileId && this.selectedPvFile) {
      this.filesSelected.emit({
        monmasterFileId: this.monmasterFileId,
        pvFileId: this.selectedPvFile
      });
    }
  }
}
