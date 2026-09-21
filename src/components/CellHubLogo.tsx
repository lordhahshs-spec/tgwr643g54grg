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

  if (variant === 'icon' || !showText) {
    return (
      <svg
        viewBox="0 0 135 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`${currentHeight} w-auto flex-shrink-0 ${className}`}
      >
        <g fill="#FFFFFF">
          <path d="M72 18 C34 18 12 40 12 65 C12 90 34 112 72 112 L98 112 C101 112 103 109 103 106 L103 96 C103 93 101 91 98 91 L70 91 C46 91 32 80 32 65 C32 50 46 39 70 39 L98 39 C101 39 103 37 103 34 L103 24 C103 21 101 18 98 18 Z" />
          <rect x="24" y="55" width="64" height="18" rx="6" />
          <rect x="112" y="18" width="16" height="94" rx="4" />
        </g>
      </svg>
    );
  }

  return (
    <div className={`inline-flex items-center gap-2 select-none ${className}`}>
      {/* Icon */}
      <svg
        viewBox="0 0 135 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`${currentHeight} w-auto flex-shrink-0`}
      >
        <g fill="#FFFFFF">
          <path d="M72 18 C34 18 12 40 12 65 C12 90 34 112 72 112 L98 112 C101 112 103 109 103 106 L103 96 C103 93 101 91 98 91 L70 91 C46 91 32 80 32 65 C32 50 46 39 70 39 L98 39 C101 39 103 37 103 34 L103 24 C103 21 101 18 98 18 Z" />
          <rect x="24" y="55" width="64" height="18" rx="6" />
          <rect x="112" y="18" width="16" height="94" rx="4" />
        </g>
      </svg>

      {/* Wordmark */}
      <span className="font-extrabold tracking-tight text-white leading-none flex items-baseline">
        <span className="text-white">Cell</span>
        <span className="text-[#00E599] ml-0.5">Hub</span>
      </span>
    </div>
  );
};
