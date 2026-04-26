## 1. Workspace Foundation

- [x] 1.1 Add a root workspace package configuration that includes `frontend`, `plugins/*`, and any new shared packages.
- [x] 1.2 Move shared frontend platform dependencies and common toolchain versions into workspace-managed configuration.
- [x] 1.3 Create a shared package such as `packages/plugin-runtime` for plugin runtime types, helper contracts, and reusable authoring utilities.

## 2. Shared Runtime Contract

- [x] 2.1 Define the initial shared runtime allowlist for `react`, `react-dom`, and `@a2ui/react`.
- [x] 2.2 Update plugin manifest models and validation to support the optional `sharedDependencies` field.
- [x] 2.3 Document how shared dependencies are declared, validated, and promoted from plugin-local to host-provided runtime libraries.

## 3. Plugin Build and Loading

- [x] 3.1 Create shared plugin build presets for TypeScript and Vite so plugins can externalize shared runtime dependencies consistently.
- [x] 3.2 Update existing plugin bundle expectations so `dist/index.esm.js` preserves the current output contract while excluding shared runtime implementations.
- [x] 3.3 Update frontend dynamic plugin loading to treat `sharedDependencies` as host-provided runtime requirements instead of plugin-bundled code.
- [x] 3.4 Update backend plugin loading and registration so shared runtime metadata is retained with each loaded plugin.

## 4. Plugin APIs and Prompt Integration

- [x] 4.1 Update `GET /api/v1/plugins` responses to include each plugin's `sharedDependencies`.
- [ ] 4.2 Ensure plugin static asset serving remains compatible with shared-runtime plugin bundles.
- [ ] 4.3 Update plugin capability injection in prompt-building so plugin guidance reflects the “host platform extension” model rather than standalone app assumptions.

## 5. Developer Tooling and Documentation

- [x] 5.1 Refactor `plugins/_template` to align with the workspace-shared toolchain and shared runtime contract.
- [x] 5.2 Update manifest generation prompts and plugin authoring guidance to discourage per-plugin duplicated dependency stacks.
- [x] 5.3 Update plugin development documentation to explain shared dependencies, workspace usage, and AI-friendly plugin authoring constraints.

## 6. Existing Plugin Migration and Verification

- [x] 6.1 Migrate current plugins under `plugins/*` to the shared workspace and preset-based configuration.
- [x] 6.2 Add or update manifests for existing plugins to declare required `sharedDependencies`.
- [x] 6.3 Verify existing plugins still build to `dist/index.esm.js` and load correctly through the host frontend.
- [ ] 6.4 Verify backend plugin APIs, prompt integration, and Gallery-based previews continue to work after the migration.
