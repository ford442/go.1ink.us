/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ANALYTICS_DISABLED?: string;
  readonly VITE_ANALYTICS_BEACON_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
