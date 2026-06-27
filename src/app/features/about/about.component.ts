import {
  Component,
  ChangeDetectionStrategy,
  ElementRef,
  inject,
  OnInit,
  signal,
  ViewChild,
} from '@angular/core';
import { PortfolioDataService } from '../../core/services';
import { ScrollRevealDirective } from '../../shared/directives/scroll-reveal.directive';

interface RpgStat {
  name: string;
  attribute: string;
  value: number;
  color: string;
}

type CardRarity = 'common' | 'rare' | 'epic' | 'legendary';

interface CardColor {
  id: string;
  label: string;
  primary: string;
  secondary: string;
}

type GradientStyle = 'linear' | 'radial' | 'conic' | 'solid';

interface GradientOption {
  id: GradientStyle;
  label: string;
  icon: string;
}

interface AvatarOption {
  id: string;
  emoji: string;
  label: string;
}

interface InventoryItem {
  name: string;
  level: number;
  rarity: CardRarity;
}

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [ScrollRevealDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="rpg">
      <div class="rpg__container">
        <!-- Header -->
        <div class="rpg__header" appScrollReveal>
          <span class="rpg__tag">// character-select</span>
          <h1 class="rpg__title">Character Sheet</h1>
          <p class="rpg__subtitle">Level {{ level }} · Senior Developer · {{ xpYears }}+ years of adventure</p>
          <button
            type="button"
            class="rpg__print-btn"
            (click)="printResume()"
            aria-label="Save this page as PDF resume"
          >
            📄 Save as PDF Resume
          </button>
        </div>

        <!-- Two-column: Card sidebar + Content -->
        <div class="rpg__layout">

          <!-- LEFT: Sticky card + controls -->
          <aside class="rpg__sidebar">
            <div
              class="rpg__card-wrapper"
              (mousemove)="onCardMouseMove($event)"
              (mouseleave)="onCardMouseLeave()"
            >
              <div
                class="rpg__card"
                [style.transform]="cardTransform()"
              >
                <div class="rpg__card-holo"></div>
                <div class="rpg__card-content">
                  <div class="rpg__card-avatar">
                    <span>NH</span>
                  </div>
                  <h2 class="rpg__card-name">Nandan Hegde</h2>
                  <p class="rpg__card-class">\u2694\ufe0f Senior Software Engineer</p>
                  <p class="rpg__card-guild">\ud83c\udff0 Thinkbridge Software</p>
                  <p class="rpg__card-realm">\ud83c\udf0d Bangalore, India</p>
                  <div class="rpg__card-xp">
                    <div class="rpg__card-xp-label">
                      <span>XP</span>
                      <span>Lv.{{ level }}</span>
                    </div>
                    <div class="rpg__card-xp-bar">
                      <div class="rpg__card-xp-fill" [style.width.%]="xpPercent"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          <!-- RIGHT: Sections -->
          <main class="rpg__main">
            <!-- Attributes -->
            <div class="rpg__section" appScrollReveal [delay]="100">
              <button class="rpg__section-title" (click)="toggleSection('attributes')">
                <span class="rpg__section-icon">\u26A1</span>
                Attributes
                <span class="rpg__section-toggle" [class.rpg__section-toggle--open]="openSections().has('attributes')">\u25B6</span>
              </button>
              @if (openSections().has('attributes')) {
                <div class="rpg__stats rpg__section-body">
                  @for (stat of attributes; track stat.name) {
                    <div class="rpg__stat">
                      <div class="rpg__stat-header">
                        <span class="rpg__stat-attr" [style.color]="stat.color">{{ stat.attribute }}</span>
                        <span class="rpg__stat-name">{{ stat.name }}</span>
                        <span class="rpg__stat-value">{{ stat.value }}</span>
                      </div>
                      <div class="rpg__stat-bar">
                        <div class="rpg__stat-fill" [style.width.%]="stat.value" [style.background]="stat.color"></div>
                      </div>
                    </div>
                  }
                </div>
              }
            </div>

            <!-- Quest Log -->
            <div class="rpg__section" appScrollReveal [delay]="200">
              <button class="rpg__section-title" (click)="toggleSection('quests')">
                <span class="rpg__section-icon">\uD83D\uDCDC</span>
                Quest Log
                <span class="rpg__section-toggle" [class.rpg__section-toggle--open]="openSections().has('quests')">\u25B6</span>
              </button>
              @if (openSections().has('quests')) {
                @if (data.data(); as portfolio) {
                  <div class="rpg__quests rpg__section-body">
                    @for (exp of portfolio.experience; track exp.id) {
                      <div class="rpg__quest" [class.rpg__quest--active]="exp.current">
                        <div class="rpg__quest-status">
                          @if (exp.current) {
                            <span class="rpg__quest-badge rpg__quest-badge--active">\u2694\uFE0F ACTIVE</span>
                          } @else {
                            <span class="rpg__quest-badge rpg__quest-badge--complete">\u2705 COMPLETE</span>
                          }
                        </div>
                        <h4 class="rpg__quest-title">{{ exp.role }}</h4>
                        <p class="rpg__quest-guild">{{ exp.company }} \u00B7 {{ exp.location }}</p>
                        <p class="rpg__quest-desc">{{ exp.description }}</p>
                        @if (exp.highlights) {
                          <ul class="rpg__quest-highlights">
                            @for (h of exp.highlights; track h) {
                              <li>{{ h }}</li>
                            }
                          </ul>
                        }
                        <div class="rpg__quest-loot">
                          @for (tech of exp.technologies; track tech) {
                            <span class="rpg__quest-item">{{ tech }}</span>
                          }
                        </div>
                      </div>
                    }
                  </div>
                }
              }
            </div>

            <!-- Inventory -->
            <div class="rpg__section" appScrollReveal [delay]="300">
              <button class="rpg__section-title" (click)="toggleSection('inventory')">
                <span class="rpg__section-icon">\uD83C\uDF92</span>
                Inventory
                <span class="rpg__section-toggle" [class.rpg__section-toggle--open]="openSections().has('inventory')">\u25B6</span>
              </button>
              @if (openSections().has('inventory')) {
                <div class="rpg__inventory rpg__section-body">
                  @for (cat of inventoryCategories; track cat.label) {
                    <div class="rpg__inv-category">
                      <h4 class="rpg__inv-label">{{ cat.icon }} {{ cat.label }}</h4>
                      <div class="rpg__inv-grid">
                        @for (item of cat.items; track item.name) {
                          <div
                            class="rpg__inv-item rpg__inv-item--{{ item.rarity }}"
                            [title]="item.name + ' \u2014 Lv.' + item.level + ' \u2014 ' + item.rarity"
                          >
                            <span class="rpg__inv-rarity-dot"></span>
                            <span class="rpg__inv-name">{{ item.name }}</span>
                            <span class="rpg__inv-level">Lv.{{ item.level }}</span>
                          </div>
                        }
                      </div>
                    </div>
                  }
                </div>
              }
            </div>

            <!-- Achievements -->
            <div class="rpg__section" appScrollReveal [delay]="400">
              <button class="rpg__section-title" (click)="toggleSection('achievements')">
                <span class="rpg__section-icon">\uD83C\uDFC6</span>
                Achievements Unlocked
                <span class="rpg__section-toggle" [class.rpg__section-toggle--open]="openSections().has('achievements')">\u25B6</span>
              </button>
              @if (openSections().has('achievements')) {
                @if (data.data(); as portfolio) {
                  <div class="rpg__achievements rpg__section-body">
                    @for (cert of portfolio.certifications; track cert.name) {
                      <div class="rpg__achievement rpg__achievement--legendary">
                        <div class="rpg__achievement-icon">\uD83C\uDFC5</div>
                        <div class="rpg__achievement-info">
                          <h4>{{ cert.name }}</h4>
                          <p>{{ cert.issuer }} \u00B7 {{ cert.date }}</p>
                        </div>
                      </div>
                    }
                    @for (edu of portfolio.education; track edu.degree) {
                      <div class="rpg__achievement rpg__achievement--epic">
                        <div class="rpg__achievement-icon">\uD83C\uDF93</div>
                        <div class="rpg__achievement-info">
                          <h4>{{ edu.degree }}</h4>
                          <p>{{ edu.institution }}</p>
                        </div>
                      </div>
                    }
                    <div class="rpg__achievement rpg__achievement--rare">
                      <div class="rpg__achievement-icon">\uD83C\uDF0D</div>
                      <div class="rpg__achievement-info">
                        <h4>Multilingual</h4>
                        <p>English \u00B7 Hindi \u00B7 Kannada</p>
                      </div>
                    </div>
                    <div class="rpg__achievement rpg__achievement--epic">
                      <div class="rpg__achievement-icon">\uD83C\uDFAA</div>
                      <div class="rpg__achievement-info">
                        <h4>Tradeshow Demo</h4>
                        <p>Built React AI agent showcased in Austin, US</p>
                      </div>
                    </div>
                    <div class="rpg__achievement rpg__achievement--legendary">
                      <div class="rpg__achievement-icon">\uD83D\uDD25</div>
                      <div class="rpg__achievement-info">
                        <h4>High Performer</h4>
                        <p>Infosys Foundation Program \u00B7 82% score</p>
                      </div>
                    </div>
                  </div>
                }
              }
            </div>
          </main>
        </div>

        <!-- Forge Your Card (full width below) -->
        <div class="rpg__section rpg__forge" appScrollReveal [delay]="500">
          <h3 class="rpg__section-title">
            <span class="rpg__section-icon">\uD83D\uDD28</span>
            Forge Your Card
          </h3>
          <p class="rpg__forge-intro">Create your own holographic developer card. Download it or share it with the world!</p>

          <div class="rpg__forge-grid">
            <div class="rpg__forge-form">
              <div class="rpg__forge-field">
                <span class="rpg__forge-label">Avatar</span>
                <div class="rpg__forge-avatars">
                  <button
                    class="rpg__forge-avatar-btn"
                    [class.rpg__forge-avatar-btn--active]="forgeAvatar() === 'dicebear'"
                    (click)="forgeAvatar.set('dicebear')"
                    title="Cartoon avatar generated from your name"
                  >
                    <img
                      [src]="getDiceBearUrl(visitorName || 'guest')"
                      alt="Cartoon avatar option"
                      class="rpg__forge-dicebear-thumb"
                      width="28"
                      height="28"
                    />
                  </button>
                  <button
                    class="rpg__forge-avatar-btn"
                    [class.rpg__forge-avatar-btn--active]="forgeAvatar() === 'initials'"
                    (click)="forgeAvatar.set('initials')"
                    title="Use your initials as text"
                  >Aa</button>
                </div>
              </div>
              <div class="rpg__forge-field">
                <span class="rpg__forge-label">Character Name</span>
                <input
                  class="rpg__forge-input"
                  type="text"
                  [value]="visitorName"
                  (input)="visitorName = getValue($event)"
                  placeholder="Your name..."
                  maxlength="30"
                />
              </div>
              <div class="rpg__forge-field">
                <span class="rpg__forge-label">Class</span>
                <input
                  class="rpg__forge-input"
                  type="text"
                  [value]="visitorTitle"
                  (input)="visitorTitle = getValue($event)"
                  placeholder="Frontend Wizard, Cloud Architect..."
                  maxlength="40"
                />
              </div>
              <div class="rpg__forge-field">
                <span class="rpg__forge-label">Skills (pick up to 6)</span>
                <div class="rpg__forge-chips">
                  @for (skill of availableSkills; track skill) {
                    <button
                      class="rpg__forge-chip"
                      [class.rpg__forge-chip--active]="visitorSkills().includes(skill)"
                      (click)="toggleSkill(skill)"
                    >{{ skill }}</button>
                  }
                </div>
              </div>
              <div class="rpg__forge-field">
                <span class="rpg__forge-label">Card Style</span>
                <div class="rpg__forge-gradients">
                  @for (g of gradientOptions; track g.id) {
                    <button
                      class="rpg__forge-grad-btn"
                      [class.rpg__forge-grad-btn--active]="forgeGradient() === g.id"
                      (click)="forgeGradient.set(g.id)"
                    >
                      <span class="rpg__forge-grad-icon">{{ g.icon }}</span>
                      <span class="rpg__forge-grad-label">{{ g.label }}</span>
                    </button>
                  }
                </div>
              </div>
              <div class="rpg__forge-field">
                <span class="rpg__forge-label">Card Color</span>
                <div class="rpg__forge-colors">
                  @for (color of forgeColors; track color.id) {
                    <button
                      class="rpg__forge-color-btn"
                      [class.rpg__forge-color-btn--active]="forgeColorId() === color.id"
                      [style.background]="'linear-gradient(135deg, ' + color.primary + ', ' + color.secondary + ')'"
                      (click)="forgeColorId.set(color.id)"
                      [title]="color.label"
                    ></button>
                  }
                </div>
              </div>
              <div class="rpg__forge-actions">
                <button class="rpg__forge-btn rpg__forge-btn--download" (click)="downloadCard()">
                  \uD83D\uDCE5 Download PNG
                </button>
                <button class="rpg__forge-btn rpg__forge-btn--share" (click)="shareCard()">
                  \uD83D\uDD17 Copy Share Link
                </button>
              </div>
              @if (shareMessage()) {
                <p class="rpg__forge-toast">{{ shareMessage() }}</p>
              }
            </div>

            <div
              class="rpg__forge-preview"
              (mousemove)="onForgeMouseMove($event)"
              (mouseleave)="onForgeMouseLeave()"
            >
              <div
                class="rpg__card rpg__forge-card"
                [class.rpg__forge-card--solid]="forgeGradient() === 'solid'"
                [class.rpg__forge-card--radial]="forgeGradient() === 'radial'"
                [class.rpg__forge-card--conic]="forgeGradient() === 'conic'"
                [style.transform]="forgeTransform()"
                [style.--forge-color-1]="activeForgeColor().primary"
                [style.--forge-color-2]="activeForgeColor().secondary"
              >
                <div class="rpg__card-holo"></div>
                <div class="rpg__card-content">
                  <div class="rpg__forge-avatar-display">
                    @if (forgeAvatar() === 'initials') {
                      <span>{{ getInitials(visitorName) }}</span>
                    } @else {
                      <img
                        [src]="getDiceBearUrl(visitorName || 'guest')"
                        alt="Cartoon avatar"
                        class="rpg__forge-dicebear-display"
                      />
                    }
                  </div>
                  <h2 class="rpg__card-name">{{ visitorName || 'Your Name' }}</h2>
                  <p class="rpg__card-class">\u2694\ufe0f {{ visitorTitle || 'Your Class' }}</p>
                  @if (visitorSkills().length > 0) {
                    <div class="rpg__forge-skills">
                      @for (skill of visitorSkills(); track skill) {
                        <span class="rpg__forge-skill-tag">{{ skill }}</span>
                      }
                    </div>
                  }
                  <p class="rpg__forge-watermark">forged on nandanhegde1.github.io/portfolio</p>
                </div>
              </div>
            </div>
          </div>
          <canvas #downloadCanvas style="display: none;"></canvas>
        </div>
      </div>
    </section>
  `,
  styleUrl: './about.component.scss',
})
export class AboutComponent implements OnInit {
  readonly data = inject(PortfolioDataService);

  readonly level = 8;
  readonly xpYears = 6;
  readonly xpPercent = 82;

  // Attributes open by default (it's the character sheet hook); the rest
  // are dense, optional reading and start collapsed.
  readonly openSections = signal<Set<string>>(new Set(['attributes']));

  // ── Forge customization ──
  readonly forgeColors: CardColor[] = [
    { id: 'cyan', label: 'Cyan', primary: '#06b6d4', secondary: '#3b82f6' },
    { id: 'ruby', label: 'Ruby', primary: '#ef4444', secondary: '#dc2626' },
    { id: 'gold', label: 'Gold', primary: '#f59e0b', secondary: '#eab308' },
    { id: 'emerald', label: 'Emerald', primary: '#10b981', secondary: '#059669' },
    { id: 'amethyst', label: 'Amethyst', primary: '#a855f7', secondary: '#7c3aed' },
    { id: 'rose', label: 'Rose', primary: '#ec4899', secondary: '#db2777' },
    { id: 'sunset', label: 'Sunset', primary: '#f97316', secondary: '#ea580c' },
    { id: 'mint', label: 'Mint', primary: '#34d399', secondary: '#2dd4bf' },
    { id: 'slate', label: 'Slate', primary: '#64748b', secondary: '#475569' },
  ];

  readonly gradientOptions: GradientOption[] = [
    { id: 'linear', label: 'Linear', icon: '↗' },
    { id: 'radial', label: 'Radial', icon: '◎' },
    { id: 'conic', label: 'Conic', icon: '◐' },
    { id: 'solid', label: 'Solid', icon: '■' },
  ];

  // Avatar options trimmed to just initials and a DiceBear cartoon avatar.
  // Default is the cartoon avatar — feels more like a character card.
  readonly avatarOptions: AvatarOption[] = [
    { id: 'dicebear', emoji: '', label: 'Cartoon avatar' },
    { id: 'initials', emoji: 'Aa', label: 'Initials' },
  ];

  readonly forgeColorId = signal('cyan');
  readonly forgeGradient = signal<GradientStyle>('linear');
  readonly forgeAvatar = signal('dicebear');

  activeForgeColor(): CardColor {
    return this.forgeColors.find(c => c.id === this.forgeColorId()) ?? this.forgeColors[0];
  }

  getDiceBearUrl(name: string): string {
    const seed = encodeURIComponent((name || 'guest').toLowerCase().trim());
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
  }

  printResume(): void {
    if (typeof window !== 'undefined') {
      window.print();
    }
  }

  readonly attributes: RpgStat[] = [
    { attribute: 'STR', name: 'Backend', value: 72, color: '#ef4444' },
    { attribute: 'INT', name: 'Frontend', value: 93, color: '#3b82f6' },
    { attribute: 'DEX', name: 'DevOps', value: 75, color: '#22c55e' },
    { attribute: 'WIS', name: 'Cloud', value: 68, color: '#a855f7' },
    { attribute: 'CON', name: 'Testing', value: 82, color: '#f59e0b' },
    { attribute: 'CHA', name: 'Leadership', value: 80, color: '#ec4899' },
  ];

  readonly inventoryCategories: { icon: string; label: string; items: InventoryItem[] }[] = [
    {
      icon: '\u2694\uFE0F', label: 'Weapons (Frontend)',
      items: [
        { name: 'Angular 17', level: 95, rarity: 'legendary' },
        { name: 'TypeScript', level: 92, rarity: 'legendary' },
        { name: 'RxJS', level: 85, rarity: 'epic' },
        { name: 'JavaScript', level: 90, rarity: 'epic' },
        { name: 'SCSS', level: 88, rarity: 'epic' },
        { name: 'HTML/CSS', level: 90, rarity: 'rare' },
        { name: 'React.js', level: 60, rarity: 'rare' },
        { name: 'Tailwind CSS', level: 65, rarity: 'common' },
      ],
    },
    {
      icon: '\uD83D\uDEE1\uFE0F', label: 'Armor (Backend)',
      items: [
        { name: 'Node.js', level: 78, rarity: 'epic' },
        { name: 'Express.js', level: 72, rarity: 'rare' },
      ],
    },
    {
      icon: '\uD83D\uDCDC', label: 'Scrolls (Database)',
      items: [
        { name: 'MongoDB', level: 70, rarity: 'rare' },
        { name: 'MS-SQL', level: 60, rarity: 'common' },
      ],
    },
    {
      icon: '\uD83E\uDDEA', label: 'Potions (DevOps)',
      items: [
        { name: 'Azure DevOps', level: 85, rarity: 'legendary' },
        { name: 'CI/CD', level: 82, rarity: 'epic' },
        { name: 'Git', level: 88, rarity: 'epic' },
        { name: 'Jenkins', level: 72, rarity: 'rare' },
        { name: 'Docker', level: 65, rarity: 'common' },
        { name: 'Kubernetes', level: 55, rarity: 'common' },
        { name: 'Terraform', level: 60, rarity: 'rare' },
      ],
    },
    {
      icon: '\u2601\uFE0F', label: 'Relics (Cloud)',
      items: [
        { name: 'AWS', level: 72, rarity: 'epic' },
        { name: 'Azure', level: 70, rarity: 'rare' },
        { name: 'GCP', level: 50, rarity: 'common' },
      ],
    },
    {
      icon: '\uD83E\uDDEA', label: 'Enchantments (Testing)',
      items: [
        { name: 'Karma/Jasmine', level: 88, rarity: 'legendary' },
        { name: 'Unit Testing', level: 85, rarity: 'epic' },
        { name: 'E2E Testing', level: 70, rarity: 'rare' },
      ],
    },
  ];

  toggleSection(section: string): void {
    const current = new Set(this.openSections());
    if (current.has(section)) {
      current.delete(section);
    } else {
      current.add(section);
    }
    this.openSections.set(current);
  }

  readonly cardTransform = signal('perspective(800px) rotateX(0deg) rotateY(0deg)');

  ngOnInit(): void {
    if (!this.data.data()) {
      this.data.loadData();
    }
    this.loadSharedCard();
  }

  onCardMouseMove(event: MouseEvent): void {
    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -12;
    const rotateY = ((x - centerX) / centerX) * 12;

    this.cardTransform.set(
      `perspective(800px) rotateX(${rotateX.toFixed(1)}deg) rotateY(${rotateY.toFixed(1)}deg)`
    );

    // Move holo gradient
    const card = target.querySelector('.rpg__card') as HTMLElement;
    if (card) {
      const px = (x / rect.width) * 100;
      const py = (y / rect.height) * 100;
      card.style.setProperty('--holo-x', `${px}%`);
      card.style.setProperty('--holo-y', `${py}%`);
    }
  }

  onCardMouseLeave(): void {
    this.cardTransform.set('perspective(800px) rotateX(0deg) rotateY(0deg)');
  }

  // ── Forge Your Card ──

  @ViewChild('downloadCanvas', { static: false })
  downloadCanvasRef!: ElementRef<HTMLCanvasElement>;

  visitorName = '';
  visitorTitle = '';
  readonly visitorSkills = signal<string[]>([]);
  readonly forgeTransform = signal('perspective(800px) rotateX(0deg) rotateY(0deg)');
  readonly shareMessage = signal('');

  readonly availableSkills = [
    'Angular', 'React', 'Vue', 'Svelte', 'TypeScript', 'JavaScript',
    'Python', 'Node.js', 'Java', 'C#', 'Go', 'Rust',
    'SCSS', 'Tailwind', 'Docker', 'K8s', 'AWS', 'Azure',
    'MongoDB', 'PostgreSQL', 'Redis', 'GraphQL', 'Git', 'CI/CD',
    'Testing', 'Agile', 'Leadership', 'Design', 'AI/ML', 'Swift',
  ];

  getValue(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }

  toggleSkill(skill: string): void {
    const current = this.visitorSkills();
    if (current.includes(skill)) {
      this.visitorSkills.set(current.filter(s => s !== skill));
    } else if (current.length < 6) {
      this.visitorSkills.set([...current, skill]);
    }
  }

  getInitials(name: string): string {
    if (!name) return '??';
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '??';
  }

  onForgeMouseMove(event: MouseEvent): void {
    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const rotateX = ((y - rect.height / 2) / (rect.height / 2)) * -12;
    const rotateY = ((x - rect.width / 2) / (rect.width / 2)) * 12;
    this.forgeTransform.set(
      `perspective(800px) rotateX(${rotateX.toFixed(1)}deg) rotateY(${rotateY.toFixed(1)}deg)`
    );
    const card = target.querySelector('.rpg__card') as HTMLElement;
    if (card) {
      card.style.setProperty('--holo-x', `${(x / rect.width) * 100}%`);
      card.style.setProperty('--holo-y', `${(y / rect.height) * 100}%`);
    }
  }

  onForgeMouseLeave(): void {
    this.forgeTransform.set('perspective(800px) rotateX(0deg) rotateY(0deg)');
  }

  downloadCard(): void {
    // Build a self-contained, animated holographic SVG so the downloaded
    // artifact actually looks like the live preview: real gradients, an
    // animated glare sweep, and a slow tilt. SVG opens in any browser and
    // keeps the animation — far better than a flat PNG.
    void this.buildAndDownloadCard();
  }

  private async buildAndDownloadCard(): Promise<void> {
    const name = (this.visitorName || 'Your Name').slice(0, 30);
    const title = (this.visitorTitle || 'Developer').slice(0, 40);
    const skills = this.visitorSkills().slice(0, 6);
    const initials = this.getInitials(name);
    const fc = this.activeForgeColor();
    const gradient = this.forgeGradient();
    const useDicebear = this.forgeAvatar() === 'dicebear';

    // DiceBear is fetched as a data URI so the standalone SVG works offline.
    // (External <image href> doesn't render when the file is opened from disk
    // or imported into design tools — which is what made the download look
    // "not proper" before.)
    let avatarDataUri: string | null = null;
    if (useDicebear) {
      try {
        const res = await fetch(this.getDiceBearUrl(name || 'guest'));
        const svgText = await res.text();
        avatarDataUri = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgText)))}`;
      } catch {
        // network failed — fall through to initials
        avatarDataUri = null;
      }
    }

    const W = 600, H = 360;
    const cx = W / 2;
    const c1 = fc.primary;
    const c2 = fc.secondary;

    // Background fill — matches the linear/radial/conic preview exactly.
    let bgFill = `url(#linearBg)`;
    if (gradient === 'radial') bgFill = `url(#radialBg)`;
    if (gradient === 'conic') bgFill = `url(#conicBg)`;
    if (gradient === 'solid') bgFill = c1;

    // Conic isn't supported in plain SVG, so we approximate it with a
    // multi-stop sweep using <foreignObject> + a CSS conic-gradient.
    const conicLayer = gradient === 'conic'
      ? `<foreignObject x="0" y="0" width="${W}" height="${H}">
           <div xmlns="http://www.w3.org/1999/xhtml" style="
             width:100%;height:100%;border-radius:24px;
             background:conic-gradient(from 0deg, ${c1}, ${c2}, ${c1});
             filter:saturate(1.1);"></div>
         </foreignObject>`
      : '';

    const skillBadges = skills.map((s, i) => {
      const padX = 12;
      const charW = 7.2;
      const w = Math.max(60, s.length * charW + padX * 2);
      return { text: s, w, i };
    });
    const totalSkillsW = skillBadges.reduce((sum, b) => sum + b.w, 0) + (skillBadges.length - 1) * 8;
    let skillX = cx - totalSkillsW / 2;
    const skillY = 246;
    const skillsSvg = skillBadges.map(b => {
      const x = skillX;
      skillX += b.w + 8;
      return `
        <g transform="translate(${x} ${skillY})">
          <rect width="${b.w}" height="26" rx="6" fill="${c1}" fill-opacity="0.16" stroke="${c1}" stroke-opacity="0.5"/>
          <text x="${b.w / 2}" y="17" text-anchor="middle"
                font-family="ui-monospace, 'SF Mono', Menlo, monospace"
                font-size="11" font-weight="700" fill="${c1}">${this.escapeXml(b.text)}</text>
        </g>`;
    }).join('');

    // Avatar — DiceBear embedded as data URI (so it renders offline) clipped
    // to a circle via a real <clipPath>. The CSS shape syntax `clip-path="circle(...)"`
    // doesn't work as an SVG attribute and was the reason the avatar was
    // missing/squared in the downloaded card.
    const avatarInner = avatarDataUri
      ? `<image href="${avatarDataUri}" x="${cx - 32}" y="80" width="64" height="64" clip-path="url(#avatarClip)" preserveAspectRatio="xMidYMid slice"/>`
      : `<text x="${cx}" y="124" text-anchor="middle"
              font-family="ui-monospace, 'SF Mono', Menlo, monospace"
              font-size="24" font-weight="800" fill="#fff">${this.escapeXml(initials)}</text>`;

    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
     viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img"
     aria-label="Holographic dev card for ${this.escapeXml(name)}">
  <defs>
    <linearGradient id="linearBg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${c1}" stop-opacity="0.85"/>
      <stop offset="100%" stop-color="${c2}" stop-opacity="0.85"/>
    </linearGradient>
    <radialGradient id="radialBg" cx="0.3" cy="0.3" r="0.9">
      <stop offset="0%" stop-color="${c1}"/>
      <stop offset="100%" stop-color="${c2}"/>
    </radialGradient>
    <linearGradient id="dark" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#0a0e1a" stop-opacity="0.55"/>
      <stop offset="100%" stop-color="#0a0e1a" stop-opacity="0.85"/>
    </linearGradient>
    <linearGradient id="border" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${c1}"/>
      <stop offset="100%" stop-color="${c2}"/>
    </linearGradient>
    <linearGradient id="glare" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#fff" stop-opacity="0"/>
      <stop offset="45%" stop-color="#fff" stop-opacity="0.0"/>
      <stop offset="50%" stop-color="#fff" stop-opacity="0.45"/>
      <stop offset="55%" stop-color="#fff" stop-opacity="0.0"/>
      <stop offset="100%" stop-color="#fff" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="rainbow" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%"  stop-color="#ff5fa2" stop-opacity="0.5"/>
      <stop offset="25%" stop-color="#ffd166" stop-opacity="0.5"/>
      <stop offset="50%" stop-color="#5af787" stop-opacity="0.5"/>
      <stop offset="75%" stop-color="#6ad9ff" stop-opacity="0.5"/>
      <stop offset="100%" stop-color="#c896ff" stop-opacity="0.5"/>
    </linearGradient>
    <linearGradient id="separator" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${c1}" stop-opacity="0"/>
      <stop offset="50%" stop-color="${c1}" stop-opacity="0.5"/>
      <stop offset="100%" stop-color="${c2}" stop-opacity="0"/>
    </linearGradient>
    <radialGradient id="avatarGrad" cx="0.3" cy="0.3" r="0.8">
      <stop offset="0%" stop-color="${c1}"/>
      <stop offset="100%" stop-color="${c2}"/>
    </radialGradient>
    <filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="6" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <clipPath id="cardClip">
      <rect x="2" y="2" width="${W - 4}" height="${H - 4}" rx="22" ry="22"/>
    </clipPath>
    <clipPath id="avatarClip">
      <circle cx="${cx}" cy="112" r="32"/>
    </clipPath>
  </defs>

  <style><![CDATA[
    @keyframes tilt {
      0%, 100% { transform: rotate(-1deg); }
      50%      { transform: rotate(1deg); }
    }
    @keyframes sweep {
      0%   { transform: translateX(-${W}px) skewX(-18deg); }
      100% { transform: translateX(${W}px) skewX(-18deg); }
    }
    @keyframes shimmer {
      0%, 100% { opacity: 0.18; }
      50%      { opacity: 0.32; }
    }
    .card-root  { transform-origin: ${cx}px ${H / 2}px; animation: tilt 6s ease-in-out infinite; }
    .glare-bar  { animation: sweep 4.2s linear infinite; mix-blend-mode: screen; opacity: 0.85; }
    .rainbow    { animation: shimmer 5s ease-in-out infinite; mix-blend-mode: overlay; }
    @media (prefers-reduced-motion: reduce) {
      .card-root, .glare-bar, .rainbow { animation: none; }
    }
  ]]></style>

  <g class="card-root">
    <!-- card body + clip -->
    <rect x="2" y="2" width="${W - 4}" height="${H - 4}" rx="22" ry="22" fill="${bgFill}"/>
    ${conicLayer}
    <g clip-path="url(#cardClip)">
      <!-- darken the gradient for legibility -->
      <rect x="0" y="0" width="${W}" height="${H}" fill="url(#dark)"/>

      <!-- holographic rainbow film -->
      <rect class="rainbow" x="0" y="0" width="${W}" height="${H}" fill="url(#rainbow)"/>

      <!-- subtle grid -->
      <g stroke="rgba(255,255,255,0.04)" stroke-width="0.5">
        ${Array.from({ length: Math.floor(W / 30) }, (_, i) =>
          `<line x1="${i * 30}" y1="0" x2="${i * 30}" y2="${H}"/>`).join('')}
        ${Array.from({ length: Math.floor(H / 30) }, (_, i) =>
          `<line x1="0" y1="${i * 30}" x2="${W}" y2="${i * 30}"/>`).join('')}
      </g>

      <!-- corner brand -->
      <text x="20" y="${H - 18}" font-family="ui-monospace, 'SF Mono', Menlo, monospace"
            font-size="11" font-weight="700" fill="rgba(255,255,255,0.35)">&lt;NH/&gt;</text>

      <!-- avatar -->
      <circle cx="${cx}" cy="112" r="36" fill="url(#avatarGrad)" filter="url(#softGlow)"/>
      ${avatarInner}

      <!-- name -->
      <text x="${cx}" y="186" text-anchor="middle"
            font-family="'Segoe UI', system-ui, sans-serif"
            font-size="28" font-weight="800" fill="#f8fafc">${this.escapeXml(name)}</text>

      <!-- title -->
      <text x="${cx}" y="212" text-anchor="middle"
            font-family="'Segoe UI', system-ui, sans-serif"
            font-size="14" font-weight="500" fill="#e2e8f0" opacity="0.9">⚔ ${this.escapeXml(title)}</text>

      <!-- skills -->
      ${skillsSvg}

      <!-- separator -->
      <line x1="60" y1="${H - 50}" x2="${W - 60}" y2="${H - 50}" stroke="url(#separator)" stroke-width="1"/>

      <!-- watermark -->
      <text x="${cx}" y="${H - 28}" text-anchor="middle"
            font-family="ui-monospace, 'SF Mono', Menlo, monospace"
            font-size="10.5" fill="rgba(255,255,255,0.35)">forged on nandanhegde1.github.io/portfolio</text>

      <!-- animated glare sweep -->
      <rect class="glare-bar" x="-${W}" y="-50" width="220" height="${H + 100}" fill="url(#glare)"/>
    </g>

    <!-- gradient border -->
    <rect x="2" y="2" width="${W - 4}" height="${H - 4}" rx="22" ry="22"
          fill="none" stroke="url(#border)" stroke-width="3"/>
  </g>
