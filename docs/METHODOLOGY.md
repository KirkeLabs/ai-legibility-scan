# Methodology

This document explains exactly how `ai-legibility-scan` scores a page, what the weights are based on, and what it deliberately does **not** claim. Transparency is the point: if you disagree with a weight, open an issue — the scoring is a set of documented judgement calls, not a black box.

## The model of the problem

AI agents (ChatGPT, Claude, Perplexity, Gemini, Google AI Overviews) increasingly mediate discovery. They share two properties this tool is built around:

1. **They mostly do not execute JavaScript.** GPTBot, ClaudeBot, PerplexityBot and Google-Extended read the raw HTML a server returns. Content injected client-side is invisible to them. This is why the scanner fetches with a single plain request and never runs scripts — it sees what they see.
2. **They answer from a confidence-weighted reading of the web.** Where the web is structured, corroborated and consistent, models answer plainly; where it is thin or contradictory, they hedge or omit. Every dimension below targets one input to that confidence.

## The eight dimensions and their weights

| Dimension | Weight | Rationale |
|---|---|---|
| Server-rendered content | 10 | If the crawler sees no text, nothing else matters. Highest weight because it is a precondition for every other signal. |
| Schema.org structured data | 10 | Removes interpretation from the facts you cannot afford to have guessed. Heavily ingested by every major model. |
| Entity identity | 10 | Models resolve entities via knowledge graphs. Wikidata/Crunchbase/LinkedIn/GitHub corroboration is what turns "a site" into "a known thing". |
| Answer-shaped content | 8 | GEO research indicates direct-answer openings, Q&A headings and tables raise citation likelihood. |
| Fact density | 7 | The Princeton GEO study (KDD 2024) found statistic-rich and well-sourced content materially more likely to be cited. |
| AI crawler access | 7 | A `robots.txt` block on AI bots zeroes out every other signal — but blocking can be deliberate, so this informs more than it punishes. |
| `llms.txt` | 4 | A curated retrieval index. Its citation effect is **not yet proven** (Search Engine Land's 2026 tracking found no consistent lift), so it is a low-weight, low-cost hedge. |
| On-chain legibility | 5 | Algorand-specific. On-chain trust claims are worthless to a skeptical AI unless the proof is server-rendered and explorer-linked. Bonus, not core, hence moderate weight. |

Weights sum to 61; the final score is `Σ((dimensionScore / 10) × weight) / 61 × 100`, graded: A ≥ 90, B ≥ 80, C ≥ 65, D ≥ 50, F < 50.

## Thresholds worth knowing

- **Server-rendered:** < 50 words ⇒ treated as blank (score 1); 50–149 ⇒ thin (5); ≥ 150 ⇒ pass (10). The 150 floor is a judgement call — a focused landing/about page can be legible at that length; a marketing page should usually exceed it.
- **Schema.org:** up to 6 points for high-value `@type`s (Organization, Person, Product, Service, Article, FAQPage, BreadcrumbList, WebSite, SoftwareApplication), +4 for any `sameAs`. Unparseable JSON-LD is flagged as a failure because invalid structured data is worse than none.
- **Entity identity:** points per platform (Wikidata/Wikipedia 3, Crunchbase/LinkedIn/GitHub 2, ORCID/Goodreads 1), capped at 10. Absence of Wikidata is always called out.
- **On-chain:** if no on-chain claim is detected, the dimension is **not applicable** and scored a neutral 5 so non-blockchain sites are not penalised.

## What this tool does NOT claim

- It does **not** guarantee AI citation. No tool can. It measures *indicators* that make a page easier for a model to read, trust and reproduce.
- It does **not** render JavaScript — by design. If your content needs JS to appear, that *is* the finding.
- It does **not** query ChatGPT/Claude/Perplexity to see if you are mentioned. That is a different (paid, rate-limited) class of tool. This is a static-legibility auditor.
- The weights are **informed by public research but are not derived from a controlled experiment.** They are defensible defaults, published here so they can be challenged.

## Evidence base

- Aggarwal et al., *GEO: Generative Engine Optimization*, KDD 2024 (statistic-rich and source-emphasised content materially more cited).
- Public 2025–2026 platform-citation analyses showing low source overlap across engines and a heavy weighting toward brand-controlled, structured surfaces.
- The `llms.txt` convention (Answer.AI, 2024) and subsequent independent tracking that found no consistent ranking lift — the reason it is low-weighted here.

Citations are summarised, not reproduced. Follow the primary sources for detail.

## Changing the scoring

Every check is an isolated module in `src/checks/` exporting `meta` (id, title, weight, why) and `run(ctx)`. Fork, adjust a weight or threshold, and the change is transparent in your own report. PRs that improve calibration — especially documented false positives — are the most welcome kind.

---

Built by Soleman El Gelawi (CTO, Kirke Labs), with Steve Kirton — [www.kirkelabs.com](https://www.kirkelabs.com)
