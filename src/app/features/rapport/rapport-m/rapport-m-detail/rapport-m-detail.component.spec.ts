import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RapportMDetailComponent } from './rapport-m-detail.component';

describe('RapportMDetailComponent', () => {
  let component: RapportMDetailComponent;
  let fixture: ComponentFixture<RapportMDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RapportMDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RapportMDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
