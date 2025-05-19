import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LettreSommationBilletListComponent } from './lettre-sommation-billet-list.component';

describe('LettreSommationBilletListComponent', () => {
  let component: LettreSommationBilletListComponent;
  let fixture: ComponentFixture<LettreSommationBilletListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LettreSommationBilletListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LettreSommationBilletListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
