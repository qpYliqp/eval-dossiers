import { Component, Input, Output, EventEmitter,OnInit  } from '@angular/core';
import { NoScrollComponent } from '../../no-scroll/no-scroll.component';
import { LargeButtonComponent } from '../../buttons/large-button/large-button.component';
import { CommonModule } from '@angular/common';
import { FileColumn } from '../../../../features/file-upload/models/FileColumn';
import { FileMasterService } from '../../../../features/file-upload/services/file-master.service';



@Component({
  selector: 'select-column-master',
  standalone: true,
  imports: [NoScrollComponent,CommonModule,LargeButtonComponent],
  templateUrl: './select-column-master.component.html',
  styleUrl: './select-column-master.component.scss'
})
export class SelectColumnMasterComponent {
  @Input() fileId: number | null = null;
  @Output() cancel = new EventEmitter<void>();

  masterColumns : FileColumn[] = []
  selectedRows: FileColumn[] = [];

  constructor(private fileMasterService: FileMasterService) { }

  ngOnInit() {
    if (this.fileId != null) {
      this.fileMasterService.getColumnsByFileId(this.fileId).subscribe({
        next: (columns) => {
          console.log(columns)
          this.masterColumns = columns;
          console.log('Colonnes récupérées:', this.masterColumns);
        },
        error: (err) => {
          console.error('Erreur lors de la récupération des colonnes:', err);
        }
      });

      this.fileMasterService.getSelectedColumnsByFileId(this.fileId).subscribe({
        next: (columns)=>{
          this.selectedRows = columns;
        }
      })
    } else {
      this.cancelSelection();
    }
  }



  selectRow(column: FileColumn) {
    if(this.fileId != null)
    {      
      const index = this.selectedRows.findIndex(row => row.columnIndex === column.columnIndex);
      if (index > -1) {
        this.selectedRows.splice(index, 1); // Déselectionner
      } else {
        this.selectedRows.push(column); // Sélectionner
      }
      this.fileMasterService.toggleColumnSelection(this.fileId, column.columnIndex, column.columnName).subscribe(response => {
        console.log('Réponse du serveur:', response);
      });
    }
    else
    {
        this.cancelSelection()
    }
  }

  getRowClass(column: FileColumn): { [key: string]: boolean } {
    return {
      'selected': this.selectedRows.some(row => row.columnIndex === column.columnIndex),
    };
  }

  cancelSelection() {
    this.cancel.emit();
  }
}