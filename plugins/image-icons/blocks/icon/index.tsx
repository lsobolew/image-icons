/**
 * Image Icons.
 *
 * The block renders an empty element whose shape comes from a CSS mask and whose colour comes from
 * `currentColor`. Any image works - PNG, SVG, WebP - and none of its own colours survive, which is
 * the point: one file, any colour, and it follows the text it sits in.
 */
import { registerBlock } from '../shared/register';
import metadata from './block.json';

import Edit from './edit';
import save from './save';
import './button-extension';
import './inline-format';
import './editor.scss';

registerBlock( metadata.name, {
	edit: Edit,
	save,
} );
