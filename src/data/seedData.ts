import { ClothingItem, OutfitSuggestion } from '../types';

// Curated high-resolution SVG lookbook graphics for flawless offline & preview rendering
const createFashionSvgDataUrl = (
  bg: string,
  accent: string,
  iconType: 'jacket' | 'pants' | 'sneakers' | 'knit' | 'bag' | 'hoodie' | 'loafers' | 'cap',
  label: string
) => {
  let path = '';
  if (iconType === 'jacket') {
    path = `
      <path d="M60 40 L90 55 L110 40 L140 55 L170 40 L195 90 L165 105 L160 210 L70 210 L65 105 L35 90 Z" fill="${accent}" opacity="0.88" />
      <path d="M115 48 L115 210" stroke="#FAF9F6" stroke-width="2.5" stroke-dasharray="4 3" />
      <path d="M85 52 L115 100 L145 52" stroke="#FAF9F6" stroke-width="3" fill="none" />
      <circle cx="95" cy="130" r="3" fill="#FAF9F6" />
      <circle cx="95" cy="165" r="3" fill="#FAF9F6" />
    `;
  } else if (iconType === 'pants') {
    path = `
      <path d="M72 50 L158 50 L170 215 L128 215 L115 110 L102 215 L60 215 Z" fill="${accent}" opacity="0.88" />
      <line x1="88" y1="56" x2="88" y2="210" stroke="#FAF9F6" stroke-width="1.5" opacity="0.4" />
      <line x1="142" y1="56" x2="142" y2="210" stroke="#FAF9F6" stroke-width="1.5" opacity="0.4" />
      <rect x="70" y="50" width="90" height="12" fill="#FAF9F6" opacity="0.2" />
    `;
  } else if (iconType === 'sneakers') {
    path = `
      <path d="M45 155 Q55 125 90 120 L135 120 Q160 135 185 140 Q195 155 185 175 L45 175 Z" fill="${accent}" opacity="0.85" />
      <path d="M40 170 L190 170 L190 185 Q115 192 40 185 Z" fill="#262626" />
      <path d="M80 125 L105 145 M95 125 L120 145 M110 125 L135 145" stroke="#FAF9F6" stroke-width="2.5" />
      <circle cx="160" cy="148" r="8" fill="#FAF9F6" opacity="0.3" />
    `;
  } else if (iconType === 'knit') {
    path = `
      <path d="M75 55 L98 48 Q115 62 132 48 L155 55 L190 105 L165 118 L155 205 L75 205 L65 118 L40 105 Z" fill="${accent}" opacity="0.88" />
      <path d="M98 48 Q115 62 132 48" fill="none" stroke="#FAF9F6" stroke-width="3" />
      <line x1="95" y1="75" x2="95" y2="200" stroke="#FAF9F6" stroke-width="1.5" opacity="0.3" />
      <line x1="115" y1="75" x2="115" y2="200" stroke="#FAF9F6" stroke-width="1.5" opacity="0.3" />
      <line x1="135" y1="75" x2="135" y2="200" stroke="#FAF9F6" stroke-width="1.5" opacity="0.3" />
    `;
  } else if (iconType === 'bag') {
    path = `
      <path d="M85 85 Q115 35 145 85" fill="none" stroke="${accent}" stroke-width="6" stroke-linecap="round" />
      <rect x="65" y="85" width="100" height="90" rx="14" fill="${accent}" opacity="0.9" />
      <path d="M65 85 L165 85 L150 130 L80 130 Z" fill="#18181B" opacity="0.4" />
      <circle cx="115" cy="130" r="7" fill="#E4D5B7" />
    `;
  } else if (iconType === 'hoodie') {
    path = `
      <path d="M80 50 Q115 35 150 50 L195 95 L165 115 L155 205 L75 205 L65 115 L35 95 Z" fill="${accent}" opacity="0.85" />
      <path d="M95 52 Q115 75 135 52" fill="#18181B" opacity="0.3" />
      <rect x="90" y="145" width="50" height="40" rx="4" fill="#FAF9F6" opacity="0.25" />
    `;
  } else if (iconType === 'loafers') {
    path = `
      <path d="M45 145 Q55 125 90 120 L150 120 Q185 135 190 155 L185 175 L45 175 Z" fill="${accent}" opacity="0.9" />
      <rect x="40" y="170" width="150" height="15" rx="3" fill="#18181B" />
      <rect x="110" y="130" width="35" height="10" rx="2" fill="#E4D5B7" />
    `;
  } else {
    path = `
      <path d="M60 145 Q65 80 140 80 Q170 80 175 145 Z" fill="${accent}" opacity="0.88" />
      <path d="M150 145 Q195 145 205 160 L140 160 Z" fill="${accent}" opacity="0.95" />
      <circle cx="115" cy="80" r="4" fill="#FAF9F6" />
    `;
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 230 260" width="100%" height="100%">
    <rect width="230" height="260" fill="${bg}"/>
    <g transform="translate(0, 5)">
      ${path}
    </g>
    <text x="115" y="242" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="10.5" font-weight="600" fill="#71717A" letter-spacing="1.5">${label.toUpperCase()}</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

// Full-body editorial ambassador model lookbook fit photo generator
export const createFitPicModelSvg = (
  bg: string,
  topColor: string,
  bottomColor: string,
  outerColor: string,
  outfitTitle: string,
  vibe: string
) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 340 450" width="100%" height="100%">
    <defs>
      <linearGradient id="wallGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${bg}"/>
        <stop offset="100%" stop-color="#E5E2DC"/>
      </linearGradient>
      <filter id="softShadow" x="-10%" y="-10%" width="130%" height="130%">
        <feDropShadow dx="0" dy="12" stdDeviation="10" flood-opacity="0.12"/>
      </filter>
    </defs>
    <!-- Architectural Studio Backdrop -->
    <rect width="340" height="450" fill="url(#wallGrad)"/>
    <line x1="30" y1="0" x2="30" y2="450" stroke="#000" stroke-width="0.5" opacity="0.06"/>
    <line x1="310" y1="0" x2="310" y2="450" stroke="#000" stroke-width="0.5" opacity="0.06"/>
    <rect x="0" y="380" width="340" height="70" fill="#DCD9D2" opacity="0.4"/>

    <!-- Full-body Model Silhouette Styled in Outfit -->
    <g transform="translate(45, 15)" filter="url(#softShadow)">
      <!-- Head / Hair / Beret or Hat -->
      <ellipse cx="125" cy="55" rx="19" ry="24" fill="#D7C4B2"/>
      <path d="M106 50 C106 32, 144 32, 144 50 C144 42, 136 36, 125 36 C114 36, 106 42, 106 50 Z" fill="#211F1D"/>
      <!-- Neck -->
      <rect x="120" y="74" width="10" height="15" fill="#CBB6A4"/>

      <!-- Inner Top (Cashmere / Pullover) -->
      <path d="M105 88 L145 88 L152 180 L98 180 Z" fill="${topColor}"/>

      <!-- Outerwear (Jacket / Bomber draped open) -->
      <path d="M92 86 L108 88 L100 200 L76 195 L68 120 Z" fill="${outerColor}" opacity="0.95"/>
      <path d="M158 86 L142 88 L150 200 L174 195 L182 120 Z" fill="${outerColor}" opacity="0.95"/>

      <!-- Belt & High Waistline -->
      <rect x="100" y="178" width="50" height="7" fill="#18181B"/>

      <!-- Trousers / Bottoms (Pleated Wide Leg) -->
      <path d="M100 185 L150 185 L162 335 L130 335 L125 240 L120 335 L88 335 Z" fill="${bottomColor}"/>
      <line x1="108" y1="190" x2="108" y2="330" stroke="#FFFFFF" stroke-width="1" opacity="0.15"/>
      <line x1="142" y1="190" x2="142" y2="330" stroke="#FFFFFF" stroke-width="1" opacity="0.15"/>

      <!-- Footwear (Designer Loafers or Technical Sneakers) -->
      <path d="M85 335 L112 335 L114 350 L80 350 Z" fill="#18181B"/>
      <path d="M138 335 L165 335 L170 350 L136 350 Z" fill="#18181B"/>

      <!-- Shoulder / Crossbody Bag -->
      <path d="M110 88 Q140 140 156 175" fill="none" stroke="#18181B" stroke-width="2.5"/>
      <rect x="150" y="165" width="28" height="24" rx="4" fill="#18181B"/>
    </g>

    <!-- Editorial Typography Overlay / Lookbook Caption -->
    <rect x="16" y="392" width="308" height="42" rx="8" fill="#FFFFFF" fill-opacity="0.92"/>
    <text x="32" y="412" font-family="'Plus Jakarta Sans', system-ui, sans-serif" font-size="11" font-weight="700" fill="#18181B" letter-spacing="0.5">${outfitTitle.toUpperCase()}</text>
    <text x="32" y="426" font-family="'Plus Jakarta Sans', system-ui, sans-serif" font-size="9.5" font-weight="500" fill="#71717A">${vibe}</text>
    <circle cx="304" cy="413" r="3.5" fill="#10B981"/>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

export const INITIAL_CLOTHING_ITEMS: ClothingItem[] = [];

export const INITIAL_OUTFITS: OutfitSuggestion[] = [];
