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

		const icon = page.locator( '.wp-block-masked-icon-icon' );

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

		const icon = page.locator( '.wp-block-masked-icon-icon' );

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
