/**
 * check 03 — Entity identity
 *
 * An AI resolves you as a node in a knowledge graph, not as prose.
 * This check looks for outbound links to the platforms that build
 * entity confidence: Wikidata, Wikipedia, Crunchbase, LinkedIn,
 * GitHub, ORCID, Goodreads. Their presence (in links or sameAs)
 * signals a corroborated, disambiguated identity.
 */

export const meta = {
  id: 'entity-identity',
  title: 'Entity identity & corroboration',
  weight: 10,
  why: 'AI engines weight independent, structured identity signals heavily. Links to Wikidata/Crunchbase/LinkedIn/GitHub turn "a website" into "a known entity".',
};

const SIGNALS = [
  { key: 'wikidata', host: 'wikidata.org', label: 'Wikidata', points: 3 },
  { key: 'wikipedia', host: 'wikipedia.org', label: 'Wikipedia', points: 3 },
  { key: 'crunchbase', host: 'crunchbase.com', label: 'Crunchbase', points: 2 },
  { key: 'linkedin', host: 'linkedin.com', label: 'LinkedIn', points: 2 },
  { key: 'github', host: 'github.com', label: 'GitHub', points: 2 },
  { key: 'orcid', host: 'orcid.org', label: 'ORCID', points: 1 },
  { key: 'goodreads', host: 'goodreads.com', label: 'Goodreads', points: 1 },
];

export function run({ $, html }) {
  const findings = [];
  const hay = html.toLowerCase();
  const present = [];
  let raw = 0;

  for (const s of SIGNALS) {
    if (hay.includes(s.host)) {
      present.push(s.label);
      raw += s.points;
    }
  }

  let score = Math.min(10, raw);

  if (present.length === 0) {
    score = 0;
    findings.push({
      level: 'fail',
      msg: 'No links to identity/knowledge-graph platforms found (Wikidata, Crunchbase, LinkedIn, GitHub…). Nothing corroborates who this entity is.',
    });
  } else {
    findings.push({
      level: present.length >= 3 ? 'pass' : 'warn',
      msg: `Identity signals present: ${present.join(', ')}.`,
    });
    if (!hay.includes('wikidata.org')) {
      findings.push({
        level: 'warn',
        msg: 'No Wikidata reference. Wikidata is the upstream source feeding Google Knowledge Panels and major-model entity resolution — create an item and link it.',
      });
    }
    if (present.length < 3) {
      findings.push({
        level: 'warn',
        msg: 'Few corroborating platforms. Aim for at least three consistent profiles cross-linked via sameAs.',
      });
    }
  }

  return { score, max: 10, findings, detail: { present } };
}
