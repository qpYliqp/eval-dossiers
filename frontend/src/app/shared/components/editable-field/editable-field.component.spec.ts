import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EditableFieldComponent } from './editable-field.component';
import { InfoItem } from '../../../features/update-data/components/update-data/update-data.component';

describe('EditableFieldComponent', () => {
  let component: EditableFieldComponent;
  let fixture: ComponentFixture<EditableFieldComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditableFieldComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(EditableFieldComponent);
    component = fixture.componentInstance;

    component.infoItem = {
      label: 'Test Label',
      value: 'Test Value',
      isEditable: true
    };

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
