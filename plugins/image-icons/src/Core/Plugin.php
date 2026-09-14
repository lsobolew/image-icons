<?php
/**
 * Plugin core: module registry and boot.
 *
 * @package Sobolewski\ImageIcons
 */

declare( strict_types=1 );

namespace Sobolewski\ImageIcons\Core;

defined( 'ABSPATH' ) || exit;

/**
 * The single entry point: loads the module list, lets it be filtered, and registers every module.
 *
 * The filter and the `imageicons_register_modules` action are the extension surface - an add-on
 * can add a module of its own without this plugin knowing anything about it.
 */
final class Plugin {

	/**
	 * Singleton instance.
	 *
	 * @var Plugin|null
	 */
	private static $instance = null;

	/**
	 * Registered modules, keyed by id.
	 *
	 * @var array<string, Module>
	 */
	private $modules = array();

	/**
	 * Whether boot() already ran.
	 *
	 * @var bool
	 */
	private $booted = false;

	/**
	 * Private constructor - use instance().
	 */
	private function __construct() {
	}

	/**
	 * Returns the shared plugin instance.
	 */
	public static function instance(): self {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}

		return self::$instance;
	}

	/**
	 * Plugin version taken from the plugin header.
	 */
	public function version(): string {
		return IMAGE_ICONS_VERSION;
	}

	/**
	 * A registered module, or null.
	 *
	 * @param string $id Module identifier.
	 */
	public function module( string $id ): ?Module {
		return $this->modules[ $id ] ?? null;
	}

	/**
	 * All registered modules.
	 *
	 * @return array<string, Module>
	 */
	public function modules(): array {
		return $this->modules;
	}

	/**
	 * Adds a module to the registry and registers its hooks.
	 *
	 * Public on purpose: this is how an add-on joins in on `imageicons_register_modules`.
	 *
	 * @param Module $module Module to register.
	 */
	public function add_module( Module $module ): void {
		$id = $module->id();

		if ( isset( $this->modules[ $id ] ) ) {
			return;
		}

		$this->modules[ $id ] = $module;
		$module->register();
	}

	/**
	 * Boots the plugin. Idempotent.
	 */
	public function boot(): void {
		if ( $this->booted ) {
			return;
		}

		$this->booted = true;

		add_action( 'init', array( Upgrader::class, 'maybe_upgrade' ), 5 );

		/**
		 * Filters the list of module classes.
		 *
		 * @param string[] $classes Class names implementing Module.
		 */
		$classes = apply_filters( 'imageicons_modules', $this->module_classes() );

		foreach ( $classes as $class_name ) {
			if ( ! is_string( $class_name ) || ! class_exists( $class_name ) ) {
				continue;
			}

			$module = new $class_name( $this );

			if ( $module instanceof Module ) {
				$this->add_module( $module );
			}
		}

		/**
		 * Fires when add-ons may register their own modules.
		 *
		 * @param Plugin $plugin Plugin instance.
		 */
		do_action( 'imageicons_register_modules', $this );

		/**
		 * Fires once the plugin is fully booted.
		 *
		 * @param Plugin $plugin Plugin instance.
		 */
		do_action( 'imageicons_loaded', $this );
	}

	/**
	 * Module classes from config/modules.php.
	 *
	 * @return string[]
	 */
	private function module_classes(): array {
		$file = IMAGE_ICONS_DIR . 'config/modules.php';

		if ( ! is_readable( $file ) ) {
			return array();
		}

		$classes = require $file;

		return is_array( $classes ) ? $classes : array();
	}
}
