export interface VisitEntry {
  id: string;
  timestamp: string;
  ip: string;
  city?: string;
  country?: string;
  device: string;
  browser: string;
  type: 'login' | 'visit';
}

const LOCAL_LOG_KEY = 'propiedades_visit_log';
const LOCAL_COUNTER_KEY = 'propiedades_visit_count';
const GIST_CONFIG_KEY = 'propiedades_gist_config';
const GIST_LOG_FILENAME = 'propiedades_access_log.json';

export interface GistConfig {
  token: string;
  gistId?: string;
}

// ─── Device / browser parsing ────────────────────────────────────────────────

function parseDevice(ua: string): string {
  if (/iPhone/i.test(ua)) return 'iPhone';
  if (/iPad/i.test(ua)) return 'iPad';
  if (/Android/i.test(ua)) return 'Android';
  if (/Windows/i.test(ua)) return 'Windows';
  if (/Mac OS/i.test(ua)) return 'Mac';
  if (/Linux/i.test(ua)) return 'Linux';
  return 'Desconocido';
}

function parseBrowser(ua: string): string {
  if (/Edg\//i.test(ua)) return 'Edge';
  if (/OPR\//i.test(ua)) return 'Opera';
  if (/Chrome/i.test(ua)) return 'Chrome';
  if (/Firefox/i.test(ua)) return 'Firefox';
  if (/Safari/i.test(ua)) return 'Safari';
  return 'Otro';
}

// ─── IP fetch ────────────────────────────────────────────────────────────────

async function fetchIpInfo(): Promise<{ ip: string; city?: string; country?: string }> {
  try {
    const res = await fetch('https://ipapi.co/json/', { signal: AbortSignal.timeout(4000) });
    if (res.ok) {
      const d = await res.json() as { ip?: string; city?: string; country_name?: string };
      return { ip: d.ip ?? 'desconocida', city: d.city, country: d.country_name };
    }
  } catch {
    // fallback to ipify
    try {
      const res2 = await fetch('https://api.ipify.org?format=json', { signal: AbortSignal.timeout(3000) });
      if (res2.ok) {
        const d2 = await res2.json() as { ip?: string };
        return { ip: d2.ip ?? 'desconocida' };
      }
    } catch { /* ignore */ }
  }
  return { ip: 'desconocida' };
}

// ─── Local log ───────────────────────────────────────────────────────────────

export function getLocalLog(): VisitEntry[] {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_LOG_KEY) || '[]') as VisitEntry[];
  } catch {
    return [];
  }
}

function saveLocalLog(log: VisitEntry[]) {
  localStorage.setItem(LOCAL_LOG_KEY, JSON.stringify(log.slice(0, 200)));
}

export function getVisitCount(): number {
  return parseInt(localStorage.getItem(LOCAL_COUNTER_KEY) ?? '0', 10);
}

function incrementCounter() {
  localStorage.setItem(LOCAL_COUNTER_KEY, String(getVisitCount() + 1));
}

// ─── Gist config ─────────────────────────────────────────────────────────────

export function getGistConfig(): GistConfig | null {
  try {
    const raw = localStorage.getItem(GIST_CONFIG_KEY);
    return raw ? (JSON.parse(raw) as GistConfig) : null;
  } catch {
    return null;
  }
}

export function saveGistConfig(config: GistConfig) {
  localStorage.setItem(GIST_CONFIG_KEY, JSON.stringify(config));
}

export function clearGistConfig() {
  localStorage.removeItem(GIST_CONFIG_KEY);
}

// ─── Gist sync ───────────────────────────────────────────────────────────────

async function createGist(token: string, entry: VisitEntry): Promise<string | null> {
  try {
    const res = await fetch('https://api.github.com/gists', {
      method: 'POST',
      headers: { Authorization: `token ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        description: 'PropAdmin — Registro de accesos',
        public: false,
        files: {
          [GIST_LOG_FILENAME]: { content: JSON.stringify([entry], null, 2) },
        },
      }),
    });
    if (res.ok) {
      const data = await res.json() as { id?: string };
      return data.id ?? null;
    }
  } catch { /* ignore */ }
  return null;
}

async function appendToGist(token: string, gistId: string, entry: VisitEntry) {
  try {
    // Get current content
    const res = await fetch(`https://api.github.com/gists/${gistId}`, {
      headers: { Authorization: `token ${token}` },
    });
    if (!res.ok) return;
    const data = await res.json() as { files?: Record<string, { content?: string }> };
    const currentContent = data.files?.[GIST_LOG_FILENAME]?.content ?? '[]';
    let log: VisitEntry[] = [];
    try { log = JSON.parse(currentContent) as VisitEntry[]; } catch { /* ignore */ }
    log.unshift(entry);
    const trimmed = log.slice(0, 500);

    await fetch(`https://api.github.com/gists/${gistId}`, {
      method: 'PATCH',
      headers: { Authorization: `token ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        files: { [GIST_LOG_FILENAME]: { content: JSON.stringify(trimmed, null, 2) } },
      }),
    });
  } catch { /* ignore */ }
}

export async function fetchGistLog(token: string, gistId: string): Promise<VisitEntry[]> {
  try {
    const res = await fetch(`https://api.github.com/gists/${gistId}`, {
      headers: { Authorization: `token ${token}` },
    });
    if (!res.ok) return [];
    const data = await res.json() as { files?: Record<string, { content?: string }> };
    const content = data.files?.[GIST_LOG_FILENAME]?.content ?? '[]';
    return JSON.parse(content) as VisitEntry[];
  } catch {
    return [];
  }
}

// ─── Main record function ─────────────────────────────────────────────────────

export async function recordVisit(type: 'login' | 'visit') {
  const ipInfo = await fetchIpInfo();
  const ua = navigator.userAgent;

  const entry: VisitEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: new Date().toISOString(),
    ip: ipInfo.ip,
    city: ipInfo.city,
    country: ipInfo.country,
    device: parseDevice(ua),
    browser: parseBrowser(ua),
    type,
  };

  // Always save locally
  const local = getLocalLog();
  local.unshift(entry);
  saveLocalLog(local);
  incrementCounter();

  // Sync to Gist if configured (non-blocking)
  const cfg = getGistConfig();
  if (cfg?.token) {
    if (!cfg.gistId) {
      const newId = await createGist(cfg.token, entry);
      if (newId) {
        saveGistConfig({ ...cfg, gistId: newId });
      }
    } else {
      void appendToGist(cfg.token, cfg.gistId, entry);
    }
  }

  return entry;
}
