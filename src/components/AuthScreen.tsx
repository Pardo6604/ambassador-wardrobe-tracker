import React, { useState } from 'react';
import { Shirt, ArrowRight, Lock, Mail, Sparkles, User as UserIcon } from 'lucide-react';
import { apiService } from '../services/api';

interface AuthScreenProps {
  onSignIn: (email: string) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onSignIn }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isRegistering) {
        const regRes = await apiService.register(email, password, name);
        if (regRes.success) {
          // auto login after register
          const loginRes = await apiService.login(email, password);
          if (loginRes.success) {
            onSignIn(email);
          } else {
            setError(loginRes.error || 'Registration succeeded, but login failed. Please try logging in.');
            setIsRegistering(false);
          }
        } else {
          setError(regRes.error || 'Registration failed.');
        }
      } else {
        const loginRes = await apiService.login(email, password);
        if (loginRes.success) {
          onSignIn(email);
        } else {
          setError(loginRes.error || 'Invalid email or password.');
        }
      }
    } catch (err: any) {
      setError(err?.message || 'A network error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="w-12 h-12 rounded-xl bg-neutral-900 text-white flex items-center justify-center mx-auto shadow-md">
          <Shirt className="w-6 h-6 stroke-[2]" />
        </div>
        <h2 className="mt-4 text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-900 font-['Syne',sans-serif]">
          ClosetPR
        </h2>
        <p className="mt-1 text-xs sm:text-sm text-neutral-500">
          Brand Ambassador Wardrobe & Campaign Inventory
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-xl rounded-2xl border border-neutral-200/80">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-center">
                {error}
              </div>
            )}
            
            {isRegistering && (
              <div>
                <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your Full Name"
                    className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-white border border-neutral-200 rounded-lg text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">
                Ambassador Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-white border border-neutral-200 rounded-lg text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-white border border-neutral-200 rounded-lg text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg shadow-sm transition-all active:scale-[0.99] cursor-pointer min-h-[42px]"
              >
                <span>{loading ? (isRegistering ? 'Registering...' : 'Signing in...') : (isRegistering ? 'Create Account' : 'Sign In')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>

          <div className="mt-4 text-center">
            <button
              onClick={() => setIsRegistering(!isRegistering)}
              className="text-xs text-neutral-500 hover:text-neutral-900 transition-colors"
            >
              {isRegistering ? 'Already have an account? Sign in.' : "Don't have an account? Register."}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
