"""ISO 2-letter country codes for flag CDN (flagcdn.com/w80/{code}.png)"""

ISO_CODES = {
    'Afghanistan': 'af', 'Albania': 'al', 'Algeria': 'dz', 'Andorra': 'ad',
    'Angola': 'ao', 'Argentina': 'ar', 'Armenia': 'am', 'Australia': 'au',
    'Austria': 'at', 'Azerbaijan': 'az', 'Bahrain': 'bh', 'Bangladesh': 'bd',
    'Belarus': 'by', 'Belgium': 'be', 'Benin': 'bj', 'Bolivia': 'bo',
    'Bosnia and Herzegovina': 'ba', 'Botswana': 'bw', 'Brazil': 'br',
    'Bulgaria': 'bg', 'Burkina Faso': 'bf', 'Burundi': 'bi', 'Cambodia': 'kh',
    'Cameroon': 'cm', 'Canada': 'ca', 'Cape Verde': 'cv', 'Central African Republic': 'cf',
    'Chad': 'td', 'Chile': 'cl', 'China': 'cn', 'Colombia': 'co',
    'Comoros': 'km', 'Congo': 'cg', 'Costa Rica': 'cr', 'Croatia': 'hr',
    'Cuba': 'cu', 'Curaçao': 'cw', 'Cyprus': 'cy', 'Czech Republic': 'cz', 'DR Congo': 'cd',
    'Denmark': 'dk', 'Djibouti': 'dj', 'Dominican Republic': 'do', 'Ecuador': 'ec',
    'Egypt': 'eg', 'El Salvador': 'sv', 'England': 'gb-eng', 'Equatorial Guinea': 'gq',
    'Eritrea': 'er', 'Estonia': 'ee', 'Eswatini': 'sz', 'Ethiopia': 'et',
    'Fiji': 'fj', 'Finland': 'fi', 'France': 'fr', 'Gabon': 'ga',
    'Gambia': 'gm', 'Georgia': 'ge', 'Germany': 'de', 'Ghana': 'gh',
    'Greece': 'gr', 'Guatemala': 'gt', 'Guinea': 'gn', 'Guinea-Bissau': 'gw',
    'Haiti': 'ht', 'Honduras': 'hn', 'Hungary': 'hu', 'Iceland': 'is',
    'India': 'in', 'Indonesia': 'id', 'Iran': 'ir', 'Iraq': 'iq',
    'Ireland': 'ie', 'Israel': 'il', 'Italy': 'it', 'Ivory Coast': 'ci',
    'Jamaica': 'jm', 'Japan': 'jp', 'Jordan': 'jo', 'Kazakhstan': 'kz',
    'Kenya': 'ke', 'Kosovo': 'xk', 'Kuwait': 'kw', 'Kyrgyzstan': 'kg',
    'Laos': 'la', 'Latvia': 'lv', 'Lebanon': 'lb', 'Lesotho': 'ls',
    'Liberia': 'lr', 'Libya': 'ly', 'Liechtenstein': 'li', 'Lithuania': 'lt',
    'Luxembourg': 'lu', 'Madagascar': 'mg', 'Malawi': 'mw', 'Malaysia': 'my',
    'Maldives': 'mv', 'Mali': 'ml', 'Malta': 'mt', 'Mauritania': 'mr',
    'Mauritius': 'mu', 'Mexico': 'mx', 'Moldova': 'md', 'Mongolia': 'mn',
    'Montenegro': 'me', 'Morocco': 'ma', 'Mozambique': 'mz', 'Myanmar': 'mm',
    'Namibia': 'na', 'Nepal': 'np', 'Netherlands': 'nl', 'New Zealand': 'nz',
    'Nicaragua': 'ni', 'Niger': 'ne', 'Nigeria': 'ng', 'North Korea': 'kp',
    'North Macedonia': 'mk', 'Northern Ireland': 'gb-nir', 'Norway': 'no',
    'Oman': 'om', 'Pakistan': 'pk', 'Palestine': 'ps', 'Panama': 'pa',
    'Papua New Guinea': 'pg', 'Paraguay': 'py', 'Peru': 'pe', 'Philippines': 'ph',
    'Poland': 'pl', 'Portugal': 'pt', 'Qatar': 'qa', 'Romania': 'ro',
    'Russia': 'ru', 'Rwanda': 'rw', 'Saudi Arabia': 'sa', 'Scotland': 'gb-sct',
    'Senegal': 'sn', 'Serbia': 'rs', 'Sierra Leone': 'sl', 'Singapore': 'sg',
    'Slovakia': 'sk', 'Slovenia': 'si', 'Solomon Islands': 'sb', 'Somalia': 'so',
    'South Africa': 'za', 'South Korea': 'kr', 'South Sudan': 'ss', 'Spain': 'es',
    'Sri Lanka': 'lk', 'Sudan': 'sd', 'Suriname': 'sr', 'Sweden': 'se',
    'Switzerland': 'ch', 'Syria': 'sy', 'Tajikistan': 'tj', 'Tanzania': 'tz',
    'Thailand': 'th', 'Togo': 'tg', 'Trinidad and Tobago': 'tt', 'Tunisia': 'tn',
    'Turkey': 'tr', 'Turkmenistan': 'tm', 'Uganda': 'ug', 'Ukraine': 'ua',
    'United Arab Emirates': 'ae', 'United States': 'us', 'Uruguay': 'uy',
    'Uzbekistan': 'uz', 'Venezuela': 've', 'Vietnam': 'vn', 'Wales': 'gb-wls',
    'Yemen': 'ye', 'Zambia': 'zm', 'Zimbabwe': 'zw',
    # Additional variations
    'USA': 'us', 'Korea Republic': 'kr', 'Republic of Ireland': 'ie',
    "Cote d'Ivoire": 'ci', 'Czechia': 'cz', 'Türkiye': 'tr',
}

def get_iso_code(country_name: str) -> str:
    """Get ISO 2-letter code for a country name."""
    return ISO_CODES.get(country_name, country_name.lower()[:2])

def get_flag_url(country_name: str, width: int = 80) -> str:
    """Get flag CDN URL for a country."""
    iso_code = get_iso_code(country_name)
    return f"https://flagcdn.com/w{width}/{iso_code}.png"
