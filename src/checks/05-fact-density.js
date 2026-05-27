/**
 * check 05 — Fact density
 *
 * The Princeton GEO study found statistic-rich and well-sourced
 * content materially more likely to be cited by generative engines.
 * This check estimates the density of numbers, named sources and
 * dated claims per ~200 words.
 */

export const meta = {
  id: 'fact-density',
  title: 'Fact density & sourcing',
  weight: 7,
  why: 'Statistics and explicit sourcing raise generative-engine citation likelihood (GEO research: statistics ~+41%, source emphasis ~+115%).',
};

export function run({ $ }) {
  const findings = [];
  const body = $('body').clone();
  body.find('script, style, noscript').remove();
  const text = body.text().replace(/\s+/g, ' ').trim();
  const words = text ? text.split(' ').filter(Boolean).length : 0;

  if (words < 80) {
    return {
      score: 0,
      max: 10,
      findings: [
        { level: 'fail', msg: 'Too little text to assess fact density (see server-rendered check).' },
      ],
    };
  }

  const stats = (text.match(/\b\d+([.,]\d+)?\s?(%|percent|x|million|billion|k\b)/gi) || []).length;
  const years = (text.match(/\b(19|20)\d{2}\b/g) || []).length;
  const cites = (text.match(/\b(according to|study|research|report|survey|data from|source:)\b/gi) || []).length;

  const per200 = (n) => n / (words / 200);
  const density = per200(stats + cites);

  let score = 0;
  if (density >= 1.5) {
    score = 9;
    findings.push({
      level: 'pass',
      msg: `Strong fact density (~${density.toFixed(1)} statistics/citations per 200 words).`,
    });
  } else if (density >= 0.6) {
    score = 6;
    findings.push({
      level: 'warn',
      msg: `Moderate fact density (~${density.toFixed(1)} per 200 words). Add specific numbers and explicit "according to X" sourcing.`,
    });
  } else {
    score = 3;
    findings.push({
      level: 'warn',
      msg: 'Low fact density. Generative engines down-weight unsupported, generic prose — anchor claims with figures and named sources.',
    });
  }

  if (years >= 1) {
    score = Math.min(10, score + 1);
    findings.push({ level: 'pass', msg: 'Dated claims present — recency/specificity helps.' });
  }

  return { score, max: 10, findings, detail: { words, stats, cites, years } };
}
