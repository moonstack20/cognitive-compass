import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import type { QuestionBankItem } from '@/types';
import {
  Library, Search, Edit3, Trash2, Plus, Filter, X, CheckCircle,
} from 'lucide-react';

export function QuestionBank() {
  const { user } = useAuth();
  const [items, setItems] = useState<QuestionBankItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [filterBloom, setFilterBloom] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState('');
  const [filterCO, setFilterCO] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [editing, setEditing] = useState<QuestionBankItem | null>(null);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('question_bank_items').select('*').order('created_at', { ascending: false });
      setItems(data || []);
      setLoading(false);
    })();
  }, []);

  const filtered = items.filter((item) => {
    if (search && !item.question_text.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterSubject && item.subject !== filterSubject) return false;
    if (filterBloom && item.bloom_level !== filterBloom) return false;
    if (filterDifficulty && item.difficulty !== filterDifficulty) return false;
    if (filterCO && item.co_code !== filterCO) return false;
    return true;
  });

  const handleDelete = async (id: string) => {
    setItems(items.filter((i) => i.id !== id));
    await supabase.from('question_bank_items').delete().eq('id', id);
  };

  const handleSave = async (item: QuestionBankItem) => {
    if (editing) {
      setItems(items.map((i) => (i.id === item.id ? item : i)));
      await supabase.from('question_bank_items').update({
        question_text: item.question_text,
        subject: item.subject,
        unit: item.unit,
        topic: item.topic,
        bloom_level: item.bloom_level,
        difficulty: item.difficulty,
        co_code: item.co_code,
        po_codes: item.po_codes,
        marks: item.marks,
      }).eq('id', item.id);
    } else {
      const { data } = await supabase.from('question_bank_items').insert({
        user_id: user?.id,
        question_text: item.question_text,
        subject: item.subject,
        unit: item.unit,
        topic: item.topic,
        bloom_level: item.bloom_level,
        difficulty: item.difficulty,
        co_code: item.co_code,
        po_codes: item.po_codes,
        question_type: item.question_type,
        source: item.source,
        security_risk: item.security_risk,
        status: 'available',
        marks: item.marks,
      }).select().single();
      if (data) setItems([data, ...items]);
    }
    setEditing(null);
    setAdding(false);
  };

  const subjects = [...new Set(items.map((i) => i.subject).filter(Boolean))];
  const coCodes = [...new Set(items.map((i) => i.co_code).filter(Boolean))];

  if (loading) return <LoadingSpinner size={32} label="Loading question bank..." />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-serif font-bold text-charcoal-700">Question Bank</h1>
          <p className="text-charcoal-400 mt-1">{items.length} questions in your reusable library</p>
        </div>
        <button onClick={() => setAdding(true)} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> Add Question
        </button>
      </div>

      {/* Search & Filters */}
      <Card>
        <div className="p-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-300" />
              <input
                className="input-field pl-10"
                placeholder="Search questions..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button onClick={() => setShowFilters(!showFilters)} className="btn-secondary flex items-center gap-2">
              <Filter size={18} /> Filters
            </button>
          </div>
          {showFilters && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
              <select className="input-field" value={filterSubject} onChange={(e) => setFilterSubject(e.target.value)}>
                <option value="">All Subjects</option>
                {subjects.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <select className="input-field" value={filterBloom} onChange={(e) => setFilterBloom(e.target.value)}>
                <option value="">All Bloom Levels</option>
                {['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create'].map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
              <select className="input-field" value={filterDifficulty} onChange={(e) => setFilterDifficulty(e.target.value)}>
                <option value="">All Difficulties</option>
                {['Easy', 'Medium', 'Hard'].map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
              <select className="input-field" value={filterCO} onChange={(e) => setFilterCO(e.target.value)}>
                <option value="">All COs</option>
                {coCodes.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          )}
        </div>
      </Card>

      {/* Items */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<Library size={28} />}
          title="No questions found"
          description="Add questions to your bank or adjust your filters to see more results."
          action={<button onClick={() => setAdding(true)} className="btn-primary flex items-center gap-2"><Plus size={18} /> Add Question</button>}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {filtered.map((item) => (
            <Card key={item.id}>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge variant="neutral">{item.marks} marks</Badge>
                    <Badge variant="neutral">{item.bloom_level}</Badge>
                    <Badge variant={item.difficulty === 'Hard' ? 'critical' : item.difficulty === 'Medium' ? 'warn' : 'good'}>
                      {item.difficulty}
                    </Badge>
                    {item.co_code && <Badge variant="neutral">{item.co_code}</Badge>}
                    {item.security_risk === 'High' && <Badge variant="critical">High Risk</Badge>}
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button onClick={() => setEditing(item)} className="p-1.5 text-charcoal-400 hover:text-sage-600 hover:bg-sage-50 rounded-lg">
                      <Edit3 size={16} />
                    </button>
                    <button onClick={() => handleDelete(item.id)} className="p-1.5 text-charcoal-400 hover:text-terracotta-600 hover:bg-terracotta-50 rounded-lg">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-charcoal-600">{item.question_text}</p>
                <div className="text-xs text-charcoal-400 mt-2">
                  {item.subject} · {item.unit} → {item.topic}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit modal */}
      {(editing || adding) && (
        <QuestionFormModal
          item={editing}
          onSave={handleSave}
          onClose={() => { setEditing(null); setAdding(false); }}
        />
      )}
    </div>
  );
}

function QuestionFormModal({ item, onSave, onClose }: { item: QuestionBankItem | null; onSave: (item: QuestionBankItem) => void; onClose: () => void }) {
  const [form, setForm] = useState<QuestionBankItem>(
    item || {
      id: '', user_id: '', question_text: '', subject: '', unit: '', topic: '',
      bloom_level: 'Understand', difficulty: 'Medium', co_code: 'CO1', po_codes: ['PO1'],
      question_type: 'Long Answer', source: '', security_risk: 'Low', status: 'available', marks: 5, created_at: '',
    }
  );

  return (
    <Modal open={true} onClose={onClose} title={item ? 'Edit Question' : 'Add Question'} size="lg">
      <div className="space-y-4">
        <div>
          <label className="label-text">Question Text</label>
          <textarea className="input-field min-h-[100px]" value={form.question_text}
            onChange={(e) => setForm({ ...form, question_text: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div>
            <label className="label-text">Subject</label>
            <input className="input-field" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
          </div>
          <div>
            <label className="label-text">Unit</label>
            <input className="input-field" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
          </div>
          <div>
            <label className="label-text">Topic</label>
            <input className="input-field" value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} />
          </div>
          <div>
            <label className="label-text">Marks</label>
            <input type="number" className="input-field" value={form.marks} onChange={(e) => setForm({ ...form, marks: parseInt(e.target.value) || 5 })} />
          </div>
          <div>
            <label className="label-text">Bloom Level</label>
            <select className="input-field" value={form.bloom_level} onChange={(e) => setForm({ ...form, bloom_level: e.target.value })}>
              {['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create'].map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <div>
            <label className="label-text">Difficulty</label>
            <select className="input-field" value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })}>
              {['Easy', 'Medium', 'Hard'].map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="label-text">CO Code</label>
            <input className="input-field" value={form.co_code} onChange={(e) => setForm({ ...form, co_code: e.target.value })} />
          </div>
          <div>
            <label className="label-text">Question Type</label>
            <select className="input-field" value={form.question_type} onChange={(e) => setForm({ ...form, question_type: e.target.value })}>
              {['Short Answer', 'Long Answer', 'MCQ', 'True/False'].map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="btn-ghost">Cancel</button>
          <button onClick={() => onSave(form)} className="btn-primary flex items-center gap-2">
            <CheckCircle size={16} /> Save
          </button>
        </div>
      </div>
    </Modal>
  );
}
