// Central place for session/role helpers shared by App.jsx, LoginPage.jsx,
// TopToolbar.jsx and AdminLayout.jsx — kept in one file so the storage keys
// aren't duplicated across components.
const TOKEN_KEY = 'pos_token';
const ROLE_KEY = 'pos_role';
// Session-only: lets an admin temporarily operate the POS screens without
// changing their stored role. Cleared on logout or when they head back to
// the Admin Panel.
const POS_ACCESS_KEY = 'pos_admin_access';

export function isAuthenticated() {
  return Boolean(localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY));
}

// The backend will define this per-user later (see setSession, called at
// login) — for now it's read straight out of storage.
export function getRole() {
  return localStorage.getItem(ROLE_KEY) || sessionStorage.getItem(ROLE_KEY) || 'pos';
}

export function setSession(token, role, remember) {
  const store = remember ? localStorage : sessionStorage;
  store.setItem(TOKEN_KEY, token);
  store.setItem(ROLE_KEY, role);
}

export function logout() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ROLE_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(ROLE_KEY);
  sessionStorage.removeItem(POS_ACCESS_KEY);
}

export function hasPosAccess() {
  return sessionStorage.getItem(POS_ACCESS_KEY) === '1';
}

export function grantPosAccess() {
  sessionStorage.setItem(POS_ACCESS_KEY, '1');
}

export function revokePosAccess() {
  sessionStorage.removeItem(POS_ACCESS_KEY);
}
