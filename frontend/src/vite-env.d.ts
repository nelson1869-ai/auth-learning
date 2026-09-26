/// <reference types="vite/client" />

// Mga env variable ng Vite na ginagamit natin — para may type ang import.meta.env.VITE_API_URL
interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
}
