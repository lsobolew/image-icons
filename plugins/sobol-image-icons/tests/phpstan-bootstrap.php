<?php
/**
 * Constants that PHPStan cannot infer, because WordPress defines them at runtime.
 *
 * @package Sobolewski\ImageIcons
 */

declare( strict_types=1 );

define( 'SOBOL_IMAGE_ICONS_VERSION', '0.1.0' );
define( 'SOBOL_IMAGE_ICONS_FILE', __FILE__ );
define( 'SOBOL_IMAGE_ICONS_DIR', dirname( __DIR__ ) . '/' );
define( 'SOBOL_IMAGE_ICONS_URL', 'https://example.test/wp-content/plugins/sobol-image-icons/' );
define( 'SOBOL_IMAGE_ICONS_BASENAME', 'sobol-image-icons/sobol-image-icons.php' );
define( 'SOBOL_IMAGE_ICONS_MIN_PHP', '7.4' );
define( 'SOBOL_IMAGE_ICONS_MIN_WP', '6.6' );
