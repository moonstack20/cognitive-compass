import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { CheckCircle, User, Building2, GraduationCap } from 'lucide-react';

export function Settings() {
  const { profile, user } = useAuth();
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [institution, setInstitution] = useState(profile?.institution || '');
  const [department, setDepartment] = useState(profile?.department || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setInstitution(profile.institution || '');
      setDepartment(profile.department || '');
    }
    setLoading(false);
  }, [profile]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setSaved(false);
    await supabase.from('profiles').upsert({
      id: user.id,
      full_name: fullName,
      institution,
      department,
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  if (loading) return <LoadingSpinner size={32} label="Loading settings..." />;

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div>
        <h1 className="text-2xl lg:text-3xl font-serif font-bold text-charcoal-700">Settings</h1>
        <p className="text-charcoal-400 mt-1">Manage your teacher profile and preferences</p>
      </div>

      <Card>
        <div className="p-5">
          <h2 className="text-lg font-serif font-semibold text-charcoal-700 mb-4">Teacher Profile</h2>
          <div className="space-y-4">
            <div>
              <label className="label-text">Full Name</label>
              <div className="relative">
                <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-300" />
                <input className="input-field pl-10" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Prof. Jane Doe" />
              </div>
            </div>
            <div>
              <label className="label-text">Email</label>
              <input className="input-field bg-beige-50 cursor-not-allowed" value={user?.email || ''} disabled />
            </div>
            <div>
              <label className="label-text">Institution</label>
              <div className="relative">
                <Building2 size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-300" />
                <input className="input-field pl-10" value={institution} onChange={(e) => setInstitution(e.target.value)} placeholder="National Institute of Technology" />
              </div>
            </div>
            <div>
              <label className="label-text">Department</label>
              <div className="relative">
                <GraduationCap size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-300" />
                <input className="input-field pl-10" value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="Computer Science & Engineering" />
              </div>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2">
                {saving ? <LoadingSpinner size={16} /> : <CheckCircle size={18} />}
                Save Changes
              </button>
              {saved && <span className="text-sm text-sage-600 animate-fade-in">Profile updated successfully</span>}
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <div className="p-5">
          <h2 className="text-lg font-serif font-semibold text-charcoal-700 mb-2">About Cognitive Compass</h2>
          <p className="text-sm text-charcoal-500 leading-relaxed">
            Cognitive Compass is an AI-powered assessment intelligence platform designed for educators.
            It helps teachers create, analyze, stress-test, and improve assessments while keeping them
            in full control of every decision.
          </p>
          <div className="mt-3 p-3 rounded-lg bg-beige-50 border border-beige-200">
            <p className="text-xs text-charcoal-400">
              Techathon 2K26 · Problem Statement 4: Smart Assessment Generation & Outcome Mapper
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
