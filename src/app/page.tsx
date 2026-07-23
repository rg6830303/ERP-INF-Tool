import { redirect } from 'next/navigation';
import { getProfile } from '@/lib/auth';

// Entry point: send signed-in users to their dashboard, everyone else to login.
export default async function Home() {
  const profile = await getProfile();
  redirect(profile ? '/dashboard' : '/login');
}
