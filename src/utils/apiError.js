// Every failed API call is { success: false, message, errors } (see api.js's
// response interceptor) — this pulls that message out for a toast, falling
// back to a generic string when the backend is unreachable entirely.
export function apiErrorMessage(err, fallback) {
  return err.response?.data?.message || fallback;
}
