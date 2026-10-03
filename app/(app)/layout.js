'use client';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import Navbar from '@/components/Navbar';

export default function AppLayout({ children }) {
  const router = useRouter();
  const path = usePathname();
  const [user, setUser] = useState(null);

  useEffect(() => {
    api('/api/auth/me').then((d) => setUser(d.username)).catch(() => router.replace('/login'));
  }, [router]);

  if (!user) {
    return (
      <div className="mx-auto max-w-5xl space-y-4 p-4">
        <div className="h-14 animate-pulse rounded-xl bg-black/5" />
        <div className="h-40 animate-pulse rounded-xl bg-black/5" />
        <div className="h-64 animate-pulse rounded-xl bg-black/5" />
      </div>
    );
  }

  return (
    <Navbar username={user}>
      {/* fade only, no movement */}
      <motion.div key={path} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
        {children}
      </motion.div>
    </Navbar>
  );
}