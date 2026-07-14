import React, { createContext, useContext, useEffect, useState } from 'react';

const STORAGE_KEY = 'pos_users';

// Seed data so the Admin panel isn't empty before real accounts are created.
const SEED_USERS = [
  { id: 1, username: 'counter1', password: 'pos123' },
  { id: 2, username: 'counter2', password: 'pos123' },
];

function loadUsers() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // ignore corrupt storage, fall back to seed data
  }
  return SEED_USERS;
}

// LoginPage renders before any provider (it's outside RequireAuth), so it
// can't use useUsers() — it calls this directly against the same storage
// key instead. Swap this out once the CI4 /auth/login endpoint is live.
// Returns a reason (rather than a plain bool) so LoginPage can tell a typo
// apart from a deactivated account instead of showing the same generic error
// for both.
export function validateCredentials(username, password) {
  const users = loadUsers();
  const match = users.find(
    (u) => u.username.toLowerCase() === username.toLowerCase() && u.password === password
  );
  if (!match) return { ok: false, reason: 'invalid' };
  if (match.active === false) return { ok: false, reason: 'inactive' };
  return { ok: true, reason: null };
}

const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [users, setUsers] = useState(loadUsers);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  }, [users]);

  function addUser(username, password) {
    const trimmed = username.trim();
    if (!trimmed || !password.trim()) return false;
    if (users.some((u) => u.username.toLowerCase() === trimmed.toLowerCase())) return false;
    setUsers((prev) => [...prev, { id: Date.now(), username: trimmed, password }]);
    return true;
  }

  function removeUser(id) {
    setUsers((prev) => prev.filter((u) => u.id !== id));
  }

  function resetPassword(id, password) {
    if (!password.trim()) return;
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, password } : u)));
  }

  function toggleUserActive(id) {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, active: u.active === false } : u)));
  }

  return (
    <UserContext.Provider value={{ users, addUser, removeUser, resetPassword, toggleUserActive }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUsers() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUsers must be used within a UserProvider');
  return ctx;
}
