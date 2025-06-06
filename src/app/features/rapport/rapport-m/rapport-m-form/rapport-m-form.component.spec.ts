import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RapportMFormComponent } from './rapport-m-form.component';

describe('RapportMFormComponent', () => {
  let component: RapportMFormComponent;
  let fixture: ComponentFixture<RapportMFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RapportMFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RapportMFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
