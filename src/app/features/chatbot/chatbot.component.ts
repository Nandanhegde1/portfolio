import {
  Component,
  inject,
  signal,
  viewChild,
  ElementRef,
  ChangeDetectionStrategy,
  OnInit,
  computed,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { ChatbotService } from './chatbot.service';

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Floating bubble -->
    @if (!isOpen()) {
      <button class="chat-bubble" [class.chat-bubble--attention]="showAttention()" (click)="open()" aria-label="Open chat">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
        <span class="chat-bubble__badge">Ask me</span>
        @if (showAttention()) {
          <span class="chat-bubble__tooltip">👋 New here? Ask me anything!</span>
        }
      </button>
    }

    <!-- Chat window -->
    @if (isOpen()) {
      <div class="chat-window">
        <div class="chat-window__header">
          <div class="chat-window__header-info">
            <div class="chat-window__avatar">🤖</div>
            <div>
              <h4>Ask Nandan's AI</h4>
              <span class="chat-window__status">Online</span>
            </div>
          </div>
          <button class="chat-window__close" (click)="close()" aria-label="Close chat">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div class="chat-window__body" #chatBody>
          <!-- Welcome -->
          @if (!chatService.messages().length) {
            <div class="chat-window__welcome">
              <p>👋 Hi! I'm Nandan's AI assistant. Based on the page you're on, you might want to ask:</p>
              <div class="chat-window__quick-questions">
                @for (q of contextualQuestions(); track q) {
                  <button class="chat-window__quick-btn" (click)="sendQuick(q)">{{ q }}</button>
                }
              </div>
            </div>
          }

          @for (msg of chatService.messages(); track msg.id) {
            <div class="chat-msg" [class.chat-msg--user]="msg.role === 'user'" [class.chat-msg--bot]="msg.role === 'assistant'">
              @if (msg.role === 'assistant') {
                <span class="chat-msg__avatar">🤖</span>
              }
              <div class="chat-msg__bubble">{{ msg.content }}</div>
            </div>
          }

          @if (chatService.isTyping()) {
            <div class="chat-msg chat-msg--bot">
              <span class="chat-msg__avatar">🤖</span>
              <div class="chat-msg__bubble chat-msg__typing">
                <span></span><span></span><span></span>
              </div>
            </div>
          }

          @if (chatService.rateLimited()) {
            <div class="chat-window__rate-limit">
              You've reached the message limit for this session. Please try again later or use the contact form.
            </div>
          }
        </div>

        <div class="chat-window__footer">
          <input
            #msgInput
            type="text"
            class="chat-window__input"
            [(ngModel)]="inputText"
            (keydown.enter)="send()"
            placeholder="Type your question..."
            [disabled]="chatService.isTyping() || chatService.rateLimited()"
          />
          <button
            class="chat-window__send"
            (click)="send()"
            [disabled]="!inputText || chatService.isTyping() || chatService.rateLimited()"
            aria-label="Send"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>
      </div>
    }
  `,
  styleUrl: './chatbot.component.scss',
})
export class ChatbotComponent implements OnInit {
  readonly chatService = inject(ChatbotService);
  private readonly router = inject(Router);
  private readonly chatBodyRef = viewChild<ElementRef<HTMLDivElement>>('chatBody');

  readonly isOpen = signal(false);
  readonly showAttention = signal(false);
  readonly currentPath = signal<string>('/');
  readonly contextualQuestions = computed(() => this.chatService.contextualQuestions(this.currentPath()));
  inputText = '';

  ngOnInit(): void {
    if (typeof window === 'undefined') return;
    this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe((e: any) => {
      this.currentPath.set(e.urlAfterRedirects.split('?')[0].split('#')[0]);
    });
    if (!localStorage.getItem('chat_seen')) {
      // After 8 seconds on the page, gently ping new visitors
      setTimeout(() => this.showAttention.set(true), 8000);
      setTimeout(() => this.showAttention.set(false), 18000);
    }
  }

  open(): void {
    this.isOpen.set(true);
    this.showAttention.set(false);
    if (typeof window !== 'undefined') localStorage.setItem('chat_seen', '1');
  }

  close(): void {
    this.isOpen.set(false);
  }

  send(): void {
    const text = this.inputText.trim();
    if (!text) return;
    this.inputText = '';
    this.chatService.sendMessage(text);
    this.scrollToBottom();
  }

  sendQuick(question: string): void {
    this.chatService.sendMessage(question);
    this.scrollToBottom();
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      const body = this.chatBodyRef()?.nativeElement;
      if (body) body.scrollTop = body.scrollHeight;
    }, 100);
  }
}
