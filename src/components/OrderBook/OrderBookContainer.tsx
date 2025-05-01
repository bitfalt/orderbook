import React, { useEffect, useState, useCallback } from 'react';
import { LayerAkiraHttpAPI, LayerAkiraWSSAPI, SocketEvent } from 'layerakira-js';
import { TableLevel, TableUpdate, Snapshot, Result } from 'layerakira-js';
import OrderBookDisplay from './OrderBookDisplay';
import { OrderBookState } from '../../types/orderbook';
import { parseTableLevel, formatRowsData} from '../../utils/formatter';
import { erc20ToDecimals, TARGET_BASE_CURRENCY, TARGET_QUOTE_CURRENCY } from "../../App"


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

  // Calculate total volume for depth chart and add running totals
  const processOrderBook = useCallback(
    (bidsArray: TableLevel[], asksArray: TableLevel[]) => {
        
        // Convert the bigint to a number for sorting and display
        const formattedBids = formatRowsData(bidsArray, erc20ToDecimals[TARGET_BASE_CURRENCY], erc20ToDecimals[TARGET_QUOTE_CURRENCY]);
        const formattedAsks = formatRowsData(asksArray, erc20ToDecimals[TARGET_BASE_CURRENCY], erc20ToDecimals[TARGET_QUOTE_CURRENCY]);

        return {
            bids: formattedBids,
            asks: formattedAsks,
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

        // Add null check for httpClient
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

        // Initialize order book with snapshot data
        if (snapshot.result) {
          const bids = parseTableLevel(snapshot.result.levels.bids);
          console.log('bids', bids);
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
          console.error(err);
          setIsConnected(false);
        });

        // // Subscribe to depth updates
        // const success = await wsClient.subscribeOnDepthUpdate(ticker, async data => {
        //   if (data === SocketEvent.DISCONNECT) {
        //     setIsConnected(false);
        //     setError('Disconnected from order book stream');
        //     return;
        //   }

        //   setIsConnected(true);

        //   // Track changed prices for animations
        //   const newChangedPrices = new Set<string>();

        //   // Update order book with new data
        //   setOrderBook(prevBook => {
        //     // Handle TableUpdate from WebSocket
        //     const updateData = data as TableUpdate;

        //     // Create a map of existing bids and asks for quick lookup
        //     const bidMap = new Map(prevBook.bids.map(bid => [bid.price.toString(), bid]));
        //     const askMap = new Map(prevBook.asks.map(ask => [ask.price.toString(), ask]));

        //     // Parse the update data levels
        //     const updatedBids = parseTableLevel(updateData.bids);
        //     const updatedAsks = parseTableLevel(updateData.asks);

        //     // Update bids
        //     updatedBids.forEach(bid => {
        //       const priceKey = bid.price.toString();
        //       newChangedPrices.add(priceKey);

        //       if (bid.volume === 0n) {
        //         bidMap.delete(priceKey);
        //       } else {
        //         bidMap.set(priceKey, bid);
        //       }
        //     });

        //     // Update asks
        //     updatedAsks.forEach(ask => {
        //       const priceKey = ask.price.toString();
        //       newChangedPrices.add(priceKey);

        //       if (ask.volume === 0n) {
        //         askMap.delete(priceKey);
        //       } else {
        //         askMap.set(priceKey, ask);
        //       }
        //     });

        //     // Convert maps back to arrays
        //     const newBids = Array.from(bidMap.values());
        //     const newAsks = Array.from(askMap.values());

        //     // Process the updated order book
        //     return processOrderBook(newBids, newAsks);
        //   });

        //   // Set the changed prices for animation
        //   setChangedPrices(newChangedPrices);

        //   // Clear changed prices after animation duration
        //   setTimeout(() => {
        //     setChangedPrices(new Set());
        //   }, 500);
        // });

        // if (!success) {
        //   setError('Failed to subscribe to order book updates');
        // }

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
      price: bid.price,
      amount: bid.amount,
      total: bid.total,
      isChanged: changedPrices.has(bid.price.toString()),
    })),
    asks: orderBook.asks.map(ask => ({
      price: ask.price,
      amount: ask.amount,
      total: ask.total,
      isChanged: changedPrices.has(ask.price.toString()),
    }))
  };

  console.log('displayData', displayData);

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
            baseCurrency={baseCurrency}
            quoteCurrency={quoteCurrency}
          />
        </>
      )}
    </div>
  );
};

export default OrderBookContainer;
