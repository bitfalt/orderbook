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

export const formatRowsData = (rows: TableLevel[], baseDecimals: number, quoteDecimals: number): OrderBookRow[] => {
  let formattedRows: OrderBookRow[] = [];
  for (let i = 0; i < rows.length; i++) {
    let formattedPrice = formatUnits(rows[i].price, quoteDecimals);
    let formattedVolume = formatUnits(rows[i].volume, baseDecimals);

    formattedRows.push({
      price: formattedPrice,
      amount: formattedVolume,
      total: String(rows[i].orders)
    })
  };

  return formattedRows;
}
