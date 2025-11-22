import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom, Subscription } from 'rxjs';
import { ConversationDrawerComponent } from '../conversation-drawer/conversation-drawer.component';
import { Message } from '../../models/message.model';
import { Conversation } from '../../models/conversation.model';
import { Personality } from '../../models/personality.model';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, ConversationDrawerComponent],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss'],
})
export class ChatComponent implements OnInit, OnDestroy {
  messages: Message[] = [];
  input = '';
  isLoading = false;
  isCreatingConversation = false;
  isTyping = false;
  typingTimer?: ReturnType<typeof setTimeout>;
  isDrawerOpen = false;
  activeConversationId: number | null = null;
  readonly userId = 1;
  feedbackSubmittingId: number | null = null;
  personalitySlug: string | null = null;
  personalityId: number | null = null;
  personality?: Personality;
  personalityError = '';
  isPersonalityLoading = false;
  private conversationCreationPromise: Promise<Conversation | null> | null =
    null;
  private routeSub?: Subscription;
  private readonly starActionPattern =
    /(?<!\*)\*(?!\*)([\s\S]*?)(?<!\*)\*(?!\*)/g;
  private readonly blockActionPattern =
    /\[\[ACTION\]\]([\s\S]*?)\[\[\/ACTION\]\]/gi;

