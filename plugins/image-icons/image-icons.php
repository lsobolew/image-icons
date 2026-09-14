<?php
/**
 * Plugin Name:       Image Icons
 * Plugin URI:        https://github.com/lsobolew/image-icons
 * Description:       Turn any image into a single-colour icon that follows your text colour, in text, on a button, or on its own.
 * Version:           0.1.0
 * Requires at least: 6.6
 * Requires PHP:      7.4
 * Author:            Lukasz Sobolewski
 * Author URI:        https://github.com/lsobolew
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       image-icons
 * Domain Path:       /languages
 *
 * @package Sobolewski\ImageIcons
 */

declare( strict_types=1 );

namespace Sobolewski\ImageIcons;

defined( 'ABSPATH' ) || exit;

define( 'IMAGE_ICONS_VERSION', '0.1.0' );
define( 'IMAGE_ICONS_FILE', __FILE__ );
define( 'IMAGE_ICONS_DIR', plugin_dir_path( __FILE__ ) );
define( 'IMAGE_ICONS_URL', plugin_dir_url( __FILE__ ) );
define( 'IMAGE_ICONS_BASENAME', plugin_basename( __FILE__ ) );
define( 'IMAGE_ICONS_MIN_PHP', '7.4' );
define( 'IMAGE_ICONS_MIN_WP', '6.6' );

require_once __DIR__ . '/src/Core/Requirements.php';

// The plugin must never fatal on an unsupported PHP/WP version: show a notice and stay quiet.
if ( ! Core\Requirements::met() ) {
	add_action( 'admin_notices', array( Core\Requirements::class, 'render_notice' ) );

	return;
}

require_once __DIR__ . '/src/Core/Autoloader.php';
Core\Autoloader::register( __NAMESPACE__, __DIR__ . '/src' );

// vendor/ is optional: our own classes come from the autoloader above, this only adds libraries.
if ( is_readable( __DIR__ . '/vendor/autoload.php' ) ) {
	require_once __DIR__ . '/vendor/autoload.php';
}

register_activation_hook( __FILE__, array( Core\Activator::class, 'activate' ) );
register_deactivation_hook( __FILE__, array( Core\Deactivator::class, 'deactivate' ) );

// Boot on `plugins_loaded` rather than at file load: an add-on is loaded after this plugin and
// needs a chance to hook `imageicons_register_modules` before it fires.
add_action(
	'plugins_loaded',
	static function () {
		Core\Plugin::instance()->boot();
	},
	5
);
