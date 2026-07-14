import React, { useState } from 'react';
import { useUsers } from '../context/UserContext.jsx';
import ConfirmModal from '../components/ConfirmModal.jsx';
import ToggleSwitch from '../components/ToggleSwitch.jsx';
import StatRow from '../components/StatRow.jsx';
import IconTextButton from '../components/IconTextButton.jsx';
import { IconPlus, IconTrash, IconEdit, IconSearch } from '../components/icons.jsx';

function AddUserModal({ onClose, onSave }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Enter both a username and password.');
      return;
    }
    const created = onSave(username, password);
    if (!created) {
      setError('That username already exists.');
      return;
    }
    onClose();
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
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. counter3"
              className="w-full border border-line rounded-md px-3 py-2 text-sm outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-soft mb-1.5">Password</label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full border border-line rounded-md px-3 py-2 text-sm outline-none"
            />
          </div>
          {error && <p className="text-xs text-rust">{error}</p>}
        </div>
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-line">
          <button type="button" onClick={onClose} className="btn-secondary text-sm">
            Cancel
          </button>
          <button type="submit" className="bg-rust text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-rust/90">
            Add User
          </button>
        </div>
      </form>
    </div>
  );
}

export default function AdminUsersPage() {
  const { users, addUser, removeUser, resetPassword, toggleUserActive } = useUsers();
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [resetTarget, setResetTarget] = useState(null);
  const [resetValue, setResetValue] = useState('');
  const [confirmAction, setConfirmAction] = useState(null); // { type: 'delete' | 'deactivate', user }

  const activeCount = users.filter((u) => u.active !== false).length;
  const filtered = search.trim()
    ? users.filter((u) => u.username.toLowerCase().includes(search.trim().toLowerCase()))
    : users;

  function commitReset() {
    if (resetTarget && resetValue.trim()) {
      resetPassword(resetTarget, resetValue.trim());
    }
    setResetTarget(null);
    setResetValue('');
  }

  function handleToggleActive(user) {
    if (user.active === false) {
      toggleUserActive(user.id);
    } else {
      setConfirmAction({ type: 'deactivate', user });
    }
  }

  function runConfirmedAction() {
    if (!confirmAction) return;
    if (confirmAction.type === 'delete') removeUser(confirmAction.user.id);
    else toggleUserActive(confirmAction.user.id);
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

      <div className="flex items-center gap-3 mb-4">
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
                <ToggleSwitch checked={active} onChange={() => handleToggleActive(user)} />
              </div>

              {resetTarget === user.id && (
                <div className="flex items-center gap-1.5 mt-2.5">
                  <input
                    autoFocus
                    value={resetValue}
                    onChange={(e) => setResetValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && commitReset()}
                    placeholder="New password"
                    className="flex-1 border border-line rounded-md px-2 py-1 text-xs outline-none"
                  />
                  <button onClick={commitReset} className="text-xs font-medium text-navy hover:underline">
                    Save
                  </button>
                </div>
              )}

              <div className="flex items-center gap-2 mt-3 pt-2 border-t border-line/60">
                <IconTextButton
                  icon={IconEdit}
                  tone="navy"
                  onClick={() => {
                    setResetTarget(user.id);
                    setResetValue('');
                  }}
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
        <AddUserModal onClose={() => setShowAddModal(false)} onSave={(u, p) => addUser(u, p)} />
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
          onCancel={() => setConfirmAction(null)}
          onConfirm={runConfirmedAction}
        />
      )}
    </div>
  );
}
