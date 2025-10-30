import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { MappingListComponent, MappingListType } from '../../../../shared/components/lists/mapping-list/mapping-list.component';
import { MappingResolverComponent } from '../mapping-resolver/mapping-resolver.component';
import { MappingWithDescription } from '../../services/mapping.types';
import { FieldProviderService, MappingField } from '../../services/field-provider.service';
import { LoadingIndicatorComponent } from '../../../../shared/components/loading-indicator/loading-indicator.component';
import { ErrorMessageComponent } from '../../../../shared/components/error-message/error-message.component';
import { FileSelectComponent } from '../file-select/file-select.component';
import { MappingFacadeService } from '../../services/mapping-facade.service';

@Component({
  selector: 'app-file-mapping',
  standalone: true,
  imports: [
    CommonModule,
    MappingListComponent,
    MappingResolverComponent,
    LoadingIndicatorComponent,
    ErrorMessageComponent,
    FileSelectComponent
  ],
  templateUrl: './file-mapping.component.html',
  styleUrl: './file-mapping.component.scss'
})
export class FileMappingComponent implements OnInit, OnDestroy {
  readonly MappingListType = MappingListType;

  // File IDs
  monmasterFileId: number | null = null;
  pvFileId: number | null = null;

  // Mapping state
  isSelectingMapping: boolean = false;
  selectedMasterRow: { index: number, name: string, description?: string } | null = null;
  selectedPvRow: { index: number, name: string, description?: string } | null = null;
  mappings: MappingWithDescription[] = [];

  // Data from services
  masterData: MappingField[] = [];
  pvData: MappingField[] = [];

  // UI state
  loading: boolean = false;
  error: string | null = null;
  configLoaded: boolean = false;

  // Configuration ID tracking
  currentConfigurationId: number | null = null;

  // Add masterId property
  masterId: number | null = null;

  // Subscriptions
  private subscriptions = new Subscription();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private mappingFacade: MappingFacadeService
  ) { }

  ngOnInit(): void {
    // Subscribe to route params
    this.subscriptions.add(
      this.route.params.subscribe(params => {
        if (params['masterId']) {
          this.masterId = parseInt(params['masterId']);
          console.log(`Loading mapping interface for master program ID: ${this.masterId}`);

          if (params['monmasterFileId'] && params['pvFileId']) {
            const monmasterFileId = parseInt(params['monmasterFileId']);
            const pvFileId = parseInt(params['pvFileId']);

            if (!isNaN(monmasterFileId) && !isNaN(pvFileId)) {
              this.monmasterFileId = monmasterFileId;
              this.pvFileId = pvFileId;
              this.loadMappingData();
            }
          }
        }
      })
    );

    // Subscribe to facade state
    this.subscriptions.add(
      this.mappingFacade.state$.subscribe(state => {
        // Update component state from facade
        this.mappings = state.mappings;
        this.masterData = state.masterFields;
        this.pvData = state.pvFields;
        this.loading = state.loading;
        this.error = state.error;
        this.configLoaded = state.configLoaded;
        this.currentConfigurationId = state.configuration?.configurationId || null;
      })
    );
  }

  ngOnDestroy(): void {
    // Clean up all subscriptions
    this.subscriptions.unsubscribe();
  }

  loadMappingData(): void {
    if (!this.monmasterFileId || !this.pvFileId) {
      return;
    }

    // Use the facade to load both mappings and fields in one operation
    this.mappingFacade.loadMappingData(this.monmasterFileId, this.pvFileId).subscribe();
  }

  toggleMappingSelection(): void {
    this.isSelectingMapping = !this.isSelectingMapping;

    // Reset selections when toggling off
    if (!this.isSelectingMapping) {
      this.selectedMasterRow = null;
      this.selectedPvRow = null;
    }
  }

  saveMapping(): void {
    if (!this.monmasterFileId || !this.pvFileId) {
      this.error = "Please select both MonMaster and PV files before creating mappings";
      return;
    }

    if (this.selectedMasterRow && this.selectedPvRow) {
      this.mappingFacade.addMappingEntry({
        configurationId: this.currentConfigurationId || 0,
        masterColumnIndex: this.selectedMasterRow.index,
        masterColumnName: this.selectedMasterRow.name,
        pvColumnIndex: this.selectedPvRow.index,
        pvColumnName: this.selectedPvRow.name,
        monmasterFileId: this.monmasterFileId,
        pvFileId: this.pvFileId
      }).subscribe({
        next: () => {
          // Reset selections and toggle off mapping mode
          this.selectedMasterRow = null;
          this.selectedPvRow = null;
          this.toggleMappingSelection();
        },
        error: () => {
          // Error handling is managed by the facade service
        }
      });
    } else {
      this.error = "Please select a field from each list before saving.";
    }
  }

  // Method to handle file selection
  onFilesSelected(monmasterFileId: number, pvFileId: number): void {
    // Navigate to the mapping route with the selected file IDs using the new structure
    if (this.masterId) {
      this.router.navigate(['/master', this.masterId, 'mapping', monmasterFileId, pvFileId]);
    } else {
      console.error('Cannot navigate: Master ID is not available');
      this.error = 'Cannot start mapping: Master program ID is missing';
    }
  }

  deleteMapping(entryId: number): void {
    this.mappingFacade.deleteMappingEntry(entryId).subscribe({
      error: () => {
        // Error handling is managed by the facade service
      }
    });
  }
}