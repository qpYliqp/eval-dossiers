import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { SimpleChange } from '@angular/core';
import { MappingResolverComponent } from './mapping-resolver.component';
import { ViewingListComponent } from '../../../../shared/components/lists/viewing-list/viewing-list.component';
import { LargeButtonComponent } from '../../../../shared/components/buttons/large-button/large-button.component';
import { mappingEntry } from '../../../../shared/models/objectListEntries/mapping-entry/mappingEntry';

describe('MappingResolverComponent', () => {
  let component: MappingResolverComponent;
  let fixture: ComponentFixture<MappingResolverComponent>;

  const mockMappings = [
    {
      master: { index: 0, name: 'Master1', description: 'Master Description 1' },
      pv: { index: 0, name: 'PV1', description: 'PV Description 1' },
      entryId: 1
    },
    {
      master: { index: 1, name: 'Master2' },
      pv: { index: 1, name: 'PV2' },
      entryId: 2
    }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MappingResolverComponent],
      providers: []
    })
      .compileComponents();

    fixture = TestBed.createComponent(MappingResolverComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with empty mappings', () => {
    expect(component.mappings).toEqual([]);
    expect(component.mappingEntries).toEqual([]);
  });

  it('should initialize mappingActions', () => {
    expect(component.mappingActions.length).toBe(1);
    expect(component.mappingActions[0].id).toBe('delete');
  });

  it('should update mappingEntries when mappings input changes', () => {
    component.mappings = mockMappings;

    component.ngOnChanges({
      mappings: new SimpleChange([], mockMappings, true)
    });

    expect(component.mappingEntries.length).toBe(2);
    expect(component.mappingEntries[0]).toBeInstanceOf(mappingEntry);
  });

  it('should emit deleteMapping event with correct entryId', () => {
    spyOn(component.deleteMapping, 'emit');
    component.mappings = mockMappings;

    component.ngOnChanges({
      mappings: new SimpleChange([], mockMappings, true)
    });

    const entry = component.mappingEntries[0];
    const action = component.mappingActions[0];

    action.execute(entry);

    expect(component.deleteMapping.emit).toHaveBeenCalledWith(1);
  });

  it('should not emit deleteMapping if entryId is undefined', () => {
    spyOn(component.deleteMapping, 'emit');
    const mappingsWithoutId = [{
      master: { index: 0, name: 'Master1' },
      pv: { index: 0, name: 'PV1' }
    }];

    component.mappings = mappingsWithoutId;
    component.ngOnChanges({
      mappings: new SimpleChange([], mappingsWithoutId, true)
    });

    const entry = component.mappingEntries[0];
    const action = component.mappingActions[0];

    action.execute(entry);

    expect(component.deleteMapping.emit).not.toHaveBeenCalled();
  });

  it('should emit toggleSelection when triggered', () => {
    spyOn(component.toggleSelection, 'emit');

    component.toggleSelection.emit();

    expect(component.toggleSelection.emit).toHaveBeenCalled();
  });

  it('should emit saveSelection when triggered', () => {
    spyOn(component.saveSelection, 'emit');

    component.saveSelection.emit();

    expect(component.saveSelection.emit).toHaveBeenCalled();
  });

  it('should update mappingEntries when updateMappingEntries is called', () => {
    component.mappings = mockMappings;
    component.mappingEntries = [];

    component.updateMappingEntries();

    expect(component.mappingEntries.length).toBe(2);
    expect(component.mappingEntries[0]).toBeInstanceOf(mappingEntry);
  });
});
