import React, { useEffect, useState } from 'react';
import { useUsers } from '../context/UserContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { apiErrorMessage } from '../utils/apiError.js';
import ConfirmModal from '../components/ConfirmModal.jsx';
import ToggleSwitch from '../components/ToggleSwitch.jsx';
import SubmitButton from '../components/SubmitButton.jsx';
import StatRow from '../components/StatRow.jsx';
import IconTextButton from '../components/IconTextButton.jsx';
import { IconPlus, IconTrash, IconEdit, IconSearch } from '../components/icons.jsx';

function AddUserModal({ onClose, onSave }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({}); // { username, password }
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    const next = {};
    if (!username.trim()) next.username = 'Enter a username.';
    if (!password.trim()) next.password = 'Enter a password.';
    if (Object.keys(next).length > 0) {
      setErrors(next);
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      await onSave(username, password);
    } catch {
      // parent already showed a toast with the reason; keep the modal open to retry
    }
    setSubmitting(false);
  }

  return (
    <div className="fixed inset-0 bg-ink/40 flex items-center justify-center z-50" onClick={onClose}>
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-lg shadow-md w-[420px] max-w-[92vw]"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-line">
          <h3 className="font-display font-semibold text-lg">Add POS User</h3>
          <button type="button" onClick={onClose} className="text-ink-soft hover:text-ink text-xl leading-none">
            ×
          </button>
        </div>
        <div className="px-5 py-4 space-y-3">
          <div>
            <label className="block text-xs font-medium text-ink-soft mb-1.5">Username</label>
            <input
              autoFocus
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setErrors((prev) => ({ ...prev, username: undefined }));
              }}
              placeholder="e.g. counter3"
              className={`w-full border rounded-md px-3 py-2 text-sm outline-none ${errors.username ? 'border-rust' : 'border-line'}`}
            />
            {errors.username && <p className="text-xs text-rust mt-1">{errors.username}</p>}
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-soft mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setErrors((prev) => ({ ...prev, password: undefined }));
              }}
              placeholder="Password"
              className={`w-full border rounded-md px-3 py-2 text-sm outline-none ${errors.password ? 'border-rust' : 'border-line'}`}
            />
            {errors.password && <p className="text-xs text-rust mt-1">{errors.password}</p>}
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-line">
          <button type="button" onClick={onClose} disabled={submitting} className="btn-secondary text-sm disabled:opacity-50">
            Cancel
          </button>
          <SubmitButton submitting={submitting}>Add User</SubmitButton>
        </div>
      </form>
    </div>
  );
}

function ResetPasswordModal({ user, onClose, onSave }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!password.trim()) {
      setError('Enter a new password.');
      return;
    }
    setSubmitting(true);
    try {
      await onSave(password);
    } catch {
      // parent already showed a toast with the reason; keep the modal open to retry
    }
    setSubmitting(false);
  }

  return (
    <div className="fixed inset-0 bg-ink/40 flex items-center justify-center z-50" onClick={onClose}>
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-lg shadow-md w-[420px] max-w-[92vw]"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-line">
          <h3 className="font-display font-semibold text-lg">Reset Password</h3>
          <button type="button" onClick={onClose} className="text-ink-soft hover:text-ink text-xl leading-none">
            ×
          </button>
        </div>
        <div className="px-5 py-4 space-y-3">
          <p className="text-xs text-ink-soft">
            Set a new password for <span className="font-medium text-ink">"{user.username}"</span>.
          </p>
          <div>
            <label className="block text-xs font-medium text-ink-soft mb-1.5">New Password</label>
            <input
              type="password"
              autoFocus
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              placeholder="New password"
              className={`w-full border rounded-md px-3 py-2 text-sm outline-none ${error ? 'border-rust' : 'border-line'}`}
            />
            {error && <p className="text-xs text-rust mt-1">{error}</p>}
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-line">
          <button type="button" onClick={onClose} disabled={submitting} className="btn-secondary text-sm disabled:opacity-50">
            Cancel
          </button>
          <SubmitButton submitting={submitting}>Reset Password</SubmitButton>
        </div>
      </form>
    </div>
  );
}

