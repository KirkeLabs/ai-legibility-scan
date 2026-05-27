/**
 * scorecard.js — renders a self-contained, shareable HTML scorecard.
 * No external assets; deployable to GitHub Pages or saved as a file.
 */

const C = {
  bg: '#0A0E0D',
  panel: '#121A17',
  line: '#23302B',
  txt: '#E6EDE9',
  soft: '#A7B5AF',
  mute: '#6C7C75',
  acc: '#00D08A',
  warn: '#E0A93C',
  fail: '#E0623C',
};

function gradeColor(g) {
  return g === 'A' || g === 'B' ? C.acc : g === 'C' ? C.warn : C.fail;
}
function lvlColor(l) {
  return l === 'pass'
    ? C.acc
    : l === 'warn'
      ? C.warn
      : l === 'fail'
        ? C.fail
        : C.mute;
}
function esc(s) {
  return String(s).replace(/[&<>"]/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[m]);
}

export function renderScorecard(r) {
  const gc = gradeColor(r.grade);
  const dims = r.dimensions
    .map((d) => {
      const pct = Math.round((d.score / d.max) * 100);
      const findings = d.findings
        .map(
          (f) =>
            `<li style="border-left:2px solid ${lvlColor(f.level)};padding-left:10px;margin:6px 0;color:${C.soft}">
               <span style="font-family:'JetBrains Mono',monospace;font-size:10px;text-transform:uppercase;letter-spacing:.12em;color:${lvlColor(f.level)}">${f.level}</span><br>${esc(f.msg)}</li>`,
        )
        .join('');
      return `<div style="background:${C.panel};border:1px solid ${C.line};border-radius:12px;padding:20px 22px;margin:12px 0">
        <div style="display:flex;justify-content:space-between;align-items:baseline;gap:14px;flex-wrap:wrap">
          <h3 style="margin:0;font-size:17px;color:${C.txt}">${esc(d.title)}</h3>
          <span style="font-family:'JetBrains Mono',monospace;font-size:15px;color:${pct >= 70 ? C.acc : pct >= 40 ? C.warn : C.fail}">${d.score}/${d.max}</span>
        </div>
        <div style="height:6px;background:${C.line};border-radius:4px;margin:12px 0;overflow:hidden">
          <div style="height:100%;width:${pct}%;background:${pct >= 70 ? C.acc : pct >= 40 ? C.warn : C.fail}"></div>
        </div>
        <p style="margin:6px 0 10px;font-size:13px;color:${C.mute};font-style:italic">${esc(d.why)}</p>
        <ul style="list-style:none;margin:0;padding:0;font-size:13.5px;line-height:1.5">${findings}</ul>
      </div>`;
    })
    .join('');

  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>AI Legibility Scorecard — ${esc(r.url)}</title>
<link href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;600;800;900&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">
<style>body{margin:0;background:${C.bg};color:${C.txt};font-family:'Archivo',sans-serif;line-height:1.6;
background-image:radial-gradient(800px 400px at 80% -5%,rgba(0,208,138,.06),transparent 60%)}
.wrap{max-width:820px;margin:0 auto;padding:48px 28px}a{color:${C.acc}}</style></head><body>
<div class="wrap">
  <div style="font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:.22em;text-transform:uppercase;color:${C.acc};margin-bottom:24px">AI Legibility Scorecard · @kirkelabs/ai-legibility-scan</div>
  <div style="display:flex;align-items:center;gap:28px;flex-wrap:wrap;border-bottom:1px solid ${C.line};padding-bottom:28px;margin-bottom:24px">
    <div style="width:120px;height:120px;border-radius:20px;border:2px solid ${gc};display:flex;flex-direction:column;align-items:center;justify-content:center">
      <div style="font-family:'Archivo';font-weight:900;font-size:46px;color:${gc};line-height:1">${r.grade}</div>
      <div style="font-family:'JetBrains Mono',monospace;font-size:13px;color:${C.soft}">${r.score}/100</div>
    </div>
    <div style="flex:1;min-width:240px">
      <div style="font-size:13px;color:${C.mute};font-family:'JetBrains Mono',monospace">SCANNED URL</div>
      <div style="font-size:19px;font-weight:600;word-break:break-all;margin:4px 0 12px">${esc(r.url)}</div>
      <div style="font-size:12px;color:${C.mute};font-family:'JetBrains Mono',monospace">Crawler: ${esc(r.agent)} · ${esc(r.scannedAt)}</div>
    </div>
  </div>
  ${dims}
  <div style="margin-top:34px;border-top:1px solid ${C.line};padding-top:22px;font-size:12px;color:${C.mute};font-family:'JetBrains Mono',monospace;line-height:1.8">
    Open-source · MIT · Built by Soleman El Gelawi (CTO, Kirke Labs), with Steve Kirton — as a gift to the Algorand ecosystem.<br>
    github.com/KirkeLabs/ai-legibility-scan · www.kirkelabs.com<br>
    Heuristic indicators, not a guarantee of AI citation. See the methodology doc in the repo.
  </div>
</div></body></html>`;
}
