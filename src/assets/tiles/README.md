# Tile images

Drop generated tile photos in this folder. Nothing else to do — they are
discovered at build time and replace the CSS placeholder art automatically.

Run `npm run images:prompts` for the paste-ready generation brief.

## Filename is the label

    <signature, ':' replaced by '-'>-<nn>.<jpg|png|webp>

    crosswalk-none-01.jpg           → crosswalk:none
    crosswalk-dont-02.jpg           → crosswalk:dont            [trap]
    crosswalk-none-occupied-01.jpg  → crosswalk:none:occupied   [trap]
    light-red-03.webp               → light:red
    vehicle-bus-moving-01.jpg       → vehicle:bus:moving
    hydrant-left-04.png             → hydrant:left

The filename is the only thing that tells the game what a picture shows. A
mislabelled file doesn't crash anything — it silently makes a rule wrong, and
tiers I–IV are supposed to be fair. `npm run verify` fails on any filename that
doesn't parse to a known signature, and on an unmatched red/green light count.

Partial packs are fine: any signature with no files keeps its placeholder art, so
you can generate one category at a time.
