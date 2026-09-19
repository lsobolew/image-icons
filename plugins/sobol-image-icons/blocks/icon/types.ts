export interface IconAttributes {
	/** Source image. Any format the site accepts and a browser can mask with. */
	url: string;
	/** Attachment id, kept so the media library can reopen the right item. */
	mediaId: number;
	/** Accessible name. Empty means the icon is decorative and is hidden from assistive tech. */
	label: string;
	/** Any CSS length. `1em` makes the icon scale with the surrounding text. */
	size: string;
	/** The image's own proportions as a CSS ratio, "800/1028". Empty when unknown. */
	ratio: string;
	/** Horizontal placement within the block: '', 'left', 'center' or 'right'. */
	align: string;
	/** Draw the file as itself rather than as a mask. */
	original: boolean;
	/** Theme palette slug for the icon colour. */
	presetColor: string;
	/** A literal colour, used when no palette entry was chosen. */
	customColor: string;
	/** Optional link. */
	href: string;
	linkTarget: string;
	rel: string;
}

export interface IconEditProps {
	attributes: IconAttributes;
	setAttributes: ( next: Partial< IconAttributes > ) => void;
}

export interface IconSaveProps {
	attributes: IconAttributes;
}
