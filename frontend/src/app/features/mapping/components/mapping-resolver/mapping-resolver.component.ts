import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LargeButtonComponent } from '../../../../shared/components/buttons/large-button/large-button.component';
import { ViewingListComponent } from '../../../../shared/components/lists/viewing-list/viewing-list.component';
import { mappingEntry } from '../../../../shared/models/objectListEntries/mapping-entry/mappingEntry';
import { ListAction } from '../../../../core/interfaces/listAction';

@Component({
  selector: 'mapping-resolver',
  standalone: true,
  imports: [LargeButtonComponent, CommonModule, ViewingListComponent],
  templateUrl: './mapping-resolver.component.html',
  styleUrl: './mapping-resolver.component.scss'
})
export class MappingResolverComponent implements OnChanges {
  @Output() toggleSelection = new EventEmitter<void>();
  @Output() saveSelection = new EventEmitter<void>();
  @Output() deleteMapping = new EventEmitter<number>();

  @Input() mappings: { master: { index: number, name: string }, pv: { index: number, name: string }, entryId?: number }[] = [];
  @Input() isSelecting: boolean = false;

  mappingEntries: mappingEntry[] = this.mappings.map(mapping => new mappingEntry(mapping));
  mappingColumns = mappingEntry.getColumns();

  constructor() {
    this.updateMappingActions();
  }

  mappingActions: ListAction<mappingEntry>[] = [];

  updateMappingActions(): void {
    this.mappingActions = [
      {
        id: 'delete',
        icon: 'assets/icons/delete-icon.svg',
        label: 'Supprimer',
        execute: (entry: mappingEntry) => {
          const mapping = entry.getMapping();
          const entryId = mapping.entryId;
          if (entryId) {
            this.deleteMapping.emit(entryId);
          }
        }
      }
    ];
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Update entries and actions when mappings change
    if (changes['mappings']) {
      this.updateMappingEntries();
    }
  }

  updateMappingEntries(): void {
    this.mappingEntries = this.mappings.map(mapping => new mappingEntry(mapping));
  }
}
