/**
 * Reading and writing the attributes of an inline icon.
 *
 * A rich-text object stores its settings as HTML attributes, so everything here is string
 * handling: pull values out of a style attribute and a class list, put them back. Keeping it
 * apart from the React component means the parsing can be reasoned about - and tested - on its
 * own, and it is the parsing that decides whether somebody's icon survives a round trip through
 * the editor.
 */

/** The class WordPress gives an element coloured from a theme palette slug. */
const PRESET_COLOR = /^has-([a-z0-9-]+)-color$/;

export interface IconSettings {
	src: string;
	alt: string;
	/** A palette slug, as stored in the class name. */
	presetColor: string;
	/** A literal CSS colour, used when no palette entry was chosen. */
	customColor: string;
	/** A CSS length, or empty for the 1em default. */
	size: string;
	/** Draw the file as itself rather than masking it. */
	original: boolean;
}

export const EMPTY_SETTINGS: IconSettings = {
	src: '',
	alt: '',
	presetColor: '',
	customColor: '',
	size: '',
	original: false,
};

/**
 * Splits a style attribute into declarations.
 *
 * Deliberately simple: these values are written by the code below and by nobody else, so the only
 * thing that has to be handled is the url() in the mask, whose own semicolons would break a naive
 * split. Anything unrecognised is carried through untouched rather than dropped, so a declaration
 * added by a future version - or by hand - survives being edited here.
 */
function parseStyle( style: string ): Map< string, string > {
	const declarations = new Map< string, string >();
	let depth = 0;
	let current = '';

	const push = () => {
		const index = current.indexOf( ':' );

		if ( index > 0 ) {
			declarations.set( current.slice( 0, index ).trim(), current.slice( index + 1 ).trim() );
		}

		current = '';
	};

	for ( const character of style ) {
		if ( character === '(' ) depth++;
		if ( character === ')' ) depth--;

		if ( character === ';' && depth === 0 ) {
			push();
			continue;
		}

		current += character;
	}

	push();

	return declarations;
}

function serialiseStyle( declarations: Map< string, string > ): string {
	return [ ...declarations ]
		.filter( ( [ , value ] ) => value !== '' )
		.map( ( [ property, value ] ) => `${ property }:${ value }` )
		.join( ';' );
}

/** Reads an icon's settings out of the attributes rich-text stores for it. */
export function readSettings( attributes: Record< string, string > ): IconSettings {
	const declarations = parseStyle( attributes.style || '' );
	const classes = ( attributes.className || '' ).split( /\s+/ ).filter( Boolean );
	const preset = classes
		.map( ( name ) => name.match( PRESET_COLOR ) )
		.find( ( match ): match is RegExpMatchArray => match !== null );

	return {
		src: attributes.src || '',
		alt: attributes.alt || '',
		presetColor: preset?.[ 1 ] || '',
		customColor: declarations.get( 'color' ) || '',
		size: declarations.get( '--masked-icon-size' ) || '',
		original: classes.includes( 'is-original' ),
	};
}

/**
 * Turns settings back into attributes.
 *
 * The mask travels as a custom property and the colour as either a palette class or a plain
 * `color` declaration - the same two mechanisms core uses for text colour, which is why both
 * survive KSES for a user without unfiltered_html. An integration test measures that rather than
 * trusting it.
 */
export function writeSettings(
	settings: IconSettings,
	previous: Record< string, string > = {}
): Record< string, string > {
	const declarations = parseStyle( previous.style || '' );

	declarations.set( '--masked-icon-image', `url(${ encodeURI( settings.src ) })` );
	declarations.set( '--masked-icon-size', settings.size );
	// A palette colour is a class, so the literal declaration has to go when one is picked.
	declarations.set( 'color', settings.presetColor ? '' : settings.customColor );

	const classes = ( previous.className || '' )
		.split( /\s+/ )
		.filter( ( name ) => name && ! PRESET_COLOR.test( name ) && name !== 'has-text-color' && name !== 'is-original' );

	if ( settings.presetColor ) {
		classes.push( `has-${ settings.presetColor }-color`, 'has-text-color' );
	} else if ( settings.customColor ) {
		classes.push( 'has-text-color' );
	}

	if ( settings.original ) {
		classes.push( 'is-original' );
	}

	const attributes: Record< string, string > = {
		src: encodeURI( settings.src ),
		// An empty alt is meaningful - it is how HTML marks an image as decorative - so it is
		// always written, unlike the attributes below.
		alt: settings.alt,
		style: serialiseStyle( declarations ),
	};

	if ( classes.length ) {
		attributes.className = classes.join( ' ' );
	}

	return attributes;
}
