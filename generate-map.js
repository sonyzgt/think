const fs = require('fs')
const path = require('path')
const topojson = require('topojson-client')
const d3 = require('d3-geo')
const world = require('world-atlas/countries-110m.json')

// ISO 3166-1 Numeric to Alpha-2 and standard metadata mapping
const NUMERIC_TO_COUNTRY = {
  '004': { code: 'AF', name: 'Afghanistan', symbol: 'AFG', flagEmoji: '🇦🇫', region: 'Asia' },
  '008': { code: 'AL', name: 'Albania', symbol: 'ALB', flagEmoji: '🇦🇱', region: 'Europe' },
  '012': { code: 'DZ', name: 'Algeria', symbol: 'DZD', flagEmoji: '🇩🇿', region: 'Africa' },
  '024': { code: 'AO', name: 'Angola', symbol: 'AOA', flagEmoji: '🇦🇴', region: 'Africa' },
  '032': { code: 'AR', name: 'Argentina', symbol: 'ARGENTINA', flagEmoji: '🇦🇷', region: 'Americas' },
  '036': { code: 'AU', name: 'Australia', symbol: 'AUSTRALIA', flagEmoji: '🇦🇺', region: 'Oceania' },
  '040': { code: 'AT', name: 'Austria', symbol: 'AUSTRIA', flagEmoji: '🇦🇹', region: 'Europe' },
  '031': { code: 'AZ', name: 'Azerbaijan', symbol: 'AZE', flagEmoji: '🇦🇿', region: 'Asia' },
  '050': { code: 'BD', name: 'Bangladesh', symbol: 'BD', flagEmoji: '🇧🇩', region: 'Asia' },
  '056': { code: 'BE', name: 'Belgium', symbol: 'BELGIUM', flagEmoji: '🇧🇪', region: 'Europe' },
  '204': { code: 'BJ', name: 'Benin', symbol: 'BENIN', flagEmoji: '🇧🇯', region: 'Africa' },
  '068': { code: 'BO', name: 'Bolivia', symbol: 'BOLIVIA', flagEmoji: '🇧🇴', region: 'Americas' },
  '070': { code: 'BA', name: 'Bosnia and Herzegovina', symbol: 'BIH', flagEmoji: '🇧🇦', region: 'Europe' },
  '072': { code: 'BW', name: 'Botswana', symbol: 'BOTSWANA', flagEmoji: '🇧🇼', region: 'Africa' },
  '076': { code: 'BR', name: 'Brazil', symbol: 'BRAZIL', flagEmoji: '🇧🇷', region: 'Americas' },
  '096': { code: 'BN', name: 'Brunei', symbol: 'BRUNEI', flagEmoji: '🇧🇳', region: 'Asia' },
  '100': { code: 'BG', name: 'Bulgaria', symbol: 'BULGARIA', flagEmoji: '🇧🇬', region: 'Europe' },
  '854': { code: 'BF', name: 'Burkina Faso', symbol: 'BFA', flagEmoji: '🇧🇫', region: 'Africa' },
  '108': { code: 'BI', name: 'Burundi', symbol: 'BDI', flagEmoji: '🇧🇮', region: 'Africa' },
  '116': { code: 'KH', name: 'Cambodia', symbol: 'KHM', flagEmoji: '🇰🇭', region: 'Asia' },
  '120': { code: 'CM', name: 'Cameroon', symbol: 'CMR', flagEmoji: '🇨🇲', region: 'Africa' },
  '124': { code: 'CA', name: 'Canada', symbol: 'CANADA', flagEmoji: '🇨🇦', region: 'Americas' },
  '140': { code: 'CF', name: 'Central African Republic', symbol: 'CAF', flagEmoji: '🇨🇫', region: 'Africa' },
  '148': { code: 'TD', name: 'Chad', symbol: 'TCD', flagEmoji: '🇹🇩', region: 'Africa' },
  '152': { code: 'CL', name: 'Chile', symbol: 'CHILE', flagEmoji: '🇨🇱', region: 'Americas' },
  '156': { code: 'CN', name: 'China', symbol: 'CHINA', flagEmoji: '🇨🇳', region: 'Asia' },
  '170': { code: 'CO', name: 'Colombia', symbol: 'COLOMBIA', flagEmoji: '🇨🇴', region: 'Americas' },
  '178': { code: 'CG', name: 'Republic of the Congo', symbol: 'COG', flagEmoji: '🇨🇬', region: 'Africa' },
  '180': { code: 'CD', name: 'Democratic Republic of the Congo', symbol: 'COD', flagEmoji: '🇨🇩', region: 'Africa' },
  '188': { code: 'CR', name: 'Costa Rica', symbol: 'CRI', flagEmoji: '🇨🇷', region: 'Americas' },
  '384': { code: 'CI', name: "Cote d'Ivoire", symbol: 'CIV', flagEmoji: '🇨🇮', region: 'Africa' },
  '191': { code: 'HR', name: 'Croatia', symbol: 'CROATIA', flagEmoji: '🇭🇷', region: 'Europe' },
  '192': { code: 'CU', name: 'Cuba', symbol: 'CUBA', flagEmoji: '🇨🇺', region: 'Americas' },
  '196': { code: 'CY', name: 'Cyprus', symbol: 'CYP', flagEmoji: '🇨🇾', region: 'Europe' },
  '203': { code: 'CZ', name: 'Czech Republic', symbol: 'CZECH', flagEmoji: '🇨🇿', region: 'Europe' },
  '208': { code: 'DK', name: 'Denmark', symbol: 'DENMARK', flagEmoji: '🇩🇰', region: 'Europe' },
  '262': { code: 'DJ', name: 'Djibouti', symbol: 'DJI', flagEmoji: '🇩🇯', region: 'Africa' },
  '214': { code: 'DO', name: 'Dominican Republic', symbol: 'DOM', flagEmoji: '🇩🇴', region: 'Americas' },
  '218': { code: 'EC', name: 'Ecuador', symbol: 'ECUADOR', flagEmoji: '🇪🇨', region: 'Americas' },
  '818': { code: 'EG', name: 'Egypt', symbol: 'EGYPT', flagEmoji: '🇪🇬', region: 'Africa' },
  '222': { code: 'SV', name: 'El Salvador', symbol: 'SLV', flagEmoji: '🇸🇻', region: 'Americas' },
  '226': { code: 'GQ', name: 'Equatorial Guinea', symbol: 'GNQ', flagEmoji: '🇬🇶', region: 'Africa' },
  '232': { code: 'ER', name: 'Eritrea', symbol: 'ERI', flagEmoji: '🇪🇷', region: 'Africa' },
  '233': { code: 'EE', name: 'Estonia', symbol: 'ESTONIA', flagEmoji: '🇪🇪', region: 'Europe' },
  '231': { code: 'ET', name: 'Ethiopia', symbol: 'ETHIOPIA', flagEmoji: '🇪🇹', region: 'Africa' },
  '242': { code: 'FJ', name: 'Fiji', symbol: 'FJI', flagEmoji: '🇫🇯', region: 'Oceania' },
  '246': { code: 'FI', name: 'Finland', symbol: 'FINLAND', flagEmoji: '🇫🇮', region: 'Europe' },
  '250': { code: 'FR', name: 'France', symbol: 'FRANCE', flagEmoji: '🇫🇷', region: 'Europe' },
  '266': { code: 'GA', name: 'Gabon', symbol: 'GABON', flagEmoji: '🇬🇦', region: 'Africa' },
  '270': { code: 'GM', name: 'Gambia', symbol: 'GMB', flagEmoji: '🇬🇲', region: 'Africa' },
  '268': { code: 'GE', name: 'Georgia', symbol: 'GEO', flagEmoji: '🇬🇪', region: 'Asia' },
  '276': { code: 'DE', name: 'Germany', symbol: 'GERMANY', flagEmoji: '🇩🇪', region: 'Europe' },
  '288': { code: 'GH', name: 'Ghana', symbol: 'GHANA', flagEmoji: '🇬🇭', region: 'Africa' },
  '300': { code: 'GR', name: 'Greece', symbol: 'GREECE', flagEmoji: '🇬🇷', region: 'Europe' },
  '304': { code: 'GL', name: 'Greenland', symbol: 'GREENLAND', flagEmoji: '🇬🇱', region: 'Americas' },
  '320': { code: 'GT', name: 'Guatemala', symbol: 'GTM', flagEmoji: '🇬🇹', region: 'Americas' },
  '324': { code: 'GN', name: 'Guinea', symbol: 'GIN', flagEmoji: '🇬🇳', region: 'Africa' },
  '624': { code: 'GW', name: 'Guinea-Bissau', symbol: 'GNB', flagEmoji: '🇬🇼', region: 'Africa' },
  '328': { code: 'GY', name: 'Guyana', symbol: 'GUY', flagEmoji: '🇬🇾', region: 'Americas' },
  '332': { code: 'HT', name: 'Haiti', symbol: 'HTI', flagEmoji: '🇭🇹', region: 'Americas' },
  '340': { code: 'HN', name: 'Honduras', symbol: 'HND', flagEmoji: '🇭🇳', region: 'Americas' },
  '348': { code: 'HU', name: 'Hungary', symbol: 'HUN', flagEmoji: '🇭🇺', region: 'Europe' },
  '352': { code: 'IS', name: 'Iceland', symbol: 'ICELAND', flagEmoji: '🇮🇸', region: 'Europe' },
  '356': { code: 'IN', name: 'India', symbol: 'INDIA', flagEmoji: '🇮🇳', region: 'Asia' },
  '360': { code: 'ID', name: 'Indonesia', symbol: 'INDONESIA', flagEmoji: '🇮🇩', region: 'Asia' },
  '364': { code: 'IR', name: 'Iran', symbol: 'IRAN', flagEmoji: '🇮🇷', region: 'Middle East' },
  '368': { code: 'IQ', name: 'Iraq', symbol: 'IRAQ', flagEmoji: '🇮🇶', region: 'Middle East' },
  '372': { code: 'IE', name: 'Ireland', symbol: 'IRELAND', flagEmoji: '🇮🇪', region: 'Europe' },
  '376': { code: 'IL', name: 'Israel', symbol: 'ISR', flagEmoji: '🇮🇱', region: 'Middle East' },
  '380': { code: 'IT', name: 'Italy', symbol: 'ITALY', flagEmoji: '🇮🇹', region: 'Europe' },
  '388': { code: 'JM', name: 'Jamaica', symbol: 'JAM', flagEmoji: '🇯🇲', region: 'Americas' },
  '392': { code: 'JP', name: 'Japan', symbol: 'JAPAN', flagEmoji: '🇯🇵', region: 'Asia' },
  '400': { code: 'JO', name: 'Jordan', symbol: 'JOR', flagEmoji: '🇯🇴', region: 'Middle East' },
  '398': { code: 'KZ', name: 'Kazakhstan', symbol: 'KAZAKHSTAN', flagEmoji: '🇰🇿', region: 'Asia' },
  '404': { code: 'KE', name: 'Kenya', symbol: 'KENYA', flagEmoji: '🇰🇪', region: 'Africa' },
  '408': { code: 'KP', name: 'North Korea', symbol: 'PRK', flagEmoji: '🇰🇵', region: 'Asia' },
  '410': { code: 'KR', name: 'South Korea', symbol: 'KOREA', flagEmoji: '🇰🇷', region: 'Asia' },
  '414': { code: 'KW', name: 'Kuwait', symbol: 'KUWAIT', flagEmoji: '🇰🇼', region: 'Middle East' },
  '417': { code: 'KG', name: 'Kyrgyzstan', symbol: 'KGZ', flagEmoji: '🇰🇬', region: 'Asia' },
  '418': { code: 'LA', name: 'Laos', symbol: 'LAOS', flagEmoji: '🇱🇦', region: 'Asia' },
  '428': { code: 'LV', name: 'Latvia', symbol: 'LATVIA', flagEmoji: '🇱🇻', region: 'Europe' },
  '422': { code: 'LB', name: 'Lebanon', symbol: 'LBN', flagEmoji: '🇱🇧', region: 'Middle East' },
  '426': { code: 'LS', name: 'Lesotho', symbol: 'LSO', flagEmoji: '🇱🇸', region: 'Africa' },
  '430': { code: 'LR', name: 'Liberia', symbol: 'LBR', flagEmoji: '🇱🇷', region: 'Africa' },
  '434': { code: 'LY', name: 'Libya', symbol: 'LIBYA', flagEmoji: '🇱🇾', region: 'Africa' },
  '440': { code: 'LT', name: 'Lithuania', symbol: 'LTU', flagEmoji: '🇱🇹', region: 'Europe' },
  '442': { code: 'LU', name: 'Luxembourg', symbol: 'LUX', flagEmoji: '🇱🇺', region: 'Europe' },
  '807': { code: 'MK', name: 'North Macedonia', symbol: 'MKD', flagEmoji: '🇲🇰', region: 'Europe' },
  '450': { code: 'MG', name: 'Madagascar', symbol: 'MDG', flagEmoji: '🇲🇬', region: 'Africa' },
  '454': { code: 'MW', name: 'Malawi', symbol: 'MWI', flagEmoji: '🇲🇼', region: 'Africa' },
  '458': { code: 'MY', name: 'Malaysia', symbol: 'MALAYSIA', flagEmoji: '🇲🇾', region: 'Asia' },
  '466': { code: 'ML', name: 'Mali', symbol: 'MALI', flagEmoji: '🇲🇱', region: 'Africa' },
  '478': { code: 'MR', name: 'Mauritania', symbol: 'MRT', flagEmoji: '🇲🇷', region: 'Africa' },
  '484': { code: 'MX', name: 'Mexico', symbol: 'MEXICO', flagEmoji: '🇲🇽', region: 'Americas' },
  '498': { code: 'MD', name: 'Moldova', symbol: 'MDA', flagEmoji: '🇲🇩', region: 'Europe' },
  '496': { code: 'MN', name: 'Mongolia', symbol: 'MONGOLIA', flagEmoji: '🇲🇳', region: 'Asia' },
  '499': { code: 'ME', name: 'Montenegro', symbol: 'MNE', flagEmoji: '🇲🇪', region: 'Europe' },
  '504': { code: 'MA', name: 'Morocco', symbol: 'MOROCCO', flagEmoji: '🇲🇦', region: 'Africa' },
  '508': { code: 'MZ', name: 'Mozambique', symbol: 'MOZ', flagEmoji: '🇲🇿', region: 'Africa' },
  '104': { code: 'MM', name: 'Myanmar', symbol: 'MMR', flagEmoji: '🇲🇲', region: 'Asia' },
  '516': { code: 'NA', name: 'Namibia', symbol: 'NAMIBIA', flagEmoji: '🇳🇦', region: 'Africa' },
  '524': { code: 'NP', name: 'Nepal', symbol: 'NPL', flagEmoji: '🇳🇵', region: 'Asia' },
  '528': { code: 'NL', name: 'Netherlands', symbol: 'HOLLAND', flagEmoji: '🇳🇱', region: 'Europe' },
  '540': { code: 'NC', name: 'New Caledonia', symbol: 'NCL', flagEmoji: '🇳🇨', region: 'Oceania' },
  '554': { code: 'NZ', name: 'New Zealand', symbol: 'NZ', flagEmoji: '🇳🇿', region: 'Oceania' },
  '558': { code: 'NI', name: 'Nicaragua', symbol: 'NIC', flagEmoji: '🇳🇮', region: 'Americas' },
  '562': { code: 'NE', name: 'Niger', symbol: 'NER', flagEmoji: '🇳🇪', region: 'Africa' },
  '566': { code: 'NG', name: 'Nigeria', symbol: 'NIGERIA', flagEmoji: '🇳🇬', region: 'Africa' },
  '578': { code: 'NO', name: 'Norway', symbol: 'NORWAY', flagEmoji: '🇳🇴', region: 'Europe' },
  '512': { code: 'OM', name: 'Oman', symbol: 'OMAN', flagEmoji: '🇴🇲', region: 'Middle East' },
  '586': { code: 'PK', name: 'Pakistan', symbol: 'PAKISTAN', flagEmoji: '🇵🇰', region: 'Asia' },
  '591': { code: 'PA', name: 'Panama', symbol: 'PANAMA', flagEmoji: '🇵🇦', region: 'Americas' },
  '598': { code: 'PG', name: 'Papua New Guinea', symbol: 'PNG', flagEmoji: '🇵🇬', region: 'Oceania' },
  '600': { code: 'PY', name: 'Paraguay', symbol: 'PRY', flagEmoji: '🇵🇾', region: 'Americas' },
  '604': { code: 'PE', name: 'Peru', symbol: 'PERU', flagEmoji: '🇵🇪', region: 'Americas' },
  '608': { code: 'PH', name: 'Philippines', symbol: 'PHILIPPINES', flagEmoji: '🇵🇭', region: 'Asia' },
  '616': { code: 'PL', name: 'Poland', symbol: 'POLAND', flagEmoji: '🇵🇱', region: 'Europe' },
  '620': { code: 'PT', name: 'Portugal', symbol: 'PORTUGAL', flagEmoji: '🇵🇹', region: 'Europe' },
  '630': { code: 'PR', name: 'Puerto Rico', symbol: 'PRI', flagEmoji: '🇵🇷', region: 'Americas' },
  '634': { code: 'QA', name: 'Qatar', symbol: 'QATAR', flagEmoji: '🇶🇦', region: 'Middle East' },
  '642': { code: 'RO', name: 'Romania', symbol: 'ROMANIA', flagEmoji: '🇷🇴', region: 'Europe' },
  '643': { code: 'RU', name: 'Russia', symbol: 'RUSSIA', flagEmoji: '🇷🇺', region: 'Europe' },
  '646': { code: 'RW', name: 'Rwanda', symbol: 'RWA', flagEmoji: '🇷🇼', region: 'Africa' },
  '682': { code: 'SA', name: 'Saudi Arabia', symbol: 'KSA', flagEmoji: '🇸🇦', region: 'Middle East' },
  '686': { code: 'SN', name: 'Senegal', symbol: 'SEN', flagEmoji: '🇸🇳', region: 'Africa' },
  '688': { code: 'RS', name: 'Serbia', symbol: 'SRB', flagEmoji: '🇷🇸', region: 'Europe' },
  '694': { code: 'SL', name: 'Sierra Leone', symbol: 'SLE', flagEmoji: '🇸🇱', region: 'Africa' },
  '702': { code: 'SG', name: 'Singapore', symbol: 'SINGAPORE', flagEmoji: '🇸🇬', region: 'Asia' },
  '703': { code: 'SK', name: 'Slovakia', symbol: 'SVK', flagEmoji: '🇸🇰', region: 'Europe' },
  '705': { code: 'SI', name: 'Slovenia', symbol: 'SVN', flagEmoji: '🇸🇮', region: 'Europe' },
  '090': { code: 'SB', name: 'Solomon Islands', symbol: 'SLB', flagEmoji: '🇸🇧', region: 'Oceania' },
  '706': { code: 'SO', name: 'Somalia', symbol: 'SOM', flagEmoji: '🇸🇴', region: 'Africa' },
  '710': { code: 'ZA', name: 'South Africa', symbol: 'SOUTHAFRICA', flagEmoji: '🇿🇦', region: 'Africa' },
  '728': { code: 'SS', name: 'South Sudan', symbol: 'SSD', flagEmoji: '🇸🇸', region: 'Africa' },
  '724': { code: 'ES', name: 'Spain', symbol: 'SPAIN', flagEmoji: '🇪🇸', region: 'Europe' },
  '144': { code: 'LK', name: 'Sri Lanka', symbol: 'LKA', flagEmoji: '🇱🇰', region: 'Asia' },
  '729': { code: 'SD', name: 'Sudan', symbol: 'SDN', flagEmoji: '🇸🇩', region: 'Africa' },
  '740': { code: 'SR', name: 'Suriname', symbol: 'SUR', flagEmoji: '🇸🇷', region: 'Americas' },
  '752': { code: 'SE', name: 'Sweden', symbol: 'SWEDEN', flagEmoji: '🇸🇪', region: 'Europe' },
  '756': { code: 'CH', name: 'Switzerland', symbol: 'SWISS', flagEmoji: '🇨🇭', region: 'Europe' },
  '760': { code: 'SY', name: 'Syria', symbol: 'SYR', flagEmoji: '🇸🇾', region: 'Middle East' },
  '158': { code: 'TW', name: 'Taiwan', symbol: 'TAIWAN', flagEmoji: '🇹🇼', region: 'Asia' },
  '762': { code: 'TJ', name: 'Tajikistan', symbol: 'TJK', flagEmoji: '🇹🇯', region: 'Asia' },
  '834': { code: 'TZ', name: 'Tanzania', symbol: 'TZA', flagEmoji: '🇹🇿', region: 'Africa' },
  '764': { code: 'TH', name: 'Thailand', symbol: 'THAILAND', flagEmoji: '🇹🇭', region: 'Asia' },
  '626': { code: 'TL', name: 'Timor-Leste', symbol: 'TLS', flagEmoji: '🇹🇱', region: 'Asia' },
  '768': { code: 'TG', name: 'Togo', symbol: 'TGO', flagEmoji: '🇹🇬', region: 'Africa' },
  '780': { code: 'TT', name: 'Trinidad and Tobago', symbol: 'TTO', flagEmoji: '🇹🇹', region: 'Americas' },
  '788': { code: 'TN', name: 'Tunisia', symbol: 'TUN', flagEmoji: '🇹🇳', region: 'Africa' },
  '792': { code: 'TR', name: 'Turkey', symbol: 'TURKEY', flagEmoji: '🇹🇷', region: 'Middle East' },
  '795': { code: 'TM', name: 'Turkmenistan', symbol: 'TKM', flagEmoji: '🇹🇲', region: 'Asia' },
  '800': { code: 'UG', name: 'Uganda', symbol: 'UGA', flagEmoji: '🇺🇬', region: 'Africa' },
  '804': { code: 'UA', name: 'Ukraine', symbol: 'UKRAINE', flagEmoji: '🇺🇦', region: 'Europe' },
  '784': { code: 'AE', name: 'United Arab Emirates', symbol: 'UAE', flagEmoji: '🇦🇪', region: 'Middle East' },
  '826': { code: 'GB', name: 'United Kingdom', symbol: 'UK', flagEmoji: '🇬🇧', region: 'Europe' },
  '840': { code: 'US', name: 'United States', symbol: 'USA', flagEmoji: '🇺🇸', region: 'Americas' },
  '858': { code: 'UY', name: 'Uruguay', symbol: 'URY', flagEmoji: '🇺🇾', region: 'Americas' },
  '860': { code: 'UZ', name: 'Uzbekistan', symbol: 'UZB', flagEmoji: '🇺🇿', region: 'Asia' },
  '548': { code: 'VU', name: 'Vanuatu', symbol: 'VUT', flagEmoji: '🇻🇺', region: 'Oceania' },
  '862': { code: 'VE', name: 'Venezuela', symbol: 'VEN', flagEmoji: '🇻🇪', region: 'Americas' },
  '704': { code: 'VN', name: 'Vietnam', symbol: 'VIETNAM', flagEmoji: '🇻🇳', region: 'Asia' },
  '887': { code: 'YE', name: 'Yemen', symbol: 'YEM', flagEmoji: '🇾🇪', region: 'Middle East' },
  '894': { code: 'ZM', name: 'Zambia', symbol: 'ZMB', flagEmoji: '🇿🇲', region: 'Africa' },
  '716': { code: 'ZW', name: 'Zimbabwe', symbol: 'ZWE', flagEmoji: '🇿🇼', region: 'Africa' },
}

