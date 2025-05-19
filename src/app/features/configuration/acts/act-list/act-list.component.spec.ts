import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ActListComponent } from './act-list.component';

describe('ActListComponent', () => {
  let component: ActListComponent;
  let fixture: ComponentFixture<ActListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ActListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
