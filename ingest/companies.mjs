// ── COMPANY SEED LIST ─────────────────────────────────────────────
// ats: 'greenhouse' | 'lever' | 'ashby'  ·  token = the board slug in the ATS URL.
// Original 27 verified live 2026-05-29. +38 candidates added 2026-05-31 (D086 partner
// cycle: multi-agent live token-verification — each board fetched OK and showed >=1
// niche-keyword title). The daily CI (US runner) reaches every ATS and applies the
// strict niche filter (matchesNiche); a seed that yields 0 niche jobs just produces no
// page (harmless) and is pruned after the first CI ingest confirms real yields.
// Token gotchas are noted inline (case / suffix / dot matter).

export const companies = [
  // ── Greenhouse ──
  { name: "Anthropic",         ats: "greenhouse", token: "anthropic",        verified: true },
  { name: "Scale AI",          ats: "greenhouse", token: "scaleai",          verified: true },
  { name: "Databricks",        ats: "greenhouse", token: "databricks",       verified: true },
  { name: "RunPod",            ats: "greenhouse", token: "runpod",           verified: true },
  { name: "xAI",               ats: "greenhouse", token: "xai",              verified: true },
  { name: "SambaNova",         ats: "greenhouse", token: "sambanovasystems", verified: true },
  { name: "Tenstorrent",       ats: "greenhouse", token: "tenstorrent",      verified: true },
  { name: "CoreWeave",         ats: "greenhouse", token: "coreweave",        verified: true },
  { name: "Lightning AI",      ats: "greenhouse", token: "lightningai",      verified: true },
  { name: "Together AI",       ats: "greenhouse", token: "togetherai",       verified: true },
  { name: "Fireworks AI",      ats: "greenhouse", token: "fireworksai",      verified: true },
  { name: "Nebius",            ats: "greenhouse", token: "nebius",           verified: true },
  { name: "Graphcore",         ats: "greenhouse", token: "graphcore",        verified: true },
  { name: "Applied Intuition", ats: "greenhouse", token: "appliedintuition", verified: true },
  { name: "Vast.ai",           ats: "greenhouse", token: "vastai",           verified: true },
  { name: "Lightmatter",       ats: "greenhouse", token: "lightmatter",      verified: true },
  // +2026-05-31
  { name: "Cerebras Systems",  ats: "greenhouse", token: "cerebrassystems",  verified: true },
  { name: "EnCharge AI",       ats: "greenhouse", token: "enchargeai36",     verified: true }, // note: '36' suffix
  { name: "Fal",               ats: "greenhouse", token: "fal",              verified: true },
  { name: "Thinking Machines", ats: "greenhouse", token: "thinkingmachines", verified: true },
  { name: "Black Forest Labs", ats: "greenhouse", token: "blackforestlabs",  verified: true },
  { name: "World Labs",        ats: "greenhouse", token: "worldlabs",        verified: true },
  { name: "MatX",              ats: "greenhouse", token: "matx",             verified: true },
  { name: "Parasail",          ats: "greenhouse", token: "parasail",         verified: true },
  { name: "AssemblyAI",        ats: "greenhouse", token: "assemblyai",       verified: true },
  { name: "Mithril",           ats: "greenhouse", token: "mithril",          verified: true },

  // ── Ashby ──
  { name: "Cursor",            ats: "ashby",      token: "cursor",           verified: true },
  { name: "Baseten",           ats: "ashby",      token: "baseten",          verified: true },
  { name: "Anyscale",          ats: "ashby",      token: "anyscale",         verified: true },
  { name: "Character.AI",      ats: "ashby",      token: "character",        verified: true },
  { name: "Lambda",            ats: "ashby",      token: "lambda",           verified: true },
  { name: "Cartesia",          ats: "ashby",      token: "cartesia",         verified: true },
  { name: "Etched",            ats: "ashby",      token: "etched",           verified: true },
  { name: "Prime Intellect",   ats: "ashby",      token: "primeintellect",   verified: true },
  { name: "SF Compute",        ats: "ashby",      token: "sfcompute",        verified: true },
  { name: "FluidStack",        ats: "ashby",      token: "fluidstack",       verified: true },
  // +2026-05-31
  { name: "OpenAI",            ats: "ashby",      token: "openai",           verified: true },
  { name: "Perplexity",        ats: "ashby",      token: "perplexity",       verified: true },
  { name: "Modal",             ats: "ashby",      token: "modal",            verified: true },
  { name: "Cohere",            ats: "ashby",      token: "cohere",           verified: true },
  { name: "Magic.dev",         ats: "ashby",      token: "magic.dev",        verified: true }, // keep the dot
  { name: "Liquid AI",         ats: "ashby",      token: "Liquid-AI",        verified: true }, // case-sensitive
  { name: "d-Matrix",          ats: "ashby",      token: "d-matrix",         verified: true },
  { name: "FriendliAI",        ats: "ashby",      token: "friendliai",       verified: true },
  { name: "Cognition",         ats: "ashby",      token: "cognition",        verified: true },
  { name: "Physical Intelligence", ats: "ashby",  token: "physicalintelligence", verified: true },
  { name: "Featherless AI",    ats: "ashby",      token: "featherlessai",    verified: true },
  { name: "Inworld AI",        ats: "ashby",      token: "inworld-ai",       verified: true },
  { name: "Poolside",          ats: "ashby",      token: "poolside",         verified: true },
  { name: "Crusoe",            ats: "ashby",      token: "crusoe",           verified: true },
  { name: "TensorWave",        ats: "ashby",      token: "tensorwave",       verified: true },
  { name: "Sieve",             ats: "ashby",      token: "sieve",            verified: true },
  { name: "Runway",            ats: "ashby",      token: "runway-ml",        verified: true }, // not 'runway'
  { name: "Pinecone",          ats: "ashby",      token: "pinecone",         verified: true },
  { name: "Reka AI",           ats: "ashby",      token: "reka",             verified: true },
  { name: "Axelera AI",        ats: "ashby",      token: "axelera",          verified: true },
  { name: "LanceDB",           ats: "ashby",      token: "lancedb",          verified: true },
  { name: "Pika",              ats: "ashby",      token: "pika",             verified: true },
  { name: "Chalk",             ats: "ashby",      token: "chalk",            verified: true },
  { name: "Braintrust",        ats: "ashby",      token: "braintrust",       verified: true },
  { name: "Krea",              ats: "ashby",      token: "krea",             verified: true },
  { name: "Suno",              ats: "ashby",      token: "suno",             verified: true },
  { name: "Eventual (Daft)",   ats: "ashby",      token: "eventualcomputing",verified: true }, // not 'eventual'

  // ── Lever ──
  { name: "Mistral AI",        ats: "lever",      token: "mistral",          verified: true },
  { name: "Zilliz",            ats: "lever",      token: "zilliz",           verified: true },
];