// Generate projected SVG paths from GeoJSON using Natural Earth 1 projection
const geoFeatures = topojson.feature(world, world.objects.countries).features
const projection = d3.geoNaturalEarth1().fitExtent([[20, 20], [980, 480]], { type: 'Sphere' })
const pathGenerator = d3.geoPath().projection(projection)

const generatedMapPaths = []
const generatedCountriesList = []

for (const feature of geoFeatures) {
  const numId = String(feature.id).padStart(3, '0')
  const meta = NUMERIC_TO_COUNTRY[numId] || NUMERIC_TO_COUNTRY[String(feature.id)]
  if (!meta) continue

  const d = pathGenerator(feature)
  if (!d) continue

  const bounds = pathGenerator.bounds(feature)
  const center = {
    x: Math.round((bounds[0][0] + bounds[1][0]) / 2),
    y: Math.round((bounds[0][1] + bounds[1][1]) / 2),
  }

  const countryItem = {
    code: meta.code,
    name: meta.name,
    symbol: meta.symbol,
    flagEmoji: meta.flagEmoji,
    flagUrl: `https://flagcdn.com/w320/${meta.code.toLowerCase()}.png`,
    region: meta.region,
    description: `Decentralized nation token for ${meta.name} on Robinhood Chain.`,
  }

  const mapPathItem = {
    code: meta.code,
    name: meta.name,
    d: d,
    center: center,
    bounds: {
      minX: Math.round(bounds[0][0]),
      minY: Math.round(bounds[0][1]),
      maxX: Math.round(bounds[1][0]),
      maxY: Math.round(bounds[1][1]),
      width: Math.max(10, Math.round(bounds[1][0] - bounds[0][0])),
      height: Math.max(10, Math.round(bounds[1][1] - bounds[0][1])),
    }
  }

  generatedCountriesList.push(countryItem)
  generatedMapPaths.push(mapPathItem)
}

