/**
 * End-to-end tests for the Masked Icon block and the core Button extension.
 *
 * The assertions deliberately go past "the element is there" and read the computed style, because
 * the whole plugin is a bet that a CSS mask driven by custom properties survives all the way from
 * the editor to the browser. Checking a class name would pass even if the mask never applied.
 */
import { test, expect } from '@wordpress/e2e-test-utils-playwright';
import type { Page } from '@playwright/test';

const THEME = process.env.WPLAB_THEME || 'unknown';

// A 1x1 transparent PNG is enough: the browser only needs something it can load as a mask.
const PIXEL =
	'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

// Twice as wide as it is tall, so anything that forces the icon into a square shows up as a
// measurement rather than as something only a human would notice.
const WIDE_PIXEL =
	'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAABCAYAAAD0In+KAAAADklEQVR4nGP4z8DwH4QBEfcD/ePF9e8AAAAASUVORK5CYII=';

/**
 * Console noise that belongs to WordPress rather than to this plugin.
 *
 * The assertion below is strict on purpose - a block that throws in the editor still looks fine in
 * a screenshot - but it has to be curated, because older releases log their own warnings. The
 * createRoot one comes from WordPress 6.6's editor bundle and says nothing about this plugin.
 */
const IGNORED_CONSOLE = [
	/is deprecated since version/i,
	/Failed to load resource/i,
	/favicon/i,
	/importing createRoot from "react-dom"/i,
];

function watchConsole( page: Page ): string[] {
	const errors: string[] = [];

	page.on( 'console', ( message ) => {
		if ( message.type() !== 'error' ) return;

		const text = message.text();

		if ( IGNORED_CONSOLE.some( ( pattern ) => pattern.test( text ) ) ) return;

		errors.push( text );
	} );

	page.on( 'pageerror', ( error ) => errors.push( `uncaught: ${ error.message }` ) );

	return errors;
}

