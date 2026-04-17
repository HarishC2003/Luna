'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    password: '',
    confirmPassword: '',
    website: '', // honeypot
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const calculateStrength = (pass: string) => {
    let score = 0;
    if (pass.length > 7) score += 1;
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score < 2) return { label: 'Weak', color: 'bg-red-400' };
    if (score < 4) return { label: 'Fair', color: 'bg-yellow-400' };
    return { label: 'Strong', color: 'bg-green-400' };
  };

  const strength = calculateStrength(formData.password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.website) return; // Silent reject honeypot
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: formData.displayName,
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Registration failed');
      } else {
        setSuccessMsg(data.message || 'Check your email to verify your account');
        setFormData({ ...formData, displayName: '', email: '', password: '', confirmPassword: '' });
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FDF8F9] py-12">
      <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-sm border border-[#E85D9A]/20">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#4A1B3C]">Join Luna</h1>
          <p className="text-[#4A1B3C]/70 mt-2">Create your account to get started</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg text-sm">
            {error}
          </div>
        )}
        
        {successMsg && (
          <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-lg text-sm">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <input
            type="text"
            name="website"
            value={formData.website}
            onChange={(e) => setFormData({ ...formData, website: e.target.value })}
            className="hidden"
            tabIndex={-1}
            autoComplete="off"
          />

          <div>
            <label className="block text-sm font-medium text-[#4A1B3C] mb-2" htmlFor="displayName">
              Display Name
            </label>
            <input
              id="displayName"
              required
              value={formData.displayName}
              onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
              className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-[#E85D9A] focus:ring-2 focus:ring-[#E85D9A]/20 outline-none transition-all"
              placeholder="How should we call you?"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#4A1B3C] mb-2" htmlFor="email">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-[#E85D9A] focus:ring-2 focus:ring-[#E85D9A]/20 outline-none transition-all"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <label className="block text-sm font-medium text-[#4A1B3C]" htmlFor="password">
                Password
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-xs text-[#E85D9A] hover:underline"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-[#E85D9A] focus:ring-2 focus:ring-[#E85D9A]/20 outline-none transition-all"
              placeholder="••••••••"
            />
            {formData.password && (
              <div className="mt-2 flex items-center gap-2">
                <div className="h-1 flex-1 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full ${strength.color} transition-all duration-300`} style={{ width: strength.label === 'Weak' ? '33%' : strength.label === 'Fair' ? '66%' : '100%' }}></div>
                </div>
                <span className="text-xs text-[#4A1B3C]/70 w-10 text-right">{strength.label}</span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-[#4A1B3C] mb-2" htmlFor="confirmPassword">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              required
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-[#E85D9A] focus:ring-2 focus:ring-[#E85D9A]/20 outline-none transition-all"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 bg-[#E85D9A] hover:bg-[#d44d88] text-white py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
          >
            {loading ? (
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-[#4A1B3C]/70">
          Already have an account?{' '}
          <Link href="/login" className="text-[#E85D9A] hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
