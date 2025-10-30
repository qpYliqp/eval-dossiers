import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { MasterProgramsSpacesComponent } from './master-programs-spaces.component';
import { provideHttpClient } from '@angular/common/http';

describe('MasterProgramsSpacesComponent', () => {
  let component: MasterProgramsSpacesComponent;
  let fixture: ComponentFixture<MasterProgramsSpacesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MasterProgramsSpacesComponent],
      providers: [        
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(MasterProgramsSpacesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
