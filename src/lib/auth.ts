const AUTH_KEY = 'propiedades_auth';
const SESSION_KEY = 'propiedades_session';

export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function setPassword(password: string): Promise<void> {
  const hash = await hashPassword(password);
  localStorage.setItem(AUTH_KEY, hash);
}

export async function checkPassword(password: string): Promise<boolean> {
  const storedHash = localStorage.getItem(AUTH_KEY);
  if (!storedHash) return false;
  const inputHash = await hashPassword(password);
  return inputHash === storedHash;
}

export function isPasswordSet(): boolean {
  return localStorage.getItem(AUTH_KEY) !== null;
}

export function login(): void {
  sessionStorage.setItem(SESSION_KEY, 'true');
}

export function logout(): void {
  sessionStorage.removeItem(SESSION_KEY);
}

export function isLoggedIn(): boolean {
  return sessionStorage.getItem(SESSION_KEY) === 'true';
}
