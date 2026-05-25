# DevAssist

DevAssist is a minimal, production-oriented CLI assistant for developers. It analyzes codebases, explains errors, and suggests fixes using a pluggable AI backend.

Features
- `scan`: fast project scan producing a structured JSON report
- `ask`: ask a focused question using the configured local AI backend
- `explain`: high-level project summary (what it does, tech stack, architecture, improvements)
- `error`: analyze error logs or source files and suggest fixes (powered by Ollama + mistral)

Requirements
- Node.js (LTS, >=18)
- npm
- Ollama (for AI features)

## Ollama Setup

The `explain` and `error` commands use Ollama running locally with the `mistral` model.

1. **Install Ollama**: Download from [https://ollama.ai](https://ollama.ai)

2. **Start Ollama in the background**:
```bash
ollama serve
```

3. **In another terminal, pull the mistral model**:
```bash
ollama pull mistral
```

4. **Verify Ollama is running**:
```bash
curl http://localhost:11434/api/tags
```

If you see model list output, Ollama is ready. If commands fail, check that `ollama serve` is still running.

Install

Global install (for publishing):

```bash
npm install -g devassist
```

Run via npx (no install required):

```bash
npx devassist scan
# or
npx ts-node src/index.ts scan
```

Local dev

```bash
npm install
npm run dev -- scan
```

Quick examples

- Scan the repository and output JSON:

```bash
npx ts-node src/index.ts scan > project-report.json
npx ts-node src/index.ts scan --summary
```

- Ask a focused question (uses Ollama):

```bash
npx ts-node src/index.ts ask "What does src/core/scanner.ts do?"
```

- Explain the project (uses a fast snapshot + AI summarization):

```bash
npx ts-node src/index.ts explain
```

- Analyze an error log (pasted or file):

```bash
npx ts-node src/index.ts error "TypeError: x is not a function at src/foo.ts:42:13"
npx ts-node src/index.ts error ./logs/error.log
npx ts-node src/index.ts error src/foo.ts
```

Example output (illustrative)

```
What this project does
- A Node.js CLI utility and library for parsing CSV and generating reports.

Tech stack used
- TypeScript, Node.js, Commander-style CLI, Jest for tests.

Architecture overview
- CLI entry -> core services (scanner, ai) -> pluggable AI adapters

Suggested improvements
- Add caching for scanned results
- Integrate a real AI provider with secure key storage
```


Preparing for npm publish

Checklist:

- Update `package.json` `version` and `repository` fields.
- Run `npm run build` to compile TypeScript to `dist/`.
- Ensure `files` in `package.json` includes `dist` (already configured).
- Login to npm: `npm login`.
- Publish: `npm publish --access public` (for scoped packages use appropriate access).

Polish & hygiene

- No debug logs printed during normal operation.
- Commands use concise, colored, wrapped output for readability.

Contributing

PRs welcome. Please open issues for feature requests or bugs.

License

MIT — see `LICENSE` file.