  @ViewChild(ConversationDrawerComponent)
  drawer?: ConversationDrawerComponent;

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.routeSub = this.route.paramMap.subscribe((params) => {
      const slug = params.get('slug');

      if (!slug) {
        this.router.navigate(['/']);
        return;
      }

      if (slug === this.personalitySlug) {
        return;
      }

      this.personalitySlug = slug;
      this.resetChatState();
      this.bootstrapPersonality();
    });
  }

  ngOnDestroy(): void {
    this.routeSub?.unsubscribe();
  }

  private resetChatState() {
    this.messages = [];
    this.input = '';
    this.isLoading = false;
    this.isTyping = false;
    this.typingTimer = undefined;
    this.isDrawerOpen = false;
    this.activeConversationId = null;
    this.personalityId = null;
    this.personality = undefined;
    this.personalityError = '';
    this.isPersonalityLoading = false;
    this.isCreatingConversation = false;
    this.conversationCreationPromise = null;
  }

  onType() {
    this.isTyping = true;
    clearTimeout(this.typingTimer);

    this.typingTimer = setTimeout(() => {
      this.isTyping = false;
    }, 1500);

    this.scrollToBottom();
  }

  async sendMessage() {
    if (!this.input.trim() || this.isLoading) return;
    if (!this.personalitySlug) {
      console.warn('Cannot send a message without selecting a personality.');
      return;
    }
    if (!this.personalityId) {
      console.warn('Personality still loading. Please wait.');
      return;
    }

    this.isTyping = false;
    const userInput = this.input;
    this.input = '';

    const conversationId = await this.ensureConversationExists();
    if (!conversationId) {
      return;
    }

    this.messages.push({
      sender: 'user',
      text: this.decorateActionText(userInput),
      rawText: userInput,
    });
    this.isLoading = true;
    this.scrollToBottom();

    try {
      const res = await firstValueFrom(
        this.http.post<
          | {
              text: string;
              tokens: number;
              conversationId: number;
              messageId?: number;
            }
          | {
              response: {
                text: string;
                tokens: number;
                conversationId: number;
                messageId?: number;
              };
            }
        >(`http://localhost:3000/chat/${this.personalitySlug}`, {
          message: userInput,
          conversationId,
          userId: this.userId,
        }),
      );

      const parsed = this.extractReply(res);
      this.activeConversationId = parsed.conversationId ?? conversationId;

      const replyText = parsed.text ?? '(no reply)';
      this.messages.push({
        id: parsed.messageId ?? undefined,
        sender: 'ai',
        text: this.decorateActionText(replyText),
        rawText: replyText,
      });

      await this.refreshActiveConversation();
      this.drawer?.loadConversations();
    } catch (err) {
      const label = this.personality?.name ?? this.personalitySlug ?? 'the AI';
      console.error(`Error reaching ${label}`, err);
      const fallback = `Something went wrong while talking to ${label}.`;
      this.messages.push({
        sender: 'ai',
        text: this.decorateActionText(fallback),
        rawText: fallback,
      });
    } finally {
      this.isLoading = false;
      this.scrollToBottom();
    }
  }

  private extractReply(payload: any): {
    text: string;
    tokens?: number;
    conversationId?: number | null;
    messageId?: number | null;
  } {
    const root = payload?.response ?? payload ?? {};
    return {
      text: root.text ?? '(no reply)',
      tokens: root.tokens,
      conversationId: root.conversationId ?? null,
      messageId: root.messageId ?? null,
    };
  }

  scrollToBottom() {
    if (typeof document === 'undefined') return;
    setTimeout(() => {
      const el = document.getElementById('chat-window');
      if (el) el.scrollTop = el.scrollHeight;
    }, 100);
  }

  loadConversation(convo: Conversation) {
    if (!convo?.id) return;

    this.activeConversationId = convo.id;
    const normalized = this.normalizeMessages(convo.messages);
    this.messages = normalized;

    // If the conversation came without messages, pull the latest from the API
    // so the AI-generated intro (or any persisted messages) are shown.
    if (!normalized.length) {
      this.refreshActiveConversation();
    }

    this.scrollToBottom();
  }

  onConversationSelected(convo: Conversation) {
    this.loadConversation(convo);
    this.isDrawerOpen = false;
  }

  async handleNewConversationRequest() {
    const created = await this.createConversation();
    if (created) {
      this.onConversationCreated(created);
    }
  }

  onConversationCreated(convo: Conversation) {
    this.loadConversation(convo);
    this.drawer?.loadConversations();
    this.isDrawerOpen = false;
  }

  handleDrawerClose() {
    this.isDrawerOpen = false;
  }

  navigateToPersonalityList() {
    this.router.navigate(['/']);
  }

  retryPersonalityLoad() {
    this.bootstrapPersonality();
  }

  exportConversation() {
    if (!this.messages.length) {
      const emptyBlob = new Blob(
        [
          JSON.stringify(
            { exportedAt: new Date().toISOString(), messages: [] },
            null,
            2
          ),
        ],
        { type: 'application/json' }
      );
      this.triggerDownload(emptyBlob, 'conversation-empty');
      return;
    }

    const payload = {
      exportedAt: new Date().toISOString(),
      messageCount: this.messages.length,
      messages: this.messages.map((msg) => ({
        id: msg.id,
        sender: msg.sender,
        text: msg.rawText ?? msg.text,
        styledText: msg.text,
        createdAt: msg.createdAt,
      })),
    };

    const json = JSON.stringify(payload, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    this.triggerDownload(blob, 'conversation');
  }

  private triggerDownload(blob: Blob, baseName: string) {
    if (typeof window === 'undefined') return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${baseName}-${new Date()
      .toISOString()
      .replace(/[:.]/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 500);
  }

  private async loadInitialConversation() {
    if (!this.personalityId) {
      return;
    }

    try {
      const conversations = await firstValueFrom(
        this.http.get<Conversation[]>(
          `http://localhost:3000/conversation/user/${this.userId}/personality/${this.personalityId}`
        )
      );

      if (conversations?.length) {
        this.loadConversation(conversations[0]);
      } else {
        const created = await this.createConversation();
        if (created) {
          this.loadConversation(created);
        }
      }
    } catch (err) {
      console.error('Failed to load conversations', err);
    }
  }

  private async ensureConversationExists(): Promise<number | null> {
    if (this.activeConversationId) {
      return this.activeConversationId;
    }

    const created = await this.createConversation();
    if (created) {
      this.loadConversation(created);
      this.drawer?.loadConversations();
      return created.id;
    }

    return null;
  }

  private async createConversation(): Promise<Conversation | null> {
    if (!this.personalityId) {
      console.error('Cannot create conversation without a personality');
      return null;
    }

    if (this.conversationCreationPromise) {
      return this.conversationCreationPromise;
    }

    this.isCreatingConversation = true;

    this.conversationCreationPromise = (async () => {
      try {
        const conversation = await firstValueFrom(
          this.http.post<Conversation>('http://localhost:3000/conversation', {
            userId: this.userId,
            personalityId: this.personalityId,
          }),
        );

        return conversation;
      } catch (err) {
        console.error('Failed to create conversation', err);
        const failure = 'Unable to create a new conversation right now.';
        this.messages = [
          {
            sender: 'ai',
            text: this.decorateActionText(failure),
            rawText: failure,
          },
        ];
        return null;
      } finally {
        this.isCreatingConversation = false;
        this.conversationCreationPromise = null;
      }
    })();

    return this.conversationCreationPromise;
  }

  private async refreshActiveConversation() {
    if (!this.activeConversationId) return;

    try {
      const messages = await firstValueFrom(
        this.http.get<Message[]>(
          `http://localhost:3000/conversation/${this.activeConversationId}/messages`
        )
      );

      this.messages = this.normalizeMessages(messages);
      this.scrollToBottom();
    } catch (err) {
      console.error('Failed to refresh conversation', err);
    }
  }

  async rateMessage(msg: Message, feedback: 'up' | 'down') {
    if (!msg?.id) return;
    const targetId = Number(msg.id);
    if (Number.isNaN(targetId)) return;
    const previousFeedback = msg.feedback ?? null;
    const nextFeedback = previousFeedback === feedback ? null : feedback;

    // Optimistically update UI so second click clears immediately
    this.messages = this.messages.map((m) =>
      Number(m.id) === targetId
        ? {
            ...m,
            feedback: nextFeedback,
            feedbackComment: nextFeedback === null ? null : m.feedbackComment,
            feedbackAt: nextFeedback === null ? null : m.feedbackAt,
          }
        : m,
    );

    this.feedbackSubmittingId = msg.id;
    try {
      const updated = await firstValueFrom(
        this.http.post<{
          messageId: number;
          feedback: 'up' | 'down' | null;
          feedbackComment?: string | null;
          feedbackAt?: string | null;
        }>(`http://localhost:3000/message/${targetId}/feedback`, {
          feedback: nextFeedback,
          userId: this.userId,
        }),
      );

      const finalFeedback =
        updated?.feedback === undefined ? nextFeedback : updated.feedback;
      const finalComment =
        nextFeedback === null ? null : updated?.feedbackComment ?? null;
      const finalAt = nextFeedback === null ? null : updated?.feedbackAt ?? null;

      this.messages = this.messages.map((m) =>
        Number(m.id) === targetId
          ? {
              ...m,
              feedback: finalFeedback,
              feedbackComment: finalComment,
              feedbackAt: finalAt,
            }
          : m,
      );
    } catch (err) {
      console.error('Failed to send feedback', err);
      // Revert optimistic update on failure
      this.messages = this.messages.map((m) =>
        Number(m.id) === targetId
          ? { ...m, feedback: previousFeedback }
          : m,
      );
    } finally {
      this.feedbackSubmittingId = null;
    }
  }

  private normalizeMessages(messages?: Message[]): Message[] {
    if (!messages?.length) {
      return [];
    }

    return [...messages]
      .sort((a, b) => {
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return aTime - bTime;
      })
      .map((msg) => {
        const sourceText = msg.text ?? msg.content ?? '';
        const raw = msg.content ?? msg.text ?? '';
        return {
          id: msg.id,
          sender: msg.sender,
          text: this.decorateActionText(sourceText),
          rawText: raw,
          createdAt: msg.createdAt,
          feedback: msg.feedback ?? null,
          feedbackComment: msg.feedbackComment ?? null,
          feedbackAt: msg.feedbackAt ?? null,
        };
      });
  }

  private decorateActionText(text?: string | null): string {
    if (!text) {
      return '';
    }

    let output = this.escapeHtml(text);

    if (output.includes('[[ACTION]]')) {
      this.blockActionPattern.lastIndex = 0;
      output = output.replace(this.blockActionPattern, (_match, action) =>
        this.wrapAction(action),
      );
    }

    if (output.includes('*')) {
      this.starActionPattern.lastIndex = 0;
      output = output.replace(this.starActionPattern, (_match, action) =>
        this.wrapAction(action),
      );
    }

    return output.replace(/\n/g, '<br />');
  }

  private wrapAction(actionSegment: string): string {
    const normalized = actionSegment?.trim() ?? '';
    const payload = normalized.length ? normalized : actionSegment;
    return `<span class="chat-action"><span class="chat-action-dot"></span><em>${payload}</em></span>`;
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  private async bootstrapPersonality() {
    if (!this.personalitySlug) {
      this.personalityError = 'Select a personality to start chatting.';
      return;
    }

    this.isPersonalityLoading = true;
    this.personalityError = '';
    this.personalityId = null;
    this.personality = undefined;

    try {
      const personality = await firstValueFrom(
        this.http.get<Personality>(
          `http://localhost:3000/personalities/${this.personalitySlug}`,
        ),
      );

      if (!personality?.id) {
        console.error('Personality not found');
        this.personalityError =
          'We could not find that personality. Please pick another.';
        return;
      }

      this.personalityId = personality.id;
      this.personality = personality;
      await this.loadInitialConversation();
    } catch (err) {
      console.error('Failed to load personality', err);
      this.personalityError =
        'Failed to load this personality. Try again or choose another one.';
    } finally {
      this.isPersonalityLoading = false;
    }
  }
}
