
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { AppState, User, Client, Project, Invoice, UserRole, ProjectStatus, Chat, ChatMessage, ProjectNote, NoteCategory, NoteComment, Attachment, ViewMode, DevResourceType, Issue, IssueStatus, Deliverable, Language, Notification, ProjectAsset, Proposal, ProposalModule, ProposalStatus, ImportedChatData } from '../types';
import { directus } from './directusClient';
import { readItems, readItem, createItem, updateItem, deleteItem, updateItems, readMe, registerUser } from '@directus/sdk';
import { useQuery } from '@tanstack/react-query';
import Swal from 'sweetalert2';
import toast from 'react-hot-toast';
import { translations } from '../translations';

import { v4 as uuidv4 } from 'uuid';

const generateId = () => uuidv4();

// Prices in COP (approximate conversion for software agency rates)
export const STANDARD_MODULES: ProposalModule[] = [
  { id: 'auth', name: 'Authentication System', description: 'Secure login, registration, password recovery, and session management with RBAC.', price: 4500000, estimatedHours: 40 },
  { id: 'payment', name: 'Payment Gateway', description: 'Stripe/PayPal/Wompi integration, subscription management, and invoicing system.', price: 6000000, estimatedHours: 60 },
  { id: 'dashboard', name: 'Analytics Dashboard', description: 'Interactive charts, data reporting, real-time stats, and export capabilities.', price: 8000000, estimatedHours: 70 },
  { id: 'cms', name: 'Content Management (CMS)', description: 'Dynamic content editing, media library, blog system, and SEO tools.', price: 5500000, estimatedHours: 50 },
  { id: 'chat', name: 'Real-time Chat System', description: 'Websockets-based messaging, file sharing, typing indicators, and history.', price: 9500000, estimatedHours: 85 },
  { id: 'ai', name: 'Gemini AI Integration', description: 'LLM integration for automated responses, content generation, and insights.', price: 12000000, estimatedHours: 100 },
  { id: 'mobile', name: 'Mobile Responsiveness', description: 'Fully adaptive design optimization for iOS and Android web views.', price: 3500000, estimatedHours: 30 },
  { id: 'api', name: 'Public API', description: 'RESTful API with Swagger documentation and rate limiting for third-party access.', price: 7000000, estimatedHours: 55 },
];

interface AppContextType extends AppState {
  currentView: ViewMode;
  activeProjectId: string | null;
  isLoading: boolean;
  authChecked: boolean;
  authError: string | null;
  t: typeof translations.en; 
  
  signIn: (email: string, pass: string) => Promise<void>;
  signUp: (
      email: string, 
      pass: string, 
      name: string, 
      role: UserRole, 
      clientData?: Omit<Client, 'id' | 'comments' | 'hasSupportPlan'>,
      projectData?: { title: string, description: string, deadline?: string, budget?: number, descriptionAudio?: string }
  ) => Promise<void>;
  resendVerification: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  completeOnboarding: () => void;

  toggleTheme: () => void;
  toggleLanguage: () => void;
  navigateTo: (view: ViewMode) => void;
  openProject: (projectId: string) => void;
  closeProject: () => void;
  addProject: (project: Omit<Project, 'id' | 'chats' | 'expenses' | 'notes' | 'statusHistory' | 'issues' | 'deliverables' | 'assets'>) => void;
  updateProjectStatus: (projectId: string, status: ProjectStatus) => void;
  updateProjectDescription: (projectId: string, description: string, audio?: string | null) => void;
  deleteProject: (projectId: string) => void;
  addProjectNote: (projectId: string, title: string, content: string, category: NoteCategory) => void;
  updateProjectNote: (projectId: string, noteId: string, title: string, content: string, category?: NoteCategory, isApproved?: boolean) => void;
  deleteProjectNote: (projectId: string, noteId: string) => void;
  approveProjectNote: (projectId: string, noteId: string) => void;
  addNoteComment: (projectId: string, noteId: string, content: string, attachments?: Attachment[]) => void;
  addClient: (client: Omit<Client, 'id'>) => void;
  updateClient: (client: Client) => void;
  deleteClient: (clientId: string) => void;
  addClientComment: (clientId: string, content: string) => void;
  toggleClientSupport: (clientId: string) => void;
  addInvoice: (invoice: Omit<Invoice, 'id'>) => void;
  createChat: (projectId: string, title: string) => void;
  addMessageToChat: (projectId: string, chatId: string, content: string) => void;
  importProjectChats: (projectId: string, importedData: ImportedChatData) => void;
  addOpalResult: (projectId: string, file: File) => void;
  addApiSpecification: (projectId: string, file: File) => void;
  updateDevResourceUrl: (projectId: string, resourceType: DevResourceType, url: string) => void;
  addDevResourceComment: (projectId: string, resourceType: DevResourceType, content: string) => void;
  
