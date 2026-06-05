'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function InterviewsRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/recruitment/candidates?tab=interviews');
  }, [router]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      gap: 16,
      color: 'var(--text-secondary)'
    }}>
      <Loader2 className="animate-spin" size={32} style={{ color: 'var(--primary)' }} />
      <p style={{ fontSize: 14, fontWeight: 500 }}>Redirecting to Candidates & Interviews dashboard...</p>
    </div>
  );
}
