import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ChatMessage } from '../../core/models';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LanguageService } from '../../core/i18n/language.service';

interface ChatApiResponse {
  reply: string;
  error?: string;
}

@Injectable({ providedIn: 'root' })
export class ChatbotService {
  private readonly http = inject(HttpClient);
  private readonly language = inject(LanguageService);
  private readonly MAX_MESSAGES_PER_SESSION = 10;
  private readonly API_URL = `${environment.apiUrl}/api/chat`;
  private messageCount = 0;

  readonly messages = signal<ChatMessage[]>([]);
  readonly isTyping = signal(false);
  readonly rateLimited = signal(false);
  /** True when the last reply came from the local fallback (backend asleep/offline). */
  readonly offlineMode = signal(false);

  readonly quickQuestions = [
    "What's your tech stack?",
    'Tell me about your experience',
    'Are you open to new opportunities?',
    'What makes you different from other devs?',
    'What are you currently learning?',
  ];

  /** Returns 3 most relevant quick questions based on the user's current page */
  contextualQuestions(path: string): string[] {
    const map: Record<string, string[]> = {
      '/': ['Tell me about your experience', "What's your tech stack?", 'Are you open to new opportunities?'],
      '/about': ['Walk me through your career path', 'What is your strongest skill?', 'What are you currently learning?'],
      '/dashboard': ['How do you measure impact?', 'Which language do you ship most?', "What's your favorite project?"],
      '/blog': ['Which post should I read first?', 'What inspires your writing?', 'How often do you publish?'],
      '/roast': ['Be honest \u2014 is my stack good?', 'Suggest a better stack for SaaS', 'What stack would you pick today?'],
      '/quiz': ['Got a harder question?', 'How did I score?', "What's the trickiest concept?"],
      '/guestbook': ['Who has signed recently?', 'Why a guestbook?', 'Will you reply to my note?'],
      '/contact': ['What is your response time?', 'Best way to reach you?', 'Are you available for freelance?'],
    };
    return map[path] ?? this.quickQuestions.slice(0, 3);
  }

  async sendMessage(content: string): Promise<void> {
    if (this.messageCount >= this.MAX_MESSAGES_PER_SESSION) {
      this.rateLimited.set(true);
      return;
    }

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: new Date(),
    };

    this.messages.update(prev => [...prev, userMsg]);
    this.messageCount++;
    this.isTyping.set(true);

