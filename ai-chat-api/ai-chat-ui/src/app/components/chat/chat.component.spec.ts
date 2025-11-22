import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { BehaviorSubject } from 'rxjs';

import { ChatComponent } from './chat.component';

describe('ChatComponent', () => {
  let component: ChatComponent;
  let fixture: ComponentFixture<ChatComponent>;
  let httpMock: HttpTestingController;
  const paramMap$ = new BehaviorSubject(convertToParamMap({ slug: 'luna' }));

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChatComponent],
      providers: [
        provideHttpClientTesting(),
        {
          provide: ActivatedRoute,
          useValue: { paramMap: paramMap$.asObservable() },
        },
        {
          provide: Router,
          useValue: { navigate: jasmine.createSpy('navigate') },
        },
      ],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);

    fixture = TestBed.createComponent(ChatComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    const themesReq = httpMock.expectOne('http://localhost:3000/themes');
    themesReq.flush([
      {
        slug: 'pink',
        name: 'Pink Bloom',
        mode: 'light',
        palette: {
          background: '#fff7fb',
          surface: '#ffeaf3',
          panel: '#ffd8e8',
          text: '#2c0f24',
          mutedText: '#7a3b5c',
          border: '#f7c0d8',
          accent: '#ff5fa2',
          accentMuted: '#ffc3de',
          accentContrast: '#290a18',
          input: '#ffeef6',
          success: '#16a34a',
          warning: '#f59e0b',
          danger: '#ef4444',
        },
      },
    ]);

    const defaultThemeReq = httpMock.expectOne(
      'http://localhost:3000/themes/default',
    );
    defaultThemeReq.flush({
      slug: 'pink',
      name: 'Pink Bloom',
      mode: 'light',
      palette: {
        background: '#fff7fb',
        surface: '#ffeaf3',
        panel: '#ffd8e8',
        text: '#2c0f24',
        mutedText: '#7a3b5c',
        border: '#f7c0d8',
        accent: '#ff5fa2',
        accentMuted: '#ffc3de',
        accentContrast: '#290a18',
        input: '#ffeef6',
        success: '#16a34a',
        warning: '#f59e0b',
        danger: '#ef4444',
      },
    });

    const personalityReq = httpMock.expectOne(
      'http://localhost:3000/personalities/luna'
    );
    personalityReq.flush({ id: 4, name: 'Luna', slug: 'luna' });

    const conversationsUrl =
      'http://localhost:3000/conversation/user/1/personality/4';

    httpMock
      .expectOne(conversationsUrl)
      .flush([{ id: 4, messages: [], startedAt: new Date().toISOString() }]);

    httpMock
      .expectOne(conversationsUrl)
      .flush([{ id: 4, messages: [], startedAt: new Date().toISOString() }]);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
