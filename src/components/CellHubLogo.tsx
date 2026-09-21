import React from 'react';

interface CellHubLogoProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  variant?: 'full' | 'icon';
}

export const CellHubLogo: React.FC<CellHubLogoProps> = ({
  className = '',
  size = 'md',
  showText = true,
  variant = 'full',
}) => {
  const heightClasses = {
    xs: 'h-5',
    sm: 'h-7',
    md: 'h-9',
    lg: 'h-12',
    xl: 'h-16',
  };

  const currentHeight = heightClasses[size] || heightClasses.md;

  const iconSvg = (
    <svg
      viewBox="0 0 120 90"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${currentHeight} w-auto flex-shrink-0`}
    >
      <g fill="#FFFFFF">
        {/* Outer E Shape */}
        <path d="M42 5 C20 5 5 20 5 45 C5 70 20 85 42 85 L84 85 L84 70 L42 70 C28 70 20 60 20 45 C20 30 28 20 42 20 L84 20 L84 5 Z" />
        {/* Center horizontal bar */}
        <rect x="18" y="38" width="66" height="14" />
        {/* Right vertical bar */}
        <rect x="89" y="5" width="15" height="80" />
      </g>
    </svg>
  );

  if (variant === 'icon' || !showText) {
    return (
      <div className={`inline-flex items-center ${className}`}>
        {iconSvg}
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {iconSvg}

      {/* Wordmark */}
      <span className="font-black tracking-tight text-white leading-none text-lg flex items-baseline">
        <span className="text-white">Cell</span>
        <span className="text-[#00E599] ml-0.5">Hub</span>
      </span>
    </div>
  );
};
