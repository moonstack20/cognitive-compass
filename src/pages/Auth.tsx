import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Compass, Mail, Lock, User, Loader2 } from 'lucide-react';

export function AuthPage() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (mode === 'signup') {
      if (password.length < 6) {
        setError('Password must be at least 6 characters.');
        setLoading(false);
        return;
      }
      const { error } = await signUp(email, password, fullName);
      if (error) {
        setError(error);
        setLoading(false);
      }
    } else {
      const { error } = await signIn(email, password);
      if (error) {
        setError(error);
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen flex bg-ivory-50">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-beige-100 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-10 left-10 w-72 h-72 rounded-full bg-sage-400 blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-terracotta-300 blur-3xl" />
        </div>
        <div className="relative z-10 flex flex-col justify-center px-16 py-12">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-sage-500 flex items-center justify-center">
              <Compass size={26} className="text-white" />
            </div>
            <div>
              <h1 className="font-serif font-bold text-2xl text-charcoal-700">Cognitive Compass</h1>
              <p className="text-sm text-charcoal-400">AI-Powered Assessment Intelligence Platform</p>
            </div>
          </div>

          <h2 className="font-serif text-3xl font-bold text-charcoal-700 leading-tight mb-4">
            Create smarter assessments.<br />Validate them before students see them.
          </h2>
          <p className="text-charcoal-500 leading-relaxed mb-8">
            Generate question papers with AI, map them to Bloom's Taxonomy and Course Outcomes,
            stress-test for quality, and improve every question — all while keeping the teacher in control.
          </p>

          <div className="space-y-3">
            {[
              'AI question generation aligned with Bloom\'s Taxonomy',
              'Automatic CO/PO mapping and coverage analysis',
              'Exam Stress Test — find issues before students do',
              'AI security scanner for question vulnerability',
            ].map((feature) => (
              <div key={feature} className="flex items-center gap-3 text-sm text-charcoal-500">
                <div className="w-5 h-5 rounded-full bg-sage-200 flex items-center justify-center flex-shrink-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-sage-600" />
                </div>
                {feature}
              </div>
            ))}
          </div>

          <p className="text-xs text-charcoal-400 mt-10 italic">
            Techathon 2K26 · Problem Statement 4: Smart Assessment Generation & Outcome Mapper
          </p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="w-10 h-10 rounded-xl bg-sage-500 flex items-center justify-center">
              <Compass size={22} className="text-white" />
            </div>
            <h1 className="font-serif font-bold text-xl text-charcoal-700">Cognitive Compass</h1>
          </div>

          <h2 className="font-serif text-2xl font-bold text-charcoal-700 mb-1">
            {mode === 'signin' ? 'Welcome back' : 'Create your account'}
          </h2>
          <p className="text-sm text-charcoal-400 mb-6">
            {mode === 'signin' ? 'Sign in to your teacher account' : 'Start building intelligent assessments'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="label-text">Full Name</label>
                <div className="relative">
                  <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-300" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Prof. Jane Doe"
                    className="input-field pl-10"
                    required
                  />
                </div>
              </div>
            )}
            <div>
              <label className="label-text">Email</label>
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-300" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="teacher@college.edu"
                  className="input-field pl-10"
                  required
                />
              </div>
            </div>
            <div>
              <label className="label-text">Password</label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-300" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-field pl-10"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="text-sm text-terracotta-600 bg-terracotta-50 border border-terracotta-100 rounded-lg px-4 py-2.5">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  {mode === 'signin' ? 'Signing in...' : 'Creating account...'}
                </>
              ) : (
                mode === 'signin' ? 'Sign In' : 'Create Account'
              )}
            </button>
          </form>

          <p className="text-center text-sm text-charcoal-400 mt-6">
            {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
            <button
              onClick={() => {
                setMode(mode === 'signin' ? 'signup' : 'signin');
                setError(null);
              }}
              className="text-sage-600 font-medium hover:text-sage-700"
            >
              {mode === 'signin' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
