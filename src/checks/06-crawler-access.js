/**
 * check 06 — AI crawler access
 *
 * A page can be perfectly legible and still be invisible if robots.txt
 * blocks the AI crawlers. This check fetches robots.txt and reports
 * whether GPTBot, ClaudeBot, PerplexityBot or Google-Extended are
 * disallowed. (Blocking can be a deliberate choice — this check
 * informs rather than punishes hard.)
 */

export const meta = {
  id: 'crawler-access',
  title: 'AI crawler access',
  weight: 7,
  why: 'If robots.txt disallows the AI crawlers, none of the other signals matter — the agents never read the page.',
};

const BOTS = ['GPTBot', 'ClaudeBot', 'PerplexityBot', 'Google-Extended', 'anthropic-ai', 'ChatGPT-User'];

export function run({ robotsTxt }) {
  const findings = [];
  if (robotsTxt == null) {
    return {
      score: 7,
      max: 10,
      findings: [
        {
          level: 'info',
          msg: 'No robots.txt found (or it could not be fetched). Absence means crawlers are not blocked by robots rules.',
        },
      ],
      detail: { blocked: [] },
    };
  }

  const lines = robotsTxt.split('\n').map((l) => l.trim());
  const blocked = [];
  let currentAgents = [];

  for (const line of lines) {
    const low = line.toLowerCase();
    if (low.startsWith('user-agent:')) {
      currentAgents = [line.split(':')[1].trim()];
    } else if (low.startsWith('disallow:')) {
      const path = line.split(':')[1].trim();
      if (path === '/' || path === '') {
        for (const a of currentAgents) {
          const match = BOTS.find((b) => a.toLowerCase() === b.toLowerCase());
          if (match && path === '/') blocked.push(match);
          if (a === '*' && path === '/') blocked.push('* (all bots incl. AI)');
        }
      }
    }
  }

  let score = 10;
  if (blocked.length) {
    score = 2;
    findings.push({
      level: 'fail',
      msg: `robots.txt disallows: ${[...new Set(blocked)].join(', ')}. These agents cannot read the site. Remove the block unless this is intentional.`,
    });
  } else {
    findings.push({
      level: 'pass',
      msg: 'robots.txt does not block the major AI crawlers.',
    });
  }

  return { score, max: 10, findings, detail: { blocked: [...new Set(blocked)] } };
}
