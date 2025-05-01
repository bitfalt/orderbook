export type OrderBookRow = {
  price: string;
  amount: string;
  total: string;
  isChanged?: boolean;
};

export type OrderBookState = {
  bids: OrderBookRow[];
  asks: OrderBookRow[];
  lastUpdateTime: number;
};
