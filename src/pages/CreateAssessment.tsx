import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Modal } from '@/components/ui/Modal';
import {
  generateQuestions, classifyBloom, estimateDifficulty, detectAmbiguity,
  analyzeSecurity, improveQuestion, generateAnswerKey, runStressTest,
  type GeneratedQuestion,
} from '@/lib/aiEngine';
import {
  SAMPLE_SYLLABUS_TEXT, SAMPLE_UNITS, SAMPLE_COS, SAMPLE_POS, DEFAULT_BLUEPRINT,
} from '@/lib/sampleData';
import type { Page } from '@/components/Layout';
import type { Question, Syllabus, AssessmentAnalysis } from '@/types';
import {
  Upload, FileText, Settings2, Sparkles, Brain, Target, ShieldCheck,
  Wand2, CheckCircle, AlertTriangle, AlertCircle, ChevronRight, ChevronLeft,
  Edit3, RefreshCw, Trash2, Zap, KeyRound, FileCheck, X,
  Layers, TrendingUp,
} from 'lucide-react';

interface CreateAssessmentProps {
  onNavigate: (page: Page) => void;
}

type Step = 'upload' | 'blueprint' | 'generate' | 'review' | 'stress-test' | 'fix' | 'answer-key' | 'final';

const STEPS: { id: Step; label: string; icon: typeof Upload }[] = [
  { id: 'upload', label: 'Upload Material', icon: Upload },
  { id: 'blueprint', label: 'Blueprint', icon: Settings2 },
  { id: 'generate', label: 'Generate Questions', icon: Sparkles },
  { id: 'review', label: 'Bloom/CO/PO Mapping', icon: Brain },
  { id: 'stress-test', label: 'Exam Stress Test', icon: ShieldCheck },
  { id: 'fix', label: 'Fix Issues', icon: Wand2 },
  { id: 'answer-key', label: 'Answer Key', icon: KeyRound },
  { id: 'final', label: 'Final Paper', icon: FileCheck },
];

