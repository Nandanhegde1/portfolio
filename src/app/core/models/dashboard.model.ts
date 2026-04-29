export interface DashboardWidget {
  id: string;
  title: string;
  icon: string;
  loading: boolean;
  error: string | null;
  expanded: boolean;
}

export interface StatCardData {
  label: string;
  value: string | number;
  icon: string;
  change?: number;
  changeLabel?: string;
  color?: string;
}

export interface VisitorStats {
  totalVisits: number;
  uniqueVisitors: number;
  pageViews: number;
  topPages: { path: string; views: number }[];
  referrers: { source: string; count: number }[];
  dailyVisits: { date: string; visits: number }[];
}

export interface RecruiterContact {
  id: string;
  company: string;
  role: string;
  date: string;
  source: string;
  status: 'new' | 'responded' | 'interview' | 'declined';
}

export interface InterviewEntry {
  id: string;
  company: string;
  role: string;
  date: string;
  stage: 'applied' | 'phone-screen' | 'technical' | 'onsite' | 'offer' | 'rejected';
  notes: string;
}

export interface CodingStats {
  totalHoursToday: number;
  totalHoursWeek: number;
  dailyHours: { date: string; hours: number }[];
  languages: { name: string; hours: number; percent: number }[];
  editors: { name: string; hours: number }[];
  monthlyTrend: { date: string; hours: number }[];
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  date: string;
  readTime: number;
  tags: string[];
  views: number;
  featured: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface GuestbookEntry {
  id: string;
  name: string;
  message: string;
  emoji?: string;
  timestamp: Date | string;
  reactions: Record<string, number>;
}

export type ThemeName = 'light' | 'dark' | 'synthwave' | 'nord' | 'dracula';
