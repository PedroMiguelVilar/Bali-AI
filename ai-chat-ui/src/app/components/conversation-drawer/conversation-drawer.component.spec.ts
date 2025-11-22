import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConversationDrawerComponent } from './conversation-drawer.component';

describe('ConversationDrawerComponent', () => {
  let component: ConversationDrawerComponent;
  let fixture: ComponentFixture<ConversationDrawerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConversationDrawerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConversationDrawerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
