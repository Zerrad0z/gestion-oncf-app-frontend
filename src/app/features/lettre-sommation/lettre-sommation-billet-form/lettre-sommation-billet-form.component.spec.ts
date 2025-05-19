import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LettreSommationBilletFormComponent } from './lettre-sommation-billet-form.component';

describe('LettreSommationBilletFormComponent', () => {
  let component: LettreSommationBilletFormComponent;
  let fixture: ComponentFixture<LettreSommationBilletFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LettreSommationBilletFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LettreSommationBilletFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
