import { useState, useEffect } from 'react';
import { castToApiSignature, LayerAkiraHttpAPI, LayerAkiraHttpConfig } from 'layerakira-js';
import { ERC20Token, ERCToDecimalsMap } from 'layerakira-js';
import OrderBookContainer from './components/OrderBook/OrderBookContainer';
import { getTypedDataForJWT, StarknetDomain } from 'layerakira-js';
import { Signer } from 'starknet';

const STRK: ERC20Token = 'STRK';
const USDC: ERC20Token = 'USDC';
const BASE_FEE_TOKEN: ERC20Token = STRK;

const erc20ToDecimals: ERCToDecimalsMap = {
  [STRK]: 18,
  [USDC]: 6,
};

// Target market for the order book
const TARGET_BASE_CURRENCY: ERC20Token = STRK;
const TARGET_QUOTE_CURRENCY: ERC20Token = USDC;
const ORDER_BOOK_LEVELS = 10;

// JWT for Auth
const MESSAGE_JWT = 42n;
const domain: StarknetDomain = {
  name: 'LayerAkira Mobile',
  version: '1',
  chainId: '0x534e5f4d41494e',
};
const signer = new Signer(import.meta.env.VITE_SIGNER_PRIVATE_KEY);

function App() {
  const [httpClient, setHttpClient] = useState<LayerAkiraHttpAPI | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeClient = async () => {
      try {
        const config: LayerAkiraHttpConfig = {
          apiBaseUrl: import.meta.env.VITE_API_HTTP_URL,
        };
        const client = new LayerAkiraHttpAPI(config, erc20ToDecimals, BASE_FEE_TOKEN, console.log);

        const signData = getTypedDataForJWT(MESSAGE_JWT, domain);
        const signature = await signer.signMessage(signData, import.meta.env.VITE_TRADING_ADDRESS);
        const jwtResult = await client.auth(MESSAGE_JWT, castToApiSignature(signature));

        client.setCredentials(
          jwtResult.result!,
          import.meta.env.VITE_TRADING_ADDRESS,
          import.meta.env.VITE_TRADING_ADDRESS
        );
        console.log('HTTP Client credentials set.');

        setHttpClient(client);
      } catch (err) {
        console.error('Failed to initialize HTTP client:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    initializeClient();
  }, []);

  if (isLoading) {
    return <div>Loading Application...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="app-container">
      <h1>LayerAkira Order Book</h1>
      <OrderBookContainer
        httpClient={httpClient!}
        baseCurrency={TARGET_BASE_CURRENCY}
        quoteCurrency={TARGET_QUOTE_CURRENCY}
        levels={ORDER_BOOK_LEVELS}
      />
      {/* TODO: Add theme toggle */}
    </div>
  );
}

export default App;
