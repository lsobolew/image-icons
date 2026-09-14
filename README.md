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
  icon. PNG, SVG and WebP all work, because only the shape is used.
- **Inline icons** - a rich-text format, so an icon can sit inside a sentence: "Read more →". It
  inherits the colour and the font size of the text around it. A block could not do this; blocks are
  block-level, which is why this is a format.
- **Icon on the native Button** - the plugin extends `core/button` instead of shipping a rival
  button block, so every native affordance keeps working: block styles, colour supports,
  `theme.json`, width controls, link settings. Optional hover slide, reduced-motion aware.
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
