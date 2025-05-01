import React from 'react';
import OrderBookList from './OrderBookList';
// import SpreadDisplay from './SpreadDisplay';
import { OrderBookRow } from '../../types/orderbook';

interface OrderBookDisplayProps {
  bids: OrderBookRow[];
  asks: OrderBookRow[];
  // spread: string;
  // spreadPercentage: string;
  baseCurrency: string;
  quoteCurrency: string;
}

const OrderBookDisplay: React.FC<OrderBookDisplayProps> = ({
  bids,
  asks,
  // spread,
  // spreadPercentage,
  baseCurrency,
  quoteCurrency,
}) => {
  // Determine the number of rows to display - find the max length
  // You might want to limit this further based on screen height or a prop
  const numRows = Math.max(bids.length, asks.length);
  const displayBids = bids.slice(0, numRows);
  const displayAsks = asks.slice(0, numRows);

  return (
    <div className="w-full max-w-md mx-auto font-mono text-xs dark:bg-gray-900 dark:text-gray-200 p-2">
      <div className="mb-2 text-center">
        <h2 className="text-base font-semibold">Order Book</h2>{' '}
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {baseCurrency}/{quoteCurrency}
        </div>
      </div>

      <div className="flex text-center mb-1 text-gray-500 dark:text-gray-400">
        <div className="w-1/2 pr-1 flex justify-between">
          <span className="w-1/3 text-left pl-1">AMOUNT</span>{' '}
          <span className="w-2/3 text-right pr-1">BID PRICE</span>{' '}
        </div>
        <div className="w-1/2 pl-1 flex justify-between">
          <span className="w-2/3 text-left pl-1">ASK PRICE</span>{' '}
          <span className="w-1/3 text-right pr-1">AMOUNT</span>{' '}
        </div>
      </div>

      <div className="flex w-full">
        {/* Bids Column */}
        <div className="w-1/2 pr-1">
          <OrderBookList
            type="bid"
            data={displayBids}
          />
        </div>

        {/* Asks Column */}
        <div className="w-1/2 pl-1">
          <OrderBookList
            type="ask"
            data={displayAsks}
          />
        </div>
      </div>

      {/* Optional: Spread Display below columns */}
      {/* 
      <div className="mt-2 text-center">
        <SpreadDisplay spread={spread} spreadPercentage={spreadPercentage} />
      </div> 
      */}
    </div>
  );
};

export default OrderBookDisplay;
