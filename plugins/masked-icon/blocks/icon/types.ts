export interface IconAttributes {
	/** Source image. Any format the browser can use as a mask: PNG, SVG, WebP. */
	url: string;
	/** Attachment id, kept so the media library can reopen the right item. */
	mediaId: number;
	/** Accessible name. Empty means the icon is decorative and is hidden from assistive tech. */
	label: string;
	/** Any CSS length. `1em` makes the icon scale with the surrounding text. */
	size: string;
	/** How the image fits the box. */
	fit: string;
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
