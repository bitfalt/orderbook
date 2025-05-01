/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_HTTP_URL: string;
  readonly VITE_API_WS_URL: string;

  readonly VITE_PRIVATE_KEY: string;
  readonly VITE_PUBLIC_KEY: string;
  readonly VITE_TRADING_ADDRESS: string;
}
