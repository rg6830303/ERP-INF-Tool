import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireApiAdmin } from '@/lib/api-auth';
import { usernameToEmail } from '@/lib/constants';

export const dynamic = 'force-dynamic';

// GET /api/admin/users — list all employee & admin accounts.
export async function GET() {
  const auth = await requireApiAdmin();
  if (!auth.ok) return auth.response;

  const { data: profiles, error } = await auth.admin
    .from('profiles')
    .select('id, username, full_name, role, is_active, created_at')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Enrich with last sign-in time from the auth system.
  const lastSignIn = new Map<string, string | null>();
  try {
    const { data } = await auth.admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    for (const u of data.users) lastSignIn.set(u.id, u.last_sign_in_at ?? null);
  } catch {
    /* non-fatal */
  }

  const users = (profiles ?? []).map((p) => ({
    ...p,
    last_sign_in_at: lastSignIn.get(p.id) ?? null,
  }));

  return NextResponse.json({ users });
}

const createSchema = z.object({
  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, 'Username must be at least 3 characters')
    .max(32)
    .regex(/^[a-z0-9._-]+$/, 'Use only letters, numbers, dot, underscore or hyphen'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(200),
  full_name: z.string().trim().max(120).optional().or(z.literal('')),
  role: z.enum(['admin', 'employee']).default('employee'),
});

// POST /api/admin/users — create a new account (pre-confirmed, ready to log in).
export async function POST(request: Request) {
  const auth = await requireApiAdmin();
  if (!auth.ok) return auth.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? 'Invalid input' },
      { status: 400 },
    );
  }

  const { username, password, full_name, role } = parsed.data;

  const { data, error } = await auth.admin.auth.admin.createUser({
    email: usernameToEmail(username),
    password,
    email_confirm: true,
    user_metadata: {
      username,
      full_name: full_name || null,
      role,
      created_by: auth.userId,
    },
  });

  if (error) {
    const msg = /already/i.test(error.message)
      ? 'That username is already taken.'
      : error.message;
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  return NextResponse.json({ id: data.user?.id, username }, { status: 201 });
}
