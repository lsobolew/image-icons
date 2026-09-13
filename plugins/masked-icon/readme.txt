=== Masked Icon ===
Contributors: lsobolew
Tags: icon, block, svg, mask, button
Requires at least: 6.6
Tested up to: 7.1
Requires PHP: 7.4
Stable tag: 0.1.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Turn any image into a colourable icon that follows your text colour. Works with PNG, SVG and WebP.

== Description ==

Masked Icon renders an image as a CSS mask instead of as a picture. The shape comes from the file,
the colour comes from your text. Change the text colour and the icon changes with it.

That means one arrow file works on a dark button, a light background and a coloured heading,
without exporting three versions of it.

**Any image, not just SVG.** PNG, SVG and WebP all work, because only the shape is used. A plain
black PNG becomes an icon in whatever colour you set.

**Icons inside your text.** Select the toolbar's icon button while writing and drop an icon into a
sentence: "Read more →". It sits on the baseline, scales with the font size and takes the colour of
the text around it, the way a glyph would.

**Sizes with your text.** The default size is `1em`, so the icon scales with the font size around
it.

**Adds an icon to the native Button block.** This plugin does not replace the WordPress Button with
its own. It extends the one you already use, so block styles, colour settings, theme.json styling,
the width controls and link handling all keep working. An optional hover animation nudges the icon
away from the label, and it respects reduced-motion preferences.

**No JavaScript on the front end.** The icon is CSS - a mask, a custom property and `currentColor`.

= Accessibility =

An icon with a label is announced to screen readers. Leave the label empty and the icon is marked
decorative and skipped, which is what you want when it sits next to text that already says the same
thing.

= Works for every editor, not just administrators =

WordPress strips `mask-image` from inline styles for users without the `unfiltered_html`
capability - authors and contributors on a single site, and everyone except the super admin on
multisite. Plugins that write the mask directly into the markup therefore break for exactly those
users, and often only on a client's site.

Masked Icon carries the mask in a CSS custom property, which survives that filtering, and resolves
it in its stylesheet. The plugin's test suite asserts this on every release.

== Installation ==

1. Upload the plugin to `/wp-content/plugins/` or install it from the Plugins screen.
2. Activate it.
3. Add the **Masked Icon** block, put one inside a sentence with the toolbar's icon button, or open
   a Button block and look for the **Icon** panel.

== Frequently Asked Questions ==

= Why does my icon come out all one colour? =

That is the point. The image is used as a mask, so only its shape matters. The colour comes from
the text colour, which you can set with the usual colour controls.

= Can I use a multi-coloured logo? =

Not as a masked icon - it will be flattened to a single colour. Use the Image block for artwork
that needs its own colours.

= Does it work with SVG? =

Yes. WordPress does not allow SVG uploads by default; if you enable them with another plugin, SVG
files work here like any other image.

= Will the icon still show on old browsers? =

CSS masks are supported by every current browser. Very old browsers fall back to no icon rather
than to a broken layout.

== Screenshots ==

1. A Masked Icon block inheriting the text colour.
2. The Icon panel added to the native Button block.

== Changelog ==

= 0.1.0 =
* First release: the Masked Icon block, inline icons inside text, and an icon option for the core
  Button block.

== Upgrade Notice ==

= 0.1.0 =
First release.
