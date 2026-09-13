<?php
/**
 * Module: REST API.
 *
 * @package Sobolewski\MaskedIcon
 */

declare( strict_types=1 );

namespace Sobolewski\MaskedIcon\Modules\Rest;

use Sobolewski\MaskedIcon\Core\Module as ModuleContract;
use Sobolewski\MaskedIcon\Core\Plugin;

defined( 'ABSPATH' ) || exit;

/**
 * Wires up the plugin REST controllers.
 */
final class Module implements ModuleContract {

	/**
	 * REST namespace.
	 */
	const NAMESPACE_V1 = 'masked-icon/v1';

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
		return 'rest';
	}

	/**
	 * Module hooks.
	 */
	public function register(): void {
		add_action(
			'rest_api_init',
			static function () {
				( new ItemsController() )->register_routes();
			}
		);
	}
}
