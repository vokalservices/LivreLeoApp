/**
 * Utilitaires d'authentification pour l'espace administration.
 */

export function isTokenValid(token) {
  if (!token || typeof token !== 'string') return false;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    // Base64 decode du payload JWT
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const payload = JSON.parse(jsonPayload);
    if (!payload.exp) return true;
    // Vérification de l'expiration avec marge de sécurité de 10 secondes
    return payload.exp * 1000 > Date.now() + 10000;
  } catch {
    return false;
  }
}

export function getAdminToken() {
  if (typeof window === 'undefined') return null;
  const token = localStorage.getItem('adminToken');
  if (!token) return null;
  if (!isTokenValid(token)) {
    localStorage.removeItem('adminToken');
    return null;
  }
  return token;
}

export function handleAuthError(router) {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('adminToken');
  }
  if (router && typeof router.push === 'function') {
    router.push('/admin/login?sessionExpired=1');
  } else if (typeof window !== 'undefined') {
    window.location.href = '/admin/login?sessionExpired=1';
  }
}
