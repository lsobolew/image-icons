<?php
/**
 * The requirements gate.
 *
 * @package Sobolewski\ImageIcons
 */

declare( strict_types=1 );

namespace Sobolewski\ImageIcons\Tests\Integration;

use Sobolewski\ImageIcons\Core\Requirements;
use WP_UnitTestCase;

/**
 * Tests for Requirements.
 *
 * The plugin promises never to fatal on an unsupported PHP or WordPress: it returns early and
 * leaves a notice instead. These assertions are what make that a promise rather than an intention.
 */
final class RequirementsTest extends WP_UnitTestCase {

	/**
	 * The suite runs on a supported environment, so the gate opens.
	 */
	public function test_supported_environment_passes(): void {
		$this->assertTrue( Requirements::met() );
	}

	/**
	 * The declared minimums agree with the ones the readme and the header promise.
	 *
	 * A plugin that says it runs on 6.6 and checks for something else is lying in one of the two
	 * places, and which one is anybody's guess.
	 */
	public function test_declared_minimums_match_the_plugin_header(): void {
		$headers = get_file_data(
			IMAGE_ICONS_FILE,
			array(
				'RequiresWP'  => 'Requires at least',
				'RequiresPHP' => 'Requires PHP',
			)
		);

		$this->assertSame( $headers['RequiresWP'], IMAGE_ICONS_MIN_WP );
		$this->assertSame( $headers['RequiresPHP'], IMAGE_ICONS_MIN_PHP );
	}

	/**
	 * Nothing is printed to a visitor who could not act on it anyway.
	 */
	public function test_notice_is_not_shown_to_users_who_cannot_activate_plugins(): void {
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'subscriber' ) ) );

		ob_start();
		Requirements::render_notice();

		$this->assertSame( '', (string) ob_get_clean() );
	}
}
