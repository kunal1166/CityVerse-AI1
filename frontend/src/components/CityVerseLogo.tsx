import React from 'react';

interface CityVerseLogoProps {
  className?: string;
  variant?: 'full' | 'wordmark-only' | 'icon-only' | 'badge';
  height?: number;
  textColor?: string;
  accentColor?: string;
  showBorder?: boolean;
}

export const CityVerseLogo: React.FC<CityVerseLogoProps> = ({
  className = '',
  variant = 'full',
  height = 36,
  textColor = '#0F172A', // Deep Navy
  accentColor = '#2563EB', // Royal Blue
  showBorder = false,
}) => {
  // Pure Wordmark Variant (Only the text "CityVerse AI")
  if (variant === 'wordmark-only') {
    return (
      <svg
        viewBox="0 0 280 48"
        height={height}
        className={`inline-block select-none ${className}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="CityVerse AI Logo"
      >
        <g>
          {/* CityVerse in Deep Navy (#0F172A) */}
          <text
            x="0"
            y="35"
            fill={textColor}
            style={{
              fontFamily: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
              fontSize: '34px',
              fontWeight: 800,
              letterSpacing: '-0.035em',
            }}
          >
            CityVerse
          </text>

          {/* AI in Royal Blue (#2563EB) */}
          <text
            x="195"
            y="35"
            fill={accentColor}
            style={{
              fontFamily: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
              fontSize: '34px',
              fontWeight: 800,
              letterSpacing: '-0.02em',
            }}
          >
            AI
          </text>
        </g>
      </svg>
    );
  }

  // Icon Only Variant (Geometric Node Symbol)
  if (variant === 'icon-only') {
    return (
      <svg
        viewBox="0 0 40 40"
        height={height}
        width={height}
        className={`inline-block select-none ${className}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="CityVerse AI Symbol"
      >
        <rect width="40" height="40" rx="8" fill={accentColor} />
        {/* Geometric Smart City Infrastructure Pillars */}
        <path
          d="M11 12H15V28H11V12ZM18 12H22V28H18V12ZM25 12H29V28H25V12Z"
          fill="white"
        />
        <circle cx="20" cy="20" r="3" fill={accentColor} />
      </svg>
    );
  }

  // Full Enterprise Wordmark (Geometric Emblem + Text)
  return (
    <svg
      viewBox="0 0 340 48"
      height={height}
      className={`inline-block select-none ${className}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="CityVerse AI Enterprise Logo"
    >
      {showBorder && (
        <rect
          x="1"
          y="1"
          width="338"
          height="46"
          rx="6"
          stroke="#E2E8F0"
          strokeWidth="1"
          fill="transparent"
        />
      )}

      <g transform="translate(4, 8)">
        {/* Modern Geometric Monogram Emblem: Enterprise Grid & Node Stack */}
        <g transform="translate(0, 2)">
          {/* Outer Pillar Left */}
          <rect x="0" y="0" width="6" height="28" rx="1.5" fill={textColor} />
          {/* Middle Stack Top */}
          <rect x="9" y="0" width="6" height="12" rx="1.5" fill={accentColor} />
          {/* Middle Stack Bottom */}
          <rect x="9" y="16" width="6" height="12" rx="1.5" fill={textColor} />
          {/* Outer Pillar Right */}
          <rect x="18" y="0" width="6" height="28" rx="1.5" fill={textColor} />
          {/* Connecting Active AI Pulse Node */}
          <circle cx="12" cy="14" r="1.5" fill="#FFFFFF" />
        </g>

        {/* Wordmark Text: "CityVerse" */}
        <text
          x="36"
          y="25"
          fill={textColor}
          style={{
            fontFamily: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
            fontSize: '28px',
            fontWeight: 800,
            letterSpacing: '-0.03em',
          }}
        >
          CityVerse
        </text>

        {/* Wordmark Badge: "AI" in Royal Blue Pill (#2563EB) */}
        <g transform="translate(198, 2)">
          <rect x="0" y="1" width="38" height="25" rx="4" fill={accentColor} />
          <text
            x="8"
            y="19"
            fill="#FFFFFF"
            style={{
              fontFamily: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
              fontSize: '16px',
              fontWeight: 800,
              letterSpacing: '0.04em',
            }}
          >
            AI
          </text>
        </g>
      </g>
    </svg>
  );
};
