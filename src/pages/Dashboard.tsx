import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Card, StatCard } from '@/components/ui/Card';
import { Badge, ScoreBadge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  FileText, Library, Heart, Target, Layers, FilePlus2, FileSearch,
  AlertTriangle, CheckCircle, AlertCircle, ChevronRight, TrendingUp,
} from 'lucide-react';
import type { Page } from '@/components/Layout';
import type { Assessment, AssessmentAnalysis } from '@/types';

interface DashboardProps {
  onNavigate: (page: Page) => void;
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const { profile } = useAuth();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [analyses, setAnalyses] = useState<Record<string, AssessmentAnalysis>>({});
  const [qbankCount, setQbankCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [{ data: aData }, { data: qData }] = await Promise.all([
        supabase.from('assessments').select('*').order('created_at', { ascending: false }).limit(10),
        supabase.from('question_bank_items').select('id', { count: 'exact', head: true }),
      ]);
      setAssessments(aData || []);
      setQbankCount(qData?.length || 0);

      if (aData && aData.length > 0) {
        const ids = aData.map((a) => a.id);
        const { data: anData } = await supabase
          .from('assessment_analyses')
          .select('*')
          .in('assessment_id', ids)
          .order('created_at', { ascending: false });
        const map: Record<string, AssessmentAnalysis> = {};
        for (const an of anData || []) {
          if (!map[an.assessment_id]) map[an.assessment_id] = an;
        }
        setAnalyses(map);
      }
      setLoading(false);
    })();
  }, []);

  const avgHealth = assessments.length > 0
    ? Math.round(assessments.reduce((s, a) => s + (a.health_score || 0), 0) / assessments.length)
    : 0;

  // Calculate aggregate CO/PO coverage from analyses
  const coScores = Object.values(analyses).map((a) => a.co_coverage).filter((v) => v > 0);
  const poScores = Object.values(analyses).map((a) => a.po_coverage).filter((v) => v > 0);
  const avgCO = coScores.length > 0 ? Math.round(coScores.reduce((a, b) => a + b, 0) / coScores.length) : 0;
  const avgPO = poScores.length > 0 ? Math.round(poScores.reduce((a, b) => a + b, 0) / poScores.length) : 0;

  // Latest analysis for health breakdown
  const latestAnalysis = assessments.length > 0 ? analyses[assessments[0].id] : null;

  if (loading) return <LoadingSpinner size={32} label="Loading dashboard..." />;

  const healthItems = [
    { label: 'Syllabus Coverage', score: latestAnalysis?.syllabus_coverage ?? 88, icon: FileText },
    { label: 'Bloom Balance', score: latestAnalysis?.bloom_balance ?? 72, icon: Layers },
    { label: 'CO Coverage', score: latestAnalysis?.co_coverage ?? 91, icon: Target },
    { label: 'PO Coverage', score: latestAnalysis?.po_coverage ?? 78, icon: Target },
    { label: 'Difficulty Balance', score: latestAnalysis?.difficulty_balance ?? 85, icon: TrendingUp },
    { label: 'Question Clarity', score: latestAnalysis?.question_clarity ?? 80, icon: CheckCircle },
    { label: 'Security Risk', score: latestAnalysis?.security_risk_score ?? 65, icon: AlertTriangle },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-serif font-bold text-charcoal-700">
          Welcome to Cognitive Compass{profile?.full_name ? `, ${profile.full_name}` : ''}
        </h1>
        <p className="text-charcoal-400 mt-1">Create smarter assessments. Validate them before students see them.</p>
      </div>

      {/* CTA buttons */}
      <div className="flex flex-wrap gap-3">
        <button onClick={() => onNavigate('create-assessment')} className="btn-primary flex items-center gap-2">
          <FilePlus2 size={18} />
          Create New Assessment
        </button>
        <button onClick={() => onNavigate('analyze-existing')} className="btn-accent flex items-center gap-2">
          <FileSearch size={18} />
          Analyze Existing Paper
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard label="Total Assessments" value={assessments.length} icon={<FileText size={20} />} accent="sage" />
        <StatCard label="Question Bank" value={qbankCount} icon={<Library size={20} />} accent="charcoal" />
        <StatCard label="Avg Health" value={`${avgHealth}%`} icon={<Heart size={20} />} accent="terracotta" />
        <StatCard label="CO Coverage" value={`${avgCO}%`} icon={<Target size={20} />} accent="sage" />
        <StatCard label="PO Coverage" value={`${avgPO}%`} icon={<Target size={20} />} accent="terracotta" />
      </div>

      {/* Assessment Health section */}
      <Card>
        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-serif font-semibold text-charcoal-700">Assessment Health</h2>
            {latestAnalysis && <ScoreBadge score={latestAnalysis.overall_health} />}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {healthItems.map((item) => {
              const Icon = item.icon;
              const status = item.score >= 85 ? 'good' : item.score >= 60 ? 'warn' : 'critical';
              const color = status === 'good' ? 'sage' : status === 'warn' ? 'amber' : 'terracotta';
              return (
                <div key={item.label} className="flex items-center gap-3 p-3 rounded-lg bg-ivory-100 border border-beige-200">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                    status === 'good' ? 'bg-sage-100 text-sage-600' :
                    status === 'warn' ? 'bg-amber-100 text-amber-600' :
                    'bg-terracotta-100 text-terracotta-600'
                  }`}>
                    <Icon size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-charcoal-500">{item.label}</span>
                      <span className="text-xs font-bold text-charcoal-600">{item.score}%</span>
                    </div>
                    <ProgressBar value={item.score} color={color as 'sage' | 'terracotta' | 'amber'} />
                  </div>
                  <div className="flex-shrink-0">
                    {status === 'good' ? (
                      <Badge variant="good">Good</Badge>
                    ) : status === 'warn' ? (
                      <Badge variant="warn">Attention</Badge>
                    ) : (
                      <Badge variant="critical">Critical</Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Recent Assessments */}
      <Card>
        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-serif font-semibold text-charcoal-700">Recent Assessments</h2>
            <button onClick={() => onNavigate('assessments')} className="text-sm text-sage-600 hover:text-sage-700 flex items-center gap-1">
              View All <ChevronRight size={16} />
            </button>
          </div>
          {assessments.length === 0 ? (
            <EmptyState
              icon={<FileText size={28} />}
              title="No assessments yet"
              description="Create your first assessment or analyze an existing paper to get started."
              action={
                <button onClick={() => onNavigate('create-assessment')} className="btn-primary flex items-center gap-2">
                  <FilePlus2 size={18} /> Create New Assessment
                </button>
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-beige-200 text-charcoal-400 text-xs uppercase tracking-wide">
                    <th className="text-left py-2 px-3 font-medium">Assessment</th>
                    <th className="text-left py-2 px-3 font-medium hidden md:table-cell">Subject</th>
                    <th className="text-left py-2 px-3 font-medium hidden lg:table-cell">Date</th>
                    <th className="text-center py-2 px-3 font-medium">Health</th>
                    <th className="text-center py-2 px-3 font-medium">Status</th>
                    <th className="text-right py-2 px-3 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {assessments.slice(0, 5).map((a) => (
                    <tr key={a.id} className="border-b border-beige-100 hover:bg-ivory-100 transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-medium text-charcoal-600">{a.title}</div>
                        <div className="text-xs text-charcoal-400">{a.total_marks} marks · {a.type === 'created' ? 'Created' : 'Analyzed'}</div>
                      </td>
                      <td className="py-3 px-3 hidden md:table-cell text-charcoal-500">{a.subject || '—'}</td>
                      <td className="py-3 px-3 hidden lg:table-cell text-charcoal-400 text-xs">
                        {new Date(a.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="inline-flex items-center gap-1.5">
                          <span className="font-bold text-charcoal-600">{a.health_score || 0}%</span>
                          <ScoreBadge score={a.health_score || 0} />
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`badge ${
                          a.status === 'finalized' ? 'badge-good' :
                          a.status === 'analyzed' ? 'badge-warn' :
                          'badge-neutral'
                        }`}>
                          {a.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => onNavigate('reports')}
                          className="text-sage-600 hover:text-sage-700 text-xs font-medium"
                        >
                          View Report
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
