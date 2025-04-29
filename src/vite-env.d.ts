/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_HTTP_URL: string;
  readonly VITE_API_WS_URL: string;

  readonly VITE_SIGNER_PRIVATE_KEY: string;
  // Public key of the signer
  readonly VITE_TRADING_ADDRESS: string;
}
