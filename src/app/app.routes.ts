import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./layouts/main-layout/main-layout.component').then(m => m.MainLayoutComponent),
    children: [
      {
        path: '',
        loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent),
      },
      {
        path: 'about',
        loadComponent: () => import('./features/about/about.component').then(m => m.AboutComponent),
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
      },
      {
        path: 'blog',
        loadComponent: () => import('./features/blog/blog.component').then(m => m.BlogComponent),
      },
      {
        path: 'contact',
        loadComponent: () => import('./features/contact/contact.component').then(m => m.ContactComponent),
      },
      {
        path: 'guestbook',
        loadComponent: () => import('./features/guestbook/guestbook.component').then(m => m.GuestbookComponent),
      },
      {
        path: 'roast',
        loadComponent: () => import('./features/roast/roast.component').then(m => m.RoastComponent),
      },
      {
        path: 'quiz',
        loadComponent: () => import('./features/quiz/quiz.component').then(m => m.QuizComponent),
      },
      {
        path: 'pitch',
        loadComponent: () => import('./features/pitch/pitch.component').then(m => m.PitchComponent),
      },
    ],
  },
  {
    path: '**',
    redirectTo: '',
  },
];
