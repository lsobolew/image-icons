# Image Icons

Turn any image into a colourable icon that follows your text colour.

The shape comes from the file, the colour comes from `currentColor`. One arrow works on a dark
button, a light background and a coloured heading, without exporting three versions of it.

```
   arrow.png            CSS mask            currentColor
   (any colour)   ──▶   (shape only)   ──▶  (your text colour)
```

## What it does

- **Image Icon block** - pick any image from the media library and it renders as a single-colour
  icon. PNG, WebP, AVIF, GIF and anything else the site accepts, because only the shape is read.
  The editor lists the formats *that* site allows rather than promising ones it would refuse.
- **Inline icons** - a rich-text format, so an icon can sit inside a sentence: "Read more →". It
  inherits the colour and the font size of the text around it. A block could not do this; blocks are
  block-level, which is why this is a format. Select one and its settings open on the icon itself:
  swap the image, resize it, set alternative text, or give it a colour from the theme palette.
- **Icon on the native Button** - the plugin extends `core/button` instead of shipping a rival
  button block, so every native affordance keeps working: block styles, colour supports,
  `theme.json`, width controls, link settings.
- **Two animation slots** - an idle one that plays on its own at an interval you set, and a hover
  one that takes over and also runs on keyboard focus. Pure CSS, and both stop entirely under
  `prefers-reduced-motion`.
- **Sizes with the text** - `1em` by default, so the icon scales like a glyph.
- **No front-end JavaScript** - a mask, a custom property and `currentColor`.

## The design decision worth knowing

WordPress strips `mask-image` from inline styles for every user without the `unfiltered_html`
capability: authors and contributors on a single site, and **everyone except the super admin on
multisite**. Writing the mask into the markup therefore works for the plugin author, who is an
administrator on their own machine, and silently breaks for a client's editor.

Image Icons puts the mask in a CSS custom property, which survives that filtering, and resolves it
in its stylesheet. `plugins/image-icons/tests/Integration/KsesCompatibilityTest.php` asserts it -
including a test that fails if anyone moves a mask declaration back into the markup.

## Where things are

This repository is the plugin plus the environment it is built in.

| Path | |
|---|---|
| `plugins/image-icons/` | **the plugin** - everything that ships |
| `plugins/image-icons/blocks/` | TypeScript sources for the editor script that ships minified in `build/` |
| `tests/e2e/` | Playwright specs, run against several WordPress versions and themes |
| `bin/`, `cli/`, `env/`, `dashboard/` | the development environment, not part of the plugin |

## Development

Built on [WP Plugin Lab](https://github.com/lsobolew/wp-plugin-lab), so the whole environment comes
with the repository. Docker and Node are the only requirements - PHP runs in containers.

```bash
npm install
npm --prefix plugins/image-icons install
./bin/wpx up latest          # WordPress on http://localhost:8191
./bin/wpx dev                # rebuild the block on every change
./bin/wpx test               # unit, integration and end-to-end
./bin/wpx panel              # dashboard on 127.0.0.1:7778
```

Tests run against several WordPress versions, and the end-to-end suite sweeps two block themes and
a classic theme - which matters for a plugin whose whole surface is CSS.

```bash
./bin/wpx test e2e --themes=tt1     # the classic theme only
./bin/wpx build --verify            # release zip, unpacked and activated to prove it works
```

See `docs/` for the environment, and `docs/blocks.md` for how blocks are built here.

## Licence

GPL-2.0-or-later.
