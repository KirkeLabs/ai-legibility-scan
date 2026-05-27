/**
 * check 08 — On-chain legibility (Algorand)
 *
 * The differentiator for this tool in the Algorand ecosystem. Many
 * dApps make on-chain claims ("provably fair", "transparent
 * settlement") but only expose the proof inside a JavaScript
 * dashboard, where no AI can verify it. This check looks for Algorand
 * Application IDs, Asset (ASA) IDs and transaction IDs rendered as
 * crawlable text linked to a public explorer.
 */

export const meta = {
  id: 'onchain-legibility',
  title: 'On-chain legibility (Algorand)',
  weight: 5,
  why: 'On-chain trust claims are worthless to a skeptical AI unless the proof is server-rendered and linked to a public explorer. This is the bonus that matters for Algorand projects.',
};

const EXPLORERS = ['allo.info', 'algoexplorer.io', 'explorer.perawallet.app', 'app.dappflow.org', 'lora.algokit.io'];

export function run({ $, html }) {
  const findings = [];
  const hay = html.toLowerCase();

  // Is the project even making an on-chain claim?
  const claimsOnChain =
    /\b(on-chain|onchain|algorand|blockchain|provably fair|verifiable|smart contract)\b/i.test(html);

  if (!claimsOnChain) {
    return {
      score: 5,
      max: 10,
      findings: [
        {
          level: 'info',
          msg: 'No on-chain claims detected — this dimension is not applicable. Scored neutral.',
        },
      ],
      detail: { applicable: false },
    };
  }

  let score = 2;
  const explorerLinked = EXPLORERS.some((e) => hay.includes(e));
  // Algorand TxIDs are 52-char base32; App/ASA IDs are integers near keywords.
  const txLike = /\b[A-Z2-7]{52}\b/.test(html);
  const idLike = /\b(application id|app id|asset id|asa id|contract address)\b/i.test(html);

  if (explorerLinked) {
    score += 4;
    findings.push({
      level: 'pass',
      msg: 'Links to a public Algorand explorer found — proof is independently verifiable by humans and crawlers.',
    });
  } else {
    findings.push({
      level: 'fail',
      msg: 'On-chain claims made, but no link to a public explorer (allo.info, Pera, Dappflow, Lora). The proof is not crawlable.',
    });
  }

  if (txLike || idLike) {
    score += 4;
    findings.push({
      level: 'pass',
      msg: 'Algorand identifiers (App/ASA/Tx) appear in the raw HTML — server-rendered proof, not a JS-only dashboard.',
    });
  } else {
    findings.push({
      level: 'warn',
      msg: 'No Algorand App/ASA/Tx identifiers in the server-rendered HTML. Print them as plain text (e.g. in a <dl>) so AI agents can cite the proof.',
    });
  }

  return { score: Math.min(10, score), max: 10, findings, detail: { applicable: true, explorerLinked } };
}
