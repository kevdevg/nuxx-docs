
export enum UserRole {
  ADMIN = 'ADMIN',
  DEVELOPER = 'DEVELOPER',
  CLIENT = 'CLIENT',
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  clientId?: string; // If role is CLIENT
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

export interface Client {
  id: string;
  companyName: string;
  taxId: string;
  sector: string;
  contactName: string;
  email: string;
  phone?: string;       
  website?: string;     
  address?: string;     
  city?: string;        
  country?: string;     
  notes?: string;       
  comments: NoteComment[]; 
  hasSupportPlan: boolean; 
  metadata?: Record<string, unknown>;
}

export enum ProjectStatus {
  ANALYSIS = 'ANALYSIS',
  DEV = 'DEV',
  QA = 'QA',
  DONE = 'DONE',
}

export type NoteCategory = 
  | 'Transcription & Problem Extraction'
  | 'Gap Analysis'
  | 'Technical App Definition'
  | 'Client Proposal';

export interface Attachment {
  id: string;
  name: string;
  type: string;
  url: string; // Base64 or URL
}

export interface NoteComment {
  id: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: string;
  attachments?: Attachment[];
}

export interface ProjectNote {
  id: string;
  title: string;
  content: string;
  category: NoteCategory;
  createdAt: string;
  isApproved: boolean;
  comments: NoteComment[];
}

export interface ProjectStatusEntry {
  status: ProjectStatus;
  date: string; 
}

export type DevResourceType = 'aiStudio' | 'repository' | 'backend' | 'frontend';

export interface DevResource {
  url: string;
  comments: NoteComment[];
}

export enum IssueStatus {
  OPEN = 'OPEN',
  RESOLVED = 'RESOLVED'
}

export enum IssuePriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export interface IssueComment {
  id: string;
  userId: string;
  content: string;
  createdAt: string;
  isSystemGenerated: boolean;
}

export interface Issue {
  id: string;
  projectId: string;
  title: string;
  description: string;
  url: string | null;
  images: string[]; 
  status: IssueStatus;
  priority: IssuePriority;
  createdBy: string;
  createdAt: string;
  resolvedAt: string | null;
  resolvedBy: string | null;
  comments: IssueComment[];
}

export interface Deliverable {
  id: string;
  title: string;
  isCompleted: boolean;
}

export interface ProjectAsset {
  id: string;
  name: string;
  description: string;
  fileUrl?: string; // Base64 for this prototype
  fileName?: string;
  uploadedAt?: string;
  uploadedBy?: string;
  status: 'PENDING' | 'UPLOADED';
}

export interface Project {
  id: string;
  title: string;
  clientId: string;
  status: ProjectStatus;
  statusHistory: ProjectStatusEntry[];
  deadline: string; 
  budget: number;
  expenses: number;
  description?: string;
  descriptionAudio?: string; 
  notes: ProjectNote[];
  assignedDevId?: string;
  chats: Chat[];
  opalResult?: {
    fileName: string;
    content: string;
    uploadedAt: string;
  };
  apiSpecification?: {
    fileName: string;
    content: string; 
    uploadedAt: string;
  };
  devResources?: {
    aiStudio?: DevResource;
    repository?: DevResource;
    backend?: DevResource;
    frontend?: DevResource;
  };
  issues: Issue[];
  deliverables?: Deliverable[];
  assets: ProjectAsset[];
}

export interface Chat {
  id: string;
  title: string;
  messages: ChatMessage[];
}

export interface ChatMessage {
  id: string;
  authorId: string;
  authorName: string;
  content: string;
  timestamp: string;
}

export interface ImportedChatData {
  metadata?: { title?: string };
  messages: { role?: string; say?: string; content?: string; timestamp?: string }[];
}

export interface Invoice {
  id: string;
  projectId: string;
  clientId: string;
  amount: number;
  date: string;
  paid: boolean;
  type: 'ONE_TIME' | 'RECURRING';
}

export type ProposalStatus = 'DRAFT' | 'SENT' | 'SIGNED' | 'REJECTED';

export interface ProposalModule {
  id: string;
  name: string;
  description: string;
  price: number;
  estimatedHours: number;
}

export interface Proposal {
  id: string;
  clientId: string;
  title: string;
  status: ProposalStatus;
  modules: ProposalModule[];
  totalAmount: number;
  createdAt: string;
  expiresAt: string;
  signedAt?: string;
  signedBy?: string; // User ID
  
  // Extended fields based on Requirements Document
  context?: string;
  objectives?: string;
  audience?: string;
  problem?: string;
  designRequirements?: string;
  techRequirements?: string;
}

export type Language = 'en' | 'es';

export interface AppState {
  currentUser: User | null;
  users: User[];
  clients: Client[];
  projects: Project[];
  invoices: Invoice[];
  proposals: Proposal[];
  notifications: Notification[];
  theme: 'light' | 'dark';
  language: Language;
  isNewUser: boolean;
}

export type ViewMode = 'DASHBOARD' | 'PROJECTS' | 'FINANCE' | 'CLIENTS' | 'USERS' | 'PORTAL' | 'PROPOSALS' | 'APP_BUILDER';
