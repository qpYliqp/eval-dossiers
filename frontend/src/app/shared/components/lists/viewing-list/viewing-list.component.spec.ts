import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ViewingListComponent } from './viewing-list.component';

describe('ViewingListComponent', () => {
  let component: ViewingListComponent<any>;
  let fixture: ComponentFixture<ViewingListComponent<any>>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ViewingListComponent]
    })
      .compileComponents();
    fixture = TestBed.createComponent(ViewingListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

});
