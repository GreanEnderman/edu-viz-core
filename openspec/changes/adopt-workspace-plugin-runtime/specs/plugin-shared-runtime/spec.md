## ADDED Requirements

### Requirement: Host provides a shared plugin runtime
The system SHALL define a host-owned shared runtime contract for plugin execution. The shared runtime contract SHALL enumerate the libraries that are installed and versioned by the host workspace and are expected to be treated as external runtime dependencies by plugin bundles.

#### Scenario: Core shared runtime is declared
- **WHEN** the plugin runtime contract is defined for the current architecture
- **THEN** it includes `react`, `react-dom`, and `@a2ui/react` as host-provided shared runtime dependencies

#### Scenario: Future shared runtime additions are curated
- **WHEN** a new library is considered for the shared runtime contract
- **THEN** the library is added only after the host explicitly adopts it as a shared dependency for multiple plugins

### Requirement: Plugin bundles externalize shared runtime dependencies
Plugin build outputs SHALL externalize every dependency declared in the shared runtime contract so that `dist/index.esm.js` contains plugin-specific code only and does not bundle host-provided platform runtime libraries.

#### Scenario: Shared runtime dependency is externalized during build
- **WHEN** a plugin imports `react` or another dependency declared in its `sharedDependencies`
- **THEN** the generated `dist/index.esm.js` does not inline that dependency's implementation

#### Scenario: Plugin-local dependency remains bundled or locally resolved
- **WHEN** a plugin uses a dependency that is not declared as shared runtime
- **THEN** the plugin may keep that dependency as a plugin-local dependency according to the plugin build configuration

### Requirement: Workspace manages platform dependency installation once
The repository SHALL support a workspace-based package management model where host-owned platform dependencies and shared plugin tooling are installed once at the workspace level instead of being independently installed for each plugin package.

#### Scenario: Plugin package resolves host-owned platform dependencies from workspace
- **WHEN** a plugin package depends on `react`, `react-dom`, or `@a2ui/react`
- **THEN** those dependencies are resolved through the shared workspace installation rather than a duplicated plugin-local installation

#### Scenario: Shared plugin tooling is workspace-owned
- **WHEN** plugin packages use common build tooling such as TypeScript or Vite presets
- **THEN** the common tooling is provided through workspace-managed shared configuration or shared packages
