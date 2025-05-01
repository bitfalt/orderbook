import React from 'react';
import { OrderBookRow as OrderBookRowType } from '../../types/orderbook';
import VolumeBar from './VolumeBar';
import '../../styles/OrderBookRow.css';

interface OrderBookRowProps {
  row: OrderBookRowType;
  type: 'bid' | 'ask';
  reverse?: boolean;
}

const OrderBookRow: React.FC<OrderBookRowProps> = ({
  row,
  type,
  reverse = false,
}) => {
  const { price, amount, total, isChanged } = row;

  const textColorClass = type === 'bid' ? 'text-green-500' : 'text-red-500';

  // Layout changes based on device and type
  // TODO: Improve this logic like in OrderBookList.tsx
  const renderRowContent = () => {
    if (type === 'bid' && reverse) {
      return (
        <>
          <div className="w-1/3 text-left z-10">{total}</div>
          <div className="w-1/3 text-right z-10">{amount}</div>
          <div className={`w-1/3 text-right ${textColorClass} font-medium z-10`}>{price}</div>
        </>
      );
    } else {
      return (
        <>
          <div className={`w-1/3 text-left ${textColorClass} font-medium z-10`}>{price}</div>
          <div className="w-1/3 text-right z-10">{amount}</div>
          <div className="w-1/3 text-right z-10">{total}</div>
        </>
      );
    }
  };

  return (
    <div
      className={`
      flex justify-between items-center px-2 py-1 
      border-b border-gray-100 dark:border-gray-800 
      text-xs relative hover:bg-gray-50 dark:hover:bg-gray-700
      ${isChanged ? `animate-flash-${type}` : ''}
    `}
    >
      {renderRowContent()}

      <VolumeBar
        type={type}
        percentFilled={30}
        isReversed={type === 'bid' && !reverse}
      />
    </div>
  );
};

export default OrderBookRow;
