<?php
/**
 * Module: editor blocks.
 *
 * @package Sobolewski\ImageIcons
 */

declare( strict_types=1 );

namespace Sobolewski\ImageIcons\Modules\Blocks;

use Sobolewski\ImageIcons\Core\Module as ModuleContract;
use Sobolewski\ImageIcons\Core\Plugin;
use Sobolewski\ImageIcons\Core\Settings;
use Sobolewski\ImageIcons\Modules\ContentType\Module as ContentType;

defined( 'ABSPATH' ) || exit;

/**
 * Registers the blocks from build/ (produced by @wordpress/scripts from assets/blocks).
 *
 * The block is dynamic: the HTML is produced in PHP, so changing the markup never invalidates
 * content already saved in posts (no "block validation error" in the editor).
 */
final class Module implements ModuleContract {

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
	 * Registers the blocks from their block.json metadata.
	 */
	public function register_blocks(): void {
		$manifest = SOBOL_IMAGE_ICONS_DIR . 'build/item-list/block.json';

		if ( ! is_readable( $manifest ) ) {
			// A missing build (fresh clone, module disabled) must never take the plugin down.
			return;
		}

		register_block_type(
			dirname( $manifest ),
			array( 'render_callback' => array( $this, 'render_item_list' ) )
		);
	}

	/**
	 * Renders the item list block.
	 *
	 * @param array<string, mixed> $attributes Block attributes.
	 *
	 * @return string
	 */
	public function render_item_list( $attributes ): string {
		$attributes = is_array( $attributes ) ? $attributes : array();
		$limit      = isset( $attributes['limit'] )
			? max( 1, (int) $attributes['limit'] )
			: (int) Settings::get( 'items_per_page', 10 );

		if ( ! post_type_exists( ContentType::POST_TYPE ) ) {
			return '';
		}

		$posts = get_posts(
			array(
				'post_type'      => ContentType::POST_TYPE,
				'post_status'    => 'publish',
				'posts_per_page' => $limit,
			)
		);

		if ( ! $posts ) {
			return sprintf(
				'<p %1$s>%2$s</p>',
				wp_kses_data( get_block_wrapper_attributes() ),
				esc_html__( 'No items to show.', 'sobol-image-icons' )
			);
		}

		$items = '';

		foreach ( $posts as $post ) {
			$items .= sprintf(
				'<li><a href="%1$s">%2$s</a></li>',
				esc_url( (string) get_permalink( $post ) ),
				esc_html( get_the_title( $post ) )
			);
		}

		return sprintf(
			'<ul %1$s>%2$s</ul>',
			wp_kses_data( get_block_wrapper_attributes( array( 'class' => 'sobol-image-icons-item-list' ) ) ),
			$items // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- built from escaped parts above.
		);
	}
}
