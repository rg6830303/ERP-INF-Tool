'use client';

import { useEffect, useState } from 'react';
import {
  Users2,
  Plus,
  Loader2,
  ShieldCheck,
  UserCog,
  Trash2,
  RefreshCw,
  KeyRound,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Drawer } from '@/components/ui/Drawer';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatDateTime } from '@/lib/format';

type UserRow = {
  id: string;
  username: string;
  full_name: string | null;
  role: 'admin' | 'employee';
  is_active: boolean;
  created_at: string;
  last_sign_in_at: string | null;
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [mode, setMode] = useState<'create' | 'edit' | null>(null);
  const [editing, setEditing] = useState<UserRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [form, setForm] = useState({
    username: '',
    full_name: '',
    password: '',
    role: 'employee' as 'admin' | 'employee',
    is_active: true,
  });

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/users');
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to load users');
      setUsers(json.users);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function flash(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  function openCreate() {
    setMode('create');
    setEditing(null);
    setForm({ username: '', full_name: '', password: '', role: 'employee', is_active: true });
    setFormError(null);
  }

  function openEdit(u: UserRow) {
    setMode('edit');
    setEditing(u);
    setForm({
      username: u.username,
      full_name: u.full_name ?? '',
      password: '',
      role: u.role,
      is_active: u.is_active,
    });
    setFormError(null);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    try {
      if (mode === 'create') {
        const res = await fetch('/api/admin/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: form.username,
            password: form.password,
            full_name: form.full_name,
            role: form.role,
          }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Failed to create user');
        flash(`Account “${form.username}” created.`);
      } else if (mode === 'edit' && editing) {
        const body: Record<string, unknown> = {
          full_name: form.full_name || null,
          role: form.role,
          is_active: form.is_active,
        };
        if (form.password) body.password = form.password;
        const res = await fetch(`/api/admin/users/${editing.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Failed to update user');
        flash(`Account “${editing.username}” updated.`);
      }
      setMode(null);
      load();
    } catch (e: any) {
      setFormError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(u: UserRow) {
    try {
      const res = await fetch(`/api/admin/users/${u.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !u.is_active }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      flash(`${u.username} ${u.is_active ? 'disabled' : 'enabled'}.`);
      load();
    } catch (e: any) {
      flash(e.message);
    }
  }

  async function remove(u: UserRow) {
    if (!confirm(`Permanently delete “${u.username}”? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/admin/users/${u.id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      flash(`${u.username} deleted.`);
      load();
    } catch (e: any) {
      flash(e.message);
    }
  }

  return (
    <div>
      <PageHeader
        title="Employee Accounts"
        subtitle="Master control over every user account and its access."
        icon={Users2}
        action={
          <>
            <button onClick={load} className="btn-secondary" title="Refresh">
              <RefreshCw className="h-4 w-4" />
            </button>
            <button onClick={openCreate} className="btn-primary">
              <Plus className="h-4 w-4" /> New Account
            </button>
          </>
        }
      />

      {toast && (
        <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700">
          {toast}
        </div>
      )}
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Username</th>
              <th>Full Name</th>
              <th>Role</th>
              <th>Status</th>
              <th>Last Sign-in</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-400">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-400">
                  No accounts yet.
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id}>
                  <td className="font-medium text-slate-900">@{u.username}</td>
                  <td>{u.full_name || '—'}</td>
                  <td>
                    {u.role === 'admin' ? (
                      <span className="badge inline-flex items-center gap-1 bg-brand-100 text-brand-700">
                        <ShieldCheck className="h-3.5 w-3.5" /> Admin
                      </span>
                    ) : (
                      <span className="badge bg-slate-100 text-slate-600">Employee</span>
                    )}
                  </td>
                  <td>
                    <button onClick={() => toggleActive(u)} title="Toggle active">
                      <StatusBadge value={u.is_active ? 'active' : 'inactive'} />
                    </button>
                  </td>
                  <td className="text-slate-500">
                    {u.last_sign_in_at ? formatDateTime(u.last_sign_in_at) : 'Never'}
                  </td>
                  <td>
                    <div className="flex justify-end gap-1">
                      <button onClick={() => openEdit(u)} className="btn-ghost p-1.5" title="Edit">
                        <UserCog className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => remove(u)}
                        className="btn-ghost p-1.5 text-red-500 hover:bg-red-50"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Drawer
        open={mode !== null}
        title={mode === 'create' ? 'New Account' : `Edit @${editing?.username ?? ''}`}
        subtitle={
          mode === 'create'
            ? 'Provision a new employee or admin login.'
            : 'Update role, status or reset the password.'
        }
        onClose={() => setMode(null)}
      >
        <form onSubmit={submit} className="space-y-4">
          {formError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {formError}
            </div>
          )}

          <div>
            <label className="label">
              Username {mode === 'create' && <span className="text-red-500">*</span>}
            </label>
            <input
              className="input"
              value={form.username}
              disabled={mode === 'edit'}
              autoCapitalize="none"
              onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))}
              placeholder="e.g. rakesh"
            />
            {mode === 'edit' && (
              <p className="mt-1 text-xs text-slate-400">Username cannot be changed.</p>
            )}
          </div>

          <div>
            <label className="label">Full Name</label>
            <input
              className="input"
              value={form.full_name}
              onChange={(e) => setForm((p) => ({ ...p, full_name: e.target.value }))}
            />
          </div>

          <div>
            <label className="label">
              {mode === 'create' ? (
                <>
                  Password <span className="text-red-500">*</span>
                </>
              ) : (
                'Reset Password (leave blank to keep)'
              )}
            </label>
            <div className="relative">
              <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                className="input pl-9"
                value={form.password}
                onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                placeholder="Minimum 8 characters"
              />
            </div>
          </div>

          <div>
            <label className="label">Role</label>
            <select
              className="input"
              value={form.role}
              onChange={(e) => setForm((p) => ({ ...p, role: e.target.value as 'admin' | 'employee' }))}
            >
              <option value="employee">Employee (user portal)</option>
              <option value="admin">Administrator (full access)</option>
            </select>
          </div>

          {mode === 'edit' && (
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 text-brand-600"
                checked={form.is_active}
                onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))}
              />
              Account active (can sign in)
            </label>
          )}

          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <button type="button" onClick={() => setMode(null)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Saving…
                </>
              ) : mode === 'create' ? (
                'Create Account'
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </Drawer>
    </div>
  );
}
