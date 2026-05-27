# Security Policy

## Scope

`ai-legibility-scan` performs **read-only outbound HTTP GET requests** to URLs you supply, plus the site's `/robots.txt` and `/llms.txt`. It executes no JavaScript, runs no remote code, collects no telemetry, and writes only to the local output directory you choose. No data leaves your machine except the requests to the site you are scanning.

## Reporting a vulnerability

Please email **security@kirkelabs.com** with details and a reproduction. Do not open a public issue for security reports. We aim to acknowledge within 5 working days.

## Supported versions

The latest minor version on npm receives fixes. Pre-1.0, APIs and scoring may change between minors (documented in the changelog).

## Responsible use

This tool audits your own properties or sites you are authorised to assess. Respect target sites' terms and rate limits; the CLI makes a small, fixed number of requests per scan by design.
