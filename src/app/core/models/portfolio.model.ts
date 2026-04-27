// Core data models for the portfolio application

export interface PersonalInfo {
  name: string;
  title: string;
  tagline: string;
  bio: string;
  email: string;
  location: string;
  avatarUrl: string;
  resumeUrl: string;
}

export interface SocialLinks {
  github: string;
  linkedin: string;
  twitter: string;
  email: string;
}

export interface Experience {
  id: string;
  role: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string | null;
  current: boolean;
  description: string;
  highlights: string[];
  technologies: string[];
}

export interface Project {
  id: string;
  title: string;
  client: string;
  description: string;
  highlights: string[];
  technologies: string[];
  imageUrl: string;
  liveUrl: string;
  githubUrl: string;
  featured: boolean;
  category: 'enterprise' | 'devops' | 'personal' | 'open-source';
}

export interface Skill {
  name: string;
  level: number;
  icon: string;
}

export interface SkillCategory {
  frontend: Skill[];
  backend: Skill[];
  database: Skill[];
  devops: Skill[];
  cloud: Skill[];
}

export interface SkillRadarPoint {
  category: string;
  value: number;
}

export interface Education {
  degree: string;
  institution: string;
  startDate: string;
  endDate: string;
  score: string;
}

export interface Certification {
  name: string;
  issuer: string;
  date: string;
  validationNumber: string;
  url: string;
}

export interface Language {
  name: string;
  proficiency: string;
}

export interface TimelineEvent {
  date: string;
  title: string;
  description: string;
  category: 'education' | 'career' | 'achievement' | 'project';
  icon: string;
}

export interface PortfolioData {
  personal: PersonalInfo;
  social: SocialLinks;
  experience: Experience[];
  projects: Project[];
  skills: SkillCategory;
  skillsRadar: SkillRadarPoint[];
  education: Education[];
  certifications: Certification[];
  languages: Language[];
  timeline: TimelineEvent[];
  github: { username: string };
  terminal: { welcomeMessage: string; prompt: string };
  chatbot: { systemPrompt: string; quickQuestions: string[] };
}
