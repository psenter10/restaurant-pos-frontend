import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  getUsers,
  createUser as apiCreateUser,
  resetUserPassword as apiResetUserPassword,
  deleteUser as apiDeleteUser,
  toggleUserActive as apiToggleUserActive,
} from '../services/api.js';

const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    refresh();
  }, []);

  function refresh() {
    return getUsers()
      .then((res) => {
        // Normalize the API's 0/1 active flag to a real boolean — see the
        // same note in WaiterContext.jsx.
        setUsers(res.data.map((u) => ({ ...u, active: u.active !== 0 })));
      })
      .catch(() => {
        // Backend unreachable — leave the list empty rather than show stale data.
      });
  }

  async function addUser(username, password) {
    await apiCreateUser({ username, password });
    await refresh();
  }

  async function removeUser(id) {
    await apiDeleteUser(id);
    await refresh();
  }

  async function resetPassword(id, password) {
    if (!password.trim()) return;
    await apiResetUserPassword(id, password);
  }

  async function toggleUserActive(id) {
    await apiToggleUserActive(id);
    await refresh();
  }

  return (
    <UserContext.Provider value={{ users, addUser, removeUser, resetPassword, toggleUserActive, refreshUsers: refresh }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUsers() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUsers must be used within a UserProvider');
  return ctx;
}
