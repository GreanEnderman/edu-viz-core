---
name: agents-md-maintainer
description: Create or update project AGENTS.md guidance files. Use when Codex is asked to create AGENTS.md/AGENT.md instructions, add missing agent operating rules, refresh existing project guidance from the current repository state, document build/test commands, or normalize AGENTS.md language so Chinese prose is allowed while key rules, commands, paths, errors, and code conventions remain English or bilingual.
---

# AGENTS.md Maintainer

## Overview

Use this skill to maintain a project-level `AGENTS.md` as an accurate operating contract for future coding agents. Prefer `AGENTS.md` as the canonical filename; treat user mentions of `AGENT.md` as likely shorthand unless the repository already uses `AGENT.md`.

## Workflow

### 1. Locate Scope

- Find existing guidance files: `AGENTS.md`, `AGENT.md`, `.codex/`, `.github/copilot-instructions.md`, `README*`, `CONTRIBUTING*`, package manifests, build configs, and test configs.
- Check whether deeper `AGENTS.md` files exist before editing or creating a parent file. Do not duplicate rules already owned by a deeper file.
- If no guidance file exists in the requested scope, create `AGENTS.md` at the project root or the explicit directory requested by the user.
- If both `AGENTS.md` and `AGENT.md` exist, preserve the repository's current convention and mention the ambiguity in the final note.

### 2. Read Project Evidence

Gather only enough evidence to make the file true:

- Project purpose from `README*`, docs, app names, or entry points.
- Tech stack from manifests such as `package.json`, `pyproject.toml`, `requirements*.txt`, `Cargo.toml`, `go.mod`, `pom.xml`, or solution files.
- Build, test, lint, typecheck, format, and dev-server commands from scripts/configs. Prefer exact commands that already exist.
- Source layout and important paths from the repository tree.
- Coding conventions from existing files, formatters, linters, and naming patterns.
- Safety constraints from deployment, migrations, generated files, secrets, or local environment docs.

Do not invent commands, architecture, or conventions. If something is inferred, label it as inferred or omit it.

### 3. Create or Update Content

When creating a new `AGENTS.md`, include sections that fit the project:

- Project overview
- Repository layout
- Build, test, lint, typecheck, and run commands
- Coding conventions
- Testing and verification expectations
- Environment and secrets rules
- Generated files, migrations, and destructive-operation warnings
- Agent workflow notes specific to this repo

When updating an existing file:

- Preserve valid human-authored guidance and local tone.
- Remove stale or contradicted instructions when project evidence proves they are wrong.
- Prefer small, reviewable edits over a full rewrite unless the file is empty, templated, or badly obsolete.
- Keep instructions actionable. Replace vague advice with exact paths, commands, or decision rules.
- Do not overwrite broader organization or user rules unless the user explicitly asks.

## Language Rules

- `AGENTS.md` may be written in Chinese when that matches the user or repository.
- Keep key rules, commands, paths, config names, error messages, APIs, code style terms, and code conventions in English or bilingual Chinese/English.
- Keep command examples exact and fenced when multi-line.
- Use stable English tokens for things agents must search for later, such as `npm test`, `src/`, `pytest`, `ruff`, `migration`, `generated`, `secrets`, and `do not commit`.
- Avoid translating filenames, package names, CLI flags, env vars, error text, or code identifiers.

## Quality Bar

Before finishing:

- Verify the file uses the correct canonical name and scope.
- Verify every listed command exists in the project or is clearly marked as inferred.
- Verify paths are real or clearly described as patterns.
- Verify no secret values, private credentials, or machine-specific absolute paths were added unless already required by project docs.
- Verify instructions do not conflict with deeper `AGENTS.md` files.
- Run a lightweight readback of the final file to catch broken headings, placeholder text, or duplicated sections.

## Final Response

Report the changed guidance file path, whether it was created or updated, the main project facts captured, and any remaining uncertainty or verification gap.
