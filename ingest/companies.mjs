// ── COMPANY SEED LIST ─────────────────────────────────────────────
// ats: 'greenhouse' | 'lever' | 'ashby'  ·  token = the board slug in the ATS URL.
// ALL entries below verified live (2026-05-29): they return jobs AND ≥1 role
// matching the AI-infra niche filter. ~221 niche jobs total across 27 companies.
// Add more: drop in {name, ats, token}; run `npm run ingest`; fix any FAIL.

export const companies = [
  // ── Greenhouse (16) ──
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

  // ── Ashby (10) ──
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

  // ── Lever (1) ──
  { name: "Mistral AI",        ats: "lever",      token: "mistral",          verified: true },
];

// Still to add (probing couldn't auto-resolve their ATS token on 2026-05-29 —
// they likely use a custom careers site). To add one: open the company's careers
// page, note the ATS + the slug in the URL, append above, re-run `npm run ingest`.
// Worth chasing: Cohere, Hugging Face, Perplexity, Groq, Cerebras, Modal,
//   Replicate, Pinecone, Weights & Biases, Deepgram, Crusoe, OpenAI, Modular.
