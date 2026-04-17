'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(() => {
    return token ? 'loading' : 'error';
  });
  const [message, setMessage] = useState(() => {
    return token ? '' : 'No verification token provided.';
  });

  useEffect(() => {
    if (!token) {
      return;
    }

    fetch('/api/auth/verify-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (res.ok) {
          setStatus('success');
          setMessage(data.message || 'Email verified successfully!');
        } else {
          setStatus('error');
          setMessage(data.error || 'Verification failed. The link may have expired.');
        }
      })
      .catch(() => {
        setStatus('error');
        setMessage('Network error. Please try again.');
      });
  }, [token]);

  return (
    <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-sm border border-[#E85D9A]/20 text-center">
      <h1 className="text-3xl font-bold text-[#4A1B3C] mb-4">Email Verification</h1>
      
      {status === 'loading' && (
        <div className="flex flex-col items-center">
          <svg className="animate-spin h-10 w-10 text-[#E85D9A] mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-[#4A1B3C]/70">Verifying your email...</p>
        </div>
      )}

      {status === 'success' && (
        <div>
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
          </div>
          <p className="text-[#4A1B3C] mb-8">{message}</p>
          <Link href="/login" className="inline-block bg-[#E85D9A] hover:bg-[#d44d88] text-white py-3 px-8 rounded-lg font-medium transition-colors">
            Continue to Login
          </Link>
        </div>
      )}

      {status === 'error' && (
        <div>
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </div>
          <p className="text-red-600 mb-8">{message}</p>
          <Link href="/login" className="inline-block border border-[#E85D9A] text-[#E85D9A] hover:bg-[#FDF8F9] py-3 px-8 rounded-lg font-medium transition-colors">
            Back to Login
          </Link>
        </div>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FDF8F9]">
      <Suspense fallback={<div>Loading...</div>}>
        <VerifyEmailContent />
      </Suspense>
    </div>
  );
}
