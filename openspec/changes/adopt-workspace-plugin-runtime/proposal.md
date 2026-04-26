## Why

The current plugin strategy treats each plugin as a near-independent frontend project, which duplicates dependency installation, build configuration, and runtime packaging across plugins. This change is needed now because the repository already has multiple plugins with nearly identical toolchains, and continued growth will make plugin development heavier, slower, and harder to keep consistent.

## What Changes

- Shift plugin development to a monorepo workspace model where the host frontend owns platform dependencies and plugin packages focus on domain-specific code.
- Define a shared runtime contract for plugin bundles so host-provided libraries such as `react`, `react-dom`, and `@a2ui/react` are not reinstalled or repackaged per plugin.
- Extend plugin manifest semantics to declare shared dependencies that must be provided by the host runtime.
- Update plugin loading and dynamic import requirements so plugin bundles can resolve against the shared runtime contract.
- Update plugin developer tooling and templates to prefer workspace-shared configuration instead of per-plugin duplicated scaffolding.
- Update plugin-facing guidance and prompt integration so AI-assisted plugin development follows the new architecture and dependency boundaries.

## Capabilities

### New Capabilities
- `plugin-shared-runtime`: Define the host-plugin runtime contract for shared dependencies, bundle externalization, and plugin compatibility with workspace-managed platform libraries.

### Modified Capabilities
- `plugin-loading`: Change plugin manifest and loading requirements to recognize shared dependency declarations and workspace-oriented plugin packaging.
- `plugin-dynamic-import`: Change plugin bundle expectations so dynamically imported plugin modules rely on host-provided shared runtime dependencies instead of bundling their own platform runtime.
- `plugin-dev-tools`: Change plugin templates and developer tooling to support workspace-shared configuration, reduced per-plugin setup, and AI-friendly authoring guidance.
- `plugin-api`: Change plugin metadata requirements returned by backend APIs to expose the runtime information needed by the host to validate and load shared-runtime plugins.
- `plugin-prompt-integration`: Change plugin capability injection so prompt context reflects the new plugin contract, including runtime expectations and authoring constraints where relevant.

## Impact

- Root workspace and package management configuration
- Frontend plugin runtime, dynamic import flow, and plugin registration path
- Backend plugin manifest validation and plugin metadata APIs
- Plugin template files, build presets, and developer guidance documents
- Existing plugin manifests and build outputs under `plugins/*`
