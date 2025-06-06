import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RapportMListComponent } from './rapport-m-list.component';

describe('RapportMListComponent', () => {
  let component: RapportMListComponent;
  let fixture: ComponentFixture<RapportMListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RapportMListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RapportMListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
