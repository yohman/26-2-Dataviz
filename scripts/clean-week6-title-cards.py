"""Replace only the four assistant-added context cards in the 46-slide deck."""
from pathlib import Path
import json,sys
from pypdf import PdfReader,PdfWriter
from week6_title_cards import original_title_card
ROOT=Path(__file__).resolve().parents[1]
DECK=ROOT/'lectures/w06_lores.pdf'
source=Path(sys.argv[1]) if len(sys.argv)>1 else DECK
reader=PdfReader(source);assert len(reader.pages)==46
cases=json.loads((ROOT/'assets/images/week06/historical-justice-sources.json').read_text())['cases']
replacements=dict(zip([5,7,9,11],cases))
writer=PdfWriter()
for n,page in enumerate(reader.pages,1):writer.add_page(original_title_card(replacements[n]) if n in replacements else page)
writer.compress_identical_objects(remove_duplicates=True,remove_unreferenced=True)
tmp=DECK.with_suffix('.tmp.pdf')
with tmp.open('wb') as out:writer.write(out)
tmp.replace(DECK)
p=ROOT/'lectures/w06_lores.notes.json';notes=json.loads(p.read_text())
by_page={note['page']:note for note in notes['slides']}
for page,case in replacements.items():
    note=by_page[page];note['title']=case['original_title'].replace('\n',' ')
    note['sources']=list(dict.fromkeys([case['title_source'],*note['sources']]))
    for key in ['ja','en']:
        # Preserve the historical discussion outside the slide image.
        if case['id']=='brookes':
            prefix='この図版の資料目録上の年は1789年。表題にある1788年は規制法の年。' if key=='ja' else 'The catalog dates this plate to 1789; 1788 in the title is the year of the regulation act. '
            if not note[key].startswith(prefix):note[key]=prefix+note[key]
# The legends no longer sit on the context cards; the original linked scans retain them.
for page,id in [(6,'booth'),(8,'hullhouse')]:
    case=next(c for c in cases if c['id']==id)
    by_page[page]['ja']=case['detail_ja'];by_page[page]['en']=case['detail_en']
p.write_text(json.dumps(notes,ensure_ascii=False,indent=2)+'\n')
print('Updated slides 5, 7, 9 and 11; all other pages and their source links retained.')
