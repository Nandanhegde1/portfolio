import { Routes } from '@angular/router';
import { environment } from '../environments/environment';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./layouts/main-layout/main-layout.component').then(m => m.MainLayoutComponent),
    children: [
      {
        path: '',
        loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent),
        data: {
          seo: {
            title: 'Senior Software Engineer · AI Engineer',
            description: 'Senior Software Engineer who led an AI voice interviewer, fit scoring and a candidate ranking engine into production. Angular, TypeScript, Node.js, LLMs.',
            url: 'https://nandanhegde1.github.io/portfolio/',
          },
        },
      },
      {
        path: 'about',
        loadComponent: () => import('./features/about/about.component').then(m => m.AboutComponent),
        data: {
          seo: {
            title: 'About — Career, Skills & Story',
            description: 'Career timeline, tech stack, and story of Nandan Hegde — Senior Software Engineer (6+ years) who led an AI workstream and builds the product around it.',
            url: 'https://nandanhegde1.github.io/portfolio/about',
          },
        },
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
        data: {
          seo: {
            title: 'Dashboard — UI Playground',
            description: 'A playground dashboard: live GitHub stats plus illustrative UI widgets and animations.',
            url: 'https://nandanhegde1.github.io/portfolio/dashboard',
          },
        },
      },
      {
        path: 'under-the-hood',
        loadComponent: () => import('./features/under-the-hood/under-the-hood.component').then(m => m.UnderTheHoodComponent),
        data: {
          seo: {
            title: 'Under the Hood — Architecture, CI/CD, SEO & Security',
            description: 'How this portfolio is actually built: Angular 19, Node backend, Supabase, Vercel, GitHub Pages, performance budgets, and OWASP-audited security.',
            url: 'https://nandanhegde1.github.io/portfolio/under-the-hood',
          },
        },
      },
      // The blog is hidden until its posts hold up line by line. Until
      // features.blog is back on, /blog sends visitors home.
      ...(environment.features.blog
        ? [
            {
              path: 'blog',
              loadComponent: () => import('./features/blog/blog.component').then(m => m.BlogComponent),
              data: {
                seo: {
                  title: 'Blog — Engineering Notes',
                  description: 'Technical writing on Angular, TypeScript, performance, and software engineering.',
                  url: 'https://nandanhegde1.github.io/portfolio/blog',
                  type: 'article',
                },
              },
            },
          ]
        : [{ path: 'blog', redirectTo: '', pathMatch: 'full' as const }]),
      {
        path: 'contact',
        loadComponent: () => import('./features/contact/contact.component').then(m => m.ContactComponent),
        data: {
          seo: {
            title: 'Contact — Let\'s Build Something',
            description: 'Get in touch for senior and lead full-stack / AI-product roles. Available for new opportunities.',
            url: 'https://nandanhegde1.github.io/portfolio/contact',
          },
        },
      },
      // Retired pages: their old links send visitors home.
      { path: 'roast-me-back', redirectTo: '', pathMatch: 'full' },
      { path: 'guestbook', redirectTo: '', pathMatch: 'full' },
      {
        path: 'lab',
        loadComponent: () => import('./features/lab/lab.component').then(m => m.LabComponent),
        data: {
          seo: {
            title: 'The Lab: Watch an AI Agent Work',
            description: 'A recorded run of Planning Desk, an AI agent with a custom loop over three MCP servers, replayed step by step in your browser: every model call, every tool call and its timing, against hard ceilings.',
            url: 'https://nandanhegde1.github.io/portfolio/lab',
          },
        },
      },
      // Old links to the lab's previous experiment land on the lab.
      { path: 'roast', redirectTo: 'lab', pathMatch: 'full' },
      {
        path: 'quiz',
        loadComponent: () => import('./features/quiz/quiz.component').then(m => m.QuizComponent),
        data: {
          seo: {
            title: 'Would I Survive Your Team?',
            description: '7 real scenarios. 1 developer archetype. 0 wrong answers.',
            url: 'https://nandanhegde1.github.io/portfolio/quiz',
          },
        },
      },
      {
        path: 'pitch',
        loadComponent: () => import('./features/pitch/pitch.component').then(m => m.PitchComponent),
        data: {
          seo: {
            title: 'Hire Me — The Pitch',
            description: 'Why I\'m a strong fit for your team. The 60-second pitch with stats, projects, and impact.',
            url: 'https://nandanhegde1.github.io/portfolio/pitch',
          },
        },
      },
      {
        path: 'case-study/ai-interview',
        loadComponent: () => import('./features/case-study/ai-interview.component').then(m => m.AiInterviewCaseStudyComponent),
        data: {
          seo: {
            title: 'Case Study — AI Interview & Fit-Scoring',
            description: 'How a 10,000-user recruiting platform got an AI that interviews candidates — signal design, the fit-score model, the ranking engine, and the model-cost strategy.',
            url: 'https://nandanhegde1.github.io/portfolio/case-study/ai-interview',
            type: 'article',
          },
        },
      },
      {
        path: 'projects',
        loadComponent: () => import('./features/projects/projects.component').then(m => m.ProjectsComponent),
        data: {
          seo: {
            title: 'Projects — Case Studies',
            description: 'A reel of the projects I have shipped — the stack, the metrics, and the calls I made along the way.',
            url: 'https://nandanhegde1.github.io/portfolio/projects',
          },
        },
      },
      {
        path: '404',
        loadComponent: () => import('./features/not-found/not-found.component').then(m => m.NotFoundComponent),
        data: {
          seo: {
            title: '404 — Lost? Try the terminal',
            description: 'Page not found, but here\'s an interactive terminal you can play with.',
            url: 'https://nandanhegde1.github.io/portfolio/404',
            noindex: true,
          },
        },
      },
      { path: '**', redirectTo: '404' },
    ],
  },
  {
    path: '**',
    redirectTo: '',
  },
];
