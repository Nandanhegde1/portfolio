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
            title: 'Senior Software Engineer',
            description: '6+ years building enterprise Angular apps. AWS Certified. Open to senior frontend, full-stack & lead roles.',
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
            description: 'Career timeline, tech stack, and story of Nandan Hegde — Senior Software Engineer with 6+ years in enterprise Angular development.',
            url: 'https://nandanhegde1.github.io/portfolio/about',
          },
        },
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
        data: {
          seo: {
            title: 'Dashboard — Live Coding Stats',
            description: 'Live GitHub activity, coding heatmap, language breakdown, and project timeline.',
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
            description: 'Get in touch for senior frontend, full-stack, or lead roles. Available for new opportunities.',
            url: 'https://nandanhegde1.github.io/portfolio/contact',
          },
        },
      },
      {
        path: 'guestbook',
        loadComponent: () => import('./features/guestbook/guestbook.component').then(m => m.GuestbookComponent),
        data: {
          seo: {
            title: 'Guestbook — Sign In',
            description: 'Drop a note, share your thoughts, or just say hi.',
            url: 'https://nandanhegde1.github.io/portfolio/guestbook',
          },
        },
      },
      {
        path: 'roast',
        loadComponent: () => import('./features/roast/roast.component').then(m => m.RoastComponent),
        data: {
          seo: {
            title: 'Roast Me — AI Code Roaster',
            description: 'Get your code or resume roasted by AI. Constructive feedback with a side of humor.',
            url: 'https://nandanhegde1.github.io/portfolio/roast',
          },
        },
      },
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
