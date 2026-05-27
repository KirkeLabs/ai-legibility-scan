/**
 * check 04 — Answer-shaped content
 *
 * Generative engines lift content that is structured like an answer:
 * a direct statement in the opening, question-shaped headings, and
 * tables. This check rewards a clear lead and scannable structure.
 */

export const meta = {
  id: 'answer-shaped',
  title: 'Answer-shaped content',
  weight: 8,
  why: 'LLMs preferentially cite content with a direct opening answer, Q&A headings and tables. Buried ledes get averaged away.',
};

export function run({ $ }) {
  const findings = [];
  let score = 0;

  // Opening answer: first substantive paragraph length & directness.
  const firstP = $('p')
    .map((_, el) => $(el).text().trim())
    .get()
    .find((t) => t.length > 40);
  if (firstP && firstP.length >= 40) {
    score += 3;
    findings.push({
      level: 'pass',
      msg: 'A substantive opening paragraph exists — good for the "first 40 words get lifted" effect.',
    });
  } else {
    findings.push({
      level: 'warn',
      msg: 'No clear opening answer near the top. Lead with a direct, quotable statement of what the page is about.',
    });
  }

  // Heading structure.
  const h = $('h1,h2,h3').length;
  if (h >= 3) {
    score += 3;
    findings.push({ level: 'pass', msg: `${h} headings — scannable structure.` });
  } else {
    findings.push({
      level: 'warn',
      msg: `Only ${h} heading(s). Use descriptive H2/H3s; question-shaped headings get matched to prompts.`,
    });
  }

  // Question-shaped headings.
  const qHeads = $('h2,h3')
    .map((_, el) => $(el).text().trim())
    .get()
    .filter((t) => /\?$/.test(t) || /^(how|what|why|when|who|is|can|should)\b/i.test(t));
  if (qHeads.length >= 1) {
    score += 2;
    findings.push({
      level: 'pass',
      msg: `${qHeads.length} question-shaped heading(s) — these map directly onto user prompts.`,
    });
  }

  // Tables.
  if ($('table').length > 0) {
    score += 2;
    findings.push({ level: 'pass', msg: 'Contains a table — structured data is cited more often.' });
  } else {
    findings.push({
      level: 'info',
      msg: 'No tables. Where you compare or enumerate, a table is more citable than prose.',
    });
  }

  return { score: Math.min(10, score), max: 10, findings };
}
