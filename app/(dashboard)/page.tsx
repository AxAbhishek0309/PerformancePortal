'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export default function DashboardPage() {
  const router = useRouter();
  const { role } = useAuth();

  useEffect(() => {
    if (role) {
      // Redirect based on role
      router.push(`/${role}`);
    }
  }, [role, router]);

  return null;
}