    try {
      const history = this.messages().map(m => ({
        role: m.role,
        content: m.content,
      }));

      const response = await firstValueFrom(
        this.http.post<ChatApiResponse>(this.API_URL, {
          message: content,
          history: history.slice(0, -1),
          lang: this.language.current(),
        })
      );

      this.offlineMode.set(false);
      const botMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response.reply || 'Sorry, I could not generate a response right now.',
        timestamp: new Date(),
      };
      this.messages.update(prev => [...prev, botMsg]);
    } catch {
      this.offlineMode.set(true);
      const fallback = this.getLocalFallback(content);
      const botMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: fallback,
        timestamp: new Date(),
      };
      this.messages.update(prev => [...prev, botMsg]);
    } finally {
      this.isTyping.set(false);
    }
  }

  clearChat(): void {
    this.messages.set([]);
    this.messageCount = 0;
    this.rateLimited.set(false);
  }

  /**
   * Pattern-based fallback used only when the live AI backend is unreachable.
   * First match wins. Keep responses warm and concise (2-3 sentences).
   */
  private getLocalFallback(question: string): string {
    const q = question.toLowerCase();
    const has = (...words: string[]) => words.some((w) => q.includes(w));

    if (has('hello', 'hi ', 'hey', 'howdy', 'yo ', 'greetings') && q.length < 25)
      return "Hey! 👋 I'm Nandan's AI assistant. Ask me about his experience, tech stack, projects, or availability — or try one of the quick suggestions above.";

    if (has('who are you', 'what are you', 'about you', 'introduce yourself'))
      return "I'm a small AI assistant trained on Nandan's resume and this site's content. I can answer questions about his work, skills, projects, and how to reach him.";

    if (has('who is nandan', 'about nandan', 'tell me about nandan'))
      return 'Nandan is a Senior Software Engineer with 6+ years of experience, specializing in Angular, TypeScript, and Node.js. Currently leading frontend at Thinkbridge for client PSG Global Solutions.';

    if (has('tech', 'stack', 'skill', 'language', 'framework', 'tool'))
      return 'Primary stack: Angular 17+, TypeScript, RxJS, SCSS, Node.js, Azure DevOps. Also React.js, Power BI, Terraform, Docker, Kubernetes, multi-cloud (AWS/Azure/GCP). AWS Certified Solutions Architect Associate.';

    if (has('experience', 'years', 'how long', 'background', 'career', 'journey'))
      return '6+ years total. Currently Senior SE at Thinkbridge since March 2022 (Angular migration, CI/CD, Power BI for 10K+ users). Before that: Infosys (2020-2022) on Swiss Re Corflow Claims and a multi-cloud migration accelerator.';

    if (has('current', 'right now', 'currently doing', 'currently working'))
      return "Leading the Compass recruitment platform at Thinkbridge — Angular 17, real-time data sync, browser extensions used by 500+ recruiters. Also exploring AI agents (built React prototype 'Anna' demoed in Austin).";

    if (has('hire', 'hiring', 'available', 'opportunit', 'open to', 'looking for', 'role', 'job', 'position', 'recruit'))
      return 'Yes! Open to Senior Frontend, Full-Stack, and Lead roles. Use the contact form or click the open-to-work badge in the navbar — typical response time is under 24 hours.';

    if (has('salary', 'compensation', 'rate', 'pay', 'package'))
      return 'Compensation is flexible based on role, location, and scope. Reach out via the contact form to discuss specifics.';

    if (has('remote', 'relocat', 'location', 'where based', 'where do you'))
      return 'Based in Bangalore, India. Open to remote roles globally and willing to discuss relocation for the right opportunity.';

    if (has('freelance', 'contract', 'consulting'))
      return 'Yes — open to short-term freelance and contracts, especially Angular modernization and frontend architecture audits. Drop a message via the contact form.';

    if (has('project', 'built', 'work on', 'made', 'shipped', 'compass', 'anna', 'corflow'))
      return 'Highlights: Compass (Angular 17 recruitment platform, 10K+ users), AI Calling Agent "Anna" (React, demoed in Austin), Corflow Claims (Swiss Re, 40+ countries), Cloud Migration Accelerator (Terraform, multi-cloud), and this very portfolio.';

    if (has('favorite', 'best', 'proudest', 'favourite'))
      return 'Compass is the proudest one — owned the Angular migration end-to-end, cut load time ~30%, and shipped a real-time sync engine that eliminated duplicate candidate entries for 10K+ monthly users.';

    if (has('learn', 'study', 'reading', 'exploring', 'side project'))
      return 'Currently exploring AI agent design, Angular Signals + the new control flow, edge runtimes, and 3D web (Three.js — used in this portfolio\'s hero).';

    if (has('different', 'unique', 'why you', 'why hire', 'stand out', 'special'))
      return 'Three things: deep Angular expertise (migrations, perf, architecture), full-stack range (Node, multi-cloud, CI/CD), and a builder mindset — every side project ships, including this portfolio with live AI, dashboards, and 3D scenes.';

    if (has('education', 'degree', 'college', 'university', 'school'))
      return 'B.E. in Electronics & Telecommunication from Dayananda Sagar College of Engineering, Bangalore (2019). Plus AWS Certified Solutions Architect Associate.';

    if (has('certif', 'aws', 'azure cert', 'gcp cert'))
      return 'AWS Certified Solutions Architect Associate. Hands-on with Azure DevOps and GCP via the cloud migration accelerator at Infosys.';

    if (has('contact', 'reach', 'email', 'linkedin', 'message', 'get in touch', 'ping'))
      return 'Use the Contact page (link in the navbar) — it goes straight to Nandan. LinkedIn and GitHub are in the social sidebar on the left.';

    if (has('response time', 'how fast', 'when reply', 'reply time'))
      return 'Typically under 24 hours on weekdays. Recruiters get prioritised — leave the role + comp band and you\'ll usually hear back same-day.';

    // Site-specific
    if (has('guestbook', 'sign'))
      return 'The guestbook lets visitors leave a quick note + a reaction emoji. Recent entries are at /guestbook — pop in and say hi!';

    if (has('blog', 'post', 'article', 'write'))
      return 'The blog has notes on Angular, performance, and architecture. Hit /blog to browse — newest posts first.';

    if (has('dashboard', 'stats', 'metric', 'analytic'))
      return 'The /dashboard tab shows live GitHub activity, coding stats, a skills radar, and visitor analytics — all real data, refreshed in real time.';

    if (has('roast'))
      return '/roast lets you paste your tech stack and Claude AI roasts it (mild, medium, or spicy). Surprisingly accurate — and pretty funny.';

    if (has('quiz'))
      return '/quiz tests your Angular & TypeScript knowledge across three difficulty tiers — see how you stack up!';

    if (has('source', 'github', 'code', 'repo', 'open source'))
      return 'Full source is at github.com/Nandanhegde1/portfolio — fork it, learn from it, or open an issue if you spot something to improve!';

    if (has('theme', 'dark', 'light', 'mode'))
      return 'Toggle dark/light from the navbar (sun/moon icon). The site also respects your OS theme preference by default.';

    if (has('this site', 'this portfolio', 'how built', 'how did you build'))
      return 'Built with Angular 19 (standalone components, signals, new control flow), SCSS, Three.js for the hero, and a Node/Express backend on Render with the Claude API. Fully open-source on GitHub.';

    if (has('offline', 'down', 'broken', 'not working', 'error', 'bug'))
      return "The AI backend may be sleeping (free tier — cold starts take ~30s). I'm using cached answers right now. Refresh in a minute and the live AI should respond.";

    return `Great question! The live AI is taking a quick nap (free-tier cold start), so I'm answering from a cached knowledge base. Try asking about Nandan's experience, tech stack, projects, availability, or anything you see on the site — or refresh in a minute for the full AI.`;
  }
}