</svg>`;

    const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const safeName = name.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'card';
    a.download = `dev-card-${safeName}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  private escapeXml(s: string): string {
    return s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  shareCard(): void {
    const data = {
      n: this.visitorName,
      t: this.visitorTitle,
      s: this.visitorSkills(),
      c: this.forgeColorId(),
      g: this.forgeGradient(),
      a: this.forgeAvatar(),
    };
    const encoded = btoa(JSON.stringify(data));
    const url = `${window.location.origin}${window.location.pathname}#card=${encoded}`;
    navigator.clipboard.writeText(url).then(() => {
      this.shareMessage.set('✅ Link copied to clipboard!');
      setTimeout(() => this.shareMessage.set(''), 3000);
    }).catch(() => {
      this.shareMessage.set('URL: ' + url);
      setTimeout(() => this.shareMessage.set(''), 6000);
    });
  }

  private loadSharedCard(): void {
    try {
      const hash = window.location.hash;
      if (hash.startsWith('#card=')) {
        const json = atob(hash.slice(6));
        const data = JSON.parse(json);
        if (data.n && typeof data.n === 'string') this.visitorName = data.n.slice(0, 30);
        if (data.t && typeof data.t === 'string') this.visitorTitle = data.t.slice(0, 40);
        if (Array.isArray(data.s)) {
          this.visitorSkills.set(
            data.s.filter((s: unknown): s is string => typeof s === 'string' && this.availableSkills.includes(s as string)).slice(0, 6)
          );
        }
        if (data.c && typeof data.c === 'string' && this.forgeColors.some(c => c.id === data.c)) {
          this.forgeColorId.set(data.c);
        }
        if (data.g && ['linear', 'radial', 'conic', 'solid'].includes(data.g)) {
          this.forgeGradient.set(data.g);
        }
        if (data.a && typeof data.a === 'string' && this.avatarOptions.some(a => a.id === data.a)) {
          this.forgeAvatar.set(data.a);
        }
      }
    } catch { /* invalid hash, ignore */ }
  }

  private canvasRoundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }
}
