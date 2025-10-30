import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormAddExaminerComponent } from './form-add-examiner.component';

describe('FormAddExaminerComponent', () => {
  let component: FormAddExaminerComponent;
  let fixture: ComponentFixture<FormAddExaminerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormAddExaminerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FormAddExaminerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
