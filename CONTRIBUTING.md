# Contributing

Thanks for considering a contribution. This project is small on purpose; the bar for changes is "does it make the scoring more honest or more useful?"

## Ways to help

- **Report a scoring false positive.** The most valuable contribution. Open an issue with the URL (or a minimal HTML repro), the dimension, and why the score is wrong. There is a dedicated issue template.
- **Add or refine a check.** Each check lives in `src/checks/` as an isolated ES module exporting `meta` and `run(ctx)`. Keep it dependency-free and deterministic.
- **Add ecosystem coverage.** New Algorand explorers, additional identity platforms, etc.
- **Improve docs.** Especially `docs/METHODOLOGY.md` — clarity there is the project's credibility.

## Development

```bash
git clone https://github.com/kirke-labs/ai-legibility-scan
cd ai-legibility-scan
npm install
npm test          # runs the offline engine tests
npm run lint
node bin/cli.js https://example.com
```

## Rules of the road

1. **Tests must pass and new logic needs a test.** Tests are offline (HTML fixtures) so CI never hits live sites.
2. **No new runtime dependencies** without discussion. `cheerio` is the only one; keep it that way if you can.
3. **Conventional Commits** for messages (`feat:`, `fix:`, `docs:`, `chore:`…). This drives semantic-release.
4. **Be honest in scoring.** A check should never reward something that does not genuinely help AI legibility. If in doubt, weight it low and document why in `METHODOLOGY.md`.
5. **Keep it kind.** See the [Code of Conduct](./CODE_OF_CONDUCT.md).

## PR checklist

- [ ] `npm test` passes
- [ ] `npm run lint` clean
- [ ] New behaviour covered by a test fixture
- [ ] `METHODOLOGY.md` updated if scoring changed
- [ ] Commit messages follow Conventional Commits

By contributing you agree your work is released under the project's [MIT licence](./LICENSE).
