import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, AlertCircle, Loader, Key, LogIn } from 'lucide-react';
import { authAPI } from '../api';

export default function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await authAPI.login(username, password);
      navigate('/');
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.detail || 
        'Failed to log in. Please check your credentials.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (user) => {
    setUsername(user);
    setPassword('student123');
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 dark:bg-slate-950 transition-colors duration-300 overflow-hidden">
      {/* Background blobs for premium glassmorphism aesthetic */}
      <div className="absolute top-1/4 left-1/4 -z-10 h-72 w-72 rounded-full bg-violet-300 opacity-20 blur-3xl dark:bg-violet-900/10"></div>
      <div className="absolute bottom-1/4 right-1/4 -z-10 h-96 w-96 rounded-full bg-indigo-300 opacity-20 blur-3xl dark:bg-indigo-900/10"></div>

      <div className="w-full max-w-md space-y-8 rounded-2xl border border-slate-200/80 bg-white/70 p-8 shadow-xl backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-900/70 transition-all duration-300">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-violet-100 text-violet-600 dark:bg-violet-950/50 dark:text-violet-400">
            <BookOpen className="h-7 w-7 animate-pulse" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
            Sign in to Academia
          </h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Enter your student credentials below
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          {error && (
            <div className="flex items-center space-x-2 rounded-lg bg-rose-50 p-4 text-sm text-rose-700 dark:bg-rose-950/20 dark:text-rose-400">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-4 rounded-md shadow-sm">
            <div>
              <label htmlFor="username-address" className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                Username
              </label>
              <input
                id="username-address"
                name="username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="block w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-slate-900 placeholder-slate-400 shadow-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder-slate-500 transition-all duration-200"
                placeholder="e.g., student1"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-slate-900 placeholder-slate-400 shadow-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder-slate-500 transition-all duration-200"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative flex w-full justify-center rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 disabled:bg-violet-400 dark:bg-violet-700 dark:hover:bg-violet-850 dark:focus:ring-offset-slate-900 transition-all duration-200"
            >
              {loading ? (
                <Loader className="h-5 w-5 animate-spin text-white/80" />
              ) : (
                <>
                  <LogIn className="h-5 w-5 mr-1.5 text-violet-200 group-hover:scale-110 transition-transform duration-200" />
                  Sign In
                </>
              )}
            </button>
          </div>
        </form>

        {/* Quick Seeder Login Section */}
        <div className="pt-6 border-t border-slate-200/80 dark:border-slate-800/80">
          <div className="flex items-center space-x-1.5 text-sm text-slate-500 dark:text-slate-400 mb-3 justify-center">
            <Key className="h-4 w-4 text-violet-500" />
            <span className="font-medium">Quick Seed Logins (Password: student123)</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {['student1', 'student2', 'student3'].map((user) => (
              <button
                key={user}
                onClick={() => handleQuickLogin(user)}
                className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-900 transition-all duration-200"
              >
                {user}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
