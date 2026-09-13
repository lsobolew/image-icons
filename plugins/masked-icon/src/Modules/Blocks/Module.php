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
	}

	/**
	 * Registers all built blocks from their block.json metadata.
	 */
	public function register_blocks(): void {
		foreach ( $this->block_directories() as $directory ) {
			register_block_type( $directory );
		}

		$this->enqueue_button_styles();
	}

	/**
	 * Attaches the icon stylesheet to the core Button block.
	 *
	 * An icon added to a button is a pseudo-element on core/button, so the rules live in this
	 * plugin's stylesheet while the markup belongs to WordPress. Block styles are only loaded when
	 * their own block is on the page, so a page holding a button and no Masked Icon block would
	 * otherwise get the markup without the CSS.
	 *
	 * wp_enqueue_block_style() keeps that conditional: the file loads when a core/button is
	 * rendered, and not otherwise.
	 */
	private function enqueue_button_styles(): void {
		$relative = self::BUILD_DIR . '/icon/style-index.css';
		$path     = MASKED_ICON_DIR . $relative;

		if ( ! is_readable( $path ) ) {
			return;
		}

		wp_enqueue_block_style(
			'core/button',
			array(
				'handle' => 'masked-icon-button',
				'src'    => MASKED_ICON_URL . $relative,
				'path'   => $path,
				'ver'    => (string) filemtime( $path ),
			)
		);
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
