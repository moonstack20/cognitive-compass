import { useState } from 'react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { Layout, type Page } from '@/components/Layout';
import { AuthPage } from '@/pages/Auth';
import { Dashboard } from '@/pages/Dashboard';
import { CreateAssessment } from '@/pages/CreateAssessment';
import { AnalyzeExisting } from '@/pages/AnalyzeExisting';
import { QuestionBank } from '@/pages/QuestionBank';
import { Assessments } from '@/pages/Assessments';
import { Reports } from '@/pages/Reports';
import { Settings } from '@/pages/Settings';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

function AppContent() {
  const { session, loading } = useAuth();
  const [page, setPage] = useState<Page>('dashboard');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ivory-50">
        <LoadingSpinner size={32} label="Loading Cognitive Compass..." />
      </div>
    );
  }

  if (!session) {
    return <AuthPage />;
  }

  return (
    <Layout currentPage={page} onNavigate={setPage}>
      {page === 'dashboard' && <Dashboard onNavigate={setPage} />}
      {page === 'create-assessment' && <CreateAssessment onNavigate={setPage} />}
      {page === 'analyze-existing' && <AnalyzeExisting onNavigate={setPage} />}
      {page === 'existing-papers' && <Assessments onNavigate={setPage} />}
      {page === 'question-bank' && <QuestionBank />}
      {page === 'assessments' && <Assessments onNavigate={setPage} />}
      {page === 'reports' && <Reports onNavigate={setPage} />}
      {page === 'settings' && <Settings />}
    </Layout>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
