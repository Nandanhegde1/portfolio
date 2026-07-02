import { Routes } from '@angular/router';

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
            title: 'Senior Full-Stack Engineer · AI Products',
            description: 'I build full-stack products — and the AI inside them. AI voice-interview + fit-scoring on a 10,000-user platform. Angular, TypeScript, Node, LLMs. Open to senior/lead roles.',
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
            description: 'Career timeline, tech stack, and story of Nandan Hegde — senior full-stack engineer (~6 years) who designs the AI workstream and builds the product around it.',
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
            description: 'How this portfolio is actually built: Angular 19, Node backend, Claude AI, Supabase, Render, GitHub Pages, performance budgets, and OWASP-audited security.',
            url: 'https://nandanhegde1.github.io/portfolio/under-the-hood',
          },
        },
      },
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
      {
        path: 'roast-me-back',
        loadComponent: () => import('./features/roast-me-back/roast-me-back.component').then(m => m.RoastMeBackComponent),
        data: {
          seo: {
            title: 'Roast Me Back — The Honest Wall',
            description: 'The AI on /lab roasts your stack. This page flips it. Leave a one-line roast of this portfolio. I read every one and reply to the sharp ones.',
            url: 'https://nandanhegde1.github.io/portfolio/roast-me-back',
          },
        },
      },
      { path: 'guestbook', redirectTo: 'roast-me-back', pathMatch: 'full' },
      {
        path: 'lab',
        loadComponent: () => import('./features/roast/roast.component').then(m => m.RoastComponent),
        data: {
          seo: {
            title: 'The Lab — AI Experiments',
            description: 'A weekend experiment. Claude wired to a streaming endpoint, given permission to roast your tech stack. Source linked.',
            url: 'https://nandanhegde1.github.io/portfolio/lab',
          },
        },
      },
      { path: 'roast', redirectTo: 'lab', pathMatch: 'full' },
      {
        path: 'quiz',
        loadComponent: () => import('./features/quiz/quiz.component').then(m => m.QuizComponent),
        data: {
          seo: {
            title: 'Quiz — How Well Do You Know Me?',
            description: 'A fun quiz about my career, projects, and tech stack.',
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
