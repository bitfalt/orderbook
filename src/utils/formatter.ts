import { TableLevel } from 'layerakira-js';

// Convert array-based levels to TableLevel objects
export const parseTableLevel = (levels: [bigint, bigint, number][]): TableLevel[] => {
  return levels.map(([price, volume, orders]) => ({
    price,
    volume,
    orders,
  }));
};
