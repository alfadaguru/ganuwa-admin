// Base types
export interface User {
  _id: string;
  email: string;
  name: string;
  role: 'admin' | 'editor' | 'viewer';
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User, token: string) => void;
}

// Content Types
export interface News {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: 'general' | 'politics' | 'economy' | 'education' | 'health' | 'infrastructure';
  tags: string[];
  featuredImage: string;
  author: string;
  status: 'draft' | 'published' | 'archived';
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface HeroBanner {
  _id: string;
  title: string;
  subtitle?: string;
  description?: string;
  image: string;
  link?: string;
  linkText?: string;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Announcement {
  _id: string;
  title: string;
  content: string;
  type: 'info' | 'warning' | 'urgent';
  priority: number;
  isActive: boolean;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PressRelease {
  _id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  category: string;
  tags: string[];
  attachments: string[];
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
  publishedAt?: string;
  status: 'draft' | 'published' | 'archived';
  createdAt: string;
  updatedAt: string;
}

export interface Event {
  _id: string;
  title: string;
  slug: string;
  description: string;
  location: string;
  venue: string;
  startDate: string;
  endDate: string;
  category: string;
  tags: string[];
  featuredImage?: string;
  organizer: string;
  contactEmail?: string;
  contactPhone?: string;
  registrationLink?: string;
  capacity?: number;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

export interface Leader {
  _id: string;
  name: string;
  position: string;
  office: string;
  bio: string;
  image: string;
  email?: string;
  phone?: string;
  socialMedia?: {
    twitter?: string;
    facebook?: string;
    instagram?: string;
    linkedin?: string;
  };
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Service {
  _id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  icon?: string;
  featuredImage?: string;
  requirements: string[];
  process: string[];
  documents: string[];
  fee?: string;
  duration?: string;
  contactInfo?: {
    email?: string;
    phone?: string;
    address?: string;
  };
  onlineApplicationLink?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  _id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  location: string;
  budget?: number;
  status: 'planned' | 'ongoing' | 'completed' | 'suspended';
  startDate?: string;
  completionDate?: string;
  contractor?: string;
  ministry: string;
  images: string[];
  progress?: number;
  updates: Array<{
    date: string;
    description: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface MDA {
  _id: string;
  name: string;
  acronym?: string;
  type: 'ministry' | 'department' | 'agency';
  description: string;
  mission?: string;
  vision?: string;
  headOfMDA: string;
  email: string;
  phone: string;
  address: string;
  website?: string;
  services: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LGA {
  _id: string;
  name: string;
  description: string;
  population?: number;
  area?: number;
  headquarters: string;
  chairman: string;
  email?: string;
  phone?: string;
  address?: string;
  wards: string[];
  keyFacts?: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Media {
  _id: string;
  title: string;
  type: 'image' | 'video' | 'document';
  url: string;
  thumbnail?: string;
  description?: string;
  category: string;
  tags: string[];
  fileSize?: number;
  mimeType?: string;
  uploadedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface QuickLink {
  _id: string;
  title: string;
  url: string;
  icon?: string;
  category: string;
  order: number;
  isActive: boolean;
  openInNewTab: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Page {
  _id: string;
  title: string;
  slug: string;
  content: string;
  metaDescription?: string;
  metaKeywords?: string[];
  template?: string;
  parentPage?: string;
  status: 'draft' | 'published';
  createdAt: string;
  updatedAt: string;
}

export interface FAQ {
  _id: string;
  question: string;
  answer: string;
  category: string;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Contact {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  status: 'new' | 'read' | 'responded';
  response?: string;
  respondedAt?: string;
  respondedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Subscriber {
  _id: string;
  email: string;
  name?: string;
  isActive: boolean;
  categories: string[];
  subscribedAt: string;
  unsubscribedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

// Form types
export interface LoginFormData {
  email: string;
  password: string;
}

// Dashboard stats
export interface DashboardStats {
  news: number;
  events: number;
  services: number;
  projects: number;
  contacts: number;
  subscribers: number;
  users: number;
  totalContent: number;
}