import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CepcComponent } from './cepc.component';

describe('CepcComponent', () => {
  let component: CepcComponent;
  let fixture: ComponentFixture<CepcComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CepcComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CepcComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