// Sort by name for clean listings
generatedCountriesList.sort((a, b) => a.name.localeCompare(b.name))

const outputLibCountries = `export interface CountryData {
  code: string          // ISO 2-letter code
  name: string          // Full country name
  symbol: string        // Default token symbol
  flagEmoji: string     // Flag emoji
  flagUrl: string       // High quality flag CDN URL
  region: string
  description: string   // Default description
}

export const WORLD_COUNTRIES: CountryData[] = ${JSON.stringify(generatedCountriesList, null, 2)}

export function matchTokenWithCountry(
  token: { name?: string; symbol?: string; description?: string }
): CountryData | undefined {
  const normSym = (token.symbol || '').toUpperCase().trim()
  const normName = (token.name || '').toLowerCase().trim()

  return WORLD_COUNTRIES.find((c) => {
    return (
      c.symbol.toUpperCase() === normSym ||
      c.code.toUpperCase() === normSym ||
      c.name.toLowerCase() === normName ||
      normName.includes(c.name.toLowerCase())
    )
  })
}
`

const outputLibMapPaths = `export interface MapCountryPath {
  code: string
  name: string
  d: string
  center: { x: number; y: number }
  bounds: { minX: number; minY: number; maxX: number; maxY: number; width: number; height: number }
}

export const MAP_COUNTRY_PATHS: MapCountryPath[] = ${JSON.stringify(generatedMapPaths, null, 2)}
`

fs.writeFileSync(path.join(__dirname, 'lib', 'countries.ts'), outputLibCountries)
fs.writeFileSync(path.join(__dirname, 'lib', 'map-paths.ts'), outputLibMapPaths)
console.log('Successfully generated real geo map paths for', generatedMapPaths.length, 'countries!')
