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
    blurb: "Hands-on GPU and CUDA roles — kernel development, GPU programming and accelerator software at AI labs and infrastructure companies.",
    editorial:
      "GPU and CUDA roles are the hardware-adjacent end of this stack: writing and tuning kernels, chasing occupancy and memory bandwidth on a specific architecture, and building the GPU programming layers everything above depends on. They cluster at the companies closest to the metal — accelerator startups designing their own silicon and the GPU-cloud providers running fleets at scale — where a few percent of kernel performance turns directly into training cost. CUDA/C++ depth, profiler fluency (Nsight, rocprof) and comfort reading PTX/SASS tend to matter more here than framework familiarity." },
  { slug: "ml-systems-jobs", name: "ML Systems & Infrastructure Jobs", match: /ml systems|machine learning systems|ml infrastructure|machine learning infrastructure/i,
    blurb: "Engineering the systems that train and serve large models — distributed training, ML platforms and infrastructure at frontier labs.",
    editorial:
      "ML-systems and infrastructure roles are about the machinery that trains and serves large models rather than the models themselves: distributed-training frameworks, data and checkpoint pipelines, scheduling, and the platform glue that lets research run reliably across thousands of accelerators. They concentrate at frontier labs and platform companies, where the bottleneck is rarely a single GPU and almost always coordination — fault tolerance across week-long runs, throughput at cluster scale, and the gap between 40% and 60% hardware utilization. Distributed-systems instinct usually outweighs deep kernel knowledge in these roles." },
  { slug: "inference-jobs", name: "Inference & Model Serving Jobs", match: /inference|serving|vllm|throughput|latency/i,
    blurb: "Running models in production — inference engines, model serving, and latency/throughput optimization (vLLM, TensorRT and similar).",
    editorial:
      "Inference and model-serving roles own the production side: getting trained models to answer fast and cheaply under real traffic. That means serving engines and runtimes (vLLM, TensorRT-LLM and the like), continuous batching and KV-cache strategy, quantization, and the latency/throughput trade-offs that decide unit economics for anyone shipping an LLM product. They concentrate at the labs and inference-platform startups whose revenue is literally tokens-per-second — so the work rewards people who reason fluently about both model internals and the systems that run them." },
  { slug: "performance-engineering-jobs", name: "Performance & Kernel Engineering Jobs", match: /performance|kernel|compiler|optimization|triton/i,
    blurb: "Wringing performance out of hardware — kernels, compilers, Triton and low-level optimization for ML workloads.",
    editorial:
      "Performance and kernel-engineering roles are the optimization core of this niche — compilers, custom kernels (often Triton), graph-level transforms, and the low-level work of making a given workload run measurably faster on given hardware. It is consistently the largest specialty on this board, which tracks the moment: every accelerator company and serving stack is now competing on efficiency. These roles favor people who profile before they optimize, who are comfortable at the IR/compiler layer, and who treat a benchmark regression as a bug to be bisected." },
];

export function getCategory(slug) {
  return categories.find((c) => c.slug === slug) || null;
}
