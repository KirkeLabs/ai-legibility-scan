# Claude Code Recon Prompt — Step 1 of the Fix Workflow

A read-only reconnaissance prompt. Paste it into a Claude Code session inside the source repo of the site you just scanned. Claude greps the codebase and returns a structured 10-section report. You paste that report back to wherever you're drafting the fix prompt (or into [docs/PROMPT_TEMPLATE.md](./PROMPT_TEMPLATE.md)) — so the fix is grounded in real codebase facts instead of generic assumptions.

## Why a recon step at all?

The generic [PROMPT_TEMPLATE.md](./PROMPT_TEMPLATE.md) works with 14 placeholders you fill in by hand. That's fine for sites where you know the answers off the top of your head. But for non-trivial codebases — Vite vs Next vs Astro, monorepo subdirs, hidden on-chain integrations, existing JSON-LD that mustn't be duplicated, brand-asset paths that aren't directly servable — guessing leads to a fix prompt that wastes implementation time on the wrong assumptions.

The recon takes ~10 minutes of round-trip and gives the fix prompt concrete file paths, route lists, framework specifics, and a `NOT FOUND` for everything that genuinely doesn't exist. Use it for anything beyond a one-page brochure site.

## The prompt — copy this whole block

````markdown
# Task: Reconnaissance — gather context for an LLM-visibility fix

This is a **read-only** discovery task. Do NOT change any code, do NOT create files, do NOT commit anything. Your job is to grep and read the codebase, then return a structured report.

The site this codebase deploys just scored poorly on `@kirkelabs/ai-legibility-scan`. A follow-up session will draft a tailored fix prompt — but the fix prompt needs concrete facts from THIS codebase to be useful. That's what you're collecting.

## Output shape

Produce a single Markdown report with the ten sections below, in order. For anything you genuinely can't find in the codebase, write `NOT FOUND` — do not infer or invent. The next step depends on the report being accurate.

