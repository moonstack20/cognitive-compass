import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Modal } from '@/components/ui/Modal';
import {
  classifyBloom, estimateDifficulty, detectAmbiguity, analyzeSecurity,
  improveQuestion, runStressTest,
} from '@/lib/aiEngine';
import { SAMPLE_QUESTIONS_TEXT, SAMPLE_UNITS, SAMPLE_COS, SAMPLE_POS, SAMPLE_SYLLABUS_TEXT } from '@/lib/sampleData';
import type { Page } from '@/components/Layout';
import type { Question, Syllabus, AssessmentAnalysis } from '@/types';
import {
  FileSearch, Upload, Sparkles, ShieldCheck, AlertCircle, AlertTriangle,
  CheckCircle, Wand2, Edit3, ChevronRight, Brain, Target, Layers,
} from 'lucide-react';

interface AnalyzeExistingProps {
  onNavigate: (page: Page) => void;
}

export function AnalyzeExisting({ onNavigate }: AnalyzeExistingProps) {
  const { user } = useAuth();
  const [paperText, setPaperText] = useState(SAMPLE_QUESTIONS_TEXT);
  const [assessmentName, setAssessmentName] = useState('Old DSA Mid-Sem Exam — Analyzed');
  const [subject, setSubject] = useState('Data Structures and Algorithms');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [analysis, setAnalysis] = useState<AssessmentAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [fixingQ, setFixingQ] = useState<Question | null>(null);
  const [fixedPreview, setFixedPreview] = useState('');
  const [editingQ, setEditingQ] = useState<Question | null>(null);
  const [assessmentId, setAssessmentId] = useState<string | null>(null);

  const parsePaper = (text: string): { text: string; marks: number }[] => {
    const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
    const parsed: { text: string; marks: number }[] = [];
    let currentText = '';
    let currentMarks = 5;

    for (const line of lines) {
      const qMatch = line.match(/^Q\d+\.?\s*(.+)/i);
      const marksMatch = line.match(/\((\d+)\s*marks?\)/i);

      if (qMatch) {
        if (currentText) parsed.push({ text: currentText, marks: currentMarks });
        currentText = qMatch[1];
        currentMarks = marksMatch ? parseInt(marksMatch[1]) : 5;
      } else if (currentText) {
        currentText += ' ' + line;
      }
    }
    if (currentText) parsed.push({ text: currentText, marks: currentMarks });
    return parsed;
  };

  const handleAnalyze = async () => {
    if (!user) return;
    setAnalyzing(true);

    // Parse the paper
    const parsed = parsePaper(paperText);

    // Create assessment record
    const { data: aData } = await supabase.from('assessments').insert({
      user_id: user.id,
      title: assessmentName,
      subject,
      total_marks: parsed.reduce((s, p) => s + p.marks, 0),
      status: 'analyzed',
      type: 'uploaded',
    }).select().single();
    if (aData) setAssessmentId(aData.id);

    // Convert to Question objects with AI analysis
    const syllabus: Syllabus = {
      id: '', user_id: user.id, course_id: null,
      title: 'Syllabus', content: SAMPLE_SYLLABUS_TEXT,
      units: SAMPLE_UNITS, created_at: '',
    };

    const enhanced: Question[] = parsed.map((p, i) => {
      const bloom = classifyBloom(p.text);
      const difficulty = estimateDifficulty(p.text, p.marks, bloom);
      const ambiguity = detectAmbiguity(p.text);
      const security = analyzeSecurity(p.text, bloom);

      // Assign unit based on topic detection
      const unitMatch = SAMPLE_UNITS.find((u) =>
        u.topics.some((t) => p.text.toLowerCase().includes(t.toLowerCase().split(' ')[0]))
      );
      const unit = unitMatch?.name || SAMPLE_UNITS[i % SAMPLE_UNITS.length].name;
      const topic = unitMatch?.topics.find((t) => p.text.toLowerCase().includes(t.toLowerCase().split(' ')[0])) || 'General';

      return {
        id: crypto.randomUUID(),
        assessment_id: aData?.id || null,
        user_id: user.id,
        question_text: p.text,
        marks: p.marks,
        unit,
        topic,
        bloom_level: bloom,
        difficulty,
        co_code: SAMPLE_COS[i % SAMPLE_COS.length].code,
        po_codes: [SAMPLE_POS[i % SAMPLE_POS.length].code],
        question_type: p.marks > 5 ? 'Long Answer' : 'Short Answer',
        source_reference: 'Extracted from uploaded paper',
        security_risk: security.security_risk,
        ai_vulnerability: security.ai_vulnerability,
        public_risk: security.public_risk,
        reasoning_requirement: security.reasoning_requirement,
        ambiguity_issues: ambiguity,
        answer_key: '',
        marking_scheme: [],
        status: 'analyzed',
        created_at: '',
      };
    });

    setQuestions(enhanced);

    // Save to DB
    if (aData) {
      for (const q of enhanced) {
        await supabase.from('questions').insert({
          id: q.id,
          assessment_id: aData.id,
          user_id: user.id,
          question_text: q.question_text,
          marks: q.marks,
          unit: q.unit,
          topic: q.topic,
          bloom_level: q.bloom_level,
          difficulty: q.difficulty,
          co_code: q.co_code,
          po_codes: q.po_codes,
          question_type: q.question_type,
          source_reference: q.source_reference,
          security_risk: q.security_risk,
          ai_vulnerability: q.ai_vulnerability,
          public_risk: q.public_risk,
          reasoning_requirement: q.reasoning_requirement,
          ambiguity_issues: q.ambiguity_issues,
          status: q.status,
        });
      }
    }

    // Run stress test
    const blueprint = {
      id: '', assessment_id: '',
      bloom_distribution: { Remember: 10, Understand: 20, Apply: 30, Analyze: 25, Evaluate: 10, Create: 5 },
      difficulty_distribution: { Easy: 20, Medium: 50, Hard: 30 },
      unit_weightage: [], question_types: [], section_structure: [],
      co_requirements: [], po_requirements: [], num_questions: enhanced.length, created_at: '',
    };

    const result = runStressTest(enhanced, syllabus, blueprint);
    setAnalysis(result);

    // Save analysis
    if (aData) {
      await supabase.from('assessment_analyses').insert({
        assessment_id: aData.id,
        syllabus_coverage: result.syllabus_coverage,
        bloom_balance: result.bloom_balance,
        co_coverage: result.co_coverage,
        po_coverage: result.po_coverage,
        difficulty_balance: result.difficulty_balance,
        question_clarity: result.question_clarity,
        security_risk_score: result.security_risk_score,
        overall_health: result.overall_health,
        blind_spots: result.blind_spots,
        bloom_issues: result.bloom_issues,
        ambiguity_issues: result.ambiguity_issues,
        security_issues: result.security_issues,
        co_po_matrix: result.co_po_matrix,
        bloom_actual: result.bloom_actual,
        bloom_target: result.bloom_target,
        difficulty_actual: result.difficulty_actual,
        difficulty_target: result.difficulty_target,
        co_coverage_detail: result.co_coverage_detail,
        po_coverage_detail: result.po_coverage_detail,
        issues: result.issues,
      });

      await supabase.from('assessments').update({
        health_score: result.overall_health,
      }).eq('id', aData.id);
    }

    setAnalyzing(false);
  };

  const handleFix = (q: Question) => {
    setFixingQ(q);
    setFixedPreview(improveQuestion(q));
  };

  const acceptFix = async () => {
    if (!fixingQ) return;
    const updated = { ...fixingQ, question_text: fixedPreview };
    setQuestions(questions.map((q) => (q.id === fixingQ.id ? updated : q)));
    await supabase.from('questions').update({ question_text: fixedPreview }).eq('id', fixingQ.id);
    setFixingQ(null);
    setFixedPreview('');
  };

  const handleEditSave = async (updated: Question) => {
    setQuestions(questions.map((q) => (q.id === updated.id ? updated : q)));
    await supabase.from('questions').update({
      question_text: updated.question_text,
      marks: updated.marks,
      bloom_level: updated.bloom_level,
      difficulty: updated.difficulty,
      co_code: updated.co_code,
      po_codes: updated.po_codes,
    }).eq('id', updated.id);
    setEditingQ(null);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl lg:text-3xl font-serif font-bold text-charcoal-700">Analyze Existing Paper</h1>
        <p className="text-charcoal-400 mt-1">Upload an old question paper and run the same intelligence engine on it.</p>
      </div>

      {!analysis && (
        <Card>
          <div className="p-5">
            <h2 className="text-lg font-serif font-semibold text-charcoal-700 mb-1">Upload Question Paper</h2>
            <p className="text-sm text-charcoal-400 mb-4">Paste the text of an existing question paper to analyze it.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="label-text">Assessment Name</label>
                <input className="input-field" value={assessmentName} onChange={(e) => setAssessmentName(e.target.value)} />
              </div>
              <div>
                <label className="label-text">Subject</label>
                <input className="input-field" value={subject} onChange={(e) => setSubject(e.target.value)} />
              </div>
            </div>

            <label className="label-text">Question Paper Text</label>
            <textarea
              className="input-field min-h-[200px] font-mono text-xs"
              value={paperText}
              onChange={(e) => setPaperText(e.target.value)}
              placeholder="Paste your question paper here..."
            />

            <button onClick={handleAnalyze} disabled={analyzing} className="btn-accent flex items-center gap-2 mt-4">
              {analyzing ? <LoadingSpinner size={16} /> : <Sparkles size={18} />}
              Analyze Paper
            </button>
          </div>
        </Card>
      )}

      {analyzing && (
        <Card>
          <div className="p-8">
            <LoadingSpinner size={32} label="Extracting questions, mapping Bloom levels, running stress test..." />
          </div>
        </Card>
      )}

      {analysis && !analyzing && (
        <>
          {/* Health Report */}
          <Card>
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-serif font-semibold text-charcoal-700">Assessment Health Report</h2>
                <div className="flex items-center gap-2">
                  <span className="text-3xl font-bold font-serif text-charcoal-700">{analysis.overall_health}%</span>
                  <Badge variant={analysis.overall_health >= 85 ? 'good' : analysis.overall_health >= 60 ? 'warn' : 'critical'}>
                    {analysis.overall_health >= 85 ? 'Good' : 'Needs Attention'}
                  </Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                {[
                  { label: 'Syllabus Coverage', score: analysis.syllabus_coverage },
                  { label: 'Bloom Balance', score: analysis.bloom_balance },
                  { label: 'CO Coverage', score: analysis.co_coverage },
                  { label: 'PO Coverage', score: analysis.po_coverage },
                  { label: 'Difficulty', score: analysis.difficulty_balance },
                  { label: 'Clarity', score: analysis.question_clarity },
                  { label: 'Security', score: analysis.security_risk_score },
                ].map((item) => (
                  <div key={item.label} className="p-3 rounded-lg bg-ivory-100 border border-beige-200 text-center">
                    <div className="text-lg font-bold text-charcoal-700">{item.score}%</div>
                    <div className="text-[10px] text-charcoal-400 leading-tight">{item.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Issues */}
          {analysis.issues.length > 0 && (
            <Card>
              <div className="p-5">
                <h2 className="text-lg font-serif font-semibold text-charcoal-700 mb-3">
                  {analysis.issues.length} Issues Detected
                </h2>
                <div className="space-y-2">
                  {analysis.issues.map((issue: any, i: number) => (
                    <div key={i} className={`p-3 rounded-lg border flex items-start gap-3 ${
                      issue.severity === 'critical' ? 'bg-terracotta-50 border-terracotta-100' :
                      'bg-amber-50 border-amber-100'
                    }`}>
                      {issue.severity === 'critical' ? <AlertCircle size={18} className="text-terracotta-600 mt-0.5" /> :
                       <AlertTriangle size={18} className="text-amber-600 mt-0.5" />}
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

          {/* Questions with analysis */}
          <Card>
            <div className="p-5">
              <h2 className="text-lg font-serif font-semibold text-charcoal-700 mb-3">Extracted Questions ({questions.length})</h2>
              <div className="space-y-3">
                {questions.map((q, i) => (
                  <div key={q.id} className="p-4 rounded-lg bg-ivory-100 border border-beige-200">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="text-xs font-bold text-charcoal-400">Q{i + 1}</span>
                          <Badge variant="neutral">{q.marks} marks</Badge>
                          <Badge variant="neutral">{q.bloom_level}</Badge>
                          <Badge variant={q.difficulty === 'Hard' ? 'critical' : q.difficulty === 'Medium' ? 'warn' : 'good'}>
                            {q.difficulty}
                          </Badge>
                          <Badge variant="neutral">{q.co_code}</Badge>
                          {q.po_codes.map((po) => <Badge key={po} variant="neutral">{po}</Badge>)}
                          {q.ai_vulnerability === 'High' && <Badge variant="critical">AI Vulnerable</Badge>}
                          {q.ambiguity_issues.length > 0 && <Badge variant="warn">Ambiguous</Badge>}
                        </div>
                        <p className="text-sm text-charcoal-600">{q.question_text}</p>
                        {q.ambiguity_issues.length > 0 && (
                          <div className="mt-2 p-2 rounded bg-amber-50 border border-amber-100">
                            <div className="text-xs text-amber-700 font-medium">Ambiguity: {q.ambiguity_issues[0].problem}</div>
                            <div className="text-xs text-charcoal-500 mt-0.5">Suggestion: {q.ambiguity_issues[0].suggestion}</div>
                          </div>
                        )}
                        {q.ai_vulnerability === 'High' && (
                          <div className="mt-2 p-2 rounded bg-terracotta-50 border border-terracotta-100">
                            <div className="text-xs text-terracotta-700 font-medium">AI Vulnerability: High — heuristic estimate</div>
                            <div className="text-xs text-charcoal-500 mt-0.5">{q.question_text.length < 50 ? 'Question is short and generic.' : 'Question can be answered with common explanations.'}</div>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-1 flex-shrink-0">
                        {(q.ambiguity_issues.length > 0 || q.ai_vulnerability === 'High') && (
                          <button onClick={() => handleFix(q)} className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1">
                            <Wand2 size={14} /> Fix
                          </button>
                        )}
                        <button onClick={() => setEditingQ(q)} className="btn-ghost text-xs">
                          <Edit3 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <div className="flex justify-between">
            <button onClick={() => onNavigate('dashboard')} className="btn-secondary">Back to Dashboard</button>
            <button onClick={() => onNavigate('reports')} className="btn-primary flex items-center gap-2">
              View Full Report <ChevronRight size={18} />
            </button>
          </div>
        </>
      )}

      {/* Fix modal */}
      {fixingQ && (
        <Modal open={true} onClose={() => setFixingQ(null)} title="Fix with AI" size="lg">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-charcoal-500 mb-2">Original Question</h4>
                <div className="p-3 rounded-lg bg-terracotta-50 border border-terracotta-100 text-sm text-charcoal-600">
                  {fixingQ.question_text}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-charcoal-500 mb-2">AI-Suggested Improvement</h4>
                <div className="p-3 rounded-lg bg-sage-50 border border-sage-200 text-sm text-charcoal-600">
                  {fixedPreview}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setFixingQ(null)} className="btn-ghost">Reject</button>
              <button onClick={acceptFix} className="btn-primary flex items-center gap-2">
                <CheckCircle size={16} /> Accept
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Edit modal */}
      {editingQ && (
        <Modal open={true} onClose={() => setEditingQ(null)} title="Edit Question" size="lg">
          <div className="space-y-4">
            <div>
              <label className="label-text">Question Text</label>
              <textarea className="input-field min-h-[100px]" value={editingQ.question_text}
                onChange={(e) => setEditingQ({ ...editingQ, question_text: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div>
                <label className="label-text">Marks</label>
                <input type="number" className="input-field" value={editingQ.marks}
                  onChange={(e) => setEditingQ({ ...editingQ, marks: parseInt(e.target.value) || 5 })} />
              </div>
              <div>
                <label className="label-text">Bloom Level</label>
                <select className="input-field" value={editingQ.bloom_level}
                  onChange={(e) => setEditingQ({ ...editingQ, bloom_level: e.target.value })}>
                  {['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create'].map((l) => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label-text">Difficulty</label>
                <select className="input-field" value={editingQ.difficulty}
                  onChange={(e) => setEditingQ({ ...editingQ, difficulty: e.target.value })}>
                  {['Easy', 'Medium', 'Hard'].map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setEditingQ(null)} className="btn-ghost">Cancel</button>
              <button onClick={() => handleEditSave(editingQ)} className="btn-primary">Save</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
