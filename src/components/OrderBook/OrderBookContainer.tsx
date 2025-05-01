import React, { useEffect, useState, useCallback } from 'react';
import {
  LayerAkiraHttpAPI,
  LayerAkiraWSSAPI,
  SocketEvent,
  TableLevel,
  TableUpdate,
  Snapshot,
  Result,
  BBO,
} from 'layerakira-js';
import OrderBookDisplay from './OrderBookDisplay';
import { OrderBookState } from '../../types/orderbook';
import {
  parseTableLevel,
  formatRowsData,
  formatRowData,
  sortBids,
  sortAsks,
} from '../../utils/formatter';
import { erc20ToDecimals, TARGET_BASE_CURRENCY, TARGET_QUOTE_CURRENCY } from '../../App';

interface OrderBookContainerProps {
  httpClient: LayerAkiraHttpAPI;
  baseCurrency: string;
  quoteCurrency: string;
  levels?: number;
}

const OrderBookContainer: React.FC<OrderBookContainerProps> = ({
  httpClient,
  baseCurrency,
  quoteCurrency,
  levels = 10,
}) => {
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [orderBook, setOrderBook] = useState<OrderBookState>({
    bids: [],
    asks: [],
    lastUpdateTime: Date.now(),
  });
  const [error, setError] = useState<string | null>(null);
  const [changedPrices, setChangedPrices] = useState<Set<string>>(new Set());

  // TODO: Implement the function to process order book data in different file to make code cleaner and improve logic when possible

  const processOrderBook = useCallback(
    (bidsArray: TableLevel[], asksArray: TableLevel[]) => {
      // Convert the bigint to a number for display
      const formattedBids = formatRowsData(
        bidsArray,
        erc20ToDecimals[TARGET_BASE_CURRENCY],
        erc20ToDecimals[TARGET_QUOTE_CURRENCY]
      );
      const formattedAsks = formatRowsData(
        asksArray,
        erc20ToDecimals[TARGET_BASE_CURRENCY],
        erc20ToDecimals[TARGET_QUOTE_CURRENCY]
      );

      return {
        bids: formattedBids,
        asks: formattedAsks,
        lastUpdateTime: Date.now(),
      };
    },
    [levels]
  );

  // Websocket callback
  const handleWebSocketEvent = async (event: TableUpdate | BBO | SocketEvent.DISCONNECT) => {
    if (event === SocketEvent.DISCONNECT) {
      setIsConnected(false);
      setError('Disconnected from order book stream');
      return;
    }

    setIsConnected(true);

    console.log('event', event);

    if ('bids' in event && 'asks' in event) {
      const updateData = event as TableUpdate;

      // Track changed prices for animations
      const newChangedPrices = new Set<string>();

      setOrderBook(prevBook => {
        // Create a map of existing bids and asks for quick lookup
        const bidMap = new Map(prevBook.bids.map(bid => [bid.price, bid]));
        const askMap = new Map(prevBook.asks.map(ask => [ask.price, ask]));

        const updatedBids = parseTableLevel(updateData.bids);
        const updatedAsks = parseTableLevel(updateData.asks);

        updatedBids.forEach(bid => {
          const key = formatRowData(
            bid,
            erc20ToDecimals[TARGET_BASE_CURRENCY],
            erc20ToDecimals[TARGET_QUOTE_CURRENCY]
          );
          const priceKey = key.price;
          newChangedPrices.add(priceKey);

          if (bid.orders === 0) {
            bidMap.delete(priceKey);
          } else {
            bidMap.set(
              priceKey,
              formatRowData(
                bid,
                erc20ToDecimals[TARGET_BASE_CURRENCY],
                erc20ToDecimals[TARGET_QUOTE_CURRENCY]
              )
            );
          }
        });

        updatedAsks.forEach(ask => {
          const key = formatRowData(
            ask,
            erc20ToDecimals[TARGET_BASE_CURRENCY],
            erc20ToDecimals[TARGET_QUOTE_CURRENCY]
          );
          const priceKey = key.price;
          newChangedPrices.add(priceKey);

          if (ask.orders === 0) {
            askMap.delete(priceKey);
          } else {
            askMap.set(
              priceKey,
              formatRowData(
                ask,
                erc20ToDecimals[TARGET_BASE_CURRENCY],
                erc20ToDecimals[TARGET_QUOTE_CURRENCY]
              )
            );
          }
        });

        const newBids = Array.from(bidMap.values());
        const newAsks = Array.from(askMap.values());

        return {
          bids: sortBids(newBids),
          asks: sortAsks(newAsks),
          lastUpdateTime: Date.now(),
        };
      });

      setChangedPrices(newChangedPrices);

      setTimeout(() => {
        setChangedPrices(new Set());
      }, 500);
    }
  };

  // Initialize WebSocket connection and fetch initial data
  useEffect(() => {
    let wsClient: LayerAkiraWSSAPI | null = null;
    let isMounted = true;

    const initialize = async () => {
      try {
        setIsLoading(true);

        if (!httpClient) {
          setError('HTTP client is not initialized yet');
          setIsLoading(false);
          return;
        }

        const ticker = {
          pair: {
            base: baseCurrency,
            quote: quoteCurrency,
          },
          isEcosystemBook: false,
        };

        // Get initial snapshot via HTTP
        const snapshot: Result<Snapshot> = await httpClient.getSnapshot(
          baseCurrency,
          quoteCurrency,
          false
        );

        if (snapshot.error) {
          setError(`Failed to fetch order book: ${snapshot.error}`);
          setIsLoading(false);
          return;
        }

        if (snapshot.result) {
          const bids = parseTableLevel(snapshot.result.levels.bids);
          const asks = parseTableLevel(snapshot.result.levels.asks);
          const initialOrderBook = processOrderBook(bids, asks);
          setOrderBook(initialOrderBook);
        }

        wsClient = new LayerAkiraWSSAPI(
          import.meta.env.VITE_API_WS_URL,
          httpClient,
          true,
          console.log,
          500
        );

        console.log('Initiating WebSocket connection...');
        wsClient.connect().catch(error => {
          console.error('Error initiating WebSocket connection:', error);
          if (isMounted) setError(`WebSocket Connection Error: ${error}`);
          if (isMounted) setIsLoading(false);
        });

        const connectionDelay = 2000;
        console.log(`Waiting ${connectionDelay}ms for connection before subscribing...`);
        await new Promise(resolve => setTimeout(resolve, connectionDelay));

        if (!isMounted) return;

        console.log('Attempting to subscribe...');
        if (wsClient) {
          const subscriptionResult = await wsClient.subscribeOnMarketData(
            handleWebSocketEvent,
            SocketEvent.BOOK_DELTA,
            ticker
          );

          if (!isMounted) return;

          if (subscriptionResult.error || !subscriptionResult.result) {
            console.error('Subscription failed:', subscriptionResult.error || 'No result');
            setError(`Failed to subscribe: ${subscriptionResult.error || 'Subscription rejected'}`);
            wsClient.close();
          } else {
            console.log('Subscription request successful:', subscriptionResult.result);
          }
        } else {
          console.error('WebSocket client instance not available for subscription.');
          setError('WebSocket client lost before subscription.');
        }

        setIsLoading(false);
      } catch (error) {
        setError(
          `Error initializing order book: ${error instanceof Error ? error.message : String(error)}`
        );
        console.error(error);
        setIsLoading(false);
      }
    };

    if (httpClient) {
      initialize();
    }

    return () => {
      isMounted = false;
      // Cleanup WebSocket connection
      if (wsClient) {
        wsClient.close();
        wsClient = null;
      }
    };
  }, [httpClient, baseCurrency, quoteCurrency, levels, processOrderBook]);

  // Prepare data for display component
  const displayData = {
    bids: orderBook.bids.map(bid => ({
      price: bid.price,
      amount: bid.amount,
      total: bid.total,
      isChanged: changedPrices.has(bid.price),
    })),
    asks: orderBook.asks.map(ask => ({
      price: ask.price,
      amount: ask.amount,
      total: ask.total,
      isChanged: changedPrices.has(ask.price),
    })),
  };

  return (
    <div className="w-full">
      {isLoading && (
        <div className="w-full h-64 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-t-2 border-b-2 border-blue-500 rounded-full mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading order book...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="w-full p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          <p>{error}</p>
          <button
            className="mt-2 bg-red-500 hover:bg-red-600 text-white px-4 py-1 rounded text-sm"
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      )}

      {!isLoading && !error && (
        <>
          <div className="flex items-center mb-2 bg-gray-800 dark:bg-gray-800 rounded p-2">
            <div
              className={`h-3 w-3 rounded-full mr-2 ${isConnected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}
            ></div>
            <span className="text-xs font-mono text-gray-400 dark:text-gray-400">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
            <span className="text-xs font-mono text-gray-400 dark:text-gray-400 ml-auto">
              Last updated: {new Date().toLocaleTimeString()}
            </span>
          </div>

          <OrderBookDisplay
            bids={displayData.bids}
            asks={displayData.asks}
            baseCurrency={baseCurrency}
            quoteCurrency={quoteCurrency}
          />
        </>
      )}
    </div>
  );
};

export default OrderBookContainer;