```
## 1. Product description
[One factual sentence describing what this product/site does. Sources: package.json "description", README, the homepage hero component, any About/Product page copy. Quote the source if you find good copy verbatim.]

Source(s): [file path(s) where this came from, or NOT FOUND]

## 2. Team / authorship
[List each person mentioned anywhere in the codebase as a founder, team member, author, contributor, or maintainer.]

- Name: [...], Role: [...], LinkedIn: [URL or NOT FOUND], GitHub: [URL or NOT FOUND]
- (repeat per person)

Sources: [files where these were found]

## 3. Tech stack
- Framework: [Next.js / Vite + React / Astro / Remix / Nuxt / plain HTML / other — derived from package.json + config files]
- Build tool: [...]
- Hosting target: [Vercel / Netlify / Cloudflare Pages / self-hosted — check vercel.json, netlify.toml, etc.]
- SSR/SSG support: [Yes (already configured) / Possible (framework supports it but not enabled) / No (would require migration)]
- Notable dependencies relevant to a fix: [list the 3–5 deps that matter most — e.g. `react-router-dom@7`, `vite@5`, `react-helmet-async`, etc.]
- Monorepo? [Yes — frontend at <path>] or [No — single-package repo]

## 4. On-chain footprint (skip if not applicable)
Grep for: `algosdk`, `applicationId`, `appId`, `allo.info`, `perawallet`, `walletconnect`, `defly`, ASA constants, contract directories like `contracts/` or `smart_contracts/`, environment variables containing `APP_ID` or `ALGOD_`. For non-Algorand chains, adapt the search terms (`ethers`, `viem`, `solana/web3.js`, etc.).

- Does the product integrate any blockchain? [Yes / No]
- Does the product display on-chain artefacts to users? (App IDs, addresses, transaction hashes rendered as visible text in the UI — not just used internally)
  - [Yes — list each: App ID for X, address for Y, etc.] OR [No — wallet integration is opaque, nothing on-chain shown to users]
- Are there hardcoded App/ASA IDs / contract addresses in source/constants? [Yes — list them with file paths] OR [No / NOT FOUND]
- Smart contract source location: [path or NOT FOUND]
- Network (testnet/mainnet/devnet): [from env vars or config]

This distinction matters: "wallet integration" alone doesn't lift the on-chain dimension on the legibility scanner — only on-chain identifiers *visible in the rendered HTML* do. And honesty about testnet-vs-mainnet matters for the fix prompt's copy guidance.

## 5. Routes
[List every public-facing route the user-facing app exposes. Read the actual router config (React Router routes file, Next.js `pages/` or `app/` directory, Astro `src/pages/`, etc.) — do not infer from URLs you've never seen.]

- `/` — [one-line description of what's on it]
- `/path-2` — [...]
- (repeat)

Distinguish public/unauthenticated routes (the LLM-visible surface) from authenticated-only routes (out of scope for legibility fixes).

Source: [router config file]

## 6. Existing JSON-LD or schema.org
[Grep for `application/ld+json` across the entire repo (excluding node_modules/dist). Report any matches.]

- File: [path], Type: [@type from the JSON-LD], Content summary: [...]
- (repeat) OR `NOT FOUND — no JSON-LD blocks anywhere in the codebase`

## 7. Meta tags currently set
[Read the SPA's index.html (usually `index.html` at root, or `public/index.html`, or framework-specific equivalent). Report exactly what's in `<head>`.]

- `<title>`: [exact value]
- `<meta name="description">`: [exact value or NOT FOUND]
- `<meta property="og:title">`: [or NOT FOUND]
- `<meta property="og:description">`: [or NOT FOUND]
- `<meta property="og:image">`: [or NOT FOUND]
- `<meta name="twitter:card">`: [or NOT FOUND]
- `<link rel="canonical">`: [or NOT FOUND]
- `<meta name="author">`: [or NOT FOUND]

Source: [file path]

## 8. Brand assets
- Logo (source path): [path in repo]
- Logo (production URL): [absolute URL — derived from path + the production domain]. **Flag if the logo lives under `src/assets/`** (Vite bundles + hashes it, so it's NOT at a stable production URL) versus `public/` (served at a stable URL).
- Favicon source path: [...]
- og-image (1200×630 PNG): [path or NOT FOUND]

## 9. Already-known external identity URLs
[Grep the entire repo (including markdown, components, JSON, env example files) for these strings.]

- LinkedIn company page: [URL or NOT FOUND]
- X / Twitter URL or @handle: [or NOT FOUND]
- Instagram URL or @handle: [or NOT FOUND]
- Crunchbase URL: [or NOT FOUND]
- GitHub org/repo: [URL or NOT FOUND]
- Wikidata QID: [or NOT FOUND]
- Other (ecosystem partner pages, foundation grants, etc.): [list any found]

## 10. Publisher relationship
- Is this product published/owned by a parent company? [Yes / No / Unclear — based on copyright lines in LICENSE, README footer, package.json author, any "© <Org>" string anywhere]
- Evidence: [quote the line(s) that establish this, with file paths]
- If standalone, who is the publisher? [Org or individual name from copyright + repo metadata]

## Notes / things I noticed during recon
[Anything that doesn't fit above but seems relevant to the fix prompt. E.g. "the entire site is one React component", "there's a half-finished /about route", "testnet vs mainnet config exists", "the marketing-site code is in a monorepo subdir at <path>", etc. Optional but valuable.]
```

## Hard constraints

- **Read-only.** No `Write`, no `Edit`, no `Bash` that modifies state. Reading files, grepping, listing directories is fine.
- **Do not invent facts.** If a value isn't in the codebase, write `NOT FOUND`. Never substitute a plausible guess.
- **Stop after the report.** Do not propose fixes, do not start refactoring, do not edit code. The fix step is separate.
- **Quote sources.** For every non-obvious finding, name the file path it came from. The report has to be verifiable by spot-check.

When the report is complete, paste it back into whichever conversation/session is drafting the fix prompt — or use it yourself to fill in the placeholders in `docs/PROMPT_TEMPLATE.md`.
````

## What to do with the report

Two paths:

1. **Self-serve.** Use the recon report to fill in `docs/PROMPT_TEMPLATE.md` yourself — you now know your site URL, org name, team members, framework, and routes from the report. Paste the filled-in template into a *new* Claude Code session for the fix.
2. **Hand off.** Paste the recon report into another Claude/LLM conversation and ask it to draft a tailored fix prompt (the way the kirkelabs/ai-legibility-scan README's "Audit, recon, fix" workflow describes). The tailored prompt will reference your actual file paths and stack rather than generic placeholders, which is dramatically better for non-trivial codebases.
