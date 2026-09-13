<?php
/**
 * Constants that PHPStan cannot infer, because WordPress defines them at runtime.
 *
 * @package Sobolewski\MaskedIcon
 */

declare( strict_types=1 );

define( 'MASKED_ICON_VERSION', '0.1.0' );
define( 'MASKED_ICON_FILE', __FILE__ );
define( 'MASKED_ICON_DIR', dirname( __DIR__ ) . '/' );
define( 'MASKED_ICON_URL', 'https://example.test/wp-content/plugins/masked-icon/' );
define( 'MASKED_ICON_BASENAME', 'masked-icon/masked-icon.php' );
define( 'MASKED_ICON_MIN_PHP', '7.4' );
define( 'MASKED_ICON_MIN_WP', '6.6' );
