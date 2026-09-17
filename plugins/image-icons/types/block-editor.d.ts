/**
 * Members of @wordpress/block-editor that its DefinitelyTyped package has not caught up with.
 *
 * The top-level `export {}` is what makes this file a module, and that is what makes the block
 * below an *augmentation* of the package's own types rather than a replacement of them. Without
 * it TypeScript treats the declaration as the whole module and every other import from
 * @wordpress/block-editor stops resolving - which is exactly what happened on the first attempt.
 *
 * Everything declared here was checked to exist at runtime in both the newest WordPress and the
 * oldest one this plugin supports. The types are the only thing missing, so an `as any` at the
 * call site would hide a real gap if one ever appeared. Delete an entry when DefinitelyTyped
 * grows it.
 */

export {};

declare module '@wordpress/block-editor' {
	import type { ComponentType } from 'react';

	/** Left/centre/right toolbar control. Present since WordPress 5.9. */
	export const AlignmentControl: ComponentType< {
		value?: string;
		onChange: ( next?: string ) => void;
	} >;
}
