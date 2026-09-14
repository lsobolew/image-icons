<?php
/**
 * Module: editor blocks.
 *
 * @package Sobolewski\MaskedIcon
 */

declare( strict_types=1 );

namespace Sobolewski\MaskedIcon\Modules\Blocks;

use Sobolewski\MaskedIcon\Core\Module as ModuleContract;
use Sobolewski\MaskedIcon\Core\Plugin;

defined( 'ABSPATH' ) || exit;

/**
 * Registers every block found in build/ (produced by Vite from the sources in blocks/).
 *
 * Nothing here names an individual block: adding one means adding a directory with a block.json,
 * not editing PHP. Dynamic blocks bring their own render.php, which WordPress picks up from the
 * metadata, so this module never grows render callbacks either.
 */
final class Module implements ModuleContract {

	/**
	 * Directory holding the built blocks, relative to the plugin root.
	 */
	const BUILD_DIR = 'build';

	/**
	 * Plugin instance.
	 *
	 * @var Plugin
	 */
	private $plugin;

	/**
	 * Constructor.
	 *
	 * @param Plugin $plugin Plugin instance.
	 */
	public function __construct( Plugin $plugin ) {
		$this->plugin = $plugin;
	}

	/**
	 * Module identifier.
	 */
	public function id(): string {
		return 'blocks';
	}

	/**
	 * Module hooks.
	 */
	public function register(): void {
		add_action( 'init', array( $this, 'register_blocks' ) );
		add_action( 'enqueue_block_editor_assets', array( $this, 'pass_mask_formats' ) );
	}

	/**
	 * Tells the editor which image formats this site will actually take.
	 *
	 * The controls used to name a fixed list, which was wrong in both directions: it offered SVG,
	 * which WordPress refuses by default, and it omitted formats a given site does allow. The list
	 * depends on the site's upload settings and on who is looking, so it is computed here and read
	 * by the controls rather than written into them.
	 */
	public function pass_mask_formats(): void {
		$handle = generate_block_asset_handle( 'masked-icon/icon', 'editorScript' );

		if ( ! wp_script_is( $handle, 'registered' ) ) {
			return;
		}

		wp_add_inline_script(
			$handle,
			'window.maskedIconFormats = ' . wp_json_encode( MaskFormats::available() ) . ';',
			'before'
		);
	}

	/**
	 * Registers all built blocks from their block.json metadata.
	 */
	public function register_blocks(): void {
		foreach ( $this->block_directories() as $directory ) {
			register_block_type( $directory );
		}

		$this->enqueue_host_block_styles();
	}

	/**
	 * Core blocks that can end up carrying one of this plugin's icons.
	 *
	 * A button gets one through its own settings; the others through the inline format, which can
	 * be used in any rich text.
	 */
	const HOST_BLOCKS = array(
		'core/button',
		'core/paragraph',
		'core/heading',
		'core/list',
		'core/list-item',
		'core/quote',
		'core/pullquote',
		'core/verse',
		'core/table',
	);

	/**
	 * Attaches the icon stylesheet to the core blocks that can contain an icon.
	 *
	 * An icon on a button is a pseudo-element on core/button, and an inline icon is a span inside
	 * someone else's paragraph. In both cases the markup belongs to WordPress and only the rules
	 * are ours. Block styles load only when their own block is on the page, so a page with a
	 * button - or a paragraph with an inline icon - and no Masked Icon block would get the markup
	 * without the CSS.
	 *
	 * wp_enqueue_block_style() keeps it conditional: the file loads when one of these blocks is
	 * rendered, and not otherwise.
	 */
	private function enqueue_host_block_styles(): void {
		$relative = self::BUILD_DIR . '/icon/style-index.css';
		$path     = MASKED_ICON_DIR . $relative;

		if ( ! is_readable( $path ) ) {
			return;
		}

		foreach ( self::HOST_BLOCKS as $block ) {
			wp_enqueue_block_style(
				$block,
				array(
					'handle' => 'masked-icon-inline',
					'src'    => MASKED_ICON_URL . $relative,
					'path'   => $path,
					'ver'    => (string) filemtime( $path ),
				)
			);
		}
	}

	/**
	 * Directories under build/ that contain a block.json.
	 *
	 * @return string[]
	 */
	public function block_directories(): array {
		$build = MASKED_ICON_DIR . self::BUILD_DIR;

		// A missing build (fresh clone, module removed, `npm run build` never ran) must never take
		// the site down - the plugin simply registers no blocks.
		if ( ! is_dir( $build ) ) {
			return array();
		}

		$found = glob( $build . '/*/block.json' );

		if ( ! is_array( $found ) ) {
			return array();
		}

		return array_map( 'dirname', $found );
	}
}
