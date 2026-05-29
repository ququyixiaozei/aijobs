// ── NICHE DEFINITION ──────────────────────────────────────────────
// This is the ONLY file you change to clone the engine to a new niche.
// (decisions D068/D072: "build an engine, not a site" — 快速复制)
//
// A job is kept if its title hits a ROLE signal AND a DOMAIN signal,
// and does NOT hit the NOISE list. Tuned from the 2026-05-29 live probe,
// which showed loose "infrastructure" matching pulled in legal/accounting
// roles (e.g. "Commercial Counsel, Infrastructure Security") — excluded here.

export const niche = {
  slug: "ai-infra",
  name: "AI Infrastructure & GPU Engineering Jobs",
  tagline: "GPU, CUDA, ML-systems, inference & performance engineering roles at AI labs and infra startups.",

  roleSignal:
    /\b(engineer|engineering|developer|programmer|scientist|researcher|architect|sre|devops|member of technical staff|mts)\b/i,

  domainSignal:
    /(gpu|cuda|kernel|inference|ml systems|ml infrastructure|machine learning infrastructure|performance|compiler|triton|distributed training|distributed systems|hpc|accelerator|low[- ]?level|model serving|serving|throughput|latency|training infrastructure|pytorch|tensor|vllm)/i,

  // exclude business/finance/IT "systems" roles + non-eng functions
  noise:
    /(counsel|accounting|financ|tax|payroll|business system|workplace|facilities|legal|sales|marketing|recruit|recruiter|people|partnership|community|customer|support|account executive|administrative|gtm|brand)/i,
};

export function matchesNiche(title = "") {
  if (!title) return false;
  if (niche.noise.test(title)) return false;
  return niche.roleSignal.test(title) && niche.domainSignal.test(title);
}

// Long-tail SEO category/landing pages. Clone with the niche.
export const categories = [
  { slug: "gpu-jobs", name: "GPU & CUDA Engineering Jobs", match: /gpu|cuda/i,
    blurb: "Hands-on GPU and CUDA roles — kernel development, GPU programming and accelerator software at AI labs and infrastructure companies." },
  { slug: "ml-systems-jobs", name: "ML Systems & Infrastructure Jobs", match: /ml systems|machine learning systems|ml infrastructure|machine learning infrastructure/i,
    blurb: "Engineering the systems that train and serve large models — distributed training, ML platforms and infrastructure at frontier labs." },
  { slug: "inference-jobs", name: "Inference & Model Serving Jobs", match: /inference|serving|vllm|throughput|latency/i,
    blurb: "Running models in production — inference engines, model serving, and latency/throughput optimization (vLLM, TensorRT and similar)." },
  { slug: "performance-engineering-jobs", name: "Performance & Kernel Engineering Jobs", match: /performance|kernel|compiler|optimization|triton/i,
    blurb: "Wringing performance out of hardware — kernels, compilers, Triton and low-level optimization for ML workloads." },
];

export function getCategory(slug) {
  return categories.find((c) => c.slug === slug) || null;
}
