/**
 * check 01 — Server-rendered content
 *
 * The single most consequential AI-legibility signal. AI crawlers do not
 * execute JavaScript. If the meaningful text of a page is injected
 * client-side, the page is effectively blank to ChatGPT, Claude and
 * Perplexity. This check estimates how much real text exists in the
 * raw HTML the server returned.
 */

export const meta = {
  id: 'server-rendered',
  title: 'Server-rendered content',
  weight: 10,
  why: 'AI crawlers read raw HTML and do not run JavaScript. Content that only appears after JS execution is invisible to them.',
};

export function run({ $, html }) {
  const findings = [];
  let score = 10;

  // Strip script/style/noscript, measure visible-ish text.
  const body = $('body').clone();
  body.find('script, style, noscript, template').remove();
  const text = body.text().replace(/\s+/g, ' ').trim();
  const words = text ? text.split(' ').filter(Boolean).length : 0;

  // Heuristic: detect an empty SPA shell.
  const bodyText = ($('body').text() || '').replace(/\s+/g, ' ').trim();
  const hasRootDiv =
    $('#root, #app, #__next, [data-reactroot]').length > 0;
  const tinyBody = bodyText.length < 200;

  if (words < 50) {
    score = 1;
    findings.push({
      level: 'fail',
      msg: `Only ~${words} words of text in the raw HTML. To an AI crawler this page is essentially blank.`,
    });
    if (hasRootDiv && tinyBody) {
      findings.push({
        level: 'fail',
        msg: 'Detected an empty client-side app shell (#root/#app/#__next). The content is rendered by JavaScript and AI agents cannot see it. Use SSR, SSG or pre-rendering for narrative pages.',
      });
    }
  } else if (words < 150) {
    score = 5;
    findings.push({
      level: 'warn',
      msg: `~${words} words in raw HTML. Thin for a page meant to explain who you are. Aim for substantive server-rendered prose.`,
    });
  } else {
    score = 10;
    findings.push({
      level: 'pass',
      msg: `~${words} words of server-rendered text — readable by AI crawlers.`,
    });
  }

  // First-impression check: is there meaningful text early in the document?
  const firstChunk = text.slice(0, 400);
  if (words >= 50 && firstChunk.length < 120) {
    score = Math.min(score, 7);
    findings.push({
      level: 'warn',
      msg: 'Very little text near the top of the document. AI models weight the opening heavily — lead with a plain-language summary.',
    });
  }

  return { score, max: 10, findings, detail: { words } };
}
