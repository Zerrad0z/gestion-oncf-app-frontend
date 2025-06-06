import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LettreSommationCarteDetailComponent } from './lettre-sommation-carte-detail.component';

describe('LettreSommationCarteDetailComponent', () => {
  let component: LettreSommationCarteDetailComponent;
  let fixture: ComponentFixture<LettreSommationCarteDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LettreSommationCarteDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LettreSommationCarteDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
