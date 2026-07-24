import { NextResponse } from 'next/server';
import { getProfile } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Authenticated diagnostic: reports how the app sees the CURRENT session —
// username, role and active status. Use it to confirm an admin account is
// recognised as admin (GET /api/whoami while logged in).
export async function GET() {
  const profile = await getProfile();
  if (!profile) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
  return NextResponse.json({
    authenticated: true,
    username: profile.username,
    full_name: profile.full_name,
    role: profile.role,
    is_active: profile.is_active,
    is_admin: profile.role === 'admin',
  });
}
