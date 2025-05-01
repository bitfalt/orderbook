import React from 'react';

interface VolumeBarProps {
  type: 'bid' | 'ask';
  percentFilled: number;
  isReversed?: boolean;
}

const VolumeBar: React.FC<VolumeBarProps> = ({ type, percentFilled, isReversed = false }) => {
  const colorClass =
    type === 'bid' ? 'bg-green-300 dark:bg-green-700/40' : 'bg-red-300 dark:bg-red-700/40';

  const position = isReversed ? 'right-0' : type === 'bid' ? 'left-0' : 'right-0';

  return (
    <div
      className={`absolute top-0 ${position} h-full ${colorClass} z-0`}
      style={{
        width: `${Math.min(100, percentFilled)}%`,
        opacity: 0.35,
      }}
    />
  );
};

export default VolumeBar;
