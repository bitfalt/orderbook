import React from 'react';
import OrderBookList from './OrderBookList';
//import SpreadDisplay from './SpreadDisplay';
import { OrderBookRow } from './OrderBookContainer';

interface OrderBookDisplayProps {
  bids: OrderBookRow[];
  asks: OrderBookRow[];
  //   spread: string;
  //   spreadPercentage: string;
  maxTotal: number;
  baseCurrency: string;
  quoteCurrency: string;
}

const OrderBookDisplay: React.FC<OrderBookDisplayProps> = ({
  bids,
  asks,
  //   spread,
  //   spreadPercentage,
  maxTotal,
  baseCurrency,
  quoteCurrency,
}) => {
  return (
    <div className="w-full font-mono">
      {/* Mobile view (default) */}
      <div className="block w-full">
        <div className="mb-2">
          <h2 className="text-lg font-semibold text-center">Order Book</h2>
          <div className="text-xs text-gray-500 text-center">
            {baseCurrency}/{quoteCurrency}
          </div>
        </div>

        {/* Asks - reversed for mobile (highest to lowest) */}
        <OrderBookList
          type="ask"
          data={asks.slice().reverse()}
          maxTotal={maxTotal}
          isMobile={true}
          showHeader={true}
        />

        {/* Spread */}
        {/* <SpreadDisplay 
          spread={spread} 
          spreadPercentage={spreadPercentage} 
        /> */}

        {/* Bids */}
        <OrderBookList
          type="bid"
          data={bids}
          maxTotal={maxTotal}
          isMobile={true}
          showHeader={false}
        />
      </div>

      {/* Desktop view (md screens and up) */}
      <div className="hidden md:block">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-center">Order Book</h2>
          <div className="text-sm text-gray-500 text-center">
            {baseCurrency}/{quoteCurrency}
          </div>
        </div>

        <div className="flex">
          {/* Bids column - desktop layout (total/amount/price) */}
          <div className="w-1/2 pr-1">
            <OrderBookList
              type="bid"
              data={bids}
              maxTotal={maxTotal}
              isMobile={false}
              reverse={true}
              showHeader={true}
            />
          </div>

          {/* Asks column - desktop layout (price/amount/total) */}
          <div className="w-1/2 pl-1">
            <OrderBookList
              type="ask"
              data={asks}
              maxTotal={maxTotal}
              isMobile={false}
              showHeader={true}
            />
          </div>
        </div>

        {/* Spread for desktop */}
        {/* <SpreadDisplay 
          spread={spread} 
          spreadPercentage={spreadPercentage} 
          isDesktop={true}
        /> */}
      </div>
    </div>
  );
};

export default OrderBookDisplay;
