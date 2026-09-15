import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/Card';
import { Badge, ScoreBadge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import type { Assessment } from '@/types';
import type { Page } from '@/components/Layout';
import { FileText, FilePlus2, FileSearch, ChevronRight, Calendar } from 'lucide-react';

interface AssessmentsProps {
  onNavigate: (page: Page) => void;
}

export function Assessments({ onNavigate }: AssessmentsProps) {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('assessments').select('*').order('created_at', { ascending: false });
      setAssessments(data || []);
      setLoading(false);
    })();
  }, []);

  if (loading) return <LoadingSpinner size={32} label="Loading assessments..." />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-serif font-bold text-charcoal-700">Assessments</h1>
          <p className="text-charcoal-400 mt-1">All your created and analyzed assessment papers</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => onNavigate('analyze-existing')} className="btn-secondary flex items-center gap-2">
            <FileSearch size={18} /> Analyze Existing
          </button>
          <button onClick={() => onNavigate('create-assessment')} className="btn-primary flex items-center gap-2">
            <FilePlus2 size={18} /> Create New
          </button>
        </div>
      </div>

      {assessments.length === 0 ? (
        <EmptyState
          icon={<FileText size={28} />}
          title="No assessments yet"
          description="Create a new assessment with AI or analyze an existing paper to get started."
          action={<button onClick={() => onNavigate('create-assessment')} className="btn-primary flex items-center gap-2"><FilePlus2 size={18} /> Create New Assessment</button>}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {assessments.map((a) => (
            <Card key={a.id}>
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-sage-100 flex items-center justify-center">
                    <FileText size={20} className="text-sage-600" />
                  </div>
                  <Badge variant={a.type === 'created' ? 'good' : 'neutral'}>
                    {a.type === 'created' ? 'Created' : 'Analyzed'}
                  </Badge>
                </div>
                <h3 className="font-serif font-semibold text-charcoal-700 mb-1">{a.title}</h3>
                <p className="text-xs text-charcoal-400 mb-3">{a.subject || 'General'}</p>
                <div className="flex items-center gap-3 text-xs text-charcoal-400 mb-3">
                  <span>{a.total_marks} marks</span>
                  <span>·</span>
                  <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(a.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-beige-200">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-charcoal-700">{a.health_score || 0}%</span>
                    <ScoreBadge score={a.health_score || 0} />
                  </div>
                  <button onClick={() => onNavigate('reports')} className="text-sage-600 hover:text-sage-700 text-sm font-medium flex items-center gap-1">
                    Report <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
