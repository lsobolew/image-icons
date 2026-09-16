# Sources for the directory assets

The finished images live in `.wordpress-org/`, which is the directory `deploy-wporg.yml` uploads -
and it uploads all of it, so only finished images belong there. Anything that *made* those images
belongs here instead.

| | |
|---|---|
| `.wordpress-org/` | published: `banner-*.png`, `icon-*`, `screenshot-N.png` |
| `assets-src/` | not published: scenes, working files, raw recordings |

Screenshot numbering follows the order of the `== Screenshots ==` list in
`plugins/image-icons/readme.txt`. Change one and the other has to change with it, or the captions
describe the wrong pictures.
