import React, { useEffect, useState } from 'react';
import { animate } from 'motion/react';

export const Counter = ({ value, duration = 2 }: { value: number | string, duration?: number }) => {
  const [displayValue, setDisplayValue] = useState(0);
  const numericValue = typeof value === 'string' ? parseFloat(value.replace(/[^0-9.]/g, '')) : value;
  const suffix = typeof value === 'string' ? value.replace(/[0-9.]/g, '') : '';

  useEffect(() => {
    const controls = animate(0, numericValue, {
      duration,
      onUpdate: (latest) => setDisplayValue(latest),
      ease: "easeOut"
    });

    return () => controls.stop();
  }, [numericValue, duration]);

  return (
    <span>
      {numericValue % 1 === 0 ? Math.round(displayValue) : displayValue.toFixed(1)}
      {suffix}
    </span>
  );
};
