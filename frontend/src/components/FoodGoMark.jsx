import React, { useId } from "react";

export default function FoodGoMark({
  size = 48,
  light = false,
  className = "",
}) {
  const id = useId();

  const orange = "#FF4D1F";
  const coral = "#FF6B35";
  const yellow = "#FFC83D";
  const navy = light ? "#FFFFFF" : "#182235";

  const shadowId = `foodgo-shadow-${id}`;

  return (
    <svg
      className={`foodgo-mark ${className}`}
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="FoodGo logo"
      focusable="false"
    >
      <defs>
        <filter
          id={shadowId}
          x="-30%"
          y="-30%"
          width="160%"
          height="160%"
        >
          <feDropShadow
            dx="0"
            dy="2"
            stdDeviation="1.5"
            floodOpacity="0.16"
          />
        </filter>
      </defs>

      {/* ==========================================
          MAIN FOOD + DELIVERY SYMBOL
          ========================================== */}

      <path
        d="
          M32 5
          C19 5 9 15 9 28
          C9 43 22 55 32 61
          C42 55 55 43 55 28
          C55 15 45 5 32 5Z
        "
        fill={orange}
        filter={`url(#${shadowId})`}
      />

      {/* ==========================================
          WHITE INNER AREA
          ========================================== */}

      <path
        d="
          M32 12
          C23 12 16 19 16 28
          C16 38 25 47 32 52
          C39 47 48 38 48 28
          C48 19 41 12 32 12Z
        "
        fill="#FFFFFF"
      />

      {/* ==========================================
          FOOD FORK
          ========================================== */}

      <path
        d="M23 19V29"
        stroke={orange}
        strokeWidth="3"
        strokeLinecap="round"
      />

      <path
        d="M28 19V29"
        stroke={orange}
        strokeWidth="3"
        strokeLinecap="round"
      />

      <path
        d="
          M18 19V29
          C18 33 20.5 35 25.5 35
          C30.5 35 33 33 33 29
          V19
        "
        stroke={orange}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M25.5 35V43"
        stroke={coral}
        strokeWidth="3"
        strokeLinecap="round"
      />

      {/* ==========================================
          DELIVERY ROUTE
          ========================================== */}

      <path
        d="
          M35 20
          C42 20 46 23 46 27
          C46 31 42 34 37 34
        "
        stroke={navy}
        strokeWidth="3"
        strokeLinecap="round"
      />

      {/* ==========================================
          LOCATION DOT
          ========================================== */}

      <circle
        cx="43"
        cy="25"
        r="4"
        fill={yellow}
      />

      <circle
        cx="43"
        cy="25"
        r="1.5"
        fill="#FFFFFF"
      />

      {/* ==========================================
          GO ARROW
          ========================================== */}

      <path
        d="M31 40L38 47L31 54"
        stroke={orange}
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* ==========================================
          SPEED MARKS
          ========================================== */}

      <path
        d="M45 10H57"
        stroke={orange}
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      <path
        d="M49 15H57"
        stroke={yellow}
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* ==========================================
          SMALL DELIVERY DOT
          ========================================== */}

      <circle
        cx="56"
        cy="35"
        r="1.8"
        fill={coral}
      />
    </svg>
  );
}