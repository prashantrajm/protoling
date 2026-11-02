# Security policy

## Supported versions

Protoling is pre-1.0. Only the latest version on `main` gets security fixes.

## Reporting a vulnerability

Please **don't open a public issue** for security problems.

Email **[hello@synonymy.studio](mailto:hello@synonymy.studio)** with:

- what the problem is and what an attacker could do with it
- steps to reproduce, or a proof of concept
- the commit or version you tested
- whether you'd like to be credited, and how

We aim to acknowledge reports within a week and will keep you updated while we work on a fix. Please give us a reasonable chance to release a fix before disclosing the problem publicly.

## Scope

Protoling is a local development tool: it runs on your machine through Vite's dev server and has no hosted service, accounts or database. Things worth knowing when assessing a report:

- **`bun run dev:phone` exposes the dev server on your local network** so a phone can open prototypes. Anyone on that network can then view your prototypes. Only use it on networks you trust. Protoling's own dev endpoint is read-only, and it never writes to your files.
- **Prototypes are code.** Opening someone else's project runs their code in your browser and their route files through Vite on your machine. Treat a project from an untrusted source like any untrusted code.
- **Static builds** (`bun run build`) contain every project in `projects/`. Don't host a build publicly if your prototypes are confidential.

Reports about these behaviours are welcome if you find a way they can be abused beyond what's described here. Vulnerabilities in dependencies such as Vite or React should go to those projects, though we're glad to hear about any that affect Protoling.
