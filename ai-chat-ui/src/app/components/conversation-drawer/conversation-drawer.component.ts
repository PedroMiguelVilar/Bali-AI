// conversation-drawer.component.ts
import {
  Component,
  EventEmitter,
  Input,
  Output,
  OnInit,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Conversation } from '../../models/conversation.model';
import { Message } from '../../models/message.model';

@Component({
  selector: 'app-conversation-drawer',
  templateUrl: './conversation-drawer.component.html',
  styleUrls: ['./conversation-drawer.component.scss'],
  standalone: true,
  imports: [CommonModule],
})
export class ConversationDrawerComponent implements OnInit, OnChanges {
  @Input() userId!: number;
  @Input() personalityId!: number;
  @Input() creationLocked = false;
  @Output() conversationSelected = new EventEmitter<Conversation>();
  @Output() createConversationRequested = new EventEmitter<void>();
  @Output() drawerClose = new EventEmitter<void>();

  conversations: Conversation[] = [];
  openMenuId: number | null = null;
  isEmittingCreate = false;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.openMenuId = null;
    this.loadConversations();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes['creationLocked'] &&
      changes['creationLocked'].previousValue === true &&
      changes['creationLocked'].currentValue === false
    ) {
      // Parent unlocked creation; allow the next click to emit again.
      this.isEmittingCreate = false;
    }
  }

  loadConversations() {
    if (!this.userId || !this.personalityId) {
      return;
    }

    this.http
      .get<Conversation[]>(
        `http://localhost:3000/conversation/user/${this.userId}/personality/${this.personalityId}`
      )
      .subscribe({
        next: (res) => {
          this.conversations = res ?? [];
        },
        error: (err) => console.error('Failed to load conversations', err),
      });
  }

  selectConversation(convo: Conversation) {
    if (!convo?.id) {
      return;
    }

    this.http
      .get<Message[]>(`http://localhost:3000/conversation/${convo.id}/messages`)
      .subscribe({
        next: (messages) => {
          this.conversationSelected.emit({
            ...convo,
            messages,
          });
          this.drawerClose.emit();
        },
        error: (err) => console.error('Failed to load messages', err),
      });
  }

  createNewConversation() {
    if (!this.userId || !this.personalityId) {
      return;
    }

    if (this.creationLocked || this.isEmittingCreate) {
      return;
    }

    // Stop-gap to prevent rapid-fire emits before parent lock propagates.
    this.isEmittingCreate = true;
    this.createConversationRequested.emit();
  }

  toggleMenu(convoId: number, event: MouseEvent) {
    event.stopPropagation(); // Prevent triggering conversation selection
    this.openMenuId = this.openMenuId === convoId ? null : convoId;
  }

  deleteConversation(convoId: number) {
    if (!convoId) {
      return;
    }

    this.http
      .delete(`http://localhost:3000/conversation/${convoId}`)
      .subscribe({
        next: () => {
          this.conversations = this.conversations.filter((c) => c.id !== convoId);
          this.openMenuId = null;
        },
        error: (err) => console.error('Failed to delete conversation', err),
      });
  }
}
