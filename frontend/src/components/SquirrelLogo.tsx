type SquirrelLogoProps = {
  size?: number;
  compact?: boolean;
};

export default function SquirrelLogo({
  size = 64,
  compact = false,
}: SquirrelLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 160 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="squirrel-logo"
    >
      <defs>
        <linearGradient id="snNeon" x1="18" y1="18" x2="140" y2="140">
          <stop stopColor="#00EAFF" />
          <stop offset="0.48" stopColor="#9B5CFF" />
          <stop offset="1" stopColor="#00FF95" />
        </linearGradient>

        <linearGradient id="snSteel" x1="35" y1="22" x2="120" y2="142">
          <stop stopColor="#F7FBFF" />
          <stop offset="0.22" stopColor="#A8B6C7" />
          <stop offset="0.5" stopColor="#2A3447" />
          <stop offset="0.78" stopColor="#77889F" />
          <stop offset="1" stopColor="#E9FBFF" />
        </linearGradient>

        <filter id="snLogoGlow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feColorMatrix
            in="blur"
            type="matrix"
            values="0 0 0 0 0
                    0 0 0 0 0.91
                    0 0 0 0 1
                    0 0 0 0.8 0"
          />
          <feBlend in="SourceGraphic" />
        </filter>
      </defs>

      <rect
        x="8"
        y="8"
        width="144"
        height="144"
        rx="38"
        fill="rgba(3,12,30,0.92)"
        stroke="url(#snNeon)"
        strokeWidth="3"
      />

      <path
        d="M25 115C42 92 65 82 89 83C113 84 131 96 143 121"
        stroke="url(#snNeon)"
        strokeWidth="4"
        strokeLinecap="round"
        opacity="0.8"
        filter="url(#snLogoGlow)"
      />

      <path
        d="M22 95C42 75 67 68 96 69C119 70 137 80 149 98"
        stroke="#00EAFF"
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.7"
      />

      <path
        d="M28 130C55 110 86 104 131 112"
        stroke="#9B5CFF"
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.75"
      />

      <circle cx="24" cy="95" r="4" fill="#00EAFF" filter="url(#snLogoGlow)" />
      <circle cx="143" cy="121" r="4" fill="#00FF95" filter="url(#snLogoGlow)" />
      <circle cx="149" cy="98" r="3.5" fill="#9B5CFF" filter="url(#snLogoGlow)" />
      <circle cx="131" cy="112" r="3.5" fill="#00EAFF" filter="url(#snLogoGlow)" />

      <path
        d="M103 31C126 41 134 71 119 94C108 111 88 117 69 110C58 106 49 98 44 87"
        stroke="url(#snSteel)"
        strokeWidth="16"
        strokeLinecap="round"
      />

      <path
        d="M101 45C116 54 120 73 110 87C101 100 84 104 70 96"
        stroke="url(#snNeon)"
        strokeWidth="5"
        strokeLinecap="round"
        filter="url(#snLogoGlow)"
      />

      <path
        d="M45 84C39 65 50 47 70 42C90 37 106 49 110 67C94 64 81 68 70 78C61 86 53 88 45 84Z"
        fill="url(#snSteel)"
        stroke="rgba(0,234,255,0.65)"
        strokeWidth="2"
      />

      <path
        d="M61 70L35 83L57 91L64 118L77 95L103 90L81 77L78 52L64 68L61 70Z"
        fill="url(#snNeon)"
        filter="url(#snLogoGlow)"
      />

      <path
        d="M70 45L78 30L84 48"
        fill="url(#snSteel)"
        stroke="rgba(0,234,255,0.5)"
        strokeWidth="2"
        strokeLinejoin="round"
      />

      <circle cx="78" cy="59" r="5" fill="#071124" />
      <circle cx="80" cy="58" r="2" fill="#00EAFF" filter="url(#snLogoGlow)" />

      <path
        d="M48 91L32 103"
        stroke="url(#snNeon)"
        strokeWidth="5"
        strokeLinecap="round"
        filter="url(#snLogoGlow)"
      />

      <path
        d="M72 104L68 126"
        stroke="url(#snSteel)"
        strokeWidth="6"
        strokeLinecap="round"
      />

      <path
        d="M86 101L96 123"
        stroke="url(#snSteel)"
        strokeWidth="6"
        strokeLinecap="round"
      />

      <path
        d="M113 51C123 58 130 68 133 80"
        stroke="#00EAFF"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.9"
      />

      <path
        d="M121 39C136 48 145 62 148 80"
        stroke="#9B5CFF"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.75"
      />

      {!compact && (
        <text
          x="80"
          y="145"
          textAnchor="middle"
          fontSize="13"
          fontWeight="900"
          letterSpacing="2.5"
          fill="#DFFBFF"
        >
          SQUIRREL
        </text>
      )}
    </svg>
  );
}