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
