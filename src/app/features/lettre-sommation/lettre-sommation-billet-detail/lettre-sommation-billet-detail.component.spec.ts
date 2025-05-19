import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LettreSommationBilletDetailComponent } from './lettre-sommation-billet-detail.component';

describe('LettreSommationBilletDetailComponent', () => {
  let component: LettreSommationBilletDetailComponent;
  let fixture: ComponentFixture<LettreSommationBilletDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LettreSommationBilletDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LettreSommationBilletDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
