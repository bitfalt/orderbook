import { TableLevel } from 'layerakira-js';
import { OrderBookRow } from '../types/orderbook';
import { formatUnits } from 'ethers';

// Convert array-based levels to TableLevel objects
export const parseTableLevel = (levels: [bigint, bigint, number][]): TableLevel[] => {
  return levels.map(([price, volume, orders]) => ({
    price,
    volume,
    orders,
  }));
};

export const formatRowData = (
  row: TableLevel,
  baseDecimals: number,
  quoteDecimals: number
): OrderBookRow => {
  const formattedPrice = formatUnits(row.price, quoteDecimals);
  const formattedVolume = formatUnits(row.volume, baseDecimals);
  return {
    price: formattedPrice,
    amount: formattedVolume,
    total: String(row.orders),
  };
};

export const formatRowsData = (
  rows: TableLevel[],
  baseDecimals: number,
  quoteDecimals: number
): OrderBookRow[] => {
  const formattedRows: OrderBookRow[] = [];
  for (let i = 0; i < rows.length; i++) {
    formattedRows.push(formatRowData(rows[i], baseDecimals, quoteDecimals));
  }

  return formattedRows;
};

export const sortBids = (bids: OrderBookRow[]) => {
  // Sort bids by price in descending order
  return bids.sort((a, b) => {
    return parseFloat(b.price) - parseFloat(a.price);
  });
};

export const sortAsks = (asks: OrderBookRow[]) => {
  // Sort asks by price in ascending order
  return asks.sort((a, b) => {
    return parseFloat(a.price) - parseFloat(b.price);
  });
};
