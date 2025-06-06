import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LettreSommationCarteFormComponent } from './lettre-sommation-carte-form.component';

describe('LettreSommationCarteFormComponent', () => {
  let component: LettreSommationCarteFormComponent;
  let fixture: ComponentFixture<LettreSommationCarteFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LettreSommationCarteFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LettreSommationCarteFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
