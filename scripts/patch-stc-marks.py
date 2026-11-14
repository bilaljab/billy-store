"""Make Arabic harakat in the STC font behave as combining marks.

The shipped STC woff2 files have glyphs for the harakat (fatha, damma, shadda, ...)
but declare them as ordinary spacing glyphs: empty GDEF classes, ~256-unit advances
and no GPOS mark positioning. Browsers therefore lay a haraka out as its own letter,
which opens a visible gap mid-word ("يُفعّل" renders as "يُفعّ ل").

This script, run once per font file, in place:
  1. classifies the harakat (and the shadda+haraka ligatures) as marks in GDEF,
  2. zeroes their advance width,
  3. adds a GPOS 'mark' lookup that centres each mark above/below its base glyph,
     appended next to the existing 'kern' feature (which is kept as is).

Idempotent: a font that already has a 'mark' feature is left untouched.

Usage: python scripts/patch-stc-marks.py public/fonts/stc/STC-Regular.woff2 public/fonts/stc/STC-Bold.woff2
Needs: pip install fonttools brotli
"""
import sys

from fontTools.feaLib.builder import addOpenTypeFeaturesFromString
from fontTools.ttLib import TTFont, newTable
from fontTools.ttLib.tables import otTables as ot

MARK_CODEPOINTS = list(range(0x064B, 0x0656)) + [0x0670]
# Precomposed shadda+haraka glyphs produced by the font's own 'liga' lookup
MARK_LIGATURES = ['uniFC5E', 'uniFC5F', 'uniFC60', 'uniFC61', 'uniFC62', 'shaddahfathatan', 'shaddahcomp']

# Vertical placement, font units (UPM 1000). Marks are drawn at their designed height
# over short letters (x-height ~390); over taller glyphs they are lifted to keep a gap.
TOP_LINE, BOTTOM_LINE, CLEARANCE = 560, -222, 90


def bbox(glyf, name):
    g = glyf[name]
    if g.numberOfContours == 0:
        return None
    g.recalcBounds(glyf)
    return g.xMin, g.yMin, g.xMax, g.yMax


def patch(path):
    font = TTFont(path)
    gpos = font['GPOS'].table
    if any(fr.FeatureTag == 'mark' for fr in gpos.FeatureList.FeatureRecord):
        print(f'{path}: already patched, skipped')
        return

    cmap, glyf = font.getBestCmap(), font['glyf']
    order = set(font.getGlyphOrder())
    marks = [cmap[c] for c in MARK_CODEPOINTS if c in cmap] + [n for n in MARK_LIGATURES if n in order]
    mark_set = set(marks)

    top, bottom = [], []
    for name in marks:
        b = bbox(glyf, name)
        if b is None:
            continue
        (top if b[1] >= 0 else bottom).append((name, b))

    bases = []
    for name in font.getGlyphOrder():
        if name in mark_set:
            continue
        b = bbox(glyf, name)
        if b is not None:
            bases.append((name, b))

    def cx(b):
        return round((b[0] + b[2]) / 2)

    fea = []
    for name, b in top:
        fea.append(f'markClass {name} <anchor {cx(b)} {b[1]}> @TOP;')
    for name, b in bottom:
        fea.append(f'markClass {name} <anchor {cx(b)} {b[3]}> @BOTTOM;')
    fea.append('lookup MarkPos {')
    for name, b in bases:
        y_top = max(TOP_LINE, b[3] + CLEARANCE)
        y_bottom = min(BOTTOM_LINE, b[1] - CLEARANCE)
        fea.append(f'  pos base {name} <anchor {cx(b)} {y_top}> mark @TOP <anchor {cx(b)} {y_bottom}> mark @BOTTOM;')
    fea.append('} MarkPos;')
    fea.append('feature mark { lookup MarkPos; } mark;')

    # Compile the lookup into a scratch copy, then graft it onto the real GPOS
    # (feaLib would otherwise replace the whole table and drop the kerning).
    scratch = TTFont(path)
    del scratch['GPOS']
    addOpenTypeFeaturesFromString(scratch, '\n'.join(fea), tables=['GPOS'])
    new_lookups = scratch['GPOS'].table.LookupList.Lookup

    first = len(gpos.LookupList.Lookup)
    gpos.LookupList.Lookup.extend(new_lookups)
    gpos.LookupList.LookupCount = len(gpos.LookupList.Lookup)

    rec = ot.FeatureRecord()
    rec.FeatureTag = 'mark'
    rec.Feature = ot.Feature()
    rec.Feature.FeatureParams = None
    rec.Feature.LookupListIndex = list(range(first, first + len(new_lookups)))
    rec.Feature.LookupCount = len(new_lookups)
    gpos.FeatureList.FeatureRecord.append(rec)
    gpos.FeatureList.FeatureCount = len(gpos.FeatureList.FeatureRecord)
    feature_index = gpos.FeatureList.FeatureCount - 1

    for sr in gpos.ScriptList.ScriptRecord:
        langsyses = [sr.Script.DefaultLangSys] + [l.LangSys for l in sr.Script.LangSysRecord]
        for ls in filter(None, langsyses):
            ls.FeatureIndex.append(feature_index)
            ls.FeatureCount = len(ls.FeatureIndex)

    # GDEF: 1 = base, 3 = mark. HarfBuzz zeroes mark advances by this class.
    gdef = font['GDEF'] if 'GDEF' in font else newTable('GDEF')
    if not hasattr(gdef, 'table'):
        gdef.table = ot.GDEF()
        gdef.table.Version = 0x00010000
    if gdef.table.GlyphClassDef is None:
        gdef.table.GlyphClassDef = ot.GlyphClassDef()
    classes = {name: 1 for name, _ in bases}
    classes.update({name: 3 for name in marks})
    gdef.table.GlyphClassDef.classDefs = classes
    font['GDEF'] = gdef

    hmtx = font['hmtx']
    for name in marks:
        hmtx[name] = (0, hmtx[name][1])

    font.save(path)
    print(f'{path}: {len(top)} top + {len(bottom)} bottom marks over {len(bases)} bases')


if __name__ == '__main__':
    for p in sys.argv[1:]:
        patch(p)
