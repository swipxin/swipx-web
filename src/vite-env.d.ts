/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DAILY_API_KEY?: string
  readonly VITE_DAILY_DOMAIN?: string
  readonly VITE_GOOGLE_CLIENT_ID?: string
  readonly VITE_FACEBOOK_APP_ID?: string
  readonly VITE_API_BASE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
