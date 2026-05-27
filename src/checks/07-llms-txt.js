/**
 * check 07 — llms.txt
 *
 * The llms.txt convention (Answer.AI, 2024) gives AI retrievers a
 * curated, priority-ordered Markdown index of a site. Its effect on
 * citation is not yet proven, so this check is a low-weight, low-cost
 * hedge: present and well-formed earns points; absent is a soft miss.
 */

export const meta = {
  id: 'llms-txt',
  title: 'llms.txt',
  weight: 4,
  why: 'A low-cost hedge: a curated /llms.txt gives AI retrievers a clean map of your most important pages. Not yet a proven ranking signal — treat as optional polish.',
};

export function run({ llmsTxt }) {
  const findings = [];
  if (llmsTxt == null) {
    return {
      score: 4,
      max: 10,
      findings: [
        {
          level: 'info',
          msg: 'No /llms.txt found. Optional — a well-formed one is a cheap hedge. Use the generated draft this tool emits as a starting point.',
        },
      ],
      detail: { present: false },
    };
  }

  let score = 5;
  const hasH1 = /^#\s+\S/m.test(llmsTxt);
  const hasSummary = /^>\s+\S/m.test(llmsTxt);
  const hasSections = /^##\s+\S/m.test(llmsTxt);
  const hasLinks = /\[.+\]\(.+\)/.test(llmsTxt);

  if (hasH1) score += 2;
  if (hasSummary) score += 2;
  if (hasSections && hasLinks) score += 1;

  findings.push({
    level: hasH1 && hasSummary ? 'pass' : 'warn',
    msg: `/llms.txt found. ${hasH1 ? 'Has H1 title. ' : 'Missing H1 title. '}${
      hasSummary ? 'Has blockquote summary. ' : 'Missing blockquote summary. '
    }${hasLinks ? 'Has link list.' : 'No curated link list.'}`,
  });

  return { score: Math.min(10, score), max: 10, findings, detail: { present: true } };
}
