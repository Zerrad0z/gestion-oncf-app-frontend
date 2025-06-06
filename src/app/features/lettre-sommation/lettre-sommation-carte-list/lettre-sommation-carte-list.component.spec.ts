import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LettreSommationCarteListComponent } from './lettre-sommation-carte-list.component';

describe('LettreSommationCarteListComponent', () => {
  let component: LettreSommationCarteListComponent;
  let fixture: ComponentFixture<LettreSommationCarteListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LettreSommationCarteListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LettreSommationCarteListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
