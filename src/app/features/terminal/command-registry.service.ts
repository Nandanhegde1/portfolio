import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

export interface TerminalCommand {
  name: string;
  description: string;
  action: () => string | string[];
}

@Injectable({ providedIn: 'root' })
export class CommandRegistryService {
  private readonly commands = new Map<string, TerminalCommand>();

  constructor(private router: Router) {
    this.registerDefaults();
  }

  register(cmd: TerminalCommand): void {
    this.commands.set(cmd.name.toLowerCase(), cmd);
  }

  execute(input: string): string[] {
    const parts = input.trim().toLowerCase().split(/\s+/);
    const name = parts[0];
    const args = parts.slice(1);

    if (!name) return [];

    const cmd = this.commands.get(name);
    if (!cmd) {
      return [`Command not found: ${name}. Type 'help' for available commands.`];
    }

    const result = cmd.action();
    return Array.isArray(result) ? result : [result];
  }

  getAll(): TerminalCommand[] {
    return Array.from(this.commands.values());
  }

  getSuggestions(partial: string): string[] {
    if (!partial) return [];
    const lower = partial.toLowerCase();
    return Array.from(this.commands.keys())
      .filter(name => name.startsWith(lower))
      .slice(0, 5);
  }

  private registerDefaults(): void {
    this.register({
      name: 'help',
      description: 'List all available commands',
      action: () => {
        const cmds = this.getAll();
        return [
          'Available commands:',
          '',
          ...cmds.map(c => `  ${c.name.padEnd(20)} ${c.description}`),
          '',
          "Type a command and press Enter. Use ↑/↓ for history.",
        ];
      },
    });

    this.register({
      name: 'about',
      description: 'Navigate to about page',
      action: () => { this.router.navigate(['/about']); return 'Navigating to About...'; },
    });

    this.register({
      name: 'projects',
      description: 'Navigate to projects page',
      action: () => { this.router.navigate(['/projects']); return 'Navigating to Projects...'; },
    });

    this.register({
      name: 'dashboard',
      description: 'Navigate to dashboard',
      action: () => { this.router.navigate(['/dashboard']); return 'Navigating to Dashboard...'; },
    });

    this.register({
      name: 'blog',
      description: 'Navigate to blog',
      action: () => { this.router.navigate(['/blog']); return 'Navigating to Blog...'; },
    });

    this.register({
      name: 'contact',
      description: 'Navigate to contact page',
      action: () => { this.router.navigate(['/contact']); return 'Navigating to Contact...'; },
    });

    this.register({
      name: 'home',
      description: 'Navigate to home page',
      action: () => { this.router.navigate(['/']); return 'Navigating Home...'; },
    });

    this.register({
      name: 'theme',
      description: 'Switch theme (dark/light/synthwave/nord/dracula)',
      action: () => 'Usage: theme <name>  — Use the theme switcher in the navbar.',
    });

    this.register({
      name: 'ls',
      description: 'List items (skills, projects, experience)',
      action: () => [
        'Usage: ls <category>',
        '',
        '  ls skills       — List technical skills',
        '  ls projects     — List featured projects',
        '  ls experience   — List work experience',
      ],
    });

    this.register({
      name: 'whoami',
      description: 'Display current user info',
      action: () => [
        'Nandan Hegde',
        'Full Stack Developer | Senior Software Engineer',
        'Location: Bangalore, India',
        'Stack: Angular, TypeScript, Node.js, AWS',
        '',
        'Currently @ Thinkbridge Software Pvt Ltd',
      ],
    });

    this.register({
      name: 'clear',
      description: 'Clear terminal output',
      action: () => '__CLEAR__',
    });

    this.register({
      name: 'cat',
      description: 'Display file contents (resume.pdf)',
      action: () => {
        const a = document.createElement('a');
        a.href = 'assets/Nandan_Hegde_Resume.pdf';
        a.download = 'Nandan_Hegde_Resume.pdf';
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        return 'Opening Nandan_Hegde_Resume.pdf in a new tab...';
      },
    });

    this.register({
      name: 'sudo',
      description: '🤫',
      action: () => [
        '🚀 sudo hire-me --force',
        '',
        '✅ Application submitted successfully!',
        "📧 Email sent to: nandanhegde1096@gmail.com",
        '💼 Status: READY TO JOIN',
        '',
        'Just kidding... but seriously, hire me! 😄',
      ],
    });

    this.register({
      name: 'rm',
      description: '🗑️',
      action: () => [
        '$ rm -rf doubts/',
        '',
        'Removing doubts... ████████████ 100%',
        '',
        '✨ All doubts removed successfully!',
        '💪 Confidence level: MAXIMUM',
      ],
    });

    this.register({
      name: 'history',
      description: 'Show command history',
      action: () => 'Use ↑/↓ arrow keys to navigate command history.',
    });

    this.register({
      name: 'neofetch',
      description: 'Display system info',
      action: () => [
        '    ╭─────────────────╮',
        '    │   < NH />       │',
        '    ╰─────────────────╯',
        '',
        '  OS:       Angular 19 + Node.js',
        '  Host:     Bangalore, India',
        '  Kernel:   TypeScript 5.x',
        '  Shell:    portfolio-terminal v1.0',
        '  DE:       VS Code',
        '  WM:       SCSS + CSS Grid',
        '  Terminal: This one!',
        '  CPU:      5+ years experience',
        '  Memory:   Unlimited curiosity',
      ],
    });

    this.register({
      name: 'exit',
      description: 'Close the terminal',
      action: () => '__EXIT__',
    });
  }
}
