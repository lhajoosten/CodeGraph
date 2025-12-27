/**
 * Type declarations for YAML imports.
 * Allows importing .yaml files as JS objects in TypeScript.
 */

declare module '*.yaml' {
  const content: Record<string, string>;
  export default content;
}

declare module '*.yml' {
  const content: Record<string, string>;
  export default content;
}