export default function AdminUsersPage() {
  const { users, addUser, removeUser, resetPassword, toggleUserActive, refreshUsers } = useUsers();
  const { showSuccess, showError } = useToast();
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [resetPasswordTarget, setResetPasswordTarget] = useState(null); // user object
  const [confirmAction, setConfirmAction] = useState(null); // { type: 'delete' | 'deactivate', user }
  const [confirming, setConfirming] = useState(false);
  const [togglingId, setTogglingId] = useState(null);

  // UserContext is mounted once for the whole admin session (see AdminLayout),
  // so without this its one-time initial fetch would go stale across
  // navigating away and back to this page — refetch every time it mounts.
  useEffect(() => {
    refreshUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeCount = users.filter((u) => u.active !== false).length;
  const filtered = search.trim()
    ? users.filter((u) => u.username.toLowerCase().includes(search.trim().toLowerCase()))
    : users;

  async function handleAddUser(username, password) {
    try {
      await addUser(username, password);
      showSuccess('User added.');
      setShowAddModal(false);
    } catch (err) {
      showError(apiErrorMessage(err, 'Could not add the user. Please try again.'));
      throw err;
    }
  }

  async function handleResetPassword(password) {
    try {
      await resetPassword(resetPasswordTarget.id, password);
      showSuccess('Password reset.');
      setResetPasswordTarget(null);
    } catch (err) {
      showError(apiErrorMessage(err, 'Could not reset the password. Please try again.'));
      throw err;
    }
  }

  async function handleToggleActive(user) {
    if (user.active === false) {
      setTogglingId(user.id);
      try {
        await toggleUserActive(user.id);
        showSuccess('User marked active.');
      } catch (err) {
        showError(apiErrorMessage(err, 'Could not update the user. Please try again.'));
      } finally {
        setTogglingId(null);
      }
    } else {
      setConfirmAction({ type: 'deactivate', user });
    }
  }

  async function runConfirmedAction() {
    if (!confirmAction) return;
    setConfirming(true);
    try {
      if (confirmAction.type === 'delete') {
        await removeUser(confirmAction.user.id);
        showSuccess('User deleted.');
      } else {
        await toggleUserActive(confirmAction.user.id);
        showSuccess('User marked inactive.');
      }
    } catch (err) {
      showError(apiErrorMessage(err, 'Could not update the user. Please try again.'));
    }
    setConfirming(false);
    setConfirmAction(null);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-display text-2xl font-semibold">User Management</h1>
      </div>
      <p className="text-sm text-ink-soft mb-4 max-w-2xl">
        Create login accounts for counter staff. Anyone signing in with these credentials lands on
        the Table View with POS-only access — they can't reach the Admin Panel.
      </p>

      <StatRow
        stats={[
          { label: 'Total Users', value: users.length },
          { label: 'Active', value: activeCount, tone: 'text-sage' },
          { label: 'Inactive', value: users.length - activeCount, tone: 'text-rust' },
        ]}
      />

      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2 border border-line rounded-md px-3 py-2 flex-1 max-w-sm bg-white">
          <IconSearch className="w-4 h-4 text-ink-soft" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users"
            className="outline-none bg-transparent text-sm w-full"
          />
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 bg-rust text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-rust/90 whitespace-nowrap"
        >
          <IconPlus className="w-4 h-4" /> Add User
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((user) => {
          const active = user.active !== false;
          return (
            <div key={user.id} className={`ticket-card p-3 ${active ? 'bg-white' : 'bg-line/20'}`}>
              <div className="flex items-center justify-between">
                <span className={`text-sm font-medium ${active ? '' : 'text-ink-soft'}`}>{user.username}</span>
                <ToggleSwitch
                  checked={active}
                  onChange={() => handleToggleActive(user)}
                  loading={togglingId === user.id}
                />
              </div>

              <div className="flex items-center gap-2 mt-3 pt-2 border-t border-line/60">
                <IconTextButton
                  icon={IconEdit}
                  tone="navy"
                  onClick={() => setResetPasswordTarget(user)}
                >
                  Reset Password
                </IconTextButton>
                <IconTextButton
                  icon={IconTrash}
                  tone="rust"
                  onClick={() => setConfirmAction({ type: 'delete', user })}
                >
                  Delete
                </IconTextButton>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && <p className="text-sm text-ink-soft">No POS users match.</p>}
      </div>

      {showAddModal && (
        <AddUserModal onClose={() => setShowAddModal(false)} onSave={handleAddUser} />
      )}

      {resetPasswordTarget && (
        <ResetPasswordModal
          user={resetPasswordTarget}
          onClose={() => setResetPasswordTarget(null)}
          onSave={handleResetPassword}
        />
      )}

      {confirmAction && (
        <ConfirmModal
          title={confirmAction.type === 'delete' ? 'Delete user?' : 'Deactivate user?'}
          message={
            confirmAction.type === 'delete'
              ? `"${confirmAction.user.username}" will be permanently removed and can no longer log in.`
              : `"${confirmAction.user.username}" will no longer be able to log in until reactivated.`
          }
          confirmLabel={confirmAction.type === 'delete' ? 'Delete' : 'Deactivate'}
          danger={confirmAction.type === 'delete'}
          confirming={confirming}
          onCancel={() => setConfirmAction(null)}
          onConfirm={runConfirmedAction}
        />
      )}
    </div>
  );
}
