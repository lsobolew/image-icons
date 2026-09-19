<?php
/**
 * Modules loaded by the plugin.
 *
 * Order matters only when one module assumes another is already registered.
 *
 * This file is managed by `./bin/wpx feature add|remove`.
 *
 * @package Sobolewski\ImageIcons
 */

declare( strict_types=1 );

defined( 'ABSPATH' ) || exit;

return array(
	Sobolewski\ImageIcons\Modules\Blocks\Module::class,
);
