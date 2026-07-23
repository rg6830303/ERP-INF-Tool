import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireApiAdmin } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';

const patchSchema = z.object({
  full_name: z.string().trim().max(120).nullable().optional(),
  role: z.enum(['admin', 'employee']).optional(),
  is_active: z.boolean().optional(),
  password: z.string().min(8, 'Password must be at least 8 characters').max(200).optional(),
});

// PATCH /api/admin/users/[id] — update profile fields and/or reset password.
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const auth = await requireApiAdmin();
  if (!auth.ok) return auth.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? 'Invalid input' },
      { status: 400 },
    );
  }

  const { full_name, role, is_active, password } = parsed.data;

  // Safety: an admin cannot deactivate or demote their own account (avoids
  // accidental self-lockout).
  if (params.id === auth.userId && (is_active === false || role === 'employee')) {
    return NextResponse.json(
      { error: 'You cannot deactivate or demote your own admin account.' },
      { status: 400 },
    );
  }

  const profilePatch: Record<string, unknown> = {};
  if (full_name !== undefined) profilePatch.full_name = full_name;
  if (role !== undefined) profilePatch.role = role;
  if (is_active !== undefined) profilePatch.is_active = is_active;

  if (Object.keys(profilePatch).length > 0) {
    const { error } = await auth.admin.from('profiles').update(profilePatch).eq('id', params.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (password) {
    const { error } = await auth.admin.auth.admin.updateUserById(params.id, { password });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

// DELETE /api/admin/users/[id] — permanently remove an account.
export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const auth = await requireApiAdmin();
  if (!auth.ok) return auth.response;

  if (params.id === auth.userId) {
    return NextResponse.json({ error: 'You cannot delete your own account.' }, { status: 400 });
  }

  // Deleting the auth user cascades to the profile row (FK on delete cascade).
  const { error } = await auth.admin.auth.admin.deleteUser(params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
