/**
 * fetcher.js
 *
 * Retrieves a URL the same way a non-JavaScript AI crawler does.
 * GPTBot, ClaudeBot, PerplexityBot and Google-Extended do not execute
 * JavaScript — they read the raw HTML the server returns. This module
 * deliberately performs a single plain HTTP GET with an AI-crawler
 * user agent and never runs scripts, so the scan reflects exactly what
 * an AI agent can actually see.
 */

const USER_AGENTS = {
  gptbot:
    'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; GPTBot/1.1; +https://openai.com/gptbot',
  claudebot:
    'Mozilla/5.0 (compatible; ClaudeBot/1.0; +https://www.anthropic.com/claude-bot)',
  perplexitybot:
    'Mozilla/5.0 (compatible; PerplexityBot/1.0; +https://perplexity.ai/perplexitybot)',
  google:
    'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; Google-Extended',
  default: 'ai-legibility-scan/0.1 (+https://github.com/kirke-labs/ai-legibility-scan)',
};

/**
 * Fetch a resource as an AI crawler would.
 * @param {string} url
 * @param {object} opts
 * @param {string} [opts.agent='gptbot'] one of the keys in USER_AGENTS
 * @param {number} [opts.timeoutMs=15000]
 * @returns {Promise<{ok:boolean,status:number,html:string,headers:object,finalUrl:string,error?:string}>}
 */
export async function fetchAsCrawler(url, opts = {}) {
  const agent = USER_AGENTS[opts.agent] || USER_AGENTS.gptbot;
  const timeoutMs = opts.timeoutMs ?? 15000;
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'User-Agent': agent,
        Accept: 'text/html,application/xhtml+xml',
      },
    });
    const html = await res.text();
    const headers = {};
    res.headers.forEach((v, k) => {
      headers[k] = v;
    });
    return {
      ok: res.ok,
      status: res.status,
      html,
      headers,
      finalUrl: res.url || url,
    };
  } catch (err) {
    return {
      ok: false,
      status: 0,
      html: '',
      headers: {},
      finalUrl: url,
      error: err.name === 'AbortError' ? `Timed out after ${timeoutMs}ms` : err.message,
    };
  } finally {
    clearTimeout(t);
  }
}

/**
 * Fetch a sibling resource (robots.txt, llms.txt) at the site root.
 * @param {string} baseUrl
 * @param {string} path e.g. '/llms.txt'
 */
export async function fetchSibling(baseUrl, path, opts = {}) {
  let origin;
  try {
    origin = new URL(baseUrl).origin;
  } catch {
    return { ok: false, status: 0, html: '', headers: {}, finalUrl: path };
  }
  return fetchAsCrawler(origin + path, opts);
}

export { USER_AGENTS };
