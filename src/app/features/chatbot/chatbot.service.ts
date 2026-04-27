import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ChatMessage } from '../../core/models';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

interface ChatApiResponse {
  reply: string;
  error?: string;
}

@Injectable({ providedIn: 'root' })
export class ChatbotService {
  private readonly http = inject(HttpClient);
  private readonly MAX_MESSAGES_PER_SESSION = 10;
  private readonly API_URL = `${environment.apiUrl}/api/chat`;
  private messageCount = 0;

  readonly messages = signal<ChatMessage[]>([]);
  readonly isTyping = signal(false);
  readonly rateLimited = signal(false);

  readonly quickQuestions = [
    "What's your tech stack?",
    'Tell me about your experience',
    'Are you open to new opportunities?',
    'What makes you different from other devs?',
    'What are you currently learning?',
  ];

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
          history: history.slice(0, -1), // exclude the just-added user msg
        })
      );

      const botMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response.reply || 'Sorry, I could not generate a response right now.',
        timestamp: new Date(),
      };

      this.messages.update(prev => [...prev, botMsg]);
    } catch {
      // Fallback to local responses if backend is unavailable
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

  private getLocalFallback(question: string): string {
    const q = question.toLowerCase();
    if (q.includes('tech') || q.includes('stack'))
      return 'Nandan works primarily with Angular 17, TypeScript, RxJS, Node.js, and Azure DevOps. He also has experience with React.js, Power BI, Terraform, and multi-cloud (AWS, Azure, GCP).';
    if (q.includes('experience') || q.includes('work'))
      return 'Nandan has 6+ years of experience. Currently a Senior Software Engineer at Thinkbridge (client: PSG Global Solutions) where he led the Angular migration, built CI/CD pipelines, and integrated Power BI for 10,000+ users. Previously at Infosys working on Swiss Re\'s global claims platform and a cloud migration accelerator.';
    if (q.includes('hire') || q.includes('available') || q.includes('opportunit'))
      return 'Yes! Nandan is open to senior frontend, full-stack, and lead roles. Reach out via the contact form or LinkedIn!';
    if (q.includes('project'))
      return 'Key projects: Compass (recruitment platform, Angular 17, 10K+ users), AI Calling Agent "Anna" (React.js, showcased at US tradeshow), Corflow Claims (Swiss Re, 40+ countries), and Cloud Migration Accelerator (Terraform, multi-cloud).';
    if (q.includes('certif'))
      return 'Nandan holds an AWS Certified Solutions Architect Associate certification.';
    return 'Nandan is a Senior Software Engineer with 6+ years of experience specializing in Angular, TypeScript, and Node.js. Ask me about his skills, experience, projects, or availability!';
  }
}
