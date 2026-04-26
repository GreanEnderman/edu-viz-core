export const SHARED_RUNTIME_DEPENDENCIES = [
  'react',
  'react-dom',
  '@a2ui/react',
] as const

export type SharedRuntimeDependency = (typeof SHARED_RUNTIME_DEPENDENCIES)[number]

const sharedRuntimeDependencySet = new Set<string>(SHARED_RUNTIME_DEPENDENCIES)

export function isSharedRuntimeDependency(value: string): value is SharedRuntimeDependency {
  return sharedRuntimeDependencySet.has(value)
}
