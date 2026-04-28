import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

interface Cmd {
  cmd: string;
  out: string;
  hint?: string;
  href?: string;
}

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="nf">
      <div class="nf__bg" aria-hidden="true">
        @for (n of glitchChars; track $index) {
          <span class="nf__glitch" [style.--i]="$index">{{ n }}</span>
        }
      </div>

      <div class="nf__inner">
        <div class="nf__code" aria-hidden="true">
          <span class="nf__digit">4</span>
          <span class="nf__digit nf__digit--mid">0</span>
          <span class="nf__digit">4</span>
        </div>

        <h1 class="nf__title">Page not found <span class="nf__cursor">_</span></h1>
        <p class="nf__lede">
          The route you tried doesn't exist — but here's a terminal you can play with.
          Try <code>help</code>, <code>ls</code>, <code>about</code>, <code>roast</code>, or <code>sudo hire-me</code>.
        </p>

        <div class="nf__terminal" role="region" aria-label="Interactive terminal">
          <header class="nf__bar">
            <span class="nf__dot nf__dot--r"></span>
            <span class="nf__dot nf__dot--y"></span>
            <span class="nf__dot nf__dot--g"></span>
            <span class="nf__bar-label">guest&#64;portfolio:~/404 $</span>
          </header>
          <div class="nf__screen" #screen>
            @for (line of history(); track $index) {
              <div class="nf__line">
                @if (line.cmd) {
                  <div class="nf__prompt">
                    <span class="nf__user">guest&#64;portfolio</span>:<span class="nf__path">~</span>$
                    <span class="nf__cmd">{{ line.cmd }}</span>
                  </div>
                }
                <pre class="nf__out" [innerHTML]="line.out"></pre>
                @if (line.href) {
                  <a class="nf__link" [routerLink]="line.href">↳ Open {{ line.href }}</a>
                }
              </div>
            }
            <form class="nf__input-row" (submit)="run($event)">
              <span class="nf__user">guest&#64;portfolio</span>:<span class="nf__path">~</span>$
              <input
                #input
                class="nf__input"
                type="text"
                autocomplete="off"
                spellcheck="false"
                [value]="current()"
                (input)="current.set($any($event.target).value)"
                (keydown.arrowUp)="historyPrev($event)"
                (keydown.arrowDown)="historyNext($event)"
                (keydown.tab)="autocomplete($event)"
                aria-label="Terminal input"
                autofocus />
            </form>
          </div>
        </div>

        <div class="nf__cta">
          <a routerLink="/" class="nf__btn nf__btn--primary">← Back home</a>
          <a routerLink="/under-the-hood" class="nf__btn nf__btn--ghost">See how this is built</a>
          <a routerLink="/lab" class="nf__btn nf__btn--ghost">🧪 Open the lab instead</a>
        </div>
      </div>
    </section>
  `,
  styleUrl: './not-found.component.scss',
})
export class NotFoundComponent implements OnInit, OnDestroy {
  protected readonly glitchChars = '01<>{}[]/\\@#*&%01<>{}[]/\\@#*&%01'.split('');

  protected readonly history = signal<Cmd[]>([
    { cmd: '', out: 'Last login: just now from a broken link.\nType <span class="nf__hl">help</span> to see what I can do.' },
  ]);
  protected readonly current = signal<string>('');

  private readonly cmdHistory: string[] = [];
  private historyIdx = -1;

  private readonly registry: Record<string, () => Cmd> = {
    help: () => ({
      cmd: 'help',
      out: `Available commands:
  <span class="nf__hl">about</span>      → who I am
  <span class="nf__hl">projects</span>   → ship-list
  <span class="nf__hl">skills</span>     → tech I use
  <span class="nf__hl">contact</span>    → get in touch
  <span class="nf__hl">resume</span>     → download CV
  <span class="nf__hl">roast</span>      → AI roasts you/me
  <span class="nf__hl">dashboard</span>  → live stats
  <span class="nf__hl">ls</span>         → list pages
  <span class="nf__hl">whoami</span>     → identify
  <span class="nf__hl">date</span>       → server time
  <span class="nf__hl">echo &lt;txt&gt;</span> → repeat
  <span class="nf__hl">clear</span>      → wipe screen
  <span class="nf__hl">sudo hire-me</span> → 🚀`,
    }),
    about: () => ({ cmd: 'about', out: 'Nandan Hegde — Senior Software Engineer. 6+ yrs Angular/Node/AWS.', href: '/about' }),
    projects: () => ({ cmd: 'projects', out: 'Open the dashboard for live project list.', href: '/dashboard' }),
    skills: () => ({ cmd: 'skills', out: 'Angular · TypeScript · RxJS · Node · AWS · Docker · K8s · Azure DevOps' }),
    contact: () => ({ cmd: 'contact', out: 'Form ready when you are.', href: '/contact' }),
    resume: () => ({ cmd: 'resume', out: '<a href="assets/Nandan_Hegde_Resume.pdf" target="_blank" class="nf__link">↳ Download resume.pdf</a>' }),
      roast: () => ({ cmd: 'roast', out: 'Heading to the lab.', href: '/lab' }),
    dashboard: () => ({ cmd: 'dashboard', out: 'Loading metrics…', href: '/dashboard' }),
      ls: () => ({ cmd: 'ls', out: '<span class="nf__dir">/about  /dashboard  /under-the-hood  /blog  /lab  /quiz  /pitch  /roast-me-back  /contact</span>' }),
    whoami: () => ({ cmd: 'whoami', out: 'guest — but you could be on my team. Try <span class="nf__hl">sudo hire-me</span>.' }),
    date: () => ({ cmd: 'date', out: new Date().toString() }),
    clear: () => ({ cmd: '', out: '' }),
    'sudo hire-me': () => ({ cmd: 'sudo hire-me', out: '<span class="nf__hl">[sudo] password for recruiter: ********</span>\n✓ Access granted. Forwarding to /pitch …', href: '/pitch' }),
    'rm -rf /': () => ({ cmd: 'rm -rf /', out: '<span class="nf__err">rm: refusing to remove the universe</span>' }),
    'rm -rf node_modules': () => ({ cmd: 'rm -rf node_modules', out: 'Done. Now run <span class="nf__hl">npm i</span> for the next 47 minutes.' }),
    'cat secrets.env': () => ({ cmd: 'cat secrets.env', out: '<span class="nf__err">cat: secrets.env: Permission denied</span>\nNice try.' }),
    exit: () => ({ cmd: 'exit', out: 'You can\'t exit. This is the 404 page. There is no escape.' }),
  };

  ngOnInit(): void {
    setTimeout(() => (document.querySelector('.nf__input') as HTMLInputElement | null)?.focus(), 200);
  }
  ngOnDestroy(): void { /* noop */ }

  protected run(e: Event): void {
    e.preventDefault();
    const raw = this.current().trim();
    if (!raw) return;
    this.cmdHistory.unshift(raw);
    this.historyIdx = -1;

    const lower = raw.toLowerCase();
    let result: Cmd;

    if (lower === 'clear') {
      this.history.set([]);
      this.current.set('');
      return;
    }

    if (lower.startsWith('echo ')) {
      result = { cmd: raw, out: raw.slice(5) };
    } else if (this.registry[lower]) {
      result = this.registry[lower]();
    } else {
      result = { cmd: raw, out: `<span class="nf__err">command not found: ${this.escape(raw)}</span>\nTry <span class="nf__hl">help</span>.` };
    }

    this.history.update(h => [...h, result]);
    this.current.set('');
    queueMicrotask(() => {
      const screen = document.querySelector('.nf__screen');
      screen?.scrollTo({ top: screen.scrollHeight, behavior: 'smooth' });
    });
  }

  protected historyPrev(e: Event): void {
    e.preventDefault();
    if (this.historyIdx < this.cmdHistory.length - 1) {
      this.historyIdx++;
      this.current.set(this.cmdHistory[this.historyIdx]);
    }
  }
  protected historyNext(e: Event): void {
    e.preventDefault();
    if (this.historyIdx > 0) {
      this.historyIdx--;
      this.current.set(this.cmdHistory[this.historyIdx]);
    } else {
      this.historyIdx = -1;
      this.current.set('');
    }
  }
  protected autocomplete(e: Event): void {
    e.preventDefault();
    const v = this.current().toLowerCase();
    if (!v) return;
    const match = Object.keys(this.registry).find(k => k.startsWith(v));
    if (match) this.current.set(match);
  }

  private escape(s: string): string {
    return s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
  }
}