  addIssue: (projectId: string, issue: Omit<Issue, 'id' | 'createdAt' | 'resolvedAt' | 'resolvedBy' | 'comments' | 'projectId' | 'createdBy'>) => void;
  updateIssue: (projectId: string, issueId: string, updates: Partial<Issue>) => void;
  resolveIssue: (projectId: string, issueId: string) => void;
  reopenIssue: (projectId: string, issueId: string) => void;
  addIssueComment: (projectId: string, issueId: string, content: string) => void;
  deleteIssue: (projectId: string, issueId: string) => void;

  addDeliverable: (projectId: string, title: string) => void;
  toggleDeliverable: (projectId: string, deliverableId: string) => void;
  deleteDeliverable: (projectId: string, deliverableId: string) => void;

  addProjectAssetRequest: (projectId: string, name: string, description: string) => void;
  uploadProjectAsset: (projectId: string, assetId: string, file: File) => void;
  deleteProjectAsset: (projectId: string, assetId: string) => void;

  addUser: (user: Omit<User, 'id'> & { password?: string }) => void;
  updateUser: (user: User) => void;
  deleteUser: (userId: string) => void;

  addProposal: (proposal: Omit<Proposal, 'id' | 'createdAt' | 'status'>) => void;
  updateProposalStatus: (proposalId: string, status: ProposalStatus) => void;
  deleteProposal: (proposalId: string) => void;
  signProposal: (proposalId: string) => void;

  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const cleanProject = (p: Partial<Project>): Project => ({
    ...p,
    chats: p.chats || [],
    notes: p.notes || [],
    issues: p.issues || [],
    deliverables: p.deliverables || [],
    assets: p.assets || [],
    statusHistory: p.statusHistory || [],
    devResources: p.devResources || {}
} as Project);

const cleanClient = (c: Partial<Client>): Client => ({
    ...c,
    comments: c.comments || []
} as Client);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isNewUser, setIsNewUser] = useState(false);
  const getSystemTheme = (): 'light' | 'dark' => {
    const saved = localStorage.getItem('nux_theme') as 'light' | 'dark' | null;
    if (saved) return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  };
  const [theme, setTheme] = useState<'light' | 'dark'>(getSystemTheme);
  const [language, setLanguage] = useState<Language>('es');
  const [users, setUsers] = useState<User[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  
  const projectsRef = useRef(projects);
  const clientsRef = useRef(clients);
  const usersRef = useRef(users);

  useEffect(() => { projectsRef.current = projects; }, [projects]);
  useEffect(() => { clientsRef.current = clients; }, [clients]);
  useEffect(() => { usersRef.current = users; }, [users]);

  const [currentView, setCurrentView] = useState<ViewMode>('DASHBOARD');
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);

  useEffect(() => {
    // Theme is already initialized from getSystemTheme()

    const savedLang = localStorage.getItem('nux_lang') as Language;
    if (savedLang) setLanguage(savedLang);

    const init = async () => {
      try {
        const me = await directus.request(readMe({ fields: ['id', 'email'] }));
        if (me?.id) {
          await fetchUserProfile(me.id as string, me.email as string);
          await fetchNotifications(me.id as string);
        }
      } catch {
        setCurrentUser(null);
      } finally {
        setAuthChecked(true);
      }
    };

    init();
  }, []);

  const { data: globalData, error: globalError } = useQuery({
    queryKey: ['global-app-data'],
    queryFn: async () => {
      const [usersData, clientsData, projectsData, invoicesData, proposalsData] = await Promise.all([
        directus.request(readItems('users')),
        directus.request(readItems('clients')),
        directus.request(readItems('projects')),
        directus.request(readItems('invoices')),
        directus.request(readItems('proposals')),
      ]);
      return { usersData, clientsData, projectsData, invoicesData, proposalsData };
    },
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    if (globalData) {
      setUsers((globalData.usersData as any[] || []) as User[]);
      setClients((globalData.clientsData || []).map(cleanClient));
      setProjects((globalData.projectsData || []).map(cleanProject));
      setInvoices((globalData.invoicesData as any[] || []) as Invoice[]);
      setProposals((globalData.proposalsData as any[] || []) as Proposal[]);
      setIsLoading(false);
    }
  }, [globalData]);

  useEffect(() => {
    if (globalError) {
      console.error('Failed to load data', globalError);
      setIsLoading(false);
    }
  }, [globalError]);

  // Separate effect: re-poll notifications when currentUser changes
  useEffect(() => {
    if (!currentUser) return;
    const notifInterval = setInterval(() => fetchNotifications(currentUser.id), 30000);
    return () => clearInterval(notifInterval);
  }, [currentUser]);

  // Theme effect to apply class to document element
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('nux_theme', theme);
  }, [theme]);

  const fetchUserProfile = async (userId: string, email?: string) => {
    try {
      const profile = await directus.request(readItem('users', userId));
      if (profile) {
        setCurrentUser({ ...(profile as any), email: email || (profile as any).email || '' } as User);
      }
    } catch {
      // Profile doesn't exist yet — create it
      const authEmail = email || '';
      const newProfile = {
        id: userId,
        name: authEmail.split('@')[0] || 'User',
        role: UserRole.DEVELOPER,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(authEmail)}&background=random`
      };
      try {
        await directus.request(createItem('users', newProfile));
        setCurrentUser({ ...newProfile, email: authEmail });
        setUsers(prev => [...prev.filter(u => u.id !== userId), { ...newProfile, email: authEmail }]);
      } catch (e) {
        console.error('Could not create user profile', e);
        toast.error('Error al crear el perfil de usuario');
      }
    }
  };

  const fetchNotifications = async (userId: string) => {
    try {
      const data = await directus.request(readItems('notifications', {
        filter: { user_id: { _eq: userId } },
        sort: ['-created_at']
      }));
      setNotifications((data || []).map((n: { id: string; user_id: string; title: string; message: string; link?: string; is_read: boolean; created_at: string }) => ({
        id: n.id,
        userId: n.user_id,
        title: n.title,
        message: n.message,
        link: n.link,
        isRead: n.is_read,
        createdAt: n.created_at
      })));
    } catch (e) {
      console.error('Failed to fetch notifications', e);
      toast.error('Error al cargar notificaciones');
    }
  };

  const createNotification = async (targetUserId: string, title: string, message: string, link?: string) => {
    try { await directus.request(createItem('notifications', { user_id: targetUserId, title, message, link })); } catch {}
  };

  const notifyUsers = async (userIds: string[], title: string, message: string, link?: string) => {
    const targets = Array.from(new Set(userIds.filter(id => id !== currentUser?.id)));
    await Promise.all(targets.map(uid => directus.request(createItem('notifications', { user_id: uid, title, message, link })).catch(() => {})));
  };

  const markNotificationAsRead = async (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    try { await directus.request(updateItem('notifications', id, { is_read: true })); } catch {}
  };

  const markAllNotificationsAsRead = async () => {
    if (!currentUser) return;
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    try { await directus.request(updateItems('notifications', { filter: { user_id: { _eq: currentUser.id } } }, { is_read: true })); } catch {}
  };

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');
  const toggleLanguage = () => {
    const newLang = language === 'en' ? 'es' : 'en';
    setLanguage(newLang);
    localStorage.setItem('nux_lang', newLang);
  };

  const signIn = async (email: string, pass: string) => {
    setAuthError(null);
    try {
      await directus.login(email, pass);
      const me = await directus.request(readMe({ fields: ['id', 'email'] }));
      if (me?.id) {
        await fetchUserProfile(me.id as string, me.email as string);
        await fetchNotifications(me.id as string);
      }
    } catch (error: unknown) {
      setAuthError((error as Error).message || 'Login failed');
      toast.error('Error al iniciar sesión');
      throw error;
    }
  };

  const resendVerification = async (_email: string) => {
    // Directus doesn't have a direct resend-verification equivalent.
    // Configure email verification in Directus settings.
    console.warn('resendVerification: not supported in Directus.');
  };

  const signUp = async (
      email: string,
      pass: string,
      name: string,
      role: UserRole,
      clientData?: Omit<Client, 'id' | 'comments' | 'hasSupportPlan'>,
      projectData?: { title: string, description: string, deadline?: string, budget?: number, descriptionAudio?: string }
  ) => {
    setAuthError(null);
    try {
      // Requires "Allow Registration" enabled in Directus Settings > Project Settings
      await directus.request(registerUser(email, pass));
      await directus.login(email, pass);
      const me = await directus.request(readMe({ fields: ['id'] }));
      if (!me?.id) throw new Error('Registration failed');

      setIsNewUser(true);
      let newClientId: string | undefined;

      if (role === UserRole.CLIENT && clientData) {
        const newClient: Client = { ...clientData, id: generateId(), comments: [], hasSupportPlan: false };
        try {
          await directus.request(createItem('clients', newClient));
          newClientId = newClient.id;
          setClients(prev => [...prev, newClient]);
          if (projectData) {
            const newProject: Project = {
              id: generateId(), title: projectData.title, clientId: newClient.id,
              status: ProjectStatus.ANALYSIS,
              deadline: projectData.deadline || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              budget: projectData.budget || 0, description: projectData.description,
              descriptionAudio: projectData.descriptionAudio, expenses: 0,
              chats: [{ id: generateId(), title: 'General', messages: [] }],
              notes: [], statusHistory: [{ status: ProjectStatus.ANALYSIS, date: new Date().toISOString() }],
              issues: [], deliverables: [], assets: [], devResources: {}
            };
            await directus.request(createItem('projects', newProject));
            setProjects(prev => [...prev, newProject]);
          }
        } catch (e) { 
          console.error('Client/project creation error', e); 
          toast.error('Error al crear proyecto o cliente inicial');
        }
      }

      const profile = { id: me.id as string, name, role, clientId: newClientId, avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random` };
      try { await directus.request(createItem('users', profile)); } catch { await directus.request(updateItem('users', me.id as string, profile)); }
      setCurrentUser({ ...profile, email });
      await fetchNotifications(me.id as string);
    } catch (error: unknown) {
      setAuthError((error as Error).message || 'Registration failed');
      toast.error('Error en el registro');
      throw error;
    }
  };

  const logout = async () => {
    try { await directus.logout(); } catch {}
    setCurrentUser(null);
    setCurrentView('DASHBOARD');
    setActiveProjectId(null);
    setIsNewUser(false);
    setNotifications([]);
  };

  const completeOnboarding = () => setIsNewUser(false);
  const navigateTo = (view: ViewMode) => {
      setCurrentView(view);
      if (view !== 'PROJECTS') setActiveProjectId(null);
  };
  const openProject = (projectId: string) => {
      setActiveProjectId(projectId);
      setCurrentView('PROJECTS');
  };
  const closeProject = () => setActiveProjectId(null);

  const addProject = async (data: Omit<Project, 'id' | 'chats' | 'expenses' | 'notes' | 'statusHistory' | 'issues' | 'deliverables' | 'assets'>) => {
    const newProject: Project = {
      ...data,
      id: generateId(),
      chats: [{ id: generateId(), title: 'General', messages: [] }],
      expenses: 0,
      notes: [],
      assets: [],
      statusHistory: [{ status: data.status, date: new Date().toISOString() }],
      issues: [],
      deliverables: []
    };
    setProjects(prev => [...prev, newProject]);
    await directus.request(createItem('projects', newProject));
    
    // Notify admins
    const admins = usersRef.current.filter(u => u.role === UserRole.ADMIN).map(u => u.id);
    notifyUsers(admins, 'New Project Created', `A new project "${newProject.title}" has been added.`, `PROJECT:${newProject.id}`);
  };

  const updateProjectStatus = async (projectId: string, status: ProjectStatus) => {
    const project = projectsRef.current.find(p => p.id === projectId);
    if (!project) return;
    const updates = { status, statusHistory: [...(project.statusHistory || []), { status, date: new Date().toISOString() }] };
    setProjects(prev => prev.map(p => p.id === projectId ? { ...p, ...updates } : p));
    await directus.request(updateItem('projects', projectId, updates));

    // Notify Client
    const clientUsers = usersRef.current.filter(u => u.clientId === project.clientId).map(u => u.id);
    notifyUsers(clientUsers, 'Project Status Updated', `Project "${project.title}" is now in ${status}.`, `PROJECT:${project.id}`);
  };

  const updateProjectDescription = async (projectId: string, description: string, audio?: string | null) => {
    const updates: Partial<Project> = { description };
    if (audio !== undefined) updates.descriptionAudio = audio;
    setProjects(prev => prev.map(p => p.id === projectId ? { ...p, ...updates } : p));
    await directus.request(updateItem('projects', projectId, updates));
  };

  const deleteProject = async (projectId: string) => {
    setProjects(prev => prev.filter(p => p.id !== projectId));
    await directus.request(deleteItem('projects', projectId));
  };

  const addProjectNote = async (projectId: string, title: string, content: string, category: NoteCategory) => {
    const project = projectsRef.current.find(p => p.id === projectId);
    if (!project) return;
    const newNotes = [...(project.notes || []), { id: generateId(), title, content, category, createdAt: new Date().toISOString(), isApproved: false, comments: [] }];
    setProjects(prev => prev.map(p => p.id === projectId ? { ...p, notes: newNotes } : p));
    await directus.request(updateItem('projects', projectId, { notes: newNotes }));
  };

  const updateProjectNote = async (projectId: string, noteId: string, title: string, content: string, category?: NoteCategory, isApproved?: boolean) => {
    const project = projectsRef.current.find(p => p.id === projectId);
    if (!project) return;
    const newNotes = project.notes.map(n => n.id === noteId ? { ...n, title, content, category: category || n.category, isApproved: isApproved !== undefined ? isApproved : n.isApproved } : n);
    setProjects(prev => prev.map(p => p.id === projectId ? { ...p, notes: newNotes } : p));
    await directus.request(updateItem('projects', projectId, { notes: newNotes }));

    if (isApproved === true) {
        const admins = usersRef.current.filter(u => u.role === UserRole.ADMIN).map(u => u.id);
        notifyUsers(admins, 'Note Approved', `A note for "${project.title}" was approved.`, `PROJECT:${project.id}`);
    }
  };

  const deleteProjectNote = async (projectId: string, noteId: string) => {
    const project = projectsRef.current.find(p => p.id === projectId);
    if (!project) return;
    const newNotes = project.notes.filter(n => n.id !== noteId);
    setProjects(prev => prev.map(p => p.id === projectId ? { ...p, notes: newNotes } : p));
    await directus.request(updateItem('projects', projectId, { notes: newNotes }));
  };

  const approveProjectNote = async (projectId: string, noteId: string) => {
    const project = projectsRef.current.find(p => p.id === projectId);
    if (!project) return;
    const newNotes = project.notes.map(n => n.id === noteId ? { ...n, isApproved: true } : n);
    setProjects(prev => prev.map(p => p.id === projectId ? { ...p, notes: newNotes } : p));
    await directus.request(updateItem('projects', projectId, { notes: newNotes }));
    
    const admins = usersRef.current.filter(u => u.role === UserRole.ADMIN).map(u => u.id);
    notifyUsers(admins, 'Requirement Approved', `The client approved "${project.notes.find(n=>n.id===noteId)?.title}" on ${project.title}`, `PROJECT:${project.id}`);
  };

  const addNoteComment = async (projectId: string, noteId: string, content: string, attachments?: Attachment[]) => {
    if (!currentUser) return;
    const project = projectsRef.current.find(p => p.id === projectId);
    if (!project) return;
    const newNotes = project.notes.map(n => n.id === noteId ? { ...n, comments: [...(n.comments || []), { id: generateId(), authorId: currentUser.id, authorName: currentUser.name, content, createdAt: new Date().toISOString(), attachments: attachments || [] }] } : n);
    setProjects(prev => prev.map(p => p.id === projectId ? { ...p, notes: newNotes } : p));
    await directus.request(updateItem('projects', projectId, { notes: newNotes }));
  };

  const addClient = async (data: Omit<Client, 'id'>) => {
    const newClient: Client = { ...data, id: generateId() };
    setClients(prev => [...prev, newClient]);
    await directus.request(createItem('clients', newClient));
  };

  const updateClient = async (updatedClient: Client) => {
    setClients(prev => prev.map(c => c.id === updatedClient.id ? updatedClient : c));
    await directus.request(updateItem('clients', updatedClient.id, updatedClient));
  };

  const deleteClient = async (clientId: string) => {
    try {
      await directus.request(deleteItem('clients', clientId));
      setClients(prev => prev.filter(c => c.id !== clientId));
      setProjects(prev => prev.filter(p => p.clientId !== clientId));
      setInvoices(prev => prev.filter(i => i.clientId !== clientId));
      setUsers(prev => prev.filter(u => u.clientId !== clientId));
      setProposals(prev => prev.filter(p => p.clientId !== clientId));
    } catch (e) {
      console.error('Failed to delete client', e);
      toast.error('Error al eliminar cliente');
    }
  };

  const addClientComment = async (clientId: string, content: string) => {
    if (!currentUser) return;
    const client = clientsRef.current.find(c => c.id === clientId);
    if (!client) return;
    const newComments = [...(client.comments || []), { id: generateId(), authorId: currentUser.id, authorName: currentUser.name, content, createdAt: new Date().toISOString(), attachments: [] }];
    setClients(prev => prev.map(c => c.id === clientId ? { ...c, comments: newComments } : c));
    await directus.request(updateItem('clients', clientId, { comments: newComments }));
  };

  const toggleClientSupport = async (clientId: string) => {
    const client = clientsRef.current.find(c => c.id === clientId);
    if (!client) return;
    const newStatus = !client.hasSupportPlan;
    setClients(prev => prev.map(c => c.id === clientId ? { ...c, hasSupportPlan: newStatus } : c));
    await directus.request(updateItem('clients', clientId, { hasSupportPlan: newStatus }));
  };

  const addInvoice = async (data: Omit<Invoice, 'id'>) => {
    const newInvoice: Invoice = { ...data, id: generateId() };
    setInvoices(prev => [...prev, newInvoice]);
    await directus.request(createItem('invoices', newInvoice));

    // Notify Client
    const clientUsers = usersRef.current.filter(u => u.clientId === data.clientId).map(u => u.id);
    notifyUsers(clientUsers, 'New Invoice Generated', `A new invoice for $${data.amount.toLocaleString()} is available.`, `FINANCE`);
  };

  const createChat = async (projectId: string, title: string) => {
    const project = projectsRef.current.find(p => p.id === projectId);
    if (!project) return;
    const newChats = [...(project.chats || []), { id: generateId(), title, messages: [] }];
    setProjects(prev => prev.map(p => p.id === projectId ? { ...p, chats: newChats } : p));
    await directus.request(updateItem('projects', projectId, { chats: newChats }));
  };

  const addMessageToChat = async (projectId: string, chatId: string, content: string) => {
    if (!currentUser) return;
    const project = projectsRef.current.find(p => p.id === projectId);
    if (!project) return;
    const newChats = project.chats.map(c => c.id === chatId ? { ...c, messages: [...c.messages, { id: generateId(), authorId: currentUser.id, authorName: currentUser.name, content, timestamp: new Date().toISOString() }] } : c);
    setProjects(prev => prev.map(p => p.id === projectId ? { ...p, chats: newChats } : p));
    await directus.request(updateItem('projects', projectId, { chats: newChats }));
  };

  const importProjectChats = async (projectId: string, importedData: ImportedChatData) => {
    const project = projectsRef.current.find(p => p.id === projectId);
    if (!project) return;
    let importedChats: Chat[] = [];
    if (importedData && importedData.messages && Array.isArray(importedData.messages)) {
         importedChats.push({ id: generateId(), title: importedData.metadata?.title || `Imported Log`, messages: importedData.messages.map((m) => ({ id: generateId(), authorId: m.role ? m.role.toLowerCase() : 'external', authorName: m.role || 'Unknown', content: m.say || m.content || '', timestamp: m.timestamp || new Date().toISOString() })) });
    }
    if (importedChats.length > 0) {
      const newChats = [...(project.chats || []), ...importedChats];
      setProjects(prev => prev.map(p => p.id === projectId ? { ...p, chats: newChats } : p));
      await directus.request(updateItem('projects', projectId, { chats: newChats }));
    }
  };

  const addOpalResult = async (projectId: string, file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const opalResult = { fileName: file.name, content: e.target?.result as string, uploadedAt: new Date().toISOString() };
      setProjects(prev => prev.map(p => p.id === projectId ? { ...p, opalResult } : p));
      await directus.request(updateItem('projects', projectId, { opalResult }));
    };
    reader.readAsText(file);
  };

  const addApiSpecification = async (projectId: string, file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const apiSpecification = { fileName: file.name, content: e.target?.result as string, uploadedAt: new Date().toISOString() };
      setProjects(prev => prev.map(p => p.id === projectId ? { ...p, apiSpecification } : p));
      await directus.request(updateItem('projects', projectId, { apiSpecification }));
    };
    reader.readAsText(file);
  };

  const updateDevResourceUrl = async (projectId: string, resourceType: DevResourceType, url: string) => {
    const project = projectsRef.current.find(p => p.id === projectId);
    if (!project) return;
    const resources = project.devResources || {};
    const newResources = { ...resources, [resourceType]: { ...(resources[resourceType] || { url: '', comments: [] }), url } };
    setProjects(prev => prev.map(p => p.id === projectId ? { ...p, devResources: newResources } : p));
    await directus.request(updateItem('projects', projectId, { devResources: newResources }));
  };

  const addDevResourceComment = async (projectId: string, resourceType: DevResourceType, content: string) => {
    if (!currentUser) return;
    const project = projectsRef.current.find(p => p.id === projectId);
    if (!project) return;
    const resources = project.devResources || {};
    const resource = resources[resourceType] || { url: '', comments: [] };
    const newResources = { ...resources, [resourceType]: { ...resource, comments: [...resource.comments, { id: generateId(), authorId: currentUser.id, authorName: currentUser.name, content, createdAt: new Date().toISOString(), attachments: [] }] } };
    setProjects(prev => prev.map(p => p.id === projectId ? { ...p, devResources: newResources } : p));
    await directus.request(updateItem('projects', projectId, { devResources: newResources }));
  };

  const addIssue = async (projectId: string, issue: Omit<Issue, 'id' | 'createdAt' | 'resolvedAt' | 'resolvedBy' | 'comments' | 'projectId' | 'createdBy'>) => {
    if (!currentUser) return;
    const project = projectsRef.current.find(p => p.id === projectId);
    if (!project) return;
    const newIssues = [{ ...issue, id: generateId(), projectId, createdAt: new Date().toISOString(), createdBy: currentUser.id, resolvedAt: null, resolvedBy: null, comments: [] }, ...(project.issues || [])];
    setProjects(prev => prev.map(p => p.id === projectId ? { ...p, issues: newIssues } : p));
    await directus.request(updateItem('projects', projectId, { issues: newIssues }));

    // Notify Developers if Admin created, or Admin if Client created
    const targets = [];
    if (currentUser.role === UserRole.ADMIN) {
        if (project.assignedDevId) targets.push(project.assignedDevId);
    } else if (currentUser.role === UserRole.CLIENT) {
        const admins = usersRef.current.filter(u => u.role === UserRole.ADMIN).map(u=>u.id);
        targets.push(...admins);
        if (project.assignedDevId) targets.push(project.assignedDevId);
    }
    notifyUsers(targets, 'New Issue Reported', `"${issue.title}" reported on ${project.title}.`, `PROJECT:${project.id}`);
  };

  const updateIssue = async (projectId: string, issueId: string, updates: Partial<Issue>) => {
    const project = projectsRef.current.find(p => p.id === projectId);
    if (!project) return;
    const newIssues = project.issues.map(i => i.id === issueId ? { ...i, ...updates } : i);
    setProjects(prev => prev.map(p => p.id === projectId ? { ...p, issues: newIssues } : p));
    await directus.request(updateItem('projects', projectId, { issues: newIssues }));
  };

  const resolveIssue = async (projectId: string, issueId: string) => {
    if (!currentUser) return;
    const project = projectsRef.current.find(p => p.id === projectId);
    if (!project) return;
    const newIssues = project.issues.map(i => i.id === issueId ? { ...i, status: IssueStatus.RESOLVED, resolvedAt: new Date().toISOString(), resolvedBy: currentUser.id, comments: [...i.comments, { id: generateId(), userId: currentUser.id, content: `Issue marked as resolved`, createdAt: new Date().toISOString(), isSystemGenerated: true }] } : i);
    setProjects(prev => prev.map(p => p.id === projectId ? { ...p, issues: newIssues } : p));
    await directus.request(updateItem('projects', projectId, { issues: newIssues }));

    // Notify Reporter
    const issue = project.issues.find(i => i.id === issueId);
    if (issue) notifyUsers([issue.createdBy], 'Issue Resolved', `"${issue.title}" has been marked as resolved.`, `PROJECT:${project.id}`);
  };

  const reopenIssue = async (projectId: string, issueId: string) => {
    const project = projectsRef.current.find(p => p.id === projectId);
    if (!project) return;
    const newIssues = project.issues.map(i => i.id === issueId ? { ...i, status: IssueStatus.OPEN, resolvedAt: null, resolvedBy: null } : i);
    setProjects(prev => prev.map(p => p.id === projectId ? { ...p, issues: newIssues } : p));
    await directus.request(updateItem('projects', projectId, { issues: newIssues }));
  };

  const addIssueComment = async (projectId: string, issueId: string, content: string) => {
    if (!currentUser) return;
    const project = projectsRef.current.find(p => p.id === projectId);
    if (!project) return;
    const newIssues = project.issues.map(i => i.id === issueId ? { ...i, comments: [...(i.comments || []), { id: generateId(), userId: currentUser.id, content, createdAt: new Date().toISOString(), isSystemGenerated: false }] } : i);
    setProjects(prev => prev.map(p => p.id === projectId ? { ...p, issues: newIssues } : p));
    await directus.request(updateItem('projects', projectId, { issues: newIssues }));
  };

  const deleteIssue = async (projectId: string, issueId: string) => {
    const project = projectsRef.current.find(p => p.id === projectId);
    if (!project) return;
    const newIssues = project.issues.filter(i => i.id !== issueId);
    setProjects(prev => prev.map(p => p.id === projectId ? { ...p, issues: newIssues } : p));
    await directus.request(updateItem('projects', projectId, { issues: newIssues }));
  };

  const addDeliverable = async (projectId: string, title: string) => {
    const project = projectsRef.current.find(p => p.id === projectId);
    if (!project) return;
    const newDeliverables = [...(project.deliverables || []), { id: generateId(), title, isCompleted: false }];
    setProjects(prev => prev.map(p => p.id === projectId ? { ...p, deliverables: newDeliverables } : p));
    await directus.request(updateItem('projects', projectId, { deliverables: newDeliverables }));
  };

  const toggleDeliverable = async (projectId: string, deliverableId: string) => {
    const project = projectsRef.current.find(p => p.id === projectId);
    if (!project) return;
    const newDeliverables = (project.deliverables || []).map(d => d.id === deliverableId ? { ...d, isCompleted: !d.isCompleted } : d);
    setProjects(prev => prev.map(p => p.id === projectId ? { ...p, deliverables: newDeliverables } : p));
    await directus.request(updateItem('projects', projectId, { deliverables: newDeliverables }));
  };

  const deleteDeliverable = async (projectId: string, deliverableId: string) => {
    const project = projectsRef.current.find(p => p.id === projectId);
    if (!project) return;
    const newDeliverables = (project.deliverables || []).filter(d => d.id !== deliverableId);
    setProjects(prev => prev.map(p => p.id === projectId ? { ...p, deliverables: newDeliverables } : p));
    await directus.request(updateItem('projects', projectId, { deliverables: newDeliverables }));
  };

  const addProjectAssetRequest = async (projectId: string, name: string, description: string) => {
    const project = projectsRef.current.find(p => p.id === projectId);
    if (!project) return;
    // Fix status literal widening by explicitly typing newAssets array
    const newAssets: ProjectAsset[] = [...(project.assets || []), { id: generateId(), name, description, status: 'PENDING' }];
    setProjects(prev => prev.map(p => p.id === projectId ? { ...p, assets: newAssets } : p));
    await directus.request(updateItem('projects', projectId, { assets: newAssets }));

    // Notify Client
    const clientUsers = usersRef.current.filter(u => u.clientId === project.clientId).map(u => u.id);
    notifyUsers(clientUsers, 'Document Request', `A new file "${name}" has been requested for ${project.title}.`, `PROJECT:${project.id}`);
  };

  const uploadProjectAsset = async (projectId: string, assetId: string, file: File) => {
    if (!currentUser) return;
    const project = projectsRef.current.find(p => p.id === projectId);
    if (!project) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
        const fileUrl = e.target?.result as string;
        // Fix status literal widening by explicitly typing newAssets array
        const newAssets: ProjectAsset[] = project.assets.map(a => a.id === assetId ? { 
            ...a, 
            fileUrl, 
            fileName: file.name, 
            uploadedAt: new Date().toISOString(), 
            uploadedBy: currentUser.name,
            status: 'UPLOADED' 
        } : a);
        setProjects(prev => prev.map(p => p.id === projectId ? { ...p, assets: newAssets } : p));
        await directus.request(updateItem('projects', projectId, { assets: newAssets }));

        // Notify Internal Team
        const admins = usersRef.current.filter(u => u.role === UserRole.ADMIN).map(u=>u.id);
        const targets = [...admins];
        if (project.assignedDevId) targets.push(project.assignedDevId);
        notifyUsers(targets, 'File Uploaded', `Client uploaded ${file.name} for ${project.title}.`, `PROJECT:${project.id}`);
    };
    reader.readAsDataURL(file);
  };

  const deleteProjectAsset = async (projectId: string, assetId: string) => {
    const project = projectsRef.current.find(p => p.id === projectId);
    if (!project) return;
    const newAssets = project.assets.filter(a => a.id !== assetId);
    setProjects(prev => prev.map(p => p.id === projectId ? { ...p, assets: newAssets } : p));
    await directus.request(updateItem('projects', projectId, { assets: newAssets }));
  };

  const addUser = async (userData: Omit<User, 'id'> & { password?: string }) => {
    const { password, ...fullProfileData } = userData;
    const { email, ...dbProfileData } = fullProfileData;
    const newUser: User = { ...fullProfileData, id: generateId(), avatar: fullProfileData.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(fullProfileData.name)}&background=random` };
    setUsers(prev => [...prev, newUser]);
    await directus.request(createItem('users', { ...dbProfileData, id: newUser.id, avatar: newUser.avatar }));
  };

  const updateUser = async (userData: User) => {
    const oldUser = usersRef.current.find(u => u.id === userData.id);
    const { email, ...dbUserData } = userData; 
    setUsers(prev => prev.map(u => u.id === userData.id ? userData : u));
    await directus.request(updateItem('users', userData.id, dbUserData));
  };

  const deleteUser = async (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user && user.role === UserRole.CLIENT && user.clientId) {
        await directus.request(deleteItem('clients', user.clientId));
    }
    setUsers(prev => prev.filter(u => u.id !== userId));
    await directus.request(deleteItem('users', userId));
  };

  const addProposal = async (proposal: Omit<Proposal, 'id' | 'createdAt' | 'status'>) => {
    const newProposal: Proposal = {
      ...proposal,
      id: generateId(),
      status: 'DRAFT',
      createdAt: new Date().toISOString()
    };
    setProposals(prev => [...prev, newProposal]);
    await directus.request(createItem('proposals', newProposal));
  };

  const updateProposalStatus = async (proposalId: string, status: ProposalStatus) => {
    setProposals(prev => prev.map(p => p.id === proposalId ? { ...p, status } : p));
    await directus.request(updateItem('proposals', proposalId, { status }));
    
    if (status === 'SENT') {
        const proposal = proposals.find(p => p.id === proposalId);
        if (proposal) {
            const clientUsers = usersRef.current.filter(u => u.clientId === proposal.clientId).map(u => u.id);
            notifyUsers(clientUsers, 'New Proposal', `You have received a new proposal: "${proposal.title}".`, `PROPOSALS`);
        }
    }
  };

  const signProposal = async (proposalId: string) => {
    if (!currentUser) return;
    const signedAt = new Date().toISOString();
    setProposals(prev => prev.map(p => p.id === proposalId ? { ...p, status: 'SIGNED', signedAt, signedBy: currentUser.id } : p));
    await directus.request(updateItem('proposals', proposalId, { status: 'SIGNED', signedAt, signedBy: currentUser.id }));
    
    // Convert to Project automatically? For now just notify admin
    const proposal = proposals.find(p => p.id === proposalId);
    if (proposal) {
        const admins = usersRef.current.filter(u => u.role === UserRole.ADMIN).map(u => u.id);
        notifyUsers(admins, 'Proposal Signed', `Client signed the proposal "${proposal.title}".`, `PROPOSALS`);
    }
  };

  const deleteProposal = async (proposalId: string) => {
    setProposals(prev => prev.filter(p => p.id !== proposalId));
    await directus.request(deleteItem('proposals', proposalId));
  };

  return (
    <AppContext.Provider value={{
      currentUser, users, clients, projects, invoices, proposals, notifications, theme, language, isLoading, authChecked, authError, isNewUser, t: translations[language],
      currentView, activeProjectId,
      signIn, signUp, resendVerification, logout, completeOnboarding, toggleTheme, toggleLanguage,
      navigateTo, openProject, closeProject,
      addProject, updateProjectStatus, updateProjectDescription, deleteProject, addProjectNote, updateProjectNote, deleteProjectNote, approveProjectNote, addNoteComment,
      addClient, updateClient, deleteClient, addClientComment, toggleClientSupport, addInvoice, 
      createChat, addMessageToChat, importProjectChats, addOpalResult, addApiSpecification,
      updateDevResourceUrl, addDevResourceComment,
      addIssue, updateIssue, resolveIssue, reopenIssue, addIssueComment, deleteIssue,
      addDeliverable, toggleDeliverable, deleteDeliverable,
      addProjectAssetRequest, uploadProjectAsset, deleteProjectAsset,
      addUser, updateUser, deleteUser,
      addProposal, updateProposalStatus, deleteProposal, signProposal,
      markNotificationAsRead, markAllNotificationsAsRead
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
};
