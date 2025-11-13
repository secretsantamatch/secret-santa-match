// FIX: Manually define Vite's client types to resolve build errors when
// the `vite/client` reference cannot be found by the TypeScript server.
// This ensures that `import.meta.env` is correctly typed for the project.

interface ImportMetaEnv {
  readonly DEV: boolean;
  // readonly VITE_APP_TITLE: string
  // Add other env variables here...
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
