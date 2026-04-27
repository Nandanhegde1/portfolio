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
                <label class="rpg__forge-label">Avatar</label>
                <div class="rpg__forge-avatars">
                  @for (avatar of avatarOptions; track avatar.id) {
                    <button
                      class="rpg__forge-avatar-btn"
                      [class.rpg__forge-avatar-btn--active]="forgeAvatar() === avatar.id"
                      (click)="forgeAvatar.set(avatar.id)"
                      [title]="avatar.label"
                    >{{ avatar.emoji }}</button>
                  }
                  <button
                    class="rpg__forge-avatar-btn"
                    [class.rpg__forge-avatar-btn--active]="forgeAvatar() === 'dicebear'"
                    (click)="forgeAvatar.set('dicebear')"
                    title="DiceBear cartoon avatar (unique to your name)"
                  >
                    <img
                      [src]="getDiceBearUrl(visitorName || 'guest')"
                      alt="DiceBear avatar option"
                      class="rpg__forge-dicebear-thumb"
                      width="28"
                      height="28"
                    />
                  </button>
                </div>
              </div>
              <div class="rpg__forge-field">
                <label class="rpg__forge-label">Character Name</label>
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
                <label class="rpg__forge-label">Class</label>
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
                <label class="rpg__forge-label">Skills (pick up to 6)</label>
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
                <label class="rpg__forge-label">Card Style</label>
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
                <label class="rpg__forge-label">Card Color</label>
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
                    } @else if (forgeAvatar() === 'dicebear') {
                      <img
                        [src]="getDiceBearUrl(visitorName || 'guest')"
                        alt="Cartoon avatar"
                        class="rpg__forge-dicebear-display"
                      />
                    } @else {
                      <span class="rpg__forge-avatar-emoji">{{ getAvatarEmoji(forgeAvatar()) }}</span>
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
                  <p class="rpg__forge-watermark">forged on nandan.dev</p>
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

  readonly openSections = signal<Set<string>>(new Set(['attributes', 'quests', 'inventory', 'achievements']));

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

  readonly avatarOptions: AvatarOption[] = [
    { id: 'initials', emoji: 'Aa', label: 'Initials' },
    { id: 'rocket', emoji: '🚀', label: 'Rocket' },
    { id: 'fire', emoji: '🔥', label: 'Fire' },
    { id: 'lightning', emoji: '⚡', label: 'Lightning' },
    { id: 'gem', emoji: '💎', label: 'Gem' },
    { id: 'robot', emoji: '🤖', label: 'Robot' },
    { id: 'ninja', emoji: '🥷', label: 'Ninja' },
    { id: 'alien', emoji: '👾', label: 'Alien' },
    { id: 'skull', emoji: '💀', label: 'Skull' },
    { id: 'ghost', emoji: '👻', label: 'Ghost' },
  ];

  readonly forgeColorId = signal('cyan');
  readonly forgeGradient = signal<GradientStyle>('linear');
  readonly forgeAvatar = signal('initials');

  activeForgeColor(): CardColor {
    return this.forgeColors.find(c => c.id === this.forgeColorId()) ?? this.forgeColors[0];
  }

  getAvatarEmoji(id: string): string {
    return this.avatarOptions.find(a => a.id === id)?.emoji ?? '??';
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
    const canvas = this.downloadCanvasRef.nativeElement;
    const w = 600, h = 340;
    const dpr = 2;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    const ctx = canvas.getContext('2d')!;
    ctx.scale(dpr, dpr);

    const name = this.visitorName || 'Your Name';
    const title = this.visitorTitle || 'Developer';
    const skills = this.visitorSkills();
    const initials = this.getInitials(name);
    const cx = w / 2;
    const fc = this.activeForgeColor();
    const avatarId = this.forgeAvatar();

    // Background with subtle gradient
    const bgGrad = ctx.createLinearGradient(0, 0, w, h);
    bgGrad.addColorStop(0, '#0a0e1a');
    bgGrad.addColorStop(1, '#111827');
    this.canvasRoundRect(ctx, 0, 0, w, h, 20);
    ctx.fillStyle = bgGrad;
    ctx.fill();

    // Border using forge color
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, fc.primary);
    grad.addColorStop(1, fc.secondary);
    ctx.strokeStyle = grad;
    ctx.lineWidth = 4;
    this.canvasRoundRect(ctx, 2, 2, w - 4, h - 4, 18);
    ctx.stroke();

    // Inner border glow
    ctx.strokeStyle = fc.primary + '1a';
    ctx.lineWidth = 1;
    this.canvasRoundRect(ctx, 8, 8, w - 16, h - 16, 14);
    ctx.stroke();

    // Ambient glow
    const glow = ctx.createRadialGradient(cx, 60, 0, cx, 60, 200);
    glow.addColorStop(0, fc.primary + '20');
    glow.addColorStop(1, 'transparent');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);

    // Subtle grid pattern
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.015)';
    ctx.lineWidth = 0.5;
    for (let gi = 0; gi < w; gi += 30) {
      ctx.beginPath(); ctx.moveTo(gi, 0); ctx.lineTo(gi, h); ctx.stroke();
    }
    for (let gj = 0; gj < h; gj += 30) {
      ctx.beginPath(); ctx.moveTo(0, gj); ctx.lineTo(w, gj); ctx.stroke();
    }

    // Avatar circle
    const avatarY = 65;
    ctx.save();
    ctx.shadowColor = fc.primary + '66';
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.arc(cx, avatarY, 30, 0, Math.PI * 2);
    const ag = ctx.createLinearGradient(cx - 30, avatarY - 30, cx + 30, avatarY + 30);
    ag.addColorStop(0, fc.primary);
    ag.addColorStop(1, fc.secondary);
    ctx.fillStyle = ag;
    ctx.fill();
    ctx.restore();

    // Avatar content (initials or emoji)
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    if (avatarId === 'initials') {
      ctx.font = 'bold 22px Courier New, monospace';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(initials, cx, avatarY + 1);
    } else {
      ctx.font = '28px serif';
      ctx.fillText(this.getAvatarEmoji(avatarId), cx, avatarY + 1);
    }

    // Name
    ctx.font = 'bold 28px Segoe UI, sans-serif';
    ctx.fillStyle = '#f1f5f9';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(name, cx, avatarY + 62);

    // Title
    ctx.font = '14px Segoe UI, sans-serif';
    ctx.fillStyle = fc.primary;
    ctx.fillText(title, cx, avatarY + 84);

    // Skill badges
    if (skills.length > 0) {
      const badgeY = avatarY + 118;
      ctx.font = 'bold 11px Courier New, monospace';
      const padX = 14;
      const badgeH = 24;
      const gap = 8;
      const widths = skills.map(s => ctx.measureText(s).width + padX * 2);
      const total = widths.reduce((a, b) => a + b, 0) + (skills.length - 1) * gap;
      let sx = cx - total / 2;
      for (let si = 0; si < skills.length; si++) {
        const bw = widths[si];
        const by = badgeY - badgeH / 2;
        ctx.fillStyle = fc.primary + '1a';
        this.canvasRoundRect(ctx, sx, by, bw, badgeH, 6);
        ctx.fill();
        ctx.strokeStyle = fc.primary + '66';
        ctx.lineWidth = 1;
        this.canvasRoundRect(ctx, sx, by, bw, badgeH, 6);
        ctx.stroke();
        ctx.fillStyle = fc.primary;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(skills[si], sx + bw / 2, badgeY + 1);
        sx += bw + gap;
      }
    }

    // Separator line
    const sepY = h - 52;
    const lineGrad = ctx.createLinearGradient(60, sepY, w - 60, sepY);
    lineGrad.addColorStop(0, 'transparent');
    lineGrad.addColorStop(0.3, fc.primary + '33');
    lineGrad.addColorStop(0.7, fc.secondary + '33');
    lineGrad.addColorStop(1, 'transparent');
    ctx.strokeStyle = lineGrad;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(60, sepY);
    ctx.lineTo(w - 60, sepY);
    ctx.stroke();

    // Watermark
    ctx.font = '11px Courier New, monospace';
    ctx.fillStyle = '#334155';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText('forged on nandan.dev', cx, h - 22);

    // Corner branding
    ctx.font = 'bold 11px Courier New, monospace';
    ctx.fillStyle = '#1e293b';
    ctx.textAlign = 'left';
    ctx.fillText('<NH/>', 18, h - 14);

    // Download
    canvas.toBlob(blob => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const safeName = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      a.download = 'dev-card-' + safeName + '.png';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
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
