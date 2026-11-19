import React, { useState, useEffect, useMemo } from 'react';
import { 
  TeamMember, 
  Client, 
  Deal, 
  Task, 
  Quote, 
  UserRole,
  Project,
  CatalogProduct
} from './types';
import { 
  initialTeamMembers, 
  initialClients, 
  initialDeals, 
  initialTasks, 
  initialQuotes, 
  initialProjects,
  initialCatalogProducts,
  companyInfo 
} from './data/initialData';
import { calculateValidUntil15Days, formatQuoteAuthorName } from './utils/pdfGenerator';
import { Header } from './components/Header';
import { Sidebar, NavTab } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { ClientsView } from './components/ClientsView';
import { SalesPipelineView } from './components/SalesPipelineView';
import { TasksView } from './components/TasksView';
import { TeamProgressView } from './components/TeamProgressView';
import { QuotationsView } from './components/QuotationsView';
import { ProjectsView } from './components/ProjectsView';
import { ContentManagerView } from './components/ContentManagerView';
import { StoreView } from './components/StoreView';
import { LoginView } from './components/LoginView';

const STORAGE_KEYS = {
  CLIENTS: 'rawi_crm_clients',
  DEALS: 'rawi_crm_deals',
  TASKS: 'rawi_crm_tasks',
  QUOTES: 'rawi_crm_quotes',
  PROJECTS: 'rawi_crm_projects',
  MEMBERS: 'rawi_crm_team_members',
  CURRENT_USER_ID: 'rawi_crm_current_user_id',
  IS_LOGGED_IN: 'rawi_crm_is_authenticated',
  STORE_PRODUCTS: 'rawi_crm_store_products',
};

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.IS_LOGGED_IN);
      return saved === 'true';
    } catch {
      return false;
    }
  });

  // Load data from localStorage or fallback to initial realistic datasets
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.MEMBERS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Normalize legacy roles (e.g. 'team_member' -> 'colaborador')
          const normalized: TeamMember[] = parsed.map((m: any) => ({
            ...m,
            role: m.role === 'team_member' ? 'colaborador' : (m.role || 'colaborador'),
          }));
          // Ensure all default demo members exist so quick login has all 4 roles
          initialTeamMembers.forEach((initM) => {
            if (!normalized.some((m) => m.id === initM.id)) {
              normalized.push(initM);
            }
          });
          return normalized;
        }
      }
      return initialTeamMembers;
    } catch {
      return initialTeamMembers;
    }
  });

  const [currentUserId, setCurrentUserId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID);
      return saved || initialTeamMembers[0].id;
    } catch {
      return initialTeamMembers[0].id;
    }
  });

  const [clients, setClients] = useState<Client[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CLIENTS);
      return saved ? JSON.parse(saved) : initialClients;
    } catch {
      return initialClients;
    }
  });

  const [deals, setDeals] = useState<Deal[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.DEALS);
      return saved ? JSON.parse(saved) : initialDeals;
    } catch {
      return initialDeals;
    }
  });

  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TASKS);
      return saved ? JSON.parse(saved) : initialTasks;
    } catch {
      return initialTasks;
    }
  });

  const [quotes, setQuotes] = useState<Quote[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.QUOTES);
      const parsed: Quote[] = saved ? JSON.parse(saved) : initialQuotes;
      return parsed.map((q) => ({
        ...q,
        validUntil: calculateValidUntil15Days(q.createdAt),
        createdBy: formatQuoteAuthorName(q.createdBy),
      }));
    } catch {
      return initialQuotes;
    }
  });

  const [projects, setProjects] = useState<Project[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PROJECTS);
      return saved ? JSON.parse(saved) : initialProjects;
    } catch {
      return initialProjects;
    }
  });

  const [catalogProducts, setCatalogProducts] = useState<CatalogProduct[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.STORE_PRODUCTS);
      return saved ? JSON.parse(saved) : initialCatalogProducts;
    } catch {
      return initialCatalogProducts;
    }
  });

  const [preselectedProductForQuote, setPreselectedProductForQuote] = useState<CatalogProduct | null>(null);
  const [selectedClientForContentManager, setSelectedClientForContentManager] = useState<Client | null>(null);

  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');

  // Persistence to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(teamMembers));
  }, [teamMembers]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, currentUserId);
  }, [currentUserId]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(clients));
  }, [clients]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.DEALS, JSON.stringify(deals));
  }, [deals]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.QUOTES, JSON.stringify(quotes));
  }, [quotes]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.STORE_PRODUCTS, JSON.stringify(catalogProducts));
  }, [catalogProducts]);

  // Current active user
  const rawCurrentUser = teamMembers.find(m => m.id === currentUserId) || teamMembers[0] || initialTeamMembers[0];
  const currentUser: TeamMember = useMemo(() => ({
    ...rawCurrentUser,
    role: (rawCurrentUser.role as any) === 'team_member' ? 'colaborador' : (rawCurrentUser.role || 'colaborador'),
  }), [rawCurrentUser]);
  const currentRole: UserRole = currentUser.role || 'colaborador';

  // Handlers for Clients
  const handleAddClient = (clientData: Omit<Client, 'id' | 'createdAt'>) => {
    const newClient: Client = {
      ...clientData,
      id: `cli-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setClients(prev => [newClient, ...prev]);
  };

  const handleUpdateClient = (updatedClient: Client) => {
    setClients(prev => prev.map(c => c.id === updatedClient.id ? updatedClient : c));
  };

  const handleDeleteClient = (id: string) => {
    setClients(prev => prev.filter(c => c.id !== id));
  };

  // Handlers for Deals
  const handleAddDeal = (dealData: Omit<Deal, 'id' | 'updatedAt'>) => {
    const newDeal: Deal = {
      ...dealData,
      id: `deal-${Date.now()}`,
      updatedAt: new Date().toISOString().split('T')[0],
    };
    setDeals(prev => [newDeal, ...prev]);
  };

  const handleUpdateDealStage = (dealId: string, newStage: Deal['stage']) => {
    setDeals(prev => prev.map(d => {
      if (d.id === dealId) {
        return {
          ...d,
          stage: newStage,
          updatedAt: new Date().toISOString().split('T')[0],
        };
      }
      return d;
    }));
  };

  const handleDeleteDeal = (dealId: string) => {
    setDeals(prev => prev.filter(d => d.id !== dealId));
  };

  // Handlers for Tasks (Real-time tracking)
  const handleAddTask = (taskData: Omit<Task, 'id' | 'createdAt'>) => {
    const newTask: Task = {
      ...taskData,
      id: `task-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setTasks(prev => [newTask, ...prev]);
  };

  const handleUpdateTask = (updatedTask: Task) => {
    setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
  };

  // Handlers for Quotes (Admin-only)
  const handleAddQuote = (quoteData: Omit<Quote, 'id'>) => {
    const newQuote: Quote = {
      ...quoteData,
      id: `quote-${Date.now()}`,
      validUntil: calculateValidUntil15Days(quoteData.createdAt),
      createdBy: formatQuoteAuthorName(quoteData.createdBy || currentUser.name),
    };
    setQuotes(prev => [newQuote, ...prev]);
  };

  const handleUpdateQuote = (updatedQuote: Quote) => {
    const normalizedQuote: Quote = {
      ...updatedQuote,
      validUntil: calculateValidUntil15Days(updatedQuote.createdAt),
      createdBy: formatQuoteAuthorName(updatedQuote.createdBy || currentUser.name),
    };
    setQuotes(prev => prev.map(q => q.id === normalizedQuote.id ? normalizedQuote : q));
  };

  const handleDeleteQuote = (quoteId: string) => {
    setQuotes(prev => prev.filter(q => q.id !== quoteId));
  };

  // Handlers for Projects
  const handleAddProject = (projectData: Omit<Project, 'id' | 'createdAt'>) => {
    const newProject: Project = {
      ...projectData,
      id: `prj-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setProjects(prev => [newProject, ...prev]);
  };

  const handleUpdateProject = (updatedProject: Project) => {
    setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
  };

  const handleDeleteProject = (projectId: string) => {
    setProjects(prev => prev.filter(p => p.id !== projectId));
  };

  // Handlers for Tienda / Catálogo de Productos y Servicios
  const handleAddCatalogProduct = (productData: Omit<CatalogProduct, 'id' | 'createdAt'>) => {
    const newProduct: CatalogProduct = {
      ...productData,
      id: `prod-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setCatalogProducts(prev => [newProduct, ...prev]);
  };

  const handleUpdateCatalogProduct = (updatedProduct: CatalogProduct) => {
    setCatalogProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
  };

  const handleDeleteCatalogProduct = (productId: string) => {
    setCatalogProducts(prev => prev.filter(p => p.id !== productId));
  };

  // Handlers for Team Members
  const handleAddTeamMember = (memberData: Omit<TeamMember, 'id'>) => {
    const newMember: TeamMember = {
      ...memberData,
      id: `user-${Date.now()}`,
    };
    setTeamMembers(prev => [...prev, newMember]);
  };

  const handleUpdateTeamMember = (updatedMember: TeamMember) => {
    setTeamMembers(prev => prev.map(m => (m.id === updatedMember.id ? updatedMember : m)));
  };

  const handleDeleteTeamMember = (memberId: string) => {
    if (memberId === currentUserId) return;
    setTeamMembers(prev => prev.filter(m => m.id !== memberId));
  };

  const handleLogin = (user: TeamMember) => {
    setCurrentUserId(user.id);
    setIsAuthenticated(true);
    localStorage.setItem(STORAGE_KEYS.IS_LOGGED_IN, 'true');
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, user.id);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem(STORAGE_KEYS.IS_LOGGED_IN);
  };

  // Reset to initial demo data
  const handleResetData = () => {
    if (window.confirm('¿Deseas restablecer todos los clientes, ventas, tareas, cotizaciones, proyectos y catálogo de tienda a los datos iniciales?')) {
      localStorage.clear();
      setTeamMembers(initialTeamMembers);
      setCurrentUserId(initialTeamMembers[0].id);
      setClients(initialClients);
      setDeals(initialDeals);
      setTasks(initialTasks);
      setQuotes(initialQuotes);
      setProjects(initialProjects);
      setCatalogProducts(initialCatalogProducts);
      setPreselectedProductForQuote(null);
      setIsAuthenticated(true);
      setCurrentTab('dashboard');
    }
  };

  const pendingTasksCount = tasks.filter(t => t.status !== 'completed').length;

  // If not authenticated, render Login page
  if (!isAuthenticated) {
    return (
      <LoginView
        teamMembers={teamMembers}
        onLogin={handleLogin}
        onRegisterMember={handleAddTeamMember}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased selection:bg-blue-600 selection:text-white">
      {/* Top Header with Role Simulator */}
      <Header
        currentRole={currentRole}
        currentUser={currentUser}
        teamMembers={teamMembers}
        onSelectUser={(user) => setCurrentUserId(user.id)}
        onResetData={handleResetData}
        activeTasksCount={pendingTasksCount}
        onLogout={handleLogout}
      />

      {/* Main Body */}
      <div className="flex-1 flex flex-col md:flex-row w-full mx-auto">
        {/* Navigation Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          currentRole={currentRole}
          currentUser={currentUser}
          pendingTasksCount={pendingTasksCount}
          quotesCount={quotes.length}
          projectsCount={projects.length}
          productsCount={catalogProducts.length}
          onLogout={handleLogout}
        />

        {/* Dynamic Content View */}
        <main className="flex-1 p-4 sm:p-5 lg:p-6 min-w-0 overflow-y-auto bg-slate-50">
          {currentTab === 'dashboard' && (
            <DashboardView
              clients={clients}
              deals={deals}
              tasks={tasks}
              quotes={quotes}
              teamMembers={teamMembers}
              currentRole={currentRole}
              currentUser={currentUser}
              onNavigate={(tab) => setCurrentTab(tab as NavTab)}
            />
          )}

          {currentTab === 'store' && (
            <StoreView
              products={catalogProducts}
              currentRole={currentRole}
              currentUser={currentUser}
              onAddProduct={handleAddCatalogProduct}
              onUpdateProduct={handleUpdateCatalogProduct}
              onDeleteProduct={handleDeleteCatalogProduct}
              onSelectForQuotation={(product) => {
                setPreselectedProductForQuote(product);
                setCurrentTab('quotes');
              }}
            />
          )}

          {currentTab === 'clients' && (
            <ClientsView
              clients={clients}
              teamMembers={teamMembers}
              currentRole={currentRole}
              currentUser={currentUser}
              deals={deals}
              quotes={quotes}
              projects={projects}
              tasks={tasks}
              companyInfo={companyInfo}
              catalogProducts={catalogProducts}
              onAddClient={handleAddClient}
              onUpdateClient={handleUpdateClient}
              onDeleteClient={handleDeleteClient}
              onSelectClientForTask={() => {
                setCurrentTab('tasks');
              }}
              onNavigate={(tab) => setCurrentTab(tab as NavTab)}
              onSelectClientForContentManager={(client) => {
                setSelectedClientForContentManager(client);
                setCurrentTab('content_manager');
              }}
              onAddQuote={handleAddQuote}
              onUpdateQuote={handleUpdateQuote}
              onDeleteQuote={handleDeleteQuote}
            />
          )}

          {currentTab === 'content_manager' && (
            <ContentManagerView
              clients={clients}
              teamMembers={teamMembers}
              currentUser={currentUser}
              currentRole={currentRole}
              onAddTask={handleAddTask}
              onNavigate={(tab) => setCurrentTab(tab as NavTab)}
              selectedClientFromExternal={selectedClientForContentManager}
              onClearSelectedClientFromExternal={() => setSelectedClientForContentManager(null)}
            />
          )}

          {currentTab === 'projects' && (
            <ProjectsView
              projects={projects}
              clients={clients}
              teamMembers={teamMembers}
              currentRole={currentRole}
              currentUser={currentUser}
              onAddProject={handleAddProject}
              onUpdateProject={handleUpdateProject}
              onDeleteProject={handleDeleteProject}
            />
          )}

          {currentTab === 'pipeline' && (
            <SalesPipelineView
              deals={deals}
              clients={clients}
              teamMembers={teamMembers}
              currentRole={currentRole}
              currentUser={currentUser}
              onAddDeal={handleAddDeal}
              onUpdateDealStage={handleUpdateDealStage}
              onDeleteDeal={handleDeleteDeal}
            />
          )}

          {currentTab === 'tasks' && (
            <TasksView
              tasks={tasks}
              teamMembers={teamMembers}
              clients={clients}
              currentRole={currentRole}
              currentUser={currentUser}
              onAddTask={handleAddTask}
              onUpdateTask={handleUpdateTask}
              onDeleteTask={handleDeleteTask}
            />
          )}

          {currentTab === 'team' && (
            <TeamProgressView
              teamMembers={teamMembers}
              tasks={tasks}
              deals={deals}
              clients={clients}
              currentRole={currentRole}
              currentUser={currentUser}
              onAddTask={handleAddTask}
              onUpdateTask={handleUpdateTask}
              onAddTeamMember={handleAddTeamMember}
              onUpdateTeamMember={handleUpdateTeamMember}
              onDeleteTeamMember={handleDeleteTeamMember}
            />
          )}

          {currentTab === 'quotes' && (
            <QuotationsView
              quotes={quotes}
              clients={clients}
              companyInfo={companyInfo}
              currentRole={currentRole}
              currentUser={currentUser}
              catalogProducts={catalogProducts}
              initialPreselectedProduct={preselectedProductForQuote}
              onClearPreselectedProduct={() => setPreselectedProductForQuote(null)}
              onSelectAdminUser={() => {
                const adminUser = teamMembers.find(m => m.role === 'admin') || teamMembers[0];
                setCurrentUserId(adminUser.id);
              }}
              onAddQuote={handleAddQuote}
              onUpdateQuote={handleUpdateQuote}
              onDeleteQuote={handleDeleteQuote}
            />
          )}
        </main>
      </div>
    </div>
  );
}
