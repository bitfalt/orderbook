import React from 'react';
import OrderBookRow from './OrderBookRow';
import { OrderBookRow as OrderBookRowType } from '../../types/orderbook';

interface OrderBookListProps {
  type: 'bid' | 'ask';
  data: OrderBookRowType[];
  reverse?: boolean;
  showHeader?: boolean;
}

const OrderBookList: React.FC<OrderBookListProps> = ({
  type,
  data,
  reverse = false,
  showHeader = true,
}) => {
  // Determine column arrangement based on type and device
  // TODO: Improve this logic
  const getHeaderLayout = () => {
    if (type === 'bid' && reverse) {
      return (
        <>
          <div className="w-1/3 text-left">Total</div>
          <div className="w-1/3 text-right">Amount</div>
          <div className="w-1/3 text-right">Price</div>
        </>
      );
    } else {
      return (
        <>
          <div className="w-1/3 text-left">Price</div>
          <div className="w-1/3 text-right">Amount</div>
          <div className="w-1/3 text-right">Total</div>
        </>
      );
    }
  };

  return (
    <div className="w-full">
      {showHeader && (
        <div className="flex justify-between px-2 py-2 bg-gray-100 dark:bg-gray-800 text-xs font-medium">
          {getHeaderLayout()}
        </div>
      )}

      <div className="w-full">
        {data.map((row, index) => (
          <OrderBookRow
            key={`${type}-${row.price}-${index}`}
            row={row}
            type={type}
            reverse={reverse}
          />
        ))}
      </div>
    </div>
  );
};

export default OrderBookList;
