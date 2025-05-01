import { useState, useEffect } from 'react';
import { castToApiSignature, LayerAkiraHttpAPI, LayerAkiraHttpConfig } from 'layerakira-js';
import { ERC20Token, ERCToDecimalsMap } from 'layerakira-js';
import OrderBookContainer from './components/OrderBook/OrderBookContainer';
import { getTypedDataForJWT, getDomain } from 'layerakira-js';
import { Signer } from 'starknet';
import { convertToBigintRecursively } from 'layerakira-js/dist/api/http/utils';

const AETH: ERC20Token = 'AETH';
const AUSDC: ERC20Token = 'AUSDC';
const BASE_FEE_TOKEN: ERC20Token = AETH;

export const erc20ToDecimals: ERCToDecimalsMap = {
  [AETH]: 18,
  [AUSDC]: 6,
};

// Target market for the order book
export const TARGET_BASE_CURRENCY: ERC20Token = AETH;
export const TARGET_QUOTE_CURRENCY: ERC20Token = AUSDC;
const ORDER_BOOK_LEVELS = 10;

const signer = new Signer(import.meta.env.VITE_PRIVATE_KEY);

function App() {
  const [httpClient, setHttpClient] = useState<LayerAkiraHttpAPI | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeClient = async () => {
      try {
        const config: LayerAkiraHttpConfig = {
          apiBaseUrl: import.meta.env.VITE_API_HTTP_URL,
        };
        const client = new LayerAkiraHttpAPI(config, erc20ToDecimals, BASE_FEE_TOKEN, console.log);

        const signData = await client.getSignData(
          import.meta.env.VITE_PUBLIC_KEY,
          import.meta.env.VITE_TRADING_ADDRESS
        );
        const typedData = convertToBigintRecursively(
          getTypedDataForJWT(signData.result!, getDomain('0x534e5f5345504f4c4941'))
        );
        const sign = await signer.signMessage(typedData, import.meta.env.VITE_TRADING_ADDRESS);
        const jwtResult = await client.auth(signData.result!, castToApiSignature(sign));

        client.setCredentials(
          jwtResult.result!,
          import.meta.env.VITE_TRADING_ADDRESS,
          import.meta.env.VITE_PUBLIC_KEY
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
    <div className="app-container dark:bg-gray-900">
      <h1 className="text-2xl font-bold text-center py-4 mb-6 text-white shadow-md rounded-md mx-4">
        LayerAkira Order Book
      </h1>
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
