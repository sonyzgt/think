export interface MapCountryPath {
  code: string
  name: string
  d: string
  center: { x: number; y: number }
}

export const MAP_COUNTRY_PATHS: MapCountryPath[] = [
  // ── NORTH & SOUTH AMERICA ──────────────────────────────────────────────────
  {
    code: 'US',
    name: 'United States',
    d: 'M130,120 L230,120 L240,150 L220,185 L180,195 L140,175 L115,145 Z M60,70 L110,65 L115,95 L75,100 Z', // US Lower 48 + Alaska
    center: { x: 175, y: 155 },
  },
  {
    code: 'CA',
    name: 'Canada',
    d: 'M115,60 L245,55 L260,115 L130,118 L110,95 Z M180,30 L220,30 L230,55 L175,55 Z',
    center: { x: 185, y: 80 },
  },
  {
    code: 'MX',
    name: 'Mexico',
    d: 'M140,180 L185,195 L205,240 L180,245 L150,215 Z',
    center: { x: 170, y: 215 },
  },
  {
    code: 'BR',
    name: 'Brazil',
    d: 'M250,270 L320,265 L350,305 L330,365 L280,360 L250,310 Z',
    center: { x: 295, y: 315 },
  },
  {
    code: 'AR',
    name: 'Argentina',
    d: 'M270,360 L305,365 L295,445 L275,445 L265,390 Z',
    center: { x: 285, y: 405 },
  },
  {
    code: 'CL',
    name: 'Chile',
    d: 'M260,355 L270,360 L272,445 L262,445 Z',
    center: { x: 265, y: 400 },
  },
  {
    code: 'CO',
    name: 'Colombia',
    d: 'M230,250 L260,252 L262,280 L235,275 Z',
    center: { x: 245, y: 265 },
  },

  // ── EUROPE ─────────────────────────────────────────────────────────────────
  {
    code: 'GB',
    name: 'United Kingdom',
    d: 'M445,115 L465,110 L465,140 L448,142 Z',
    center: { x: 455, y: 125 },
  },
  {
    code: 'FR',
    name: 'France',
    d: 'M460,145 L485,142 L485,175 L458,172 Z',
    center: { x: 472, y: 158 },
  },
  {
    code: 'DE',
    name: 'Germany',
    d: 'M485,130 L515,128 L515,158 L485,158 Z',
    center: { x: 500, y: 142 },
  },
  {
    code: 'IT',
    name: 'Italy',
    d: 'M495,165 L515,165 L525,200 L512,205 L498,175 Z',
    center: { x: 510, y: 185 },
  },
  {
    code: 'ES',
    name: 'Spain',
    d: 'M435,168 L462,168 L458,200 L430,195 Z',
    center: { x: 445, y: 185 },
  },
  {
    code: 'PT',
    name: 'Portugal',
    d: 'M425,170 L435,170 L435,195 L425,195 Z',
    center: { x: 430, y: 182 },
  },
  {
    code: 'NL',
    name: 'Netherlands',
    d: 'M478,128 L492,126 L490,138 L478,138 Z',
    center: { x: 485, y: 132 },
  },
  {
    code: 'CH',
    name: 'Switzerland',
    d: 'M482,158 L498,158 L498,168 L482,168 Z',
    center: { x: 490, y: 163 },
  },
  {
    code: 'SE',
    name: 'Sweden',
    d: 'M505,75 L525,75 L525,125 L505,125 Z',
    center: { x: 515, y: 100 },
  },
  {
    code: 'NO',
    name: 'Norway',
    d: 'M485,75 L505,75 L505,125 L488,125 Z',
    center: { x: 495, y: 100 },
  },
  {
    code: 'PL',
    name: 'Poland',
    d: 'M515,130 L545,130 L545,158 L515,158 Z',
    center: { x: 530, y: 144 },
  },

  // ── ASIA ───────────────────────────────────────────────────────────────────
  {
    code: 'JP',
    name: 'Japan',
    d: 'M815,150 L840,145 L845,190 L825,195 Z',
    center: { x: 830, y: 170 },
  },
  {
    code: 'KR',
    name: 'South Korea',
    d: 'M780,165 L800,165 L798,185 L780,185 Z',
    center: { x: 790, y: 175 },
  },
  {
    code: 'IN',
    name: 'India',
    d: 'M650,200 L710,195 L695,270 L665,270 L645,230 Z',
    center: { x: 675, y: 235 },
  },
  {
    code: 'ID',
    name: 'Indonesia',
    d: 'M745,305 L830,305 L850,335 L760,335 Z M785,290 L820,290 L820,310 L785,310 Z',
    center: { x: 795, y: 315 },
  },
  {
    code: 'SG',
    name: 'Singapore',
    d: 'M748,295 L758,295 L758,302 L748,302 Z',
    center: { x: 753, y: 298 },
  },
  {
    code: 'VN',
    name: 'Vietnam',
    d: 'M745,220 L765,220 L760,265 L745,260 Z',
    center: { x: 755, y: 242 },
  },
  {
    code: 'TH',
    name: 'Thailand',
    d: 'M725,225 L745,225 L745,265 L730,265 Z',
    center: { x: 735, y: 245 },
  },
  {
    code: 'PH',
    name: 'Philippines',
    d: 'M795,235 L818,235 L815,280 L795,280 Z',
    center: { x: 805, y: 258 },
  },
  {
    code: 'MY',
    name: 'Malaysia',
    d: 'M735,280 L760,280 L785,295 L745,295 Z',
    center: { x: 755, y: 288 },
  },

  // ── MIDDLE EAST ────────────────────────────────────────────────────────────
  {
    code: 'SA',
    name: 'Saudi Arabia',
    d: 'M570,205 L625,205 L620,260 L575,255 Z',
    center: { x: 595, y: 232 },
  },
  {
    code: 'AE',
    name: 'United Arab Emirates',
    d: 'M620,225 L638,225 L638,240 L620,240 Z',
    center: { x: 628, y: 232 },
  },
  {
    code: 'TR',
    name: 'Turkey',
    d: 'M535,160 L585,160 L580,185 L535,185 Z',
    center: { x: 560, y: 172 },
  },

  // ── AFRICA ─────────────────────────────────────────────────────────────────
  {
    code: 'EG',
    name: 'Egypt',
    d: 'M525,195 L565,195 L565,230 L525,230 Z',
    center: { x: 545, y: 212 },
  },
  {
    code: 'NG',
    name: 'Nigeria',
    d: 'M465,260 L498,260 L498,295 L465,295 Z',
    center: { x: 482, y: 278 },
  },
  {
    code: 'ZA',
    name: 'South Africa',
    d: 'M515,365 L558,365 L550,420 L515,415 Z',
    center: { x: 535, y: 390 },
  },

  // ── OCEANIA ────────────────────────────────────────────────────────────────
  {
    code: 'AU',
    name: 'Australia',
    d: 'M780,345 L880,340 L885,420 L770,415 Z',
    center: { x: 830, y: 380 },
  },
  {
    code: 'NZ',
    name: 'New Zealand',
    d: 'M895,415 L915,415 L915,455 L895,455 Z',
    center: { x: 905, y: 435 },
  },
]
