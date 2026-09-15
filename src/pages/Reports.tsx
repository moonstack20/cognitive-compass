import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/Card';
import { Badge, ScoreBadge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { BarChart, DonutChart } from '@/components/ui/BarChart';
import type { Assessment, AssessmentAnalysis } from '@/types';
import type { Page } from '@/components/Layout';
import {
  BarChart3, FileText, AlertCircle, AlertTriangle, CheckCircle,
  ShieldCheck, Layers, Target, TrendingUp, Download, ChevronRight,
} from 'lucide-react';

interface ReportsProps {
  onNavigate: (page: Page) => void;
}

export function Reports({ onNavigate }: ReportsProps) {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [analyses, setAnalyses] = useState<Record<string, AssessmentAnalysis>>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: aData } = await supabase.from('assessments').select('*').order('created_at', { ascending: false });
      setAssessments(aData || []);
      if (aData && aData.length > 0) {
        setSelectedId(aData[0].id);
        const ids = aData.map((a) => a.id);
        const { data: anData } = await supabase.from('assessment_analyses').select('*').in('assessment_id', ids).order('created_at', { ascending: false });
        const map: Record<string, AssessmentAnalysis> = {};
        for (const an of anData || []) {
          if (!map[an.assessment_id]) map[an.assessment_id] = an;
        }
        setAnalyses(map);
      }
      setLoading(false);
    })();
  }, []);

  if (loading) return <LoadingSpinner size={32} label="Loading reports..." />;

  const selected = assessments.find((a) => a.id === selectedId);
  const analysis = selectedId ? analyses[selectedId] : null;

  if (assessments.length === 0) {
    return (
      <EmptyState
        icon={<BarChart3 size={28} />}
        title="No reports yet"
        description="Create an assessment or analyze an existing paper to generate reports."
        action={<button onClick={() => onNavigate('create-assessment')} className="btn-primary">Create Assessment</button>}
      />
    );
  }

  const healthItems = analysis ? [
    { label: 'Syllabus Coverage', score: analysis.syllabus_coverage, icon: FileText, reason: `Coverage based on ${Object.keys(analysis.co_coverage_detail || {}).length} mapped COs across syllabus units.` },
    { label: 'Bloom Balance', score: analysis.bloom_balance, icon: Layers, reason: analysis.bloom_issues.length > 0 ? analysis.bloom_issues[0] : 'Distribution aligns well with the blueprint target.' },
    { label: 'CO Coverage', score: analysis.co_coverage, icon: Target, reason: `Average coverage across ${Object.keys(analysis.co_coverage_detail || {}).length} course outcomes.` },
    { label: 'PO Coverage', score: analysis.po_coverage, icon: Target, reason: `Average coverage across ${Object.keys(analysis.po_coverage_detail || {}).length} program outcomes.` },
    { label: 'Difficulty Balance', score: analysis.difficulty_balance, icon: TrendingUp, reason: 'AI-estimated difficulty distribution vs blueprint target.' },
    { label: 'Question Clarity', score: analysis.question_clarity, icon: CheckCircle, reason: analysis.ambiguity_issues.length > 0 ? `${analysis.ambiguity_issues.length} ambiguity issues detected.` : 'All questions are clearly worded.' },
    { label: 'Security', score: analysis.security_risk_score, icon: ShieldCheck, reason: analysis.security_issues.length > 0 ? `${analysis.security_issues.length} security concerns found.` : 'Questions show good security profile.' },
  ] : [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-serif font-bold text-charcoal-700">Reports</h1>
          <p className="text-charcoal-400 mt-1">Comprehensive assessment analysis and quality intelligence</p>
        </div>
        <button onClick={() => window.print()} className="btn-secondary flex items-center gap-2">
          <Download size={18} /> Export
        </button>
      </div>

      {/* Assessment selector */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {assessments.map((a) => (
          <button
            key={a.id}
            onClick={() => setSelectedId(a.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              selectedId === a.id ? 'bg-sage-100 text-sage-700 border border-sage-200' : 'bg-white text-charcoal-500 border border-beige-200 hover:bg-beige-50'
            }`}
          >
            {a.title}
          </button>
        ))}
      </div>

      {!analysis ? (
        <Card>
          <div className="p-8 text-center">
            <AlertCircle size={28} className="mx-auto text-charcoal-300 mb-3" />
            <p className="text-charcoal-500">No stress test analysis found for this assessment.</p>
            <p className="text-sm text-charcoal-400 mt-1">Run the Exam Stress Test to generate a report.</p>
          </div>
        </Card>
      ) : (
        <>
          {/* Overall Health */}
          <Card>
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-serif font-semibold text-charcoal-700">Assessment Health Score</h2>
                <div className="flex items-center gap-3">
                  <span className="text-4xl font-bold font-serif text-charcoal-700">{analysis.overall_health}%</span>
                  <ScoreBadge score={analysis.overall_health} />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {healthItems.map((item) => {
                  const Icon = item.icon;
                  const status = item.score >= 85 ? 'good' : item.score >= 60 ? 'warn' : 'critical';
                  const color = status === 'good' ? 'sage' : status === 'warn' ? 'amber' : 'terracotta';
                  return (
                    <div key={item.label} className="p-3 rounded-lg bg-ivory-100 border border-beige-200">
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          status === 'good' ? 'bg-sage-100 text-sage-600' :
                          status === 'warn' ? 'bg-amber-100 text-amber-600' :
                          'bg-terracotta-100 text-terracotta-600'
                        }`}>
                          <Icon size={16} />
                        </div>
                        <span className="text-sm font-medium text-charcoal-600">{item.label}</span>
                        <span className="text-sm font-bold text-charcoal-700 ml-auto">{item.score}%</span>
                      </div>
                      <ProgressBar value={item.score} color={color as 'sage' | 'terracotta' | 'amber'} />
                      <p className="text-xs text-charcoal-400 mt-2 leading-relaxed">{item.reason}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>

          {/* Bloom Distribution */}
          <Card>
            <div className="p-5">
              <h2 className="text-lg font-serif font-semibold text-charcoal-700 mb-4">Bloom's Taxonomy Distribution</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm text-charcoal-500 mb-3">Actual vs Target</h3>
                  <BarChart data={analysis.bloom_actual} targetData={analysis.bloom_target} color="sage" />
                </div>
                <div>
                  <h3 className="text-sm text-charcoal-500 mb-3">Distribution Breakdown</h3>
                  <DonutChart data={analysis.bloom_actual} />
                </div>
              </div>
              {analysis.bloom_issues.length > 0 && (
                <div className="mt-4 space-y-2">
                  {analysis.bloom_issues.map((issue, i) => (
                    <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-amber-50 border border-amber-100">
                      <AlertTriangle size={16} className="text-amber-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-charcoal-600">{issue}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* Difficulty Analysis */}
          <Card>
            <div className="p-5">
              <h2 className="text-lg font-serif font-semibold text-charcoal-700 mb-4">Difficulty Balance Analysis</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm text-charcoal-500 mb-3">Actual vs Target</h3>
                  <BarChart data={analysis.difficulty_actual} targetData={analysis.difficulty_target} color="terracotta" />
                </div>
                <div>
                  <h3 className="text-sm text-charcoal-500 mb-3">Distribution</h3>
                  <DonutChart data={analysis.difficulty_actual} />
                </div>
              </div>
              <p className="text-xs text-charcoal-400 mt-3 italic">Difficulty is an AI-estimated metric, not an objective truth. Teachers can override individual question difficulty.</p>
            </div>
          </Card>

          {/* CO & PO Coverage */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <div className="p-5">
                <h2 className="text-lg font-serif font-semibold text-charcoal-700 mb-3">CO Coverage</h2>
                <div className="space-y-2">
                  {Object.entries(analysis.co_coverage_detail).map(([co, pct]) => (
                    <div key={co} className="flex items-center gap-3">
                      <span className="text-sm text-charcoal-500 w-12">{co}</span>
                      <div className="flex-1"><ProgressBar value={pct} color="sage" showValue={false} /></div>
                      <span className="text-sm font-medium text-charcoal-600 w-10 text-right">{pct}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
            <Card>
              <div className="p-5">
                <h2 className="text-lg font-serif font-semibold text-charcoal-700 mb-3">PO Coverage</h2>
                <div className="space-y-2">
                  {Object.entries(analysis.po_coverage_detail).map(([po, pct]) => (
                    <div key={po} className="flex items-center gap-3">
                      <span className="text-sm text-charcoal-500 w-12">{po}</span>
                      <div className="flex-1"><ProgressBar value={pct} color="terracotta" showValue={false} /></div>
                      <span className="text-sm font-medium text-charcoal-600 w-10 text-right">{pct}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>

          {/* CO-PO Matrix */}
          {Object.keys(analysis.co_po_matrix).length > 0 && (
            <Card>
              <div className="p-5">
                <h2 className="text-lg font-serif font-semibold text-charcoal-700 mb-3">CO-PO Coverage Matrix</h2>
                <div className="overflow-x-auto">
                  <table className="text-sm">
                    <thead>
                      <tr>
                        <th className="px-4 py-2 text-charcoal-400 text-xs font-medium"></th>
                        {Object.keys(analysis.co_po_matrix[Object.keys(analysis.co_po_matrix)[0]] || {}).map((po) => (
                          <th key={po} className="px-4 py-2 text-charcoal-400 text-xs font-medium text-center">{po}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(analysis.co_po_matrix).map(([co, poMap]) => (
                        <tr key={co}>
                          <td className="px-4 py-2 text-charcoal-600 font-medium text-sm">{co}</td>
                          {Object.entries(poMap).map(([po, level]) => (
                            <td key={po} className="px-4 py-2 text-center">
                              <span className={`inline-block w-14 py-1.5 rounded text-xs font-medium ${
                                level === 'High' ? 'bg-sage-100 text-sage-700' :
                                level === 'Med' ? 'bg-amber-100 text-amber-700' :
                                level === 'Low' ? 'bg-terracotta-100 text-terracotta-700' :
                                'bg-beige-100 text-charcoal-400'
                              }`}>{level}</span>
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </Card>
          )}

          {/* Blind Spots */}
          {analysis.blind_spots.length > 0 && (
            <Card>
              <div className="p-5">
                <h2 className="text-lg font-serif font-semibold text-charcoal-700 mb-3">Syllabus Blind Spots</h2>
                <div className="space-y-2">
                  {analysis.blind_spots.map((bs, i) => (
                    <div key={i} className="p-3 rounded-lg bg-terracotta-50 border border-terracotta-100">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-charcoal-700">{bs.unit}</span>
                        <Badge variant={bs.coverage === 0 ? 'critical' : 'warn'}>{bs.coverage}% / {bs.expected}% expected</Badge>
                      </div>
                      <p className="text-xs text-charcoal-500">{bs.recommendation}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}

          {/* Issues Summary */}
          {analysis.issues.length > 0 && (
            <Card>
              <div className="p-5">
                <h2 className="text-lg font-serif font-semibold text-charcoal-700 mb-3">All Detected Issues ({analysis.issues.length})</h2>
                <div className="space-y-2">
                  {analysis.issues.map((issue, i) => (
                    <div key={i} className={`p-3 rounded-lg border flex items-start gap-3 ${
                      issue.severity === 'critical' ? 'bg-terracotta-50 border-terracotta-100' :
                      issue.severity === 'warn' ? 'bg-amber-50 border-amber-100' :
                      'bg-sage-50 border-sage-100'
                    }`}>
                      {issue.severity === 'critical' ? <AlertCircle size={18} className="text-terracotta-600 mt-0.5" /> :
                       issue.severity === 'warn' ? <AlertTriangle size={18} className="text-amber-600 mt-0.5" /> :
                       <CheckCircle size={18} className="text-sage-600 mt-0.5" />}
                      <div>
                        <div className="text-sm font-medium text-charcoal-700">{issue.title}</div>
                        <div className="text-xs text-charcoal-500 mt-0.5">{issue.detail}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
