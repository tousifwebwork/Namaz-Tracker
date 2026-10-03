import { redirect } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { requireUser } from '@/lib/auth';

export default async function AppLayout({ children }) {
  let user;
  try {
    user = await requireUser();
  } catch (error) {
    if (error?.message === 'UNAUTHORIZED') redirect('/login');
    throw error;
  }

  return (
    <>
      <Navbar username={user.username} />
      <main className="mx-auto w-full max-w-5xl min-w-0 px-3 py-4 sm:px-4">
      {children}
      </main>
    </>
  );
}