export function CreateAssessment({ onNavigate }: CreateAssessmentProps) {
  const { user } = useAuth();
  const [step, setStep] = useState<Step>('upload');
  const [syllabusText, setSyllabusText] = useState(SAMPLE_SYLLABUS_TEXT);
  const [syllabusUnits, setSyllabusUnits] = useState(SAMPLE_UNITS);
  const [assessmentName, setAssessmentName] = useState('Data Structures & Algorithms — Mid Semester Exam');
  const [subject, setSubject] = useState('Data Structures and Algorithms');
  const [totalMarks, setTotalMarks] = useState(50);
  const [numQuestions, setNumQuestions] = useState(10);
  const [bloomDist, setBloomDist] = useState(DEFAULT_BLUEPRINT.bloom_distribution);
  const [difficultyDist, setDifficultyDist] = useState(DEFAULT_BLUEPRINT.difficulty_distribution);
  const [cos, setCos] = useState(SAMPLE_COS);
  const [pos, setPos] = useState(SAMPLE_POS);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [analysis, setAnalysis] = useState<AssessmentAnalysis | null>(null);
  const [assessmentId, setAssessmentId] = useState<string | null>(null);
  const [syllabusId, setSyllabusId] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [testing, setTesting] = useState(false);
  const [editingQ, setEditingQ] = useState<Question | null>(null);
  const [fixingQ, setFixingQ] = useState<Question | null>(null);
  const [fixedPreview, setFixedPreview] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stepIndex = STEPS.findIndex((s) => s.id === step);

  // ─── STEP 1: Save syllabus and proceed ──────────────────────────────────

  const handleUploadComplete = async () => {
    if (!user) return;
    setGenerating(true);
    setError(null);
    const { data: sylData, error: sylError } = await supabase.from('syllabi').insert({
      user_id: user.id,
      title: assessmentName,
      content: syllabusText,
      units: syllabusUnits,
    }).select().single();
    if (sylError) {
      setError('Failed to save syllabus: ' + sylError.message);
      setGenerating(false);
      return;
    }
    if (sylData) setSyllabusId(sylData.id);
    setGenerating(false);
    setStep('blueprint');
  };

  // ─── STEP 2: Save blueprint and generate questions ──────────────────────

  const handleGenerate = async () => {
    if (!user) return;
    setGenerating(true);
    setError(null);
    setStep('generate');

    // Create assessment record
    const { data: aData, error: aError } = await supabase.from('assessments').insert({
      user_id: user.id,
      syllabus_id: syllabusId,
      title: assessmentName,
      subject,
      total_marks: totalMarks,
      status: 'draft',
      type: 'created',
    }).select().single();
    if (aError || !aData) {
      setError('Failed to create assessment: ' + (aError?.message || 'Unknown error'));
      setGenerating(false);
      setStep('blueprint');
      return;
    }
    setAssessmentId(aData.id);

    // Create blueprint
    if (aData) {
      await supabase.from('assessment_blueprints').insert({
        assessment_id: aData.id,
        bloom_distribution: bloomDist,
        difficulty_distribution: difficultyDist,
        num_questions: numQuestions,
        unit_weightage: syllabusUnits.map((u) => ({ unit: u.name, weight: u.weightage || 20 })),
        question_types: ['Short Answer', 'Long Answer'],
        section_structure: [{ name: 'Section A', questions: Math.ceil(numQuestions / 2), marks: 5 }, { name: 'Section B', questions: Math.floor(numQuestions / 2), marks: 10 }],
        co_requirements: cos.map((c) => c.code),
        po_requirements: pos.map((p) => p.code),
      });
    }

    // Generate questions using AI engine
    const syllabus: Syllabus = {
      id: syllabusId || '',
      user_id: user.id,
      course_id: null,
      title: assessmentName,
      content: syllabusText,
      units: syllabusUnits,
      created_at: '',
    };

    const blueprint = {
      id: '',
      assessment_id: aData?.id || '',
      bloom_distribution: bloomDist,
      difficulty_distribution: difficultyDist,
      unit_weightage: syllabusUnits.map((u) => ({ unit: u.name, weight: u.weightage || 20 })),
      question_types: ['Short Answer', 'Long Answer'],
      section_structure: [],
      co_requirements: cos.map((c) => c.code),
      po_requirements: pos.map((p) => p.code),
      num_questions: numQuestions,
      created_at: '',
    };

    const generated = generateQuestions(
      syllabus,
      blueprint,
      cos.map((c) => c.code),
      pos.map((p) => p.code),
    );

    // Enhance each question with AI analysis
    const enhanced: Question[] = generated.map((g: GeneratedQuestion) => {
      const bloom = classifyBloom(g.question_text);
      const difficulty = estimateDifficulty(g.question_text, g.marks, bloom);
      const ambiguity = detectAmbiguity(g.question_text);
      const security = analyzeSecurity(g.question_text, bloom);
      return {
        id: crypto.randomUUID(),
        assessment_id: aData?.id || null,
        user_id: user.id,
        question_text: g.question_text,
        marks: g.marks,
        unit: g.unit,
        topic: g.topic,
        bloom_level: g.bloom_level,
        difficulty,
        co_code: g.co_code,
        po_codes: g.po_codes,
        question_type: g.question_type,
        source_reference: g.source_reference,
        security_risk: security.security_risk,
        ai_vulnerability: security.ai_vulnerability,
        public_risk: security.public_risk,
        reasoning_requirement: security.reasoning_requirement,
        ambiguity_issues: ambiguity,
        answer_key: '',
        marking_scheme: [],
        status: 'generated',
        created_at: '',
      };
    });

    setQuestions(enhanced);

    // Save questions to DB
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

    setGenerating(false);
    setStep('review');
  };

  // ─── STEP 3: Run stress test ───────────────────────────────────────────── ─────────────────────────────────────────────

  const handleStressTest = async () => {
    if (!user || !assessmentId) return;
    setTesting(true);
    setError(null);
    setStep('stress-test');

    const syllabus: Syllabus = {
      id: syllabusId || '',
      user_id: user.id,
      course_id: null,
      title: assessmentName,
      content: syllabusText,
      units: syllabusUnits,
      created_at: '',
    };

    const blueprint = {
      id: '',
      assessment_id: assessmentId,
      bloom_distribution: bloomDist,
      difficulty_distribution: difficultyDist,
      unit_weightage: syllabusUnits.map((u) => ({ unit: u.name, weight: u.weightage || 20 })),
      question_types: ['Short Answer', 'Long Answer'],
      section_structure: [],
      co_requirements: cos.map((c) => c.code),
      po_requirements: pos.map((p) => p.code),
      num_questions: numQuestions,
      created_at: '',
    };

    const result = runStressTest(questions, syllabus, blueprint);
    setAnalysis(result);

    // Save analysis to DB
    await supabase.from('assessment_analyses').insert({
      assessment_id: assessmentId,
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

    // Update assessment health score
    await supabase.from('assessments').update({
      health_score: result.overall_health,
      status: 'analyzed',
    }).eq('id', assessmentId);

    setTesting(false);
    setStep('fix');
  };

  const handleStressTestError = (msg: string) => {
    setError(msg);
    setTesting(false);
    setStep('review');
  };

  // ─── STEP 4: Fix issues ─────────────────────────────────────────────────

  const handleFixQuestion = (q: Question) => {
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

  const handleEditQuestion = async (updated: Question) => {
    setQuestions(questions.map((q) => (q.id === updated.id ? updated : q)));
    await supabase.from('questions').update({
      question_text: updated.question_text,
      marks: updated.marks,
      bloom_level: updated.bloom_level,
      difficulty: updated.difficulty,
      co_code: updated.co_code,
      po_codes: updated.po_codes,
      unit: updated.unit,
      topic: updated.topic,
    }).eq('id', updated.id);
    setEditingQ(null);
  };

  const handleDeleteQuestion = async (id: string) => {
    setQuestions(questions.filter((q) => q.id !== id));
    await supabase.from('questions').delete().eq('id', id);
  };

  const handleRegenerateQuestion = async (q: Question) => {
    const syllabus: Syllabus = {
      id: '', user_id: '', course_id: null, title: '', content: syllabusText,
      units: syllabusUnits, created_at: '',
    };
    const blueprint = {
      id: '', assessment_id: '', bloom_distribution: bloomDist, difficulty_distribution: difficultyDist,
      unit_weightage: [], question_types: [], section_structure: [],
      co_requirements: cos.map((c) => c.code), po_requirements: pos.map((p) => p.code),
      num_questions: 1, created_at: '',
    };
    const newQs = generateQuestions(syllabus, blueprint, [q.co_code], q.po_codes);
    if (newQs.length > 0) {
      const g = newQs[0];
      const bloom = classifyBloom(g.question_text);
      const difficulty = estimateDifficulty(g.question_text, g.marks, bloom);
      const security = analyzeSecurity(g.question_text, bloom);
      const updated: Question = {
        ...q,
        question_text: g.question_text,
        unit: g.unit,
        topic: g.topic,
        bloom_level: g.bloom_level,
        difficulty,
        source_reference: g.source_reference,
        security_risk: security.security_risk,
        ai_vulnerability: security.ai_vulnerability,
        public_risk: security.public_risk,
        reasoning_requirement: security.reasoning_requirement,
        ambiguity_issues: detectAmbiguity(g.question_text),
      };
      setQuestions(questions.map((qq) => (qq.id === q.id ? updated : qq)));
      await supabase.from('questions').update({
        question_text: updated.question_text, unit: updated.unit, topic: updated.topic,
        bloom_level: updated.bloom_level, difficulty: updated.difficulty,
        source_reference: updated.source_reference, security_risk: updated.security_risk,
        ai_vulnerability: updated.ai_vulnerability, public_risk: updated.public_risk,
        reasoning_requirement: updated.reasoning_requirement, ambiguity_issues: updated.ambiguity_issues,
      }).eq('id', q.id);
    }
  };

  // ─── STEP 5: Generate answer keys ───────────────────────────────────────

  const handleGenerateAnswerKeys = async () => {
    if (!assessmentId) return;
    setGenerating(true);
    const updated = questions.map((q) => {
      const { answer, markingScheme } = generateAnswerKey(q);
      return { ...q, answer_key: answer, marking_scheme: markingScheme };
    });
    setQuestions(updated);
    for (const q of updated) {
      await supabase.from('questions').update({
        answer_key: q.answer_key,
        marking_scheme: q.marking_scheme,
      }).eq('id', q.id);
    }
    setGenerating(false);
    setStep('final');
  };

  // ─── STEP 6: Finalize ────────────────────────────────────────────────────

  const handleFinalize = async () => {
    if (!assessmentId) return;
    setSaving(true);
    await supabase.from('assessments').update({ status: 'finalized' }).eq('id', assessmentId);
    // Save questions to question bank
    for (const q of questions) {
      await supabase.from('question_bank_items').insert({
        user_id: user?.id,
        question_text: q.question_text,
        subject,
        unit: q.unit,
        topic: q.topic,
        bloom_level: q.bloom_level,
        difficulty: q.difficulty,
        co_code: q.co_code,
        po_codes: q.po_codes,
        question_type: q.question_type,
        source: q.source_reference,
        security_risk: q.security_risk,
        status: 'available',
        marks: q.marks,
      });
    }
    setSaving(false);
    onNavigate('reports');
  };

  // ─── RENDER ──────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-serif font-bold text-charcoal-700">Create New Assessment</h1>
        <p className="text-charcoal-400 mt-1">Generate an AI-powered question paper with full quality analysis.</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-1 overflow-x-auto pb-2">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const active = step === s.id;
          const done = i < stepIndex;
          return (
            <div key={s.id} className="flex items-center gap-1 flex-shrink-0">
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                active ? 'bg-sage-100 text-sage-700 border border-sage-200' :
                done ? 'bg-sage-50 text-sage-600' :
                'bg-beige-50 text-charcoal-400'
              }`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  active ? 'bg-sage-500 text-white' :
                  done ? 'bg-sage-200 text-sage-700' :
                  'bg-beige-200 text-charcoal-400'
                }`}>
                  {done ? <CheckCircle size={14} /> : <Icon size={14} />}
                </div>
                <span className="hidden md:inline">{s.label}</span>
              </div>
              {i < STEPS.length - 1 && <ChevronRight size={14} className="text-charcoal-300" />}
            </div>
          );
        })}
      </div>

      {/* Error banner */}
      {error && (
        <div className="p-3 rounded-lg bg-terracotta-50 border border-terracotta-200 text-sm text-terracotta-700 flex items-center gap-2 animate-fade-in">
          <AlertCircle size={18} className="flex-shrink-0" />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto text-terracotta-400 hover:text-terracotta-600">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Step content */}
      {step === 'upload' && (
        <UploadStep
          syllabusText={syllabusText}
          setSyllabusText={setSyllabusText}
          syllabusUnits={syllabusUnits}
          setSyllabusUnits={setSyllabusUnits}
          assessmentName={assessmentName}
          setAssessmentName={setAssessmentName}
          subject={subject}
          setSubject={setSubject}
          cos={cos}
          setCos={setCos}
          pos={pos}
          setPos={setPos}
          onComplete={handleUploadComplete}
          generating={generating}
        />
      )}

      {step === 'blueprint' && (
        <BlueprintStep
          assessmentName={assessmentName}
          totalMarks={totalMarks}
          setTotalMarks={setTotalMarks}
          numQuestions={numQuestions}
          setNumQuestions={setNumQuestions}
          bloomDist={bloomDist}
          setBloomDist={setBloomDist}
          difficultyDist={difficultyDist}
          setDifficultyDist={setDifficultyDist}
          syllabusUnits={syllabusUnits}
          onGenerate={handleGenerate}
          onBack={() => setStep('upload')}
          generating={generating}
        />
      )}

      {step === 'generate' && (
        <Card>
          <div className="p-8">
            <LoadingSpinner size={32} label="Generating questions with AI..." />
          </div>
        </Card>
      )}

      {step === 'review' && (
        <ReviewStep
          questions={questions}
          onEdit={setEditingQ}
          onRegenerate={handleRegenerateQuestion}
          onDelete={handleDeleteQuestion}
          onRunStressTest={handleStressTest}
          onBack={() => setStep('blueprint')}
          testing={testing}
          bloomDist={bloomDist}
        />
      )}

      {step === 'stress-test' && (
        <Card>
          <div className="p-8">
            <LoadingSpinner size={32} label="Running exam stress test..." />
          </div>
        </Card>
      )}

      {step === 'fix' && analysis && (
        <FixStep
          analysis={analysis}
          questions={questions}
          onFix={handleFixQuestion}
          onEdit={setEditingQ}
          onRegenerate={handleRegenerateQuestion}
          onProceed={() => setStep('answer-key')}
          onBack={() => setStep('review')}
        />
      )}

      {step === 'fix' && !analysis && (
        <Card>
          <div className="p-8 text-center">
            <AlertCircle size={28} className="mx-auto text-charcoal-300 mb-3" />
            <p className="text-charcoal-500">No stress test results found. Go back and run the stress test first.</p>
            <button onClick={() => setStep('review')} className="btn-secondary mt-4">Back to Questions</button>
          </div>
        </Card>
      )}

      {step === 'answer-key' && (
        <AnswerKeyStep
          questions={questions}
          onGenerateAll={handleGenerateAnswerKeys}
          onProceed={() => setStep('final')}
          onBack={() => setStep('fix')}
          generating={generating}
        />
      )}

      {step === 'final' && (
        <FinalPaperStep
          assessmentName={assessmentName}
          subject={subject}
          totalMarks={totalMarks}
          questions={questions}
          onFinalize={handleFinalize}
          onBack={() => setStep('answer-key')}
          saving={saving}
        />
      )}

      {/* Edit question modal */}
      {editingQ && (
        <EditQuestionModal
          question={editingQ}
          onSave={handleEditQuestion}
          onClose={() => setEditingQ(null)}
          cos={cos}
          pos={pos}
        />
      )}

      {/* Fix question modal */}
      {fixingQ && (
        <Modal open={true} onClose={() => setFixingQ(null)} title="Fix with AI" size="lg">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-charcoal-500 mb-2">Original Question</h4>
                <div className="p-3 rounded-lg bg-terracotta-50 border border-terracotta-100 text-sm text-charcoal-600">
                  {fixingQ.question_text}
                </div>
                <div className="mt-2 space-y-1">
                  {fixingQ.ambiguity_issues.map((a, i) => (
                    <div key={i} className="text-xs text-terracotta-600">
                      <AlertCircle size={12} className="inline mr-1" />
                      {a.problem}
                    </div>
                  ))}
                  {fixingQ.ai_vulnerability === 'High' && (
                    <div className="text-xs text-terracotta-600">
                      <ShieldCheck size={12} className="inline mr-1" />
                      High AI vulnerability — heuristic estimate
                    </div>
                  )}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-charcoal-500 mb-2">AI-Suggested Improvement</h4>
                <div className="p-3 rounded-lg bg-sage-50 border border-sage-200 text-sm text-charcoal-600">
                  {fixedPreview}
                </div>
                <div className="mt-2 text-xs text-sage-600">
                  <CheckCircle size={12} className="inline mr-1" />
                  Preserves topic, marks, CO, and PO mapping
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setFixingQ(null)} className="btn-ghost">Reject</button>
              <button onClick={() => { setEditingQ({ ...fixingQ, question_text: fixedPreview }); setFixingQ(null); }} className="btn-secondary">
                Edit
              </button>
              <button onClick={acceptFix} className="btn-primary flex items-center gap-2">
                <CheckCircle size={16} /> Accept
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── UPLOAD STEP ────────────────────────────────────────────────────────────

function UploadStep({
  syllabusText, setSyllabusText, syllabusUnits, setSyllabusUnits,
  assessmentName, setAssessmentName, subject, setSubject,
  cos, setCos, pos, setPos, onComplete, generating,
}: any) {
  return (
    <div className="space-y-4">
      <Card>
        <div className="p-5">
          <h2 className="text-lg font-serif font-semibold text-charcoal-700 mb-1">Syllabus & Study Material</h2>
          <p className="text-sm text-charcoal-400 mb-4">Upload or paste your syllabus. The system extracts units, topics, and learning objectives.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="label-text">Assessment Name</label>
              <input className="input-field" value={assessmentName} onChange={(e: any) => setAssessmentName(e.target.value)} />
            </div>
            <div>
              <label className="label-text">Subject</label>
              <input className="input-field" value={subject} onChange={(e: any) => setSubject(e.target.value)} />
            </div>
          </div>

          <label className="label-text">Syllabus Content</label>
          <textarea
            className="input-field min-h-[200px] font-mono text-xs"
            value={syllabusText}
            onChange={(e: any) => setSyllabusText(e.target.value)}
            placeholder="Paste your syllabus here..."
          />

          <div className="mt-4 p-3 rounded-lg bg-sage-50 border border-sage-200 flex items-start gap-2">
            <FileText size={16} className="text-sage-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-sage-700">
              <strong>Detected Units:</strong> {syllabusUnits.length} units with {syllabusUnits.reduce((s: number, u: any) => s + u.topics.length, 0)} topics
            </div>
          </div>

          {/* Units preview */}
          <div className="mt-3 space-y-2">
            {syllabusUnits.map((unit: any, i: number) => (
              <div key={i} className="p-3 rounded-lg bg-ivory-100 border border-beige-200">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-charcoal-600">{unit.name}</span>
                  <Badge variant="neutral">{unit.weightage || 20}% weightage</Badge>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {unit.topics.map((t: string, j: number) => (
                    <span key={j} className="text-xs px-2 py-0.5 rounded bg-beige-100 text-charcoal-500">{t}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* CO/PO definitions */}
      <Card>
        <div className="p-5">
          <h2 className="text-lg font-serif font-semibold text-charcoal-700 mb-1">Course Outcomes (COs)</h2>
          <p className="text-sm text-charcoal-400 mb-3">Define the course outcomes for this subject. These will be used to map questions.</p>
          <div className="space-y-2">
            {cos.map((co: any, i: number) => (
              <div key={i} className="flex gap-2">
                <input
                  className="input-field w-24"
                  value={co.code}
                  onChange={(e: any) => {
                    const updated = [...cos];
                    updated[i] = { ...co, code: e.target.value };
                    setCos(updated);
                  }}
                  placeholder="CO1"
                />
                <input
                  className="input-field flex-1"
                  value={co.description}
                  onChange={(e: any) => {
                    const updated = [...cos];
                    updated[i] = { ...co, description: e.target.value };
                    setCos(updated);
                  }}
                  placeholder="Describe the outcome..."
                />
              </div>
            ))}
          </div>
        </div>
      </Card>

      <Card>
        <div className="p-5">
          <h2 className="text-lg font-serif font-semibold text-charcoal-700 mb-1">Program Outcomes (POs)</h2>
          <p className="text-sm text-charcoal-400 mb-3">Define the program outcomes relevant to this course.</p>
          <div className="space-y-2">
            {pos.map((po: any, i: number) => (
              <div key={i} className="flex gap-2">
                <input
                  className="input-field w-24"
                  value={po.code}
                  onChange={(e: any) => {
                    const updated = [...pos];
                    updated[i] = { ...po, code: e.target.value };
                    setPos(updated);
                  }}
                  placeholder="PO1"
                />
                <input
                  className="input-field flex-1"
                  value={po.description}
                  onChange={(e: any) => {
                    const updated = [...pos];
                    updated[i] = { ...po, description: e.target.value };
                    setPos(updated);
                  }}
                  placeholder="Describe the outcome..."
                />
              </div>
            ))}
          </div>
        </div>
      </Card>

      <div className="flex justify-end">
        <button onClick={onComplete} disabled={generating} className="btn-primary flex items-center gap-2">
          {generating ? <LoadingSpinner size={16} /> : <ChevronRight size={18} />}
          Continue to Blueprint
        </button>
      </div>
    </div>
  );
}

// ─── BLUEPRINT STEP ─────────────────────────────────────────────────────────

function BlueprintStep({
  totalMarks, setTotalMarks, numQuestions, setNumQuestions,
  bloomDist, setBloomDist, difficultyDist, setDifficultyDist,
  syllabusUnits, onGenerate, onBack, generating,
}: any) {
  const bloomLevels = ['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create'];
  const difficultyLevels = ['Easy', 'Medium', 'Hard'];

  return (
    <div className="space-y-4">
      <Card>
        <div className="p-5">
          <h2 className="text-lg font-serif font-semibold text-charcoal-700 mb-1">Assessment Blueprint</h2>
          <p className="text-sm text-charcoal-400 mb-4">Define what kind of exam you want to generate.</p>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="label-text">Total Marks</label>
              <input type="number" className="input-field" value={totalMarks} onChange={(e: any) => setTotalMarks(parseInt(e.target.value) || 50)} />
            </div>
            <div>
              <label className="label-text">Number of Questions</label>
              <input type="number" className="input-field" value={numQuestions} onChange={(e: any) => setNumQuestions(parseInt(e.target.value) || 10)} />
            </div>
          </div>

          {/* Bloom distribution */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-charcoal-600 mb-3">Bloom's Taxonomy Distribution</h3>
            <div className="space-y-2">
              {bloomLevels.map((level) => (
                <div key={level} className="flex items-center gap-3">
                  <span className="text-sm text-charcoal-500 w-28">{level}</span>
                  <input
                    type="range"
                    min="0"
                    max="50"
                    value={bloomDist[level] || 0}
                    onChange={(e) => setBloomDist({ ...bloomDist, [level]: parseInt(e.target.value) })}
                    className="flex-1 accent-sage-500"
                  />
                  <span className="text-sm font-medium text-charcoal-600 w-10 text-right">{bloomDist[level] || 0}%</span>
                </div>
              ))}
            </div>
            <div className="mt-2 text-xs text-charcoal-400">
              Total: {Object.values(bloomDist).reduce((a: number, b: any) => a + (b || 0), 0)}%
            </div>
          </div>

          {/* Difficulty distribution */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-charcoal-600 mb-3">Difficulty Distribution</h3>
            <div className="space-y-2">
              {difficultyLevels.map((level) => (
                <div key={level} className="flex items-center gap-3">
                  <span className="text-sm text-charcoal-500 w-28">{level}</span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={difficultyDist[level] || 0}
                    onChange={(e) => setDifficultyDist({ ...difficultyDist, [level]: parseInt(e.target.value) })}
                    className="flex-1 accent-terracotta-500"
                  />
                  <span className="text-sm font-medium text-charcoal-600 w-10 text-right">{difficultyDist[level] || 0}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Unit weightage */}
          <div>
            <h3 className="text-sm font-medium text-charcoal-600 mb-3">Unit-wise Weightage</h3>
            <div className="space-y-2">
              {syllabusUnits.map((unit: any, i: number) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs text-charcoal-500 flex-1 truncate">{unit.name}</span>
                  <span className="text-sm font-medium text-charcoal-600 w-10 text-right">{unit.weightage || 20}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Blueprint summary */}
      <Card>
        <div className="p-5">
          <h3 className="text-sm font-medium text-charcoal-600 mb-3">Blueprint Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div className="p-3 rounded-lg bg-ivory-100">
              <div className="text-xs text-charcoal-400">Total Marks</div>
              <div className="text-lg font-bold text-charcoal-700">{totalMarks}</div>
            </div>
            <div className="p-3 rounded-lg bg-ivory-100">
              <div className="text-xs text-charcoal-400">Questions</div>
              <div className="text-lg font-bold text-charcoal-700">{numQuestions}</div>
            </div>
            <div className="p-3 rounded-lg bg-ivory-100">
              <div className="text-xs text-charcoal-400">Marks/Question</div>
              <div className="text-lg font-bold text-charcoal-700">{Math.ceil(totalMarks / numQuestions)}</div>
            </div>
            <div className="p-3 rounded-lg bg-ivory-100">
              <div className="text-xs text-charcoal-400">Units Covered</div>
              <div className="text-lg font-bold text-charcoal-700">{syllabusUnits.length}</div>
            </div>
          </div>
        </div>
      </Card>

      <div className="flex justify-between">
        <button onClick={onBack} className="btn-secondary flex items-center gap-2">
          <ChevronLeft size={18} /> Back
        </button>
        <button onClick={onGenerate} disabled={generating} className="btn-primary flex items-center gap-2">
          {generating ? <LoadingSpinner size={16} /> : <Sparkles size={18} />}
          Generate Assessment
        </button>
      </div>
    </div>
  );
}

// ─── REVIEW STEP (Bloom/CO/PO Mapping) ──────────────────────────────────────

function ReviewStep({ questions, onEdit, onRegenerate, onDelete, onRunStressTest, onBack, testing, bloomDist }: any) {
  const bloomLevels = ['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create'];
  const bloomActual: Record<string, number> = {};
  const totalMarks = questions.reduce((s: number, q: Question) => s + q.marks, 0) || 1;
  for (const level of bloomLevels) {
    bloomActual[level] = Math.round((questions.filter((q: Question) => q.bloom_level === level).reduce((s: number, q: Question) => s + q.marks, 0) / totalMarks) * 100);
  }

  const coCoverage: Record<string, number> = {};
  for (const q of questions) {
    coCoverage[q.co_code] = (coCoverage[q.co_code] || 0) + q.marks;
  }

  return (
    <div className="space-y-4">
      {/* Bloom distribution chart */}
      <Card>
        <div className="p-5">
          <h2 className="text-lg font-serif font-semibold text-charcoal-700 mb-3">Bloom's Taxonomy Distribution</h2>
          <div className="space-y-2">
            {bloomLevels.map((level) => {
              const actual = bloomActual[level] || 0;
              const target = bloomDist[level] || 0;
              const diff = actual - target;
              return (
                <div key={level} className="flex items-center gap-3">
                  <span className="text-sm text-charcoal-500 w-28">{level}</span>
                  <div className="flex-1">
                    <ProgressBar value={actual} color={Math.abs(diff) > 10 ? 'terracotta' : 'sage'} showValue={false} />
                  </div>
                  <span className="text-sm font-medium text-charcoal-600 w-12 text-right">{actual}%</span>
                  <span className="text-xs text-charcoal-400 w-12 text-right">/{target}%</span>
                  {Math.abs(diff) > 10 && (
                    <Badge variant={diff < 0 ? 'warn' : 'neutral'}>{diff < 0 ? 'Below' : 'Above'}</Badge>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      {/* CO Coverage */}
      <Card>
        <div className="p-5">
          <h2 className="text-lg font-serif font-semibold text-charcoal-700 mb-3">CO Coverage</h2>
          <div className="flex flex-wrap gap-3">
            {Object.entries(coCoverage).map(([co, marks]) => (
              <div key={co} className="px-3 py-2 rounded-lg bg-ivory-100 border border-beige-200">
                <div className="text-sm font-medium text-charcoal-600">{co}</div>
                <div className="text-xs text-charcoal-400">{Math.round((marks / totalMarks) * 100)}% ({marks} marks)</div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Questions list */}
      <Card>
        <div className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-serif font-semibold text-charcoal-700">Generated Questions ({questions.length})</h2>
          </div>
          <div className="space-y-3">
            {questions.map((q: Question, i: number) => (
              <div key={q.id} className="p-4 rounded-lg bg-ivory-100 border border-beige-200">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-charcoal-400">Q{i + 1}</span>
                      <Badge variant="neutral">{q.marks} marks</Badge>
                      <Badge variant="neutral">{q.bloom_level}</Badge>
                      <Badge variant={q.difficulty === 'Hard' ? 'critical' : q.difficulty === 'Medium' ? 'warn' : 'good'}>
                        {q.difficulty}
                      </Badge>
                      <Badge variant="neutral">{q.co_code}</Badge>
                      {q.po_codes.map((po) => <Badge key={po} variant="neutral">{po}</Badge>)}
                    </div>
                    <p className="text-sm text-charcoal-600">{q.question_text}</p>
                    <div className="text-xs text-charcoal-400 mt-1">
                      {q.unit} → {q.topic} · Source: {q.source_reference}
                    </div>
                    {q.ambiguity_issues.length > 0 && (
                      <div className="mt-2 text-xs text-amber-600 flex items-center gap-1">
                        <AlertCircle size={12} /> {q.ambiguity_issues[0].problem}
                      </div>
                    )}
                    {q.ai_vulnerability === 'High' && (
                      <div className="mt-1 text-xs text-terracotta-600 flex items-center gap-1">
                        <ShieldCheck size={12} /> High AI vulnerability — heuristic estimate
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-1 flex-shrink-0">
                    <button onClick={() => onEdit(q)} className="p-1.5 text-charcoal-400 hover:text-sage-600 hover:bg-sage-50 rounded-lg transition-colors" title="Edit">
                      <Edit3 size={16} />
                    </button>
                    <button onClick={() => onRegenerate(q)} className="p-1.5 text-charcoal-400 hover:text-terracotta-600 hover:bg-terracotta-50 rounded-lg transition-colors" title="Regenerate">
                      <RefreshCw size={16} />
                    </button>
                    <button onClick={() => onDelete(q.id)} className="p-1.5 text-charcoal-400 hover:text-terracotta-600 hover:bg-terracotta-50 rounded-lg transition-colors" title="Delete">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <div className="flex justify-between">
        <button onClick={onBack} className="btn-secondary flex items-center gap-2">
          <ChevronLeft size={18} /> Back
        </button>
        <button onClick={onRunStressTest} disabled={testing} className="btn-accent flex items-center gap-2">
          {testing ? <LoadingSpinner size={16} /> : <ShieldCheck size={18} />}
          Run Exam Stress Test
        </button>
      </div>
    </div>
  );
}

// ─── FIX STEP (Stress Test Results + Fix Issues) ───────────────────────────

function FixStep({ analysis, questions, onFix, onEdit, onRegenerate, onProceed, onBack }: any) {
  const healthItems = [
    { label: 'Syllabus Coverage', score: analysis.syllabus_coverage, icon: FileText },
    { label: 'Bloom Balance', score: analysis.bloom_balance, icon: Layers },
    { label: 'CO Coverage', score: analysis.co_coverage, icon: Target },
    { label: 'PO Coverage', score: analysis.po_coverage, icon: Target },
    { label: 'Difficulty Balance', score: analysis.difficulty_balance, icon: TrendingUp },
    { label: 'Question Clarity', score: analysis.question_clarity, icon: CheckCircle },
    { label: 'Security', score: analysis.security_risk_score, icon: ShieldCheck },
  ];

  return (
    <div className="space-y-4">
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
            {healthItems.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="p-3 rounded-lg bg-ivory-100 border border-beige-200 text-center">
                  <Icon size={16} className="mx-auto mb-1 text-charcoal-400" />
                  <div className="text-lg font-bold text-charcoal-700">{item.score}%</div>
                  <div className="text-[10px] text-charcoal-400 leading-tight">{item.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Issues */}
      {analysis.issues.length > 0 && (
        <Card>
          <div className="p-5">
            <h2 className="text-lg font-serif font-semibold text-charcoal-700 mb-3">
              {analysis.issues.length} Issue{analysis.issues.length !== 1 ? 's' : ''} Need Attention
            </h2>
            <div className="space-y-3">
              {analysis.issues.map((issue: any, i: number) => (
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

      {/* Blind spots */}
      {analysis.blind_spots.length > 0 && (
        <Card>
          <div className="p-5">
            <h2 className="text-lg font-serif font-semibold text-charcoal-700 mb-3">Syllabus Blind Spots</h2>
            <div className="space-y-2">
              {analysis.blind_spots.map((bs: any, i: number) => (
                <div key={i} className="p-3 rounded-lg bg-terracotta-50 border border-terracotta-100">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-charcoal-700">{bs.unit}</span>
                    <Badge variant={bs.coverage === 0 ? 'critical' : 'warn'}>
                      {bs.coverage}% / {bs.expected}% expected
                    </Badge>
                  </div>
                  <p className="text-xs text-charcoal-500">{bs.recommendation}</p>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* CO-PO Matrix */}
      {Object.keys(analysis.co_po_matrix).length > 0 && (
        <Card>
          <div className="p-5">
            <h2 className="text-lg font-serif font-semibold text-charcoal-700 mb-3">CO-PO Coverage Matrix</h2>
            <div className="overflow-x-auto">
              <table className="text-sm">
                <thead>
                  <tr>
                    <th className="px-3 py-2 text-charcoal-400 text-xs font-medium"></th>
                    {Object.keys(analysis.co_po_matrix[Object.keys(analysis.co_po_matrix)[0]] || {}).map((po: string) => (
                      <th key={po} className="px-3 py-2 text-charcoal-400 text-xs font-medium text-center">{po}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(analysis.co_po_matrix).map(([co, poMap]: any) => (
                    <tr key={co}>
                      <td className="px-3 py-2 text-charcoal-600 font-medium text-xs">{co}</td>
                      {Object.entries(poMap).map(([po, level]: any) => (
                        <td key={po} className="px-3 py-2 text-center">
                          <span className={`inline-block w-12 py-1 rounded text-xs font-medium ${
                            level === 'High' ? 'bg-sage-100 text-sage-700' :
                            level === 'Med' ? 'bg-amber-100 text-amber-700' :
                            level === 'Low' ? 'bg-terracotta-100 text-terracotta-700' :
                            'bg-beige-100 text-charcoal-400'
                          }`}>
                            {level}
                          </span>
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

      {/* Questions with fix buttons */}
      <Card>
        <div className="p-5">
          <h2 className="text-lg font-serif font-semibold text-charcoal-700 mb-3">Questions — Fix Issues with AI</h2>
          <div className="space-y-2">
            {questions.map((q: Question, i: number) => {
              const hasIssue = q.ambiguity_issues.length > 0 || q.ai_vulnerability === 'High' || q.security_risk === 'High';
              return (
                <div key={q.id} className={`p-3 rounded-lg border flex items-center justify-between gap-3 ${
                  hasIssue ? 'bg-terracotta-50 border-terracotta-100' : 'bg-ivory-100 border-beige-200'
                }`}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-charcoal-400">Q{i + 1}</span>
                      <Badge variant="neutral">{q.bloom_level}</Badge>
                      {hasIssue && <Badge variant="warn">Needs Fix</Badge>}
                    </div>
                    <p className="text-sm text-charcoal-600 truncate">{q.question_text}</p>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    {hasIssue && (
                      <button onClick={() => onFix(q)} className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1">
                        <Wand2 size={14} /> Fix with AI
                      </button>
                    )}
                    <button onClick={() => onEdit(q)} className="btn-ghost text-xs">
                      <Edit3 size={14} />
                    </button>
                    <button onClick={() => onRegenerate(q)} className="btn-ghost text-xs">
                      <RefreshCw size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      <div className="flex justify-between">
        <button onClick={onBack} className="btn-secondary flex items-center gap-2">
          <ChevronLeft size={18} /> Back
        </button>
        <button onClick={onProceed} className="btn-primary flex items-center gap-2">
          Proceed to Answer Key <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}

// ─── ANSWER KEY STEP ────────────────────────────────────────────────────────

function AnswerKeyStep({ questions, onGenerateAll, onProceed, onBack, generating }: any) {
  const hasKeys = questions.some((q: Question) => q.answer_key.length > 0);

  return (
    <div className="space-y-4">
      <Card>
        <div className="p-5">
          <h2 className="text-lg font-serif font-semibold text-charcoal-700 mb-1">Answer Key Generation</h2>
          <p className="text-sm text-charcoal-400 mb-4">
            Generate expected answers and marking schemes for all questions. Each answer includes key points and step-wise marks allocation.
          </p>
          {!hasKeys ? (
            <button onClick={onGenerateAll} disabled={generating} className="btn-primary flex items-center gap-2">
              {generating ? <LoadingSpinner size={16} /> : <KeyRound size={18} />}
              Generate Answer Keys
            </button>
          ) : (
            <div className="space-y-3">
              {questions.map((q: Question, i: number) => (
                <div key={q.id} className="p-4 rounded-lg bg-ivory-100 border border-beige-200">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold text-charcoal-400">Q{i + 1}</span>
                    <Badge variant="neutral">{q.marks} marks</Badge>
                    <Badge variant="neutral">{q.bloom_level}</Badge>
                  </div>
                  <p className="text-sm text-charcoal-600 mb-2">{q.question_text}</p>
                  <div className="p-3 rounded-lg bg-sage-50 border border-sage-200">
                    <div className="text-xs font-medium text-sage-700 mb-1">Expected Answer:</div>
                    <p className="text-sm text-charcoal-600">{q.answer_key}</p>
                  </div>
                  <div className="mt-2">
                    <div className="text-xs font-medium text-charcoal-500 mb-1">Marking Scheme:</div>
                    <div className="space-y-1">
                      {q.marking_scheme.map((step, j) => (
                        <div key={j} className="flex items-center justify-between text-xs">
                          <span className="text-charcoal-500">{step.label}</span>
                          <span className="font-medium text-charcoal-600">{step.marks} marks</span>
                        </div>
                      ))}
                      <div className="flex items-center justify-between text-xs pt-1 border-t border-beige-200">
                        <span className="font-medium text-charcoal-600">Total</span>
                        <span className="font-bold text-charcoal-700">{q.marking_scheme.reduce((s, st) => s + st.marks, 0)} marks</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {hasKeys && (
        <div className="flex justify-between">
          <button onClick={onBack} className="btn-secondary flex items-center gap-2">
            <ChevronLeft size={18} /> Back
          </button>
          <button onClick={onProceed} className="btn-primary flex items-center gap-2">
            Generate Final Paper <ChevronRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
}

// ─── FINAL PAPER STEP ───────────────────────────────────────────────────────

function FinalPaperStep({ assessmentName, subject, totalMarks, questions, onFinalize, onBack, saving }: any) {
  const sectionA = questions.filter((q: Question) => q.marks <= 5);
  const sectionB = questions.filter((q: Question) => q.marks > 5);

  return (
    <div className="space-y-4">
      <Card>
        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-serif font-semibold text-charcoal-700">Final Question Paper</h2>
            <div className="flex gap-2">
              <button onClick={() => window.print()} className="btn-secondary text-sm">Export PDF</button>
            </div>
          </div>

          {/* Paper preview */}
          <div className="p-8 bg-white border border-beige-300 rounded-lg" id="question-paper">
            <div className="text-center mb-6 pb-4 border-b-2 border-charcoal-300">
              <h1 className="text-xl font-serif font-bold text-charcoal-700">{assessmentName}</h1>
              <p className="text-sm text-charcoal-500 mt-1">Subject: {subject}</p>
              <div className="flex justify-center gap-6 mt-2 text-xs text-charcoal-400">
                <span>Max Marks: {totalMarks}</span>
                <span>Duration: 3 Hours</span>
                <span>Date: ____________</span>
              </div>
            </div>

            <div className="text-xs text-charcoal-500 mb-4">
              <strong>Instructions:</strong> Answer all questions. Write clearly and show all steps where applicable. Marks are indicated against each question.
            </div>

            {sectionA.length > 0 && (
              <div className="mb-6">
                <h2 className="text-sm font-serif font-bold text-charcoal-700 mb-2">Section A (Short Answer Questions)</h2>
                <div className="space-y-3 pl-4">
                  {sectionA.map((q: Question, i: number) => (
                    <div key={q.id} className="flex gap-2">
                      <span className="text-sm font-medium text-charcoal-600">Q{i + 1}.</span>
                      <div className="flex-1">
                        <p className="text-sm text-charcoal-700">{q.question_text}</p>
                        <div className="text-xs text-charcoal-400 mt-0.5">({q.marks} marks) · {q.bloom_level} · {q.co_code}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {sectionB.length > 0 && (
              <div className="mb-6">
                <h2 className="text-sm font-serif font-bold text-charcoal-700 mb-2">Section B (Long Answer Questions)</h2>
                <div className="space-y-3 pl-4">
                  {sectionB.map((q: Question, i: number) => (
                    <div key={q.id} className="flex gap-2">
                      <span className="text-sm font-medium text-charcoal-600">Q{i + 1}.</span>
                      <div className="flex-1">
                        <p className="text-sm text-charcoal-700">{q.question_text}</p>
                        <div className="text-xs text-charcoal-400 mt-0.5">({q.marks} marks) · {q.bloom_level} · {q.co_code}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6 pt-4 border-t border-beige-200 text-xs text-charcoal-400 text-center">
              — End of Question Paper —
            </div>
          </div>
        </div>
      </Card>

      <div className="flex justify-between">
        <button onClick={onBack} className="btn-secondary flex items-center gap-2">
          <ChevronLeft size={18} /> Back
        </button>
        <button onClick={onFinalize} disabled={saving} className="btn-primary flex items-center gap-2">
          {saving ? <LoadingSpinner size={16} /> : <FileCheck size={18} />}
          Finalize & Save to Question Bank
        </button>
      </div>
    </div>
  );
}

// ─── EDIT QUESTION MODAL ────────────────────────────────────────────────────

function EditQuestionModal({ question, onSave, onClose, cos, pos }: any) {
  const [edited, setEdited] = useState<Question>(question);

  return (
    <Modal open={true} onClose={onClose} title="Edit Question" size="lg">
      <div className="space-y-4">
        <div>
          <label className="label-text">Question Text</label>
          <textarea
            className="input-field min-h-[100px]"
            value={edited.question_text}
            onChange={(e) => setEdited({ ...edited, question_text: e.target.value })}
          />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="label-text">Marks</label>
            <input type="number" className="input-field" value={edited.marks}
              onChange={(e) => setEdited({ ...edited, marks: parseInt(e.target.value) || 5 })} />
          </div>
          <div>
            <label className="label-text">Bloom Level</label>
            <select className="input-field" value={edited.bloom_level}
              onChange={(e) => setEdited({ ...edited, bloom_level: e.target.value })}>
              {['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create'].map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label-text">Difficulty</label>
            <select className="input-field" value={edited.difficulty}
              onChange={(e) => setEdited({ ...edited, difficulty: e.target.value })}>
              {['Easy', 'Medium', 'Hard'].map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label-text">CO</label>
            <select className="input-field" value={edited.co_code}
              onChange={(e) => setEdited({ ...edited, co_code: e.target.value })}>
              {cos.map((c: any) => <option key={c.code} value={c.code}>{c.code}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="label-text">Unit</label>
          <input className="input-field" value={edited.unit} onChange={(e) => setEdited({ ...edited, unit: e.target.value })} />
        </div>
        <div>
          <label className="label-text">Topic</label>
          <input className="input-field" value={edited.topic} onChange={(e) => setEdited({ ...edited, topic: e.target.value })} />
        </div>
        <div>
          <label className="label-text">PO Mapping</label>
          <div className="flex flex-wrap gap-2">
            {pos.map((po: any) => {
              const selected = edited.po_codes.includes(po.code);
              return (
                <button
                  key={po.code}
                  onClick={() => {
                    setEdited({
                      ...edited,
                      po_codes: selected
                        ? edited.po_codes.filter((p) => p !== po.code)
                        : [...edited.po_codes, po.code],
                    });
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    selected ? 'bg-sage-100 text-sage-700 border border-sage-300' : 'bg-beige-100 text-charcoal-400 border border-beige-200'
                  }`}
                >
                  {po.code}
                </button>
              );
            })}
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="btn-ghost">Cancel</button>
          <button onClick={() => onSave(edited)} className="btn-primary flex items-center gap-2">
            <CheckCircle size={16} /> Save Changes
          </button>
        </div>
      </div>
    </Modal>
  );
}
