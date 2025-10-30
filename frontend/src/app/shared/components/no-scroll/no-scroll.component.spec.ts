import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NoScrollComponent } from './no-scroll.component';

describe('NoScrollComponent', () => {
  let component: NoScrollComponent;
  let fixture: ComponentFixture<NoScrollComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NoScrollComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NoScrollComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
