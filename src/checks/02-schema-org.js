/**
 * check 02 — Schema.org structured data
 *
 * JSON-LD tells a machine, unambiguously, what an entity is. This check
 * looks for parseable JSON-LD blocks and the entity types that matter
 * most for AI legibility: Organization, Person, Product/Service,
 * Article, FAQPage, BreadcrumbList — and the sameAs graph.
 */

export const meta = {
  id: 'schema-org',
  title: 'Schema.org structured data',
  weight: 10,
  why: 'Structured data removes interpretation from the facts you cannot afford to have guessed (who you are, what you do, which profiles are yours).',
};

const VALUED_TYPES = [
  'Organization',
  'Person',
  'Product',
  'Service',
  'Article',
  'FAQPage',
  'BreadcrumbList',
  'WebSite',
  'SoftwareApplication',
];

export function run({ $ }) {
  const findings = [];
  const blocks = $('script[type="application/ld+json"]');
  const foundTypes = new Set();
  let parsedOk = 0;
  let parseErrors = 0;
  let hasSameAs = false;

  blocks.each((_, el) => {
    const raw = $(el).contents().text();
    try {
      const json = JSON.parse(raw);
      parsedOk++;
      collectTypes(json, foundTypes);
      if (JSON.stringify(json).includes('"sameAs"')) hasSameAs = true;
    } catch {
      parseErrors++;
    }
  });

  let score = 0;

  if (blocks.length === 0) {
    findings.push({
      level: 'fail',
      msg: 'No JSON-LD structured data found. Add Organization, Person and Product blocks so machines can resolve the entity without guessing.',
    });
    return { score: 0, max: 10, findings, detail: { types: [] } };
  }

  if (parseErrors > 0) {
    findings.push({
      level: 'fail',
      msg: `${parseErrors} JSON-LD block(s) failed to parse. Invalid structured data is worse than none — validate at validator.schema.org.`,
    });
  }

  const valued = [...foundTypes].filter((t) => VALUED_TYPES.includes(t));
  score += Math.min(6, valued.length * 2);
  if (valued.length) {
    findings.push({
      level: 'pass',
      msg: `Found high-value types: ${valued.join(', ')}.`,
    });
  } else if (parsedOk > 0) {
    findings.push({
      level: 'warn',
      msg: `JSON-LD present but none of the high-value entity types (${VALUED_TYPES.slice(0, 5).join(', ')}…) were detected.`,
    });
  }

  if (hasSameAs) {
    score += 4;
    findings.push({
      level: 'pass',
      msg: 'A sameAs graph is present — this is the thread that ties scattered profiles into one entity.',
    });
  } else {
    findings.push({
      level: 'warn',
      msg: 'No sameAs links found. Add sameAs (Wikidata, LinkedIn, Crunchbase, GitHub) to consolidate identity.',
    });
  }

  return {
    score: Math.min(10, score),
    max: 10,
    findings,
    detail: { types: [...foundTypes], hasSameAs },
  };
}

function collectTypes(node, set) {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)) {
    node.forEach((n) => collectTypes(n, set));
    return;
  }
  if (node['@type']) {
    const t = node['@type'];
    (Array.isArray(t) ? t : [t]).forEach((x) => set.add(String(x)));
  }
  if (node['@graph']) collectTypes(node['@graph'], set);
  for (const k of Object.keys(node)) {
    if (k !== '@type' && k !== '@graph') collectTypes(node[k], set);
  }
}
