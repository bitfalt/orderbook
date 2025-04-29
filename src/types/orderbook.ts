import { TableLevel } from 'layerakira-js';

// Extended TableLevel with total for visualization
export interface TableLevelWithTotal extends TableLevel {
  total?: bigint;
}

export type OrderBookRow = {
  price: number;
  amount: number;
  total: number;
  rawPrice: bigint;
  rawAmount: bigint;
  rawTotal: bigint;
  isChanged?: boolean;
};

export type OrderBookState = {
  bids: TableLevelWithTotal[];
  asks: TableLevelWithTotal[];
  lastUpdateTime: number;
};
