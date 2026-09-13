<?php
/**
 * Module: custom post type, taxonomy and post meta.
 *
 * @package Sobolewski\MaskedIcon
 */

declare( strict_types=1 );

namespace Sobolewski\MaskedIcon\Modules\ContentType;

use Sobolewski\MaskedIcon\Core\Module as ModuleContract;
use Sobolewski\MaskedIcon\Core\Plugin;

defined( 'ABSPATH' ) || exit;

/**
 * Registers the "maskedicon_item" post type, its taxonomy and a REST-visible meta field.
 */
final class Module implements ModuleContract {

	/**
	 * Post type name (20 characters max).
	 */
	const POST_TYPE = 'maskedicon_item';

	/**
	 * Taxonomy name.
	 */
	const TAXONOMY = 'maskedicon_item_type';

	/**
	 * Meta key. The leading underscore hides it from the custom fields box.
	 */
	const META_PRIORITY = '_maskedicon_priority';

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
		return 'content-type';
	}

	/**
	 * Module hooks.
	 */
	public function register(): void {
		add_action( 'init', array( $this, 'register_post_type' ) );
		add_action( 'init', array( $this, 'register_taxonomy' ) );
		add_action( 'init', array( $this, 'register_meta' ) );
	}

	/**
	 * Registers the post type.
	 */
	public function register_post_type(): void {
		register_post_type(
			self::POST_TYPE,
			array(
				'labels'       => array(
					'name'          => __( 'Items', 'masked-icon' ),
					'singular_name' => __( 'Item', 'masked-icon' ),
					'add_new_item'  => __( 'Add item', 'masked-icon' ),
					'edit_item'     => __( 'Edit item', 'masked-icon' ),
					'search_items'  => __( 'Search items', 'masked-icon' ),
					'not_found'     => __( 'No items found.', 'masked-icon' ),
				),
				'public'       => true,
				'has_archive'  => true,
				'menu_icon'    => 'dashicons-screenoptions',
				'supports'     => array( 'title', 'editor', 'excerpt', 'thumbnail', 'custom-fields' ),
				// with_front => false keeps the archive at /items/ regardless of the site permalink
				// prefix. With the default `true`, an install that uses a prefix (a multisite main
				// site gets /blog/, for instance) moves the archive to /blog/items/ and every link
				// the plugin generates shifts with it.
				'rewrite'      => array(
					'slug'       => 'items',
					'with_front' => false,
				),
				// show_in_rest is what unlocks the block editor and the REST API for this type.
				'show_in_rest' => true,
				'taxonomies'   => array( self::TAXONOMY ),
			)
		);
	}

	/**
	 * Registers the taxonomy.
	 */
	public function register_taxonomy(): void {
		register_taxonomy(
			self::TAXONOMY,
			array( self::POST_TYPE ),
			array(
				'labels'            => array(
					'name'          => __( 'Item types', 'masked-icon' ),
					'singular_name' => __( 'Item type', 'masked-icon' ),
				),
				'public'            => true,
				'hierarchical'      => true,
				'show_admin_column' => true,
				'show_in_rest'      => true,
				'rewrite'           => array(
					'slug'       => 'item-type',
					'with_front' => false,
				),
			)
		);
	}

	/**
	 * Registers the meta field.
	 */
	public function register_meta(): void {
		register_post_meta(
			self::POST_TYPE,
			self::META_PRIORITY,
			array(
				'type'              => 'integer',
				'description'       => __( 'Item priority used when ordering lists.', 'masked-icon' ),
				'single'            => true,
				'default'           => 0,
				'show_in_rest'      => true,
				'sanitize_callback' => 'absint',
				// Without auth_callback an underscore-prefixed meta key would only be writable by
				// an administrator; here it is tied to the capability to edit that specific post.
				'auth_callback'     => static function ( $allowed, $meta_key, $post_id ) {
					return current_user_can( 'edit_post', (int) $post_id );
				},
			)
		);
	}
}