test.describe( `Masked Icon (${ THEME })`, () => {
	test( 'renders as a mask that takes the text colour', async ( { admin, editor, page } ) => {
		const errors = watchConsole( page );

		await admin.createNewPost();
		await editor.insertBlock( {
			name: 'masked-icon/icon',
			attributes: { url: PIXEL, size: '2em', label: 'Next' },
		} );

		await expect(
			editor.canvas.locator( '[data-type="masked-icon/icon"]' )
		).toBeVisible();

		const postId = await editor.publishPost();

		await page.goto( `/?p=${ postId }` );

		const icon = page.locator( '.wp-block-masked-icon-icon__mark' );

		await expect( icon ).toBeVisible();
		await expect( icon ).toHaveAttribute( 'aria-label', 'Next' );

		// The stylesheet has to turn the custom property into a real mask, and the icon has to be
		// painted with the inherited text colour rather than the image's own colours.
		const computed = await icon.evaluate( ( element ) => {
			const style = window.getComputedStyle( element );

			return {
				mask: style.maskImage || style.webkitMaskImage,
				background: style.backgroundColor,
				colour: style.color,
				width: style.width,
			};
		} );

		expect( computed.mask ).toContain( 'url(' );
		expect( computed.mask ).not.toBe( 'none' );
		expect( computed.background ).toBe( computed.colour );
		expect( computed.width ).not.toBe( '0px' );

		expect( errors, `console errors on ${ THEME }` ).toEqual( [] );
	} );

	test( 'a decorative icon is hidden from assistive technology', async ( {
		admin,
		editor,
		page,
	} ) => {
		await admin.createNewPost();
		await editor.insertBlock( {
			name: 'masked-icon/icon',
			attributes: { url: PIXEL },
		} );

		const postId = await editor.publishPost();

		await page.goto( `/?p=${ postId }` );

		const icon = page.locator( '.wp-block-masked-icon-icon__mark' );

		await expect( icon ).toHaveAttribute( 'aria-hidden', 'true' );
		await expect( icon ).not.toHaveAttribute( 'role', 'img' );
	} );

	test( 'adds an icon to a native Button without replacing it', async ( {
		admin,
		editor,
		page,
	} ) => {
		const errors = watchConsole( page );

		await admin.createNewPost();
		await editor.insertBlock( {
			name: 'core/buttons',
			innerBlocks: [
				{
					name: 'core/button',
					attributes: {
						text: 'Learn more',
						maskedIconUrl: PIXEL,
						maskedIconPosition: 'after',
						maskedIconAnimate: true,
					},
				},
			],
		} );

		const postId = await editor.publishPost();

		await page.goto( `/?p=${ postId }` );

		// Scoped to the post: a block theme may well render buttons in its header or footer.
		const button = page.locator( '.entry-content .wp-block-button, main .wp-block-button' ).first();

		await expect( button ).toHaveClass( /has-masked-icon/ );
		await expect( button ).toHaveClass( /is-icon-after/ );
		await expect(
			page.locator( 'a.wp-block-button__link' ).filter( { hasText: 'Learn more' } )
		).toBeVisible();

		// The icon is a pseudo-element, so the proof is in its computed style.
		const pseudo = await page
			.locator( 'a.wp-block-button__link' )
			.filter( { hasText: 'Learn more' } )
			.evaluate( ( element ) => {
				const style = window.getComputedStyle( element, '::after' );

				return {
					mask: style.maskImage || style.webkitMaskImage,
					background: style.backgroundColor,
					width: style.width,
				};
			} );

		expect( pseudo.mask ).toContain( 'url(' );
		expect( pseudo.width ).not.toBe( '0px' );
		expect( pseudo.background ).not.toBe( 'rgba(0, 0, 0, 0)' );

		expect( errors, `console errors on ${ THEME }` ).toEqual( [] );
	} );

	test( 'an inline icon inherits the colour of the text around it', async ( {
		admin,
		editor,
		page,
	} ) => {
		const errors = watchConsole( page );

		// What the rich-text format stores: a void element inside someone else's paragraph.
		const inline =
			`Read more <img class="wp-block-masked-icon-icon__inline" src="${ PIXEL }" ` +
			`alt="" style="--masked-icon-image:url(${ PIXEL })">`;

		await admin.createNewPost();
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: inline, style: { color: { text: '#d00000' } } },
		} );

		const postId = await editor.publishPost();

		await page.goto( `/?p=${ postId }` );

		const icon = page.locator( '.wp-block-masked-icon-icon__inline' );

		await expect( icon ).toBeVisible();

		// The point of the whole plugin: the icon takes the colour of the text it sits in, without
		// anybody setting a colour on the icon itself.
		const computed = await icon.evaluate( ( element ) => {
			const style = window.getComputedStyle( element );
			const parent = window.getComputedStyle(
				element.parentElement as HTMLElement
			);

			return {
				mask: style.maskImage || style.webkitMaskImage,
				background: style.backgroundColor,
				parentColour: parent.color,
				display: style.display,
			};
		} );

		expect( computed.mask ).toContain( 'url(' );
		expect( computed.background ).toBe( computed.parentColour );
		expect( computed.background ).toBe( 'rgb(208, 0, 0)' );
		expect( computed.display ).toBe( 'inline-block' );

		expect( errors, `console errors on ${ THEME }` ).toEqual( [] );
	} );

	test( 'the inline format serialises to a closed element, not one that swallows the text', async ( {
		admin,
		page,
	} ) => {
		// The regression this guards against: rich-text writes an `object: true` format as a start
		// tag with no closing tag, so a non-void tagName leaves everything after the icon parsed
		// as its children - the rest of the sentence ends up inside the icon and moves with it.
		//
		// Asserting on hand-written markup cannot catch that, because the bug is in what the
		// format produces. So this drives the registered format through the editor's own
		// @wordpress/rich-text and reads back what it would store.
		await admin.createNewPost();

		const result = await page.evaluate( ( pixel ) => {
			const richText = ( window as any ).wp.richText;

			let value = richText.create( { html: 'Read more ' } );
			value = { ...value, start: value.text.length, end: value.text.length };

			value = richText.insertObject( value, {
				type: 'masked-icon/inline',
				attributes: {
					src: pixel,
					style: `--masked-icon-image:url(${ pixel })`,
					alt: '',
				},
			} );

			value = richText.insert( value, richText.create( { html: ' and then some' } ) );

			const html = richText.toHTMLString( { value } );
			const holder = document.createElement( 'div' );
			holder.innerHTML = html;

			const icon = holder.querySelector( '.wp-block-masked-icon-icon__inline' );

			return {
				html,
				tagName: icon?.tagName ?? null,
				// An element that swallowed the sentence reports it here; a void one reports ''.
				insideTheIcon: icon?.textContent ?? null,
				text: holder.textContent,
			};
		}, PIXEL );

		expect( result.tagName, result.html ).toBe( 'IMG' );
		expect( result.insideTheIcon, result.html ).toBe( '' );
		expect( result.text ).toBe( 'Read more  and then some' );
	} );

	test( 'selecting an inline icon activates its toolbar button and opens its settings', async ( {
		admin,
		editor,
		page,
	} ) => {
		// The behaviour the native highlight format has and this one was missing: with the caret on
		// an icon the toolbar recognises it, so the button edits that icon instead of inserting
		// another one. It comes from isObjectActive, which the editor only passes to a format that
		// asks for it.
		const inline =
			`Read more <img class="wp-block-masked-icon-icon__inline" src="${ PIXEL }" ` +
			`alt="" style="--masked-icon-image:url(${ PIXEL })">`;

		await admin.createNewPost();
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: inline },
		} );

		// The object has to be selected, not merely next to the caret: getActiveObject wants
		// start + 1 === end. The icon is the last thing in the paragraph, so End then Shift+Left
		// selects exactly it - and unlike clicking the image, that does not fight the
		// contenteditable parent for the pointer event.
		await editor.canvas
			.getByRole( 'document', { name: 'Block: Paragraph' } )
			.click();
		await page.keyboard.press( 'End' );
		await page.keyboard.press( 'Shift+ArrowLeft' );

		await page.getByRole( 'button', { name: 'More', exact: true } ).click();

		const item = page.getByRole( 'menuitem', { name: 'Masked icon' } );

		await expect( item ).toBeVisible();
		// Inside the overflow menu core renders isActive as a class rather than aria-pressed - the
		// same signal its own formats get there, so this is what "the toolbar noticed" looks like.
		await expect( item ).toHaveClass( /is-active/ );

		await item.click();

		// The settings open on the icon rather than the media library.
		await expect(
			page.getByRole( 'textbox', { name: 'Alternative text' } )
		).toBeVisible();
		await expect( page.getByRole( 'button', { name: 'Replace image' } ) ).toBeVisible();
	} );

	test( 'the settings popover stays open while the settings are being edited', async ( {
		admin,
		editor,
		page,
	} ) => {
		// It used to close on every keystroke, because it was rendered only while the object was
		// selected and read its values straight out of the selection - and writing to the document
		// momentarily takes the selection off the object.
		const inline =
			`Read more <img class="wp-block-masked-icon-icon__inline" src="${ PIXEL }" ` +
			`alt="" style="--masked-icon-image:url(${ PIXEL })">`;

		await admin.createNewPost();
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: inline },
		} );

		await editor.canvas.getByRole( 'document', { name: 'Block: Paragraph' } ).click();
		await page.keyboard.press( 'End' );
		await page.keyboard.press( 'Shift+ArrowLeft' );

		await page.getByRole( 'button', { name: 'More', exact: true } ).click();
		await page.getByRole( 'menuitem', { name: 'Masked icon' } ).click();

		const alt = page.getByRole( 'textbox', { name: 'Alternative text' } );
		const size = page.getByRole( 'spinbutton', { name: 'Size' } );

		await expect( alt ).toBeVisible();

		await alt.fill( 'Next page' );
		await expect( alt ).toBeVisible();

		// Clearing the size field is the case that closed it most reliably.
		await size.fill( '' );
		await expect( alt ).toBeVisible();

		await size.fill( '2' );
		await expect( alt ).toBeVisible();

		// And the edits reached the document, in a form CSS can actually use: a bare "2" is not a
		// length, so the unit has to survive the field being emptied.
		const content = await editor.getEditedPostContent();

		expect( content ).toContain( 'alt="Next page"' );
		expect( content ).toMatch( /--masked-icon-size:2[a-z%]+/ );
	} );

	test( 'inserting an inline icon opens its settings straight away', async ( {
		admin,
		editor,
		page,
	} ) => {
		await admin.createNewPost();
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Read more ' },
		} );

		await editor.canvas.getByRole( 'document', { name: 'Block: Paragraph' } ).click();
		await page.keyboard.press( 'End' );

		await page.getByRole( 'button', { name: 'More', exact: true } ).click();
		await page.getByRole( 'menuitem', { name: 'Masked icon' } ).click();

		// The media library opens first; picking an image is the start of placing an icon.
		const media = page.getByRole( 'dialog' );

		await expect( media ).toBeVisible();
	} );

	test( 'an inline icon can be aligned against the text', async ( { admin, editor, page } ) => {
		// text-top and text-bottom put the icon's edges on the text's, which is a measurable
		// difference as soon as the icon is taller than the line.
		const icon = ( align: string ) =>
			`<img class="wp-block-masked-icon-icon__inline" src="${ PIXEL }" alt="" ` +
			`style="--masked-icon-image:url(${ PIXEL });--masked-icon-size:2em` +
			`${ align ? `;--masked-icon-align:${ align }` : '' }">`;

		await admin.createNewPost();
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: `Top ${ icon( 'text-top' ) }` },
		} );
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: `Bottom ${ icon( 'text-bottom' ) }` },
		} );
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: `Middle ${ icon( '' ) }` },
		} );

		const postId = await editor.publishPost();

		await page.goto( `/?p=${ postId }` );

		// Measured against the text, not the paragraph: the icon is twice the text's size, so it is
		// what defines the line box and every alignment would report the same offset from the top
		// of the paragraph. What actually differs is where the icon sits relative to the words.
		const offsets = await page
			.locator( '.wp-block-masked-icon-icon__inline' )
			.evaluateAll( ( icons ) =>
				icons.map( ( element ) => {
					const box = element.getBoundingClientRect();
					const range = document.createRange();

					range.selectNode( element.previousSibling as Node );

					const text = range.getBoundingClientRect();

					// Positive means the icon's centre sits below the text's centre.
					return (
						( box.top + box.bottom ) / 2 - ( text.top + text.bottom ) / 2
					);
				} )
			);

		expect( offsets ).toHaveLength( 3 );

		const [ textTop, textBottom, middle ] = offsets;

		// Anchoring the icon's top to the text's top pushes its bulk downwards; anchoring its
		// bottom pulls it up. Middle lands between the two.
		expect( textBottom ).toBeLessThan( middle );
		expect( middle ).toBeLessThan( textTop );
	} );

	test( 'the inline settings survive a round trip through the editor', async ( {
		admin,
		editor,
		page,
	} ) => {
		// Everything an inline icon carries is encoded into a style attribute and a class list, so
		// the thing that can quietly break is the parsing: settings that write correctly but read
		// back wrong turn into settings that reset themselves the second time somebody edits.
		await admin.createNewPost();
		await editor.insertBlock( { name: 'core/paragraph', attributes: { content: 'Read more' } } );

		const roundTrip = await page.evaluate( ( pixel ) => {
			const richText = ( window as any ).wp.richText;

			let value = richText.create( { html: 'Read more ' } );
			value = { ...value, start: value.text.length, end: value.text.length };

			const written = {
				src: pixel,
				alt: 'Next page',
				style: `--masked-icon-image:url(${ pixel });--masked-icon-size:1.5em;color:#d00000`,
				className: 'has-text-color',
			};

			value = richText.insertObject( value, {
				type: 'masked-icon/inline',
				attributes: written,
			} );

			// Serialise the way the editor saves, then parse it the way it loads.
			const html = richText.toHTMLString( { value } );
			const reloaded = richText.create( { html } );
			const object = reloaded.replacements.find( Boolean );

			return { html, written, read: object ? object.attributes : null };
		}, PIXEL );

		expect( roundTrip.read, roundTrip.html ).not.toBeNull();
		// The format's own class is stripped on parse and re-added on serialise, so what comes back
		// is our own classes only.
		expect( roundTrip.read.className ).toBe( 'has-text-color' );
		expect( roundTrip.read.alt ).toBe( 'Next page' );
		expect( roundTrip.read.style ).toContain( '--masked-icon-size:1.5em' );
		expect( roundTrip.read.style ).toContain( 'color:#d00000' );
		expect( roundTrip.html ).toContain( 'wp-block-masked-icon-icon__inline' );
	} );

	test( 'an inline icon takes a chosen colour and its own size', async ( {
		admin,
		editor,
		page,
	} ) => {
		// The paragraph is one colour and the icon another, which is the whole point of letting an
		// icon carry a colour: without one it follows the text, with one it does not.
		const inline =
			`Read more <img class="wp-block-masked-icon-icon__inline has-text-color" ` +
			`src="${ PIXEL }" alt="Next" ` +
			`style="--masked-icon-image:url(${ PIXEL });--masked-icon-size:2em;color:#0000d0">`;

		await admin.createNewPost();
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: inline, style: { color: { text: '#d00000' } } },
		} );

		const postId = await editor.publishPost();

		await page.goto( `/?p=${ postId }` );

		const icon = page.locator( '.wp-block-masked-icon-icon__inline' );

		const computed = await icon.evaluate( ( element ) => {
			const style = window.getComputedStyle( element );
			const parent = window.getComputedStyle( element.parentElement as HTMLElement );

			return {
				background: style.backgroundColor,
				parentColour: parent.color,
				height: parseFloat( style.height ),
				fontSize: parseFloat( parent.fontSize ),
				alt: element.getAttribute( 'alt' ),
			};
		} );

		// currentColor now resolves to the icon's own colour, not the paragraph's.
		expect( computed.background ).toBe( 'rgb(0, 0, 208)' );
		expect( computed.parentColour ).toBe( 'rgb(208, 0, 0)' );
		expect( computed.height ).toBeCloseTo( computed.fontSize * 2, 0 );
		expect( computed.alt ).toBe( 'Next' );
	} );

	test( 'an inline icon keeping its own colours drops the mask', async ( {
		admin,
		editor,
		page,
	} ) => {
		const inline =
			`Logo <img class="wp-block-masked-icon-icon__inline is-original" src="${ WIDE_PIXEL }" ` +
			`alt="Our logo" style="--masked-icon-image:url(${ WIDE_PIXEL })">`;

		await admin.createNewPost();
		await editor.insertBlock( { name: 'core/paragraph', attributes: { content: inline } } );

		const postId = await editor.publishPost();

		await page.goto( `/?p=${ postId }` );

		const computed = await page
			.locator( '.wp-block-masked-icon-icon__inline' )
			.evaluate( ( element ) => {
				const style = window.getComputedStyle( element );
				const box = element.getBoundingClientRect();

				return {
					mask: style.maskImage || style.webkitMaskImage,
					background: style.backgroundColor,
					objectPosition: style.objectPosition,
					ratio: box.width / box.height,
				};
			} );

		expect( computed.mask ).toBe( 'none' );
		expect( computed.background ).toBe( 'rgba(0, 0, 0, 0)' );
		// The image is shown rather than pushed out of view...
		expect( computed.objectPosition ).toBe( '50% 50%' );
		// ...and the box is still the shape of the file.
		expect( computed.ratio ).toBeCloseTo( 2, 1 );
	} );

	test( 'an inline icon keeps the proportions of the image it masks', async ( {
		admin,
		editor,
		page,
	} ) => {
		// The icon carries the mask as its own src precisely so the browser can size it from the
		// file. A box built out of padding would be square and letterbox everything else.
		const inline =
			`Wide <img class="wp-block-masked-icon-icon__inline" src="${ WIDE_PIXEL }" ` +
			`alt="" style="--masked-icon-image:url(${ WIDE_PIXEL })">`;

		await admin.createNewPost();
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: inline },
		} );

		const postId = await editor.publishPost();

		await page.goto( `/?p=${ postId }` );

		const box = await page
			.locator( '.wp-block-masked-icon-icon__inline' )
			.evaluate( ( element ) => {
				const rect = element.getBoundingClientRect();

				return { width: rect.width, height: rect.height };
			} );

		expect( box.height ).toBeGreaterThan( 0 );
		// 2:1 source, so the box is twice as wide as it is tall - within a pixel of rounding.
		expect( box.width / box.height ).toBeCloseTo( 2, 1 );
	} );

	test( 'a button icon keeps the proportions of the image, and stays square without them', async ( {
		admin,
		editor,
		page,
	} ) => {
		// The button icon is a pseudo-element, so it cannot measure an image of its own the way the
		// inline one does - the proportions have to be carried by a custom property. The second
		// button here has none, which is what every button saved before this existed looks like.
		await admin.createNewPost();
		await editor.insertBlock( {
			name: 'core/buttons',
			innerBlocks: [
				{
					name: 'core/button',
					attributes: {
						text: 'Wide',
						maskedIconUrl: WIDE_PIXEL,
						maskedIconRatio: '2/1',
					},
				},
				{
					name: 'core/button',
					attributes: { text: 'Unmeasured', maskedIconUrl: WIDE_PIXEL },
				},
			],
		} );

		const postId = await editor.publishPost();

		await page.goto( `/?p=${ postId }` );

		const boxes = await page
			.locator( '.wp-block-button.has-masked-icon .wp-block-button__link' )
			.evaluateAll( ( links ) =>
				links.map( ( link ) => {
					const style = window.getComputedStyle( link, '::after' );

					return {
						width: parseFloat( style.width ),
						height: parseFloat( style.height ),
					};
				} )
			);

		expect( boxes ).toHaveLength( 2 );
		expect( boxes[ 0 ].height ).toBeGreaterThan( 0 );
		expect( boxes[ 0 ].width / boxes[ 0 ].height ).toBeCloseTo( 2, 1 );
		expect( boxes[ 1 ].width / boxes[ 1 ].height ).toBeCloseTo( 1, 1 );
	} );

	test( 'an inline icon inside a button is independent of the button\'s own icon', async ( {
		admin,
		editor,
		page,
	} ) => {
		// Two things went wrong here at once. The button's custom properties inherit, so the inline
		// icon was sized and shaped by the button's icon; and the link was a flex container, which
		// made the label and the inline icon flex items spaced by the icon gap. Both are ways of
		// letting the pseudo-element's settings escape onto content that is not the pseudo-element.
		const inline =
			`Buy <img class="wp-block-masked-icon-icon__inline" src="${ WIDE_PIXEL }" ` +
			`alt="" style="--masked-icon-image:url(${ WIDE_PIXEL })">`;

		await admin.createNewPost();
		await editor.insertBlock( {
			name: 'core/buttons',
			innerBlocks: [
				{
					name: 'core/button',
					attributes: {
						text: inline,
						maskedIconUrl: PIXEL,
						maskedIconSize: '3em',
						maskedIconGap: '3em',
						maskedIconRatio: '1/1',
					},
				},
			],
		} );

		const postId = await editor.publishPost();

		await page.goto( `/?p=${ postId }` );

		const measured = await page
			.locator( '.wp-block-button.has-masked-icon .wp-block-button__link' )
			.evaluate( ( link ) => {
				const icon = link.querySelector(
					'.wp-block-masked-icon-icon__inline'
				) as HTMLElement;
				const box = icon.getBoundingClientRect();
				const after = window.getComputedStyle( link, '::after' );

				return {
					display: window.getComputedStyle( link ).display,
					inlineWidth: box.width,
					inlineHeight: box.height,
					buttonIconHeight: parseFloat( after.height ),
				};
			} );

		// The button's icon is 3em; the inline one keeps its own 1em default.
		expect( measured.buttonIconHeight ).toBeCloseTo( measured.inlineHeight * 3, 0 );
		// ...and its own 2:1 proportions, not the button icon's 1:1.
		expect( measured.inlineWidth / measured.inlineHeight ).toBeCloseTo( 2, 1 );
		// The label and anything inline in it stay text, not flex items spaced by the icon gap.
		expect( measured.display ).not.toContain( 'flex' );
	} );

	test( 'the label stays vertically centred against an icon taller than itself', async ( {
		admin,
		editor,
		page,
	} ) => {
		// This used to come free with the flex container that laid the icon out. The icon is in the
		// normal text flow now, so it is vertical-align that has to hold the label in the middle -
		// and only shows it is not when the icon is much taller than the text.
		await admin.createNewPost();
		await editor.insertBlock( {
			name: 'core/buttons',
			innerBlocks: [
				{
					name: 'core/button',
					attributes: {
						text: 'Tall',
						maskedIconUrl: PIXEL,
						maskedIconSize: '3em',
					},
				},
			],
		} );

		const postId = await editor.publishPost();

		await page.goto( `/?p=${ postId }` );

		const offset = await page
			.locator( '.wp-block-button.has-masked-icon .wp-block-button__link' )
			.evaluate( ( link ) => {
				const range = document.createRange();
				range.selectNodeContents( link.firstChild as Node );

				const text = range.getBoundingClientRect();
				const box = link.getBoundingClientRect();
				const style = window.getComputedStyle( link );
				const top = box.top + parseFloat( style.paddingTop );
				const bottom = box.bottom - parseFloat( style.paddingBottom );

				return Math.abs( ( text.top + text.bottom ) / 2 - ( top + bottom ) / 2 );
			} );

		// Not zero: vertical-align centres on the middle of the x-height rather than of the glyph
		// box, which is a couple of pixels at a normal font size and is what the eye reads as
		// centred anyway. A label sitting on the baseline under a 3em icon would be off by ~18px.
		expect( offset ).toBeLessThan( 4 );
	} );

	test( 'keeping the original colours drops the mask but nothing else', async ( {
		admin,
		editor,
		page,
	} ) => {
		await admin.createNewPost();
		await editor.insertBlock( {
			name: 'core/buttons',
			innerBlocks: [
				{
					name: 'core/button',
					attributes: {
						text: 'Branded',
						maskedIconUrl: WIDE_PIXEL,
						maskedIconSize: '2em',
						maskedIconRatio: '2/1',
						maskedIconOriginal: true,
						maskedIconAnimation: 'rotate',
					},
				},
			],
		} );

		const postId = await editor.publishPost();

		await page.goto( `/?p=${ postId }` );

		const link = page.locator( '.wp-block-button.has-masked-icon .wp-block-button__link' );

		const icon = await link.evaluate( ( element ) => {
			const style = window.getComputedStyle( element, '::after' );

			return {
				mask: style.maskImage || style.webkitMaskImage,
				background: style.backgroundColor,
				backgroundImage: style.backgroundImage,
				width: parseFloat( style.width ),
				height: parseFloat( style.height ),
				// em is relative to the button's font size, whatever the theme made it.
				fontSize: parseFloat( window.getComputedStyle( element ).fontSize ),
			};
		} );

		// The tint is gone: no mask, no currentColor behind it, the file drawn as itself.
		expect( icon.mask ).toBe( 'none' );
		expect( icon.background ).toBe( 'rgba(0, 0, 0, 0)' );
		expect( icon.backgroundImage ).toContain( 'url(' );

		// Everything else still applies - the size, the proportions...
		expect( icon.height ).toBeCloseTo( icon.fontSize * 2, 0 );
		expect( icon.width / icon.height ).toBeCloseTo( 2, 1 );

		// ...and the animation.
		await link.hover();
		await expect
			.poll(
				() =>
					link.evaluate(
						( element ) => window.getComputedStyle( element, '::after' ).transform
					),
				{ message: 'an icon keeping its own colours stopped animating' }
			)
			.toMatch( /^matrix\(/ );
	} );

	test( 'idle and hover animations are independent, and each carries its own timing', async ( {
		admin,
		editor,
		page,
	} ) => {
		// Core's own block states (7.1) are real and per-block, but they compile through the style
		// engine, which drops anything that is not colour, typography, spacing, border or shadow -
		// so an animation cannot ride along. These two slots are ours; this checks they do not
		// collide with each other.
		await admin.createNewPost();
		await editor.insertBlock( {
			name: 'core/buttons',
			innerBlocks: [
				{
					name: 'core/button',
					attributes: {
						text: 'Notice me',
						maskedIconUrl: PIXEL,
						maskedIconIdle: 'wiggle',
						maskedIconIdleInterval: 4,
						maskedIconAnimation: 'spin',
						maskedIconDuration: 0.3,
					},
				},
			],
		} );

		const content = await editor.getEditedPostContent();

		expect( content ).toContain( 'is-icon-idle-wiggle' );
		expect( content ).toContain( 'is-icon-anim-spin' );
		expect( content ).toContain( '--masked-icon-idle-interval:4s' );
		expect( content ).toContain( '--masked-icon-hover-duration:0.3s' );

		const postId = await editor.publishPost();

		await page.goto( `/?p=${ postId }` );

		const link = page.locator( '.wp-block-button.has-masked-icon .wp-block-button__link' );

		const idle = await link.evaluate( ( element ) => {
			const style = window.getComputedStyle( element, '::after' );

			return { name: style.animationName, duration: style.animationDuration };
		} );

		// Idle runs on its own, at the interval that was set.
		expect( idle.name ).toBe( 'masked-icon-wiggle-idle' );
		expect( idle.duration ).toBe( '4s' );

		await link.hover();

		// Hover takes over: a different animation at a different duration.
		await expect
			.poll( () =>
				link.evaluate(
					( element ) => window.getComputedStyle( element, '::after' ).transform
				)
			)
			.toMatch( /^matrix\(/ );

		const hovered = await link.evaluate( ( element ) => {
			const style = window.getComputedStyle( element, '::after' );

			return { transitionDuration: style.transitionDuration };
		} );

		expect( hovered.transitionDuration ).toBe( '0.3s' );
	} );

	test( 'the chosen hover animation reaches the saved markup', async ( { admin, editor } ) => {
		await admin.createNewPost();
		await editor.insertBlock( {
			name: 'core/buttons',
			innerBlocks: [
				{
					name: 'core/button',
					attributes: {
						text: 'Spinner',
						maskedIconUrl: PIXEL,
						maskedIconAnimation: 'spin',
					},
				},
			],
		} );

		const content = await editor.getEditedPostContent();

		expect( content ).toContain( 'is-icon-animated' );
		expect( content ).toContain( 'is-icon-anim-spin' );
	} );

	test( 'the hover animation actually runs on the front end', async ( {
		admin,
		editor,
		page,
	} ) => {
		// The class reaching the markup is only half the story - the stylesheet has to win the
		// cascade against the slide rules above it, which are one class more specific than a naive
		// animation rule would be.
		await admin.createNewPost();
		await editor.insertBlock( {
			name: 'core/buttons',
			innerBlocks: [
				{
					name: 'core/button',
					attributes: {
						text: 'Refresh',
						maskedIconUrl: PIXEL,
						maskedIconAnimation: 'rotate',
					},
				},
			],
		} );

		const postId = await editor.publishPost();

		await page.goto( `/?p=${ postId }` );

		const link = page.locator( '.wp-block-button.has-masked-icon .wp-block-button__link' );

		const idle = await link.evaluate(
			( element ) => window.getComputedStyle( element, '::after' ).transform
		);

		expect( idle ).toBe( 'none' );

		await link.hover();

		// The rotation is a transition, so poll until it has settled rather than guessing a delay.
		await expect
			.poll(
				() =>
					link.evaluate(
						( element ) => window.getComputedStyle( element, '::after' ).transform
					),
				{ message: 'the icon never rotated on hover' }
			)
			.toMatch( /^matrix\(/ );
	} );

	test( 'a button saved with the old slide toggle still produces the markup it was saved with', async ( {
		admin,
		editor,
	} ) => {
		// maskedIconAnimate is what the boolean "Slide on hover" toggle wrote before the animation
		// list replaced it. If the class set changed, every button already in a post would come
		// back as "this block contains unexpected content" the next time somebody opened it.
		await admin.createNewPost();
		await editor.insertBlock( {
			name: 'core/buttons',
			innerBlocks: [
				{
					name: 'core/button',
					attributes: {
						text: 'Legacy',
						maskedIconUrl: PIXEL,
						maskedIconAnimate: true,
					},
				},
			],
		} );

		const content = await editor.getEditedPostContent();

		expect( content ).toContain( 'is-icon-animated' );
		expect( content ).not.toContain( 'is-icon-anim-' );
	} );

	test( 'a button without an icon is left completely alone', async ( {
		admin,
		editor,
		page,
	} ) => {
		await admin.createNewPost();
		await editor.insertBlock( {
			name: 'core/buttons',
			innerBlocks: [ { name: 'core/button', attributes: { text: 'Plain button' } } ],
		} );

		const postId = await editor.publishPost();

		await page.goto( `/?p=${ postId }` );

		const button = page
			.locator( '.entry-content .wp-block-button, main .wp-block-button' )
			.first();

		await expect( button ).toBeVisible();
		await expect( button ).not.toHaveClass( /has-masked-icon/ );
	} );
} );
