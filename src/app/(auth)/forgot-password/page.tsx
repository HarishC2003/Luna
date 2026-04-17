'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      // Always show success to prevent email enumeration
      setSuccess(true);
    } catch (err) {
      setSuccess(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FDF8F9]">
      <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-sm border border-[#E85D9A]/20">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#4A1B3C]">Reset Password</h1>
          <p className="text-[#4A1B3C]/70 mt-2">Enter your email to receive a reset link</p>
        </div>

        {success ? (
          <div className="text-center">
            <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-lg text-sm">
              If that email exists, we sent a link to reset your password.
            </div>
            <Link href="/login" className="text-[#E85D9A] hover:underline font-medium">
              Return to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-[#4A1B3C] mb-2" htmlFor="email">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-[#E85D9A] focus:ring-2 focus:ring-[#E85D9A]/20 outline-none transition-all"
                placeholder="you@example.com"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#E85D9A] hover:bg-[#d44d88] text-white py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
            >
              {loading ? (
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                'Send Reset Link'
              )}
            </button>

            <div className="text-center">
              <Link href="/login" className="text-sm text-[#4A1B3C]/70 hover:text-[#E85D9A] transition-colors">
                Back to Login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
