<?php
/**
 * Constants that PHPStan cannot infer, because WordPress defines them at runtime.
 *
 * @package Sobolewski\ImageIcons
 */

declare( strict_types=1 );

define( 'IMAGE_ICONS_VERSION', '0.1.0' );
define( 'IMAGE_ICONS_FILE', __FILE__ );
define( 'IMAGE_ICONS_DIR', dirname( __DIR__ ) . '/' );
define( 'IMAGE_ICONS_URL', 'https://example.test/wp-content/plugins/image-icons/' );
define( 'IMAGE_ICONS_BASENAME', 'image-icons/image-icons.php' );
define( 'IMAGE_ICONS_MIN_PHP', '7.4' );
define( 'IMAGE_ICONS_MIN_WP', '6.6' );
