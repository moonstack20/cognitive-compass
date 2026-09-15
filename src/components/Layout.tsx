import { useState, type ReactNode } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  Compass, LayoutDashboard, FilePlus2, FileSearch, Library,
  BarChart3, Settings, LogOut, Menu, X, User,
} from 'lucide-react';

export type Page =
  | 'dashboard'
  | 'create-assessment'
  | 'analyze-existing'
  | 'existing-papers'
  | 'question-bank'
  | 'assessments'
  | 'reports'
  | 'settings';

interface LayoutProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  children: ReactNode;
}

const navItems: { id: Page; label: string; icon: typeof Compass }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'create-assessment', label: 'Create Assessment', icon: FilePlus2 },
  { id: 'analyze-existing', label: 'Analyze Existing Paper', icon: FileSearch },
  { id: 'existing-papers', label: 'Existing Papers', icon: FileSearch },
  { id: 'question-bank', label: 'Question Bank', icon: Library },
  { id: 'assessments', label: 'Assessments', icon: Compass },
  { id: 'reports', label: 'Reports', icon: BarChart3 },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export function Layout({ currentPage, onNavigate, children }: LayoutProps) {
  const { profile, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-ivory-50">
      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen w-64 bg-beige-50 border-r border-beige-200 flex flex-col z-40 transition-transform duration-300 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Logo */}
        <div className="px-5 py-5 border-b border-beige-200">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-sage-500 flex items-center justify-center">
              <Compass size={20} className="text-white" />
            </div>
            <div>
              <h1 className="font-serif font-bold text-charcoal-700 text-base leading-tight">Cognitive Compass</h1>
              <p className="text-[10px] text-charcoal-400 leading-tight">Assessment Intelligence</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  setMobileOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium mb-1 transition-all duration-200 ${
                  active
                    ? 'bg-sage-100 text-sage-700 border border-sage-200'
                    : 'text-charcoal-500 hover:bg-beige-100 hover:text-charcoal-600 border border-transparent'
                }`}
              >
                <Icon size={18} className={active ? 'text-sage-600' : 'text-charcoal-400'} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Profile */}
        <div className="p-3 border-t border-beige-200">
          <div className="flex items-center gap-2.5 px-2 py-2">
            <div className="w-8 h-8 rounded-full bg-terracotta-200 flex items-center justify-center">
              <User size={16} className="text-terracotta-700" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-charcoal-600 truncate">{profile?.full_name || 'Teacher'}</p>
              <p className="text-[10px] text-charcoal-400 truncate">{profile?.institution || 'Institution'}</p>
            </div>
          </div>
          <button
            onClick={() => signOut()}
            className="w-full flex items-center gap-2 px-3 py-2 mt-1 rounded-lg text-sm text-charcoal-400 hover:bg-terracotta-50 hover:text-terracotta-600 transition-colors"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-charcoal-900/30 z-30 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Main content */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-beige-50 border-b border-beige-200 sticky top-0 z-20">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-sage-500 flex items-center justify-center">
              <Compass size={18} className="text-white" />
            </div>
            <span className="font-serif font-bold text-charcoal-700">Cognitive Compass</span>
          </div>
          <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2 text-charcoal-500 hover:bg-beige-100 rounded-lg">
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </header>

        <main className="flex-1 p-4 lg:p-8 max-w-7xl mx-auto w-full">{children}</main>
      </div>
    </div>
  );
}
