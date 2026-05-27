# Claude Code Prompt Template — Fix Your LLM Visibility (Step 2 of the Fix Workflow)

A copy-pasteable prompt that walks Claude Code through fixing every dimension `@kirkelabs/ai-legibility-scan` grades on. Fill in the placeholders, paste into a Claude Code session in your site's source repo, and let Claude lift the score.

> **Recommended first step: run the recon prompt.** [docs/RECON_PROMPT.md](./RECON_PROMPT.md) is a read-only reconnaissance prompt that greps your codebase and returns a structured report of your framework, team, on-chain footprint, existing meta tags, routes, and identity URLs. The fix prompt is dramatically better when grounded in real codebase facts — use the recon report to fill in the placeholders below (and to drop sections that don't apply, like on-chain proof for a non-blockchain site). For tiny brochure sites you can skip the recon and fill in this template by hand; for anything non-trivial, recon first.

## How to use this template

1. **Audit first.** Run `npx @kirkelabs/ai-legibility-scan https://your-site.com` against your homepage. Note the score and the worst-scoring dimensions.
2. **(Recommended) Run the recon prompt** in [docs/RECON_PROMPT.md](./RECON_PROMPT.md) inside your site's source repo. Use its report to fill in the placeholders below accurately.
3. **Search-and-replace** every `{{PLACEHOLDER}}` in the prompt below with your own values (full list in the next section).
4. **Paste** the filled-in prompt into a *new* Claude Code session inside your site's source repository.
5. Claude Code identifies your framework, makes the changes, and runs verification.
6. **Deploy.** Re-run the scanner against the deployed URL to confirm the score lift.

Total filling-in time: ~5 minutes for a two-person team (or ~15 minutes including a recon round-trip).

## Placeholders — fill these in before pasting

| Token | What to put | Example |
|---|---|---|
| `{{SITE_URL}}` | Canonical URL with scheme, no trailing slash | `https://www.example.com` |
| `{{ORG_NAME}}` | Human-readable org/company name | `Example Inc.` |
| `{{ORG_DESCRIPTION}}` | One-sentence description (becomes JSON-LD + llms.txt) | `Privacy-first analytics for B2B SaaS.` |
| `{{ORG_LOGO_URL}}` | Absolute URL to logo image | `https://www.example.com/logo.png` |
| `{{PERSON_1_NAME}}` | Full name | `Jane Doe` |
| `{{PERSON_1_SLUG}}` | URL-safe slug (lowercase, hyphenated) | `jane-doe` |
| `{{PERSON_1_TITLE}}` | Job title | `Founder & CEO` |
| `{{PERSON_1_LINKEDIN}}` | LinkedIn profile URL | `https://www.linkedin.com/in/janedoe/` |
| `{{PERSON_1_GITHUB_OR_OMIT}}` | GitHub URL, **or delete the whole line** if none | `https://github.com/janedoe` |
| `{{PERSON_2_NAME}}` … `{{PERSON_2_GITHUB_OR_OMIT}}` | Same five fields, second person | (as above) |

**Notes:**
- The template ships with **two** Person blocks. Solo? Delete the second block everywhere. Team of three+? Duplicate the second block and bump the suffix (`PERSON_3_*`, etc.) — see the "Adjusting for team size" section below.
- `{{PERSON_X_GITHUB_OR_OMIT}}` — if the person has no public GitHub profile, **delete the entire line** that contains the placeholder; don't leave an empty string in the JSON-LD `sameAs` array.
- Routes like `/about`, `/team`, `/product`, `/press` are **not** placeholders — they're common defaults named inside the prompt. Adjust inline if your site uses different paths.
- Dimension #8 (on-chain legibility) only matters if the site makes blockchain claims. If yours doesn't, see "Adjusting for non-blockchain sites" below.

## The prompt — copy this whole block

````markdown
# Task: Fix every LLM/AI-visibility issue on {{SITE_URL}}

A scan with `@kirkelabs/ai-legibility-scan` graded this site poorly. Lift it to **≥80 (grade B)** on the homepage and ≥70 on every other public marketing route, without breaking the visual design.

This work needs to cover **every entity the site represents** — the Organization and each Person on the team — because all of them need to be discoverable, corroborated across surfaces, and machine-readable.

## Canonical identities (do not invent — ask if missing)

| Entity | Type | Role | Canonical identity URLs |
|---|---|---|---|
| **{{ORG_NAME}}** | Organization | Publisher | {{SITE_URL}} (canonical), LinkedIn company page + Crunchbase + GitHub org — **ASK ME for these, do not invent** |
| **{{PERSON_1_NAME}}** | Person | {{PERSON_1_TITLE}} | {{PERSON_1_LINKEDIN}}, {{PERSON_1_GITHUB_OR_OMIT}} |
| **{{PERSON_2_NAME}}** | Person | {{PERSON_2_TITLE}} | {{PERSON_2_LINKEDIN}}, {{PERSON_2_GITHUB_OR_OMIT}} |

If you need any sameAs URL not listed above (Wikidata QID, Crunchbase slug, LinkedIn company page, GitHub org), **STOP and ask me**. Inventing identity URLs poisons the entire identity graph and is the exact failure mode this work is meant to fix.

## The scoring rubric every change must map to

Audit tool: `npx @kirkelabs/ai-legibility-scan <url>`. Eight weighted dimensions:

| # | Dimension | Weight | What it checks |
|---|---|---|---|
| 1 | Server-rendered content | 10 | Meaningful body text in raw HTML, not behind JS |
| 2 | Schema.org structured data | 10 | Valid JSON-LD; Organization/Person/Product types; sameAs graph |
| 3 | Entity identity | 10 | Links to Wikidata, Crunchbase, LinkedIn, GitHub, ORCID |
| 4 | Answer-shaped content | 8 | Opening direct answer, question-shaped H2/H3s, tables |
| 5 | Fact density | 7 | Statistics and explicit sourcing per 200 words |
| 6 | AI crawler access | 7 | robots.txt does not block GPTBot/ClaudeBot/PerplexityBot/Google-Extended |
| 7 | llms.txt | 4 | Present at /llms.txt, well-formed |
| 8 | On-chain legibility | 5 | Only applies if the site makes blockchain claims |

Run `npx @kirkelabs/ai-legibility-scan {{SITE_URL}}` first to capture the baseline. Re-run after every meaningful change to confirm direction.

## Required changes (in priority order — dimension lifts in parens)

### 1. Server-render the marketing routes (lifts #1, unlocks #2–#5)

Identify the framework first — read `package.json` and any `next.config.*` / `astro.config.*` / `remix.config.*` / `nuxt.config.*` / Vite config — and report what you find before changing anything. Then switch these routes to SSR or SSG: `/`, `/about`, `/team`, `/product`, `/press` (adjust paths to match this site's actual routes). The build output for each route must contain the real H1, body prose, and JSON-LD as raw HTML. An empty `<div id="root">` (or `#app`, `#__next`) with content injected by JS does NOT count.

Lift any existing copy from the JS-rendered DOM into the SSR output. Do not write new marketing prose unless I ask — your job is to make existing content visible, not to invent voice.

### 2. Add JSON-LD for every entity in `<head>` (lifts #2, #3)

A single `<script type="application/ld+json">` block in the server-rendered HTML of every marketing route:

```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "{{SITE_URL}}/#org",
      "name": "{{ORG_NAME}}",
      "url": "{{SITE_URL}}",
      "logo": "{{ORG_LOGO_URL}}",
      "description": "{{ORG_DESCRIPTION}}",
      "sameAs": [
        "TODO:LINKEDIN_COMPANY_URL",
        "TODO:CRUNCHBASE_URL",
        "TODO:GITHUB_ORG_URL"
      ],
      "founder": { "@id": "{{SITE_URL}}/team#{{PERSON_1_SLUG}}" },
      "employee": [
        { "@id": "{{SITE_URL}}/team#{{PERSON_1_SLUG}}" },
        { "@id": "{{SITE_URL}}/team#{{PERSON_2_SLUG}}" }
      ]
    },
    {
      "@type": "Person",
      "@id": "{{SITE_URL}}/team#{{PERSON_1_SLUG}}",
      "name": "{{PERSON_1_NAME}}",
      "jobTitle": "{{PERSON_1_TITLE}}",
      "worksFor": { "@id": "{{SITE_URL}}/#org" },
      "sameAs": [
        "{{PERSON_1_LINKEDIN}}",
        "{{PERSON_1_GITHUB_OR_OMIT}}"
      ]
    },
    {
      "@type": "Person",
      "@id": "{{SITE_URL}}/team#{{PERSON_2_SLUG}}",
      "name": "{{PERSON_2_NAME}}",
      "jobTitle": "{{PERSON_2_TITLE}}",
      "worksFor": { "@id": "{{SITE_URL}}/#org" },
      "sameAs": [
        "{{PERSON_2_LINKEDIN}}",
        "{{PERSON_2_GITHUB_OR_OMIT}}"
      ]
    }
  ]
}
```

The `@id` cross-references let LLMs link the nodes into one graph. Do not break them. Any `TODO:` value the user couldn't supply should remain as a literal `TODO:` string, not be invented — it shows up as a fillable placeholder in the validator and is honest about what's missing.

### 3. Build a `/team` page (lifts #3, #4)

Server-rendered. One section per person with: `<h2>` name, `<p>` job title and a one-sentence bio, **visible `<a>` tags pointing to LinkedIn (and GitHub where applicable)**. The JSON-LD `@id` for each Person must match the URL fragment (`/team#{{PERSON_1_SLUG}}`) so the JSON-LD graph and the rendered HTML reinforce each other. LLMs cross-check; assert the same facts in both places.

### 4. Rewrite the homepage opening to be answer-shaped (lifts #4)

The first 40 words of the rendered homepage body must directly state: what {{ORG_NAME}} is, what problem it solves, and (in one phrase) who runs it. AI engines lift the opening 1–2 sentences as the answer. Lead with the answer, not with a tagline.

### 5. Add question-shaped H2/H3 headings (lifts #4)

On `/about` and `/team`: "Who runs {{ORG_NAME}}?", "What is the team's background?", "Where can I see the team's open-source work?". On `/product`: "How does {{ORG_NAME}} work?", "What problem does it solve?". Headings that map onto actual user prompts.

### 6. Raise fact density (lifts #5)

Wherever the existing copy makes a numeric or factual claim (throughput, latency, customers, projects shipped, team size), the rendered HTML must show the specific number + a source link. One table somewhere — for product comparison or feature enumeration — counts heavily.

### 7. Publish `/llms.txt` (lifts #7)

A short, well-formed file at the site root:

```
# {{ORG_NAME}}

> {{ORG_DESCRIPTION}}

## Core
- [About]({{SITE_URL}}/about): company background, team, mission.
- [Team]({{SITE_URL}}/team): {{PERSON_1_NAME}} ({{PERSON_1_TITLE}}), {{PERSON_2_NAME}} ({{PERSON_2_TITLE}}).
- [Product]({{SITE_URL}}/product): what it does and how.

## Optional
- [Press]({{SITE_URL}}/press): independent coverage.
```

### 8. On-chain proof (only if this site makes blockchain claims)

If the site mentions any on-chain identifier (App ID, contract address, transaction hash, ASA, token): the identifier MUST appear in the server-rendered HTML (e.g. inside a `<dl>`/`<dd>` block) AND link to a public explorer for the relevant chain (allo.info / Pera / Dappflow for Algorand; Etherscan for Ethereum; Solscan for Solana; etc.). Do not bury proofs in a JS dashboard. If the site makes no blockchain claims, skip this step — the dimension is graded as "not applicable" and does not penalise.

### 9. Verify robots.txt doesn't block AI crawlers (lifts #6)

Fetch `{{SITE_URL}}/robots.txt` and confirm there's no `Disallow: /` rule targeting `GPTBot`, `ClaudeBot`, `PerplexityBot`, or `Google-Extended`. If there is, remove those rules unless the block is deliberate (and tell me before doing so).

## Hard constraints

- **Do not invent identity URLs.** Wikidata QIDs, Crunchbase slugs, LinkedIn company URLs — if you don't have it, ask. Inventing them poisons the entire `sameAs` graph.
- **Do not break the visual design.** The fix is almost entirely at the HTML / JSON-LD / build-config layer; the rendered visual should look the same after as before.
- **Do not introduce a new JS framework.** Work with whatever the repo already uses. If the framework genuinely doesn't support SSR/SSG, stop and tell me before any rewrite.
- **Do not regress existing routes.** Every URL that worked before must still work.
- **Do not write new marketing prose.** Lift existing JS-rendered copy into SSR. If a section is missing entirely (e.g. there's no /team page yet), ask me before drafting body content.

## Verification — all three must pass before reporting done

1. **The scanner.** Run for each route and report the score per route:
   ```
   npx @kirkelabs/ai-legibility-scan {{SITE_URL}}
   npx @kirkelabs/ai-legibility-scan {{SITE_URL}}/about
   npx @kirkelabs/ai-legibility-scan {{SITE_URL}}/team
   npx @kirkelabs/ai-legibility-scan {{SITE_URL}}/product
   ```
   Homepage ≥ 80; other routes ≥ 70.

2. **Crawler-eye-view curl.** Confirm a team member is visible without JS:
   ```
   curl -A "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; GPTBot/1.0; +https://openai.com/gptbot)" {{SITE_URL}}/team | grep -c "{{PERSON_1_NAME}}"
   ```
   Must return ≥ 1.

3. **Schema.org validator.** Paste the rendered HTML of `/` and `/team` into <https://validator.schema.org/> — zero errors, all Person nodes and the Organization node detected, the `@graph` cross-references resolved.

## What to report back

When all three verifications pass:
- New score per route, before-vs-after delta per dimension.
- The list of TODOs you left in place because the URL/data wasn't available (Wikidata, Crunchbase, LinkedIn company, GitHub org, anything else).
- Anything you couldn't fix and why (framework constraint, deploy lag, external blocker).
````

## Adjusting for team size

The template ships with **two `Person` blocks** because most companies are co-founded. Adjustments:

- **Solo founder.** Delete the second `Person` block from the JSON-LD entirely. Remove the second `@id` from `Organization.employee`. Drop `, {{PERSON_2_NAME}} ({{PERSON_2_TITLE}})` from the `llms.txt` Team line. Remove the row for Person 2 from the "Canonical identities" table at the top of the prompt.
- **Three or more team members.** Duplicate the second `Person` block as many times as needed, incrementing the placeholder suffix (`PERSON_3_*`, `PERSON_4_*`, …). Add each new `@id` to `Organization.employee`. Extend the `llms.txt` Team line and the canonical-identities table.

In both cases, the `@id` cross-references between `Organization` → `employee` Person → `worksFor` Organization must stay intact. That graph is what LLMs traverse to verify identity.

## Adjusting for non-blockchain sites

Dimension #8 (on-chain legibility) is opt-in. If `{{SITE_URL}}` makes no blockchain claims, **delete section 8** ("On-chain proof …") from the prompt entirely. The scanner grades this dimension as "not applicable" for non-blockchain sites and awards a neutral score, so removing the section from the prompt prevents Claude from inventing on-chain assertions where none exist.

If your site uses a non-Algorand chain, keep section 8 but swap the explorer recommendation (Etherscan / Solscan / mempool.space for Ethereum / Solana / Bitcoin respectively).
