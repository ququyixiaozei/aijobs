// ── ATS ADAPTERS ──────────────────────────────────────────────────
// Each adapter hits a public JSON endpoint (no auth) and returns rows in a
// common shape. Node 18+ has global fetch (no dependency needed).
// Endpoints confirmed in the 2026-05-29 probe (Greenhouse path returned real data).

const UA = { "User-Agent": "jobboard-ingest/0.1 (+https://example.com)" };

// Greenhouse returns `content` as ENTITY-ENCODED HTML (e.g. &lt;p&gt;) — decode it.
function decodeEntities(s = "") {
  return String(s)
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&"); // last, so we don't double-decode
}

async function getJson(url, { timeoutMs = 30000, retries = 2 } = {}) {
  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetch(url, { headers: UA, signal: ctrl.signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      lastErr = e;
      if (attempt < retries) await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastErr;
}

// https://boards-api.greenhouse.io/v1/boards/{token}/jobs?content=true
export async function fetchGreenhouse(token) {
  const data = await getJson(`https://boards-api.greenhouse.io/v1/boards/${token}/jobs?content=true`);
  return (data.jobs || []).map((j) => ({
    sourceId: `gh-${token}-${j.id}`,
    title: j.title,
    url: j.absolute_url,
    location: j.location?.name || "",
    postedAt: j.first_published || j.updated_at || null,
    updatedAt: j.updated_at || null,
    department: j.departments?.[0]?.name || "",
    descriptionHtml: decodeEntities(j.content || ""),
  }));
}

// https://api.lever.co/v0/postings/{token}?mode=json
export async function fetchLever(token) {
  const data = await getJson(`https://api.lever.co/v0/postings/${token}?mode=json`);
  return (data || []).map((j) => ({
    sourceId: `lv-${token}-${j.id}`,
    title: j.text,
    url: j.hostedUrl,
    location: j.categories?.location || "",
    postedAt: j.createdAt ? new Date(j.createdAt).toISOString() : null,
    updatedAt: j.createdAt ? new Date(j.createdAt).toISOString() : null,
    department: j.categories?.team || j.categories?.department || "",
    descriptionHtml: j.description || j.descriptionPlain || "",
  }));
}

// https://api.ashbyhq.com/posting-api/job-board/{token}?includeCompensation=true
export async function fetchAshby(token) {
  const data = await getJson(`https://api.ashbyhq.com/posting-api/job-board/${token}?includeCompensation=true`);
  return (data.jobs || []).map((j) => ({
    sourceId: `ash-${token}-${j.id || j.jobId || j.title}`,
    title: j.title,
    url: j.jobUrl || j.applyUrl || j.url || "",
    location: j.location || j.locationName || j.address?.postalAddress?.addressLocality || "",
    postedAt: j.publishedAt || j.updatedAt || null,
    updatedAt: j.updatedAt || j.publishedAt || null,
    department: j.departmentName || j.team || "",
    descriptionHtml: j.descriptionHtml || j.description || "",
    remote: typeof j.isRemote === "boolean" ? j.isRemote : undefined,
  }));
}

export const fetchers = {
  greenhouse: fetchGreenhouse,
  lever: fetchLever,
  ashby: fetchAshby,
};
