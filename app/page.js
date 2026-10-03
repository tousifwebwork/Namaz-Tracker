import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth';

export default async function Home() {
  try {
    await requireUser();
    redirect('/record');
  } catch (error) {
    if (error?.message !== 'UNAUTHORIZED') throw error;
    redirect('/login');
  }
}
