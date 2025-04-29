import React, { useEffect, useState, useCallback } from 'react';
import { LayerAkiraHttpAPI, LayerAkiraWSSAPI, SocketEvent } from 'layerakira-js';
import { TableLevel, TableUpdate, Snapshot, Result } from 'layerakira-js';
import OrderBookDisplay from './OrderBookDisplay';
import { TableLevelWithTotal, OrderBookState } from '../../types/orderbook';
import { parseTableLevel } from '../../utils/formatter';

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
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [orderBook, setOrderBook] = useState<OrderBookState>({
    bids: [],
    asks: [],
    lastUpdateTime: Date.now(),
  });
  const [error, setError] = useState<string | null>(null);
  const [changedPrices, setChangedPrices] = useState<Set<string>>(new Set());

  // TODO: Implement the function to process order book data in different file to make code cleaner and improve logic when possible

  // Calculate total volume for depth chart and add running totals
  const processOrderBook = useCallback(
    (bidsArray: TableLevel[], asksArray: TableLevel[]) => {
      // Sort bids in descending order (highest first)
      const sortedBids = [...bidsArray].sort((a, b) => Number(b.price - a.price)).slice(0, levels);

      // Sort asks in ascending order (lowest first)
      const sortedAsks = [...asksArray].sort((a, b) => Number(a.price - b.price)).slice(0, levels);

      // Add running totals
      let bidTotal = 0n;
      const processedBids: TableLevelWithTotal[] = sortedBids.map(bid => {
        bidTotal += bid.volume;
        return { ...bid, total: bidTotal };
      });

      let askTotal = 0n;
      const processedAsks: TableLevelWithTotal[] = sortedAsks.map(ask => {
        askTotal += ask.volume;
        return { ...ask, total: askTotal };
      });

      return {
        bids: processedBids,
        asks: processedAsks,
        lastUpdateTime: Date.now(),
      };
    },
    [levels]
  );


  // Initialize WebSocket connection and fetch initial data
  useEffect(() => {
    let wsClient: LayerAkiraWSSAPI | null = null;

    const initialize = async () => {
      try {
        setIsLoading(true);

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
          true,
          levels
        );

        if (snapshot.error) {
          setError(`Failed to fetch order book: ${snapshot.error}`);
          setIsLoading(false);
          return;
        }

        // Initialize order book with snapshot data
        if (snapshot.result) {
          const bids = parseTableLevel(snapshot.result.levels.bids);
          const asks = parseTableLevel(snapshot.result.levels.asks);
          const initialOrderBook = processOrderBook(bids, asks);
          setOrderBook(initialOrderBook);
        }

        // Create WebSocket client
        wsClient = new LayerAkiraWSSAPI(
          import.meta.env.VITE_API_WS_URL,
          httpClient,
          false,
          console.log,
          5000
        );

        // Connect to WebSocket
        wsClient.connect().catch(err => {
          setError(`WebSocket connection error: ${err.message}`);
          setIsConnected(false);
        });

        // Subscribe to depth updates
        const success = await wsClient.subscribeOnDepthUpdate(ticker, async data => {
          if (data === SocketEvent.DISCONNECT) {
            setIsConnected(false);
            setError('Disconnected from order book stream');
            return;
          }

          setIsConnected(true);

          // Track changed prices for animations
          const newChangedPrices = new Set<string>();

          // Update order book with new data
          setOrderBook(prevBook => {
            // Handle TableUpdate from WebSocket
            const updateData = data as TableUpdate;

            // Create a map of existing bids and asks for quick lookup
            const bidMap = new Map(prevBook.bids.map(bid => [bid.price.toString(), bid]));
            const askMap = new Map(prevBook.asks.map(ask => [ask.price.toString(), ask]));

            // Parse the update data levels
            const updatedBids = parseTableLevel(updateData.bids);
            const updatedAsks = parseTableLevel(updateData.asks);

            // Update bids
            updatedBids.forEach(bid => {
              const priceKey = bid.price.toString();
              newChangedPrices.add(priceKey);

              if (bid.volume === 0n) {
                bidMap.delete(priceKey);
              } else {
                bidMap.set(priceKey, bid);
              }
            });

            // Update asks
            updatedAsks.forEach(ask => {
              const priceKey = ask.price.toString();
              newChangedPrices.add(priceKey);

              if (ask.volume === 0n) {
                askMap.delete(priceKey);
              } else {
                askMap.set(priceKey, ask);
              }
            });

            // Convert maps back to arrays
            const newBids = Array.from(bidMap.values());
            const newAsks = Array.from(askMap.values());

            // Process the updated order book
            return processOrderBook(newBids, newAsks);
          });

          // Set the changed prices for animation
          setChangedPrices(newChangedPrices);

          // Clear changed prices after animation duration
          setTimeout(() => {
            setChangedPrices(new Set());
          }, 500);
        });

        if (!success) {
          setError('Failed to subscribe to order book updates');
        }

        setIsLoading(false);
      } catch (error) {
        setError(
          `Error initializing order book: ${error instanceof Error ? error.message : String(error)}`
        );
        setIsLoading(false);
      }
    };

    initialize();

    // Cleanup
    return () => {
      if (wsClient) {
        wsClient.close();
      }
    };
  }, [httpClient, baseCurrency, quoteCurrency, levels, processOrderBook]);

  // Prepare data for display component
  const displayData = {
    bids: orderBook.bids.map(bid => ({
      price: Number(bid.price),
      amount: Number(bid.volume),
      total: bid.total ? Number(bid.total) : 0,
      rawPrice: bid.price,
      rawAmount: bid.volume,
      rawTotal: bid.total || 0n,
      isChanged: changedPrices.has(bid.price.toString()),
    })),
    asks: orderBook.asks.map(ask => ({
      price: Number(ask.price),
      amount: Number(ask.volume),
      total: ask.total ? Number(ask.total) : 0,
      rawPrice: ask.price,
      rawAmount: ask.volume,
      rawTotal: ask.total || 0n,
      isChanged: changedPrices.has(ask.price.toString()),
    })),
    maxTotal:
      Math.max(
        orderBook.bids.length ? Number(orderBook.bids[orderBook.bids.length - 1].total || 0n) : 0,
        orderBook.asks.length ? Number(orderBook.asks[orderBook.asks.length - 1].total || 0n) : 0
      ) /
      10 ** 2,
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
          <div className="flex items-center mb-2">
            <div
              className={`h-2 w-2 rounded-full mr-2 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}
            ></div>
            <span className="text-xs text-gray-500">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
            <span className="text-xs text-gray-500 ml-auto">{new Date().toLocaleTimeString()}</span>
          </div>

          <OrderBookDisplay
            bids={displayData.bids}
            asks={displayData.asks}
            maxTotal={displayData.maxTotal}
            baseCurrency={baseCurrency}
            quoteCurrency={quoteCurrency}
          />
        </>
      )}
    </div>
  );
};

export default OrderBookContainer;
