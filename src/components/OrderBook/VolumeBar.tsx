import React from 'react';

interface VolumeBarProps {
  type: 'bid' | 'ask';
  percentFilled: number;
  isReversed?: boolean;
}

const VolumeBar: React.FC<VolumeBarProps> = ({ type, percentFilled, isReversed = false }) => {
  const colorClass =
    type === 'bid' ? 'bg-green-100 dark:bg-green-900/20' : 'bg-red-100 dark:bg-red-900/20';

  const position = isReversed ? 'right-0' : type === 'bid' ? 'left-0' : 'right-0';

  return (
    <div
      className={`absolute top-0 ${position} h-full ${colorClass} z-0`}
      style={{
        width: `${Math.min(100, percentFilled)}%`,
        opacity: 0.3,
      }}
    />
  );
};

export default VolumeBar;
