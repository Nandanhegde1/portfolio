import {
  Component,
  inject,
  signal,
  viewChild,
  ElementRef,
  HostListener,
  AfterViewInit,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommandRegistryService } from './command-registry.service';

interface OutputLine {
  text: string;
  type: 'input' | 'output' | 'system';
}

@Component({
  selector: 'app-terminal-shell',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (isOpen()) {
      <div class="terminal-overlay" (click)="close()">
        <div class="terminal" (click)="$event.stopPropagation()">
          <div class="terminal__header">
            <div class="terminal__dots">
              <span class="terminal__dot terminal__dot--red"></span>
              <span class="terminal__dot terminal__dot--yellow"></span>
              <span class="terminal__dot terminal__dot--green"></span>
            </div>
            <span class="terminal__title">nandan&#64;portfolio:~$</span>
            <button class="terminal__close" (click)="close()" aria-label="Close terminal">×</button>
          </div>

          <div class="terminal__body" #terminalBody>
            <div class="terminal__welcome">
              <pre>{{ welcomeText }}</pre>
            </div>

            @for (line of output(); track $index) {
              <div class="terminal__line" [class.terminal__line--input]="line.type === 'input'" [class.terminal__line--system]="line.type === 'system'">
                @if (line.type === 'input') {
                  <span class="terminal__prompt">$</span>
                }
                <span>{{ line.text }}</span>
              </div>
            }

            <div class="terminal__input-line">
              <span class="terminal__prompt">$</span>
              <input
                #inputEl
                type="text"
                class="terminal__input"
                [value]="currentInput()"
                (input)="onInput($event)"
                (keydown)="onKeydown($event)"
                spellcheck="false"
                autocomplete="off"
                placeholder="Type a command..."
              />
            </div>

            @if (suggestions().length) {
              <div class="terminal__suggestions">
                @for (s of suggestions(); track s) {
                  <button class="terminal__suggestion" (click)="applySuggestion(s)">{{ s }}</button>
                }
              </div>
            }
          </div>
        </div>
      </div>
    }
  `,
  styleUrl: './terminal-shell.component.scss',
})
export class TerminalShellComponent implements AfterViewInit {
  private readonly registry = inject(CommandRegistryService);
  private readonly inputRef = viewChild<ElementRef<HTMLInputElement>>('inputEl');
  private readonly bodyRef = viewChild<ElementRef<HTMLDivElement>>('terminalBody');

  readonly isOpen = signal(false);
  readonly output = signal<OutputLine[]>([]);
  readonly currentInput = signal('');
  readonly suggestions = signal<string[]>([]);

  private history: string[] = [];
  private historyIndex = -1;

  readonly welcomeText = `
 ╭────────────────────────────────────╮
 │  Nandan's Terminal v1.0.0          │
 │  Type 'help' for available commands│
 │  Press Ctrl+K to toggle            │
 ╰────────────────────────────────────╯`;

  @HostListener('document:keydown', ['$event'])
  onGlobalKeydown(e: KeyboardEvent): void {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      this.toggle();
    }
    if (e.key === 'Escape' && this.isOpen()) {
      this.close();
    }
  }

  ngAfterViewInit(): void {
    this.focusInput();
  }

  toggle(): void {
    this.isOpen.update(v => !v);
    if (this.isOpen()) {
      setTimeout(() => this.focusInput(), 50);
    }
  }

  close(): void {
    this.isOpen.set(false);
  }

  onInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.currentInput.set(value);
    this.suggestions.set(this.registry.getSuggestions(value));
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.executeCommand();
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.navigateHistory(-1);
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.navigateHistory(1);
    } else if (event.key === 'Tab') {
      event.preventDefault();
      const suggs = this.suggestions();
      if (suggs.length > 0) {
        this.applySuggestion(suggs[0]);
      }
    }
  }

  applySuggestion(cmd: string): void {
    this.currentInput.set(cmd);
    this.suggestions.set([]);
    this.focusInput();
  }

  private executeCommand(): void {
    const input = this.currentInput().trim();
    if (!input) return;

    this.history.push(input);
    this.historyIndex = this.history.length;

    const result = this.registry.execute(input);

    // Handle special commands
    if (result.length === 1 && result[0] === '__CLEAR__') {
      this.output.set([]);
      this.currentInput.set('');
      this.suggestions.set([]);
      return;
    }

    if (result.length === 1 && result[0] === '__EXIT__') {
      this.close();
      this.currentInput.set('');
      return;
    }

    this.output.update(prev => [
      ...prev,
      { text: input, type: 'input' },
      ...result.map(text => ({ text, type: 'output' as const })),
    ]);

    this.currentInput.set('');
    this.suggestions.set([]);

    // Scroll to bottom
    setTimeout(() => {
      const body = this.bodyRef()?.nativeElement;
      if (body) body.scrollTop = body.scrollHeight;
    }, 10);
  }

  private navigateHistory(direction: number): void {
    const newIndex = this.historyIndex + direction;
    if (newIndex < 0 || newIndex > this.history.length) return;

    this.historyIndex = newIndex;
    if (newIndex === this.history.length) {
      this.currentInput.set('');
    } else {
      this.currentInput.set(this.history[newIndex]);
    }
  }

  private focusInput(): void {
    setTimeout(() => this.inputRef()?.nativeElement.focus(), 0);
  }
}
