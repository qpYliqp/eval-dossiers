import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormCreateMasterProgramComponent } from './form-create-master-program.component';
import { CreateMasterProgramDto } from '../../services/master-programs.service';

describe('FormCreateMasterProgramComponent', () => {
  let component: FormCreateMasterProgramComponent;
  let fixture: ComponentFixture<FormCreateMasterProgramComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormCreateMasterProgramComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FormCreateMasterProgramComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Modification mode', () => {
    const existingMaster: CreateMasterProgramDto = {
      masterName: 'Master Existant',
      academicUnit: 'UF Existante'
    };

    beforeEach(() => {
      component.masterToModify = existingMaster;
      component.ngOnInit();
      fixture.detectChanges();
    });

    it('should initialize with the existing master data when in modification mode', () => {
      expect(component.newMaster).toEqual(existingMaster);
    });

    it('should emit formSubmit event with modified data when form is submitted', () => {
      const modifiedMaster: CreateMasterProgramDto = {
        masterName: 'Master Modifié',
        academicUnit: 'UF Modifiée'
      };
      
      spyOn(component.formSubmit, 'emit');
      component.submitCreation(modifiedMaster);
      
      expect(component.formSubmit.emit).toHaveBeenCalledWith(modifiedMaster);
      expect(component.newMaster).toEqual(modifiedMaster);
    });

    it('should emit formCancel event when cancellation is requested', () => {
      spyOn(component.formCancel, 'emit');
      component.cancelCreation();
      
      expect(component.formCancel.emit).toHaveBeenCalled();
    });
  });


  describe('Creation mode', () => {
    beforeEach(() => {
      component.masterToModify = undefined; // Pas de master à modifier en mode création
      component.ngOnInit();
      fixture.detectChanges();
    });
  
    it('should initialize with empty master data when in creation mode', () => {
      expect(component.newMaster).toEqual({masterName: '', academicUnit: ''});
    });
  });
  it('should emit formSubmit event with modified data when form is submitted', () => {
    const modifiedMaster: CreateMasterProgramDto = {
      masterName: 'Master Modifié',
      academicUnit: 'UF Modifiée'
    };
    
    spyOn(component.formSubmit, 'emit');
    component.submitCreation(modifiedMaster);
    
    expect(component.formSubmit.emit).toHaveBeenCalledWith(modifiedMaster);
    expect(component.newMaster).toEqual(modifiedMaster);
  });

  it('should emit formCancel event when cancellation is requested', () => {
    spyOn(component.formCancel, 'emit');
    component.cancelCreation();
    
    expect(component.formCancel.emit).toHaveBeenCalled();
  });

 
});