'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

import Navbar from '@/components/Navbar';

export default function AppLayout({ children }) {
  const router = useRouter(); const [user, setUser] = useState(null);
  
  useEffect(() => { 
    api('/api/auth/me')
    .then(d => setUser(d.username))
    .catch(() => router.replace('/login')); }, [router]);
  
    if (!user) 
      return <div className="grid min-h-screen place-items-center text-sm">Loading…</div>;
  
    return (
    <>
    <Navbar username={user} />
     <main className="mx-auto w-full max-w-5xl min-w-0 px-3 py-4 sm:px-4">
      {children}
     </main>
    </>
    );
}
