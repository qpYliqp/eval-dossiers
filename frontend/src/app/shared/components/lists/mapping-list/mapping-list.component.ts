import { Component, Input, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';


export enum MappingListType {
  MASTER = 'master',
  PV = 'pv'
}

@Component({
  selector: 'mapping-list',
  standalone: true,
  imports: [CommonModule,],
  templateUrl: './mapping-list.component.html',
  styleUrl: './mapping-list.component.scss'
})
export class MappingListComponent {
  @Input() columns: { index: number, name: string, description?: string }[] = [];
  @Input() title: string = "Champs mon master";
  @Input() mappings: { master: { index: number, name: string, description?: string }, pv: { index: number, name: string, description?: string } }[] = [];

  @Input() listType: MappingListType = MappingListType.MASTER;

  @Output() selectedRowChange = new EventEmitter<{ index: number, name: string, description?: string } | null>();

  private _isSelecting: boolean = false;

  @Input()
  set isSelecting(value: boolean) {
    this._isSelecting = value;
    if (!value) {
      this.selectedRow = null;
      this._isSelecting = false;
    }
  }

  get isSelecting(): boolean {
    return this._isSelecting;
  }

  selectedRow: { index: number, name: string, description?: string } | null = null;

  selectRow(column: { index: number, name: string, description?: string }) {
    if (this.isSelecting && !this.isMapped(column)) {
      if (this.selectedRow?.index === column.index) {
        this.selectedRow = null;
      } else {
        this.selectedRow = column;
        console.log("selected row : ", this.selectedRow)

      }
      this.selectedRowChange.emit(this.selectedRow);
    }

  }

  isMapped(column: { index: number, name: string, description?: string }): boolean {
    return this.mappings.some(mapping => mapping[this.listType].index === column.index);
  }

  getRowClass(column: { index: number, name: string, description?: string }): { [key: string]: boolean } {
    return {
      'selected': this.selectedRow?.index === column.index,
      'disabled': this.isMapped(column)
    };
  }
}
