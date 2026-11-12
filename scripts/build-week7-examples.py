"""Build lecture examples from the exact course CSVs, without filling missing values."""
import csv, hashlib, json
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]

def read(name):
    path = ROOT / 'data' / name
    with path.open(encoding='utf-8-sig', newline='') as f:
        rows = list(csv.DictReader(f))
    return rows, hashlib.sha256(path.read_bytes()).hexdigest()

gap, gap_hash = read('gapminder.csv')
disasters, disaster_hash = read('disasters.csv')
latest = max(int(r['Year']) for r in gap)
selected = ['Japan', 'India', 'China', 'Sweden', 'United States']
def numeric(value):
    return float(value) if value.strip() else None
payload = {
    'sources': {'gapminder': {'file': 'data/gapminder.csv', 'sha256': gap_hash, 'rows': len(gap), 'countries': len({r['geo'] for r in gap if r['geo']}), 'start': min(int(r['Year']) for r in gap), 'end': latest},
                'disasters': {'file': 'data/disasters.csv', 'sha256': disaster_hash, 'rows': len(disasters), 'start': min(int(r['Start Year']) for r in disasters), 'end': max(int(r['Start Year']) for r in disasters), 'missingDeaths': sum(not r['Total Deaths'].strip() for r in disasters)}},
    'scatter': [{'country': r['Country'] or r['geo'], 'region': r['Region'], 'year': latest, 'income': numeric(r['Income per person']), 'life': numeric(r['Life Expectancy']), 'population': numeric(r['Population'])} for r in gap if int(r['Year']) == latest],
    'series': [{'country': c, 'points': [[int(r['Year']), numeric(r['Life Expectancy'])] for r in gap if r['Country'] == c and int(r['Year']) >= 1950]} for c in selected],
    'missingCountryLatest': sum(not r['Country'] for r in gap if int(r['Year']) == latest),
    'row': next(r for r in gap if r['Country'] == 'Japan' and int(r['Year']) == latest),
    'disasterRows': [{k: r[k] for k in ['Country', 'Disaster Type', 'Start Year', 'Total Deaths']} for r in disasters[:4]]
}
(ROOT/'data/week07-examples.json').write_text(json.dumps(payload, ensure_ascii=False, separators=(',', ':'))+'\n')
print(f'Built {len(payload["scatter"])} geography rows; empty source values remain null.')
