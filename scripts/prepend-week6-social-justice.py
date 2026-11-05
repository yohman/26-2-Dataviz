"""Prepend the supplied UCLA slides, preserving every page and PDF link.

Usage: python scripts/prepend-week6-social-justice.py '/path/to/Social Justice.pdf'
Run only against the 28-page Week 6 deck before this addition.
"""
from pathlib import Path
import sys
from pypdf import PdfReader, PdfWriter

deck = Path(__file__).resolve().parents[1] / 'lectures/w06_lores.pdf'
prefix = PdfReader(sys.argv[1])
original = PdfReader(deck)
assert len(prefix.pages) == 14, 'Expected the supplied 14-page PDF.'
assert len(original.pages) == 28, 'Expected the original 28-page deck; do not prepend twice.'
writer = PdfWriter()
writer.append(prefix)
writer.append(original)
temporary = deck.with_suffix('.tmp.pdf')
with temporary.open('wb') as output:
    writer.write(output)
temporary.replace(deck)
print('14 UCLA slides + 28 existing slides = 42 slides.')
