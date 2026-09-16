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
	 * The notice is built at render time, not at check time.
	 *
	 * The check runs while the plugin file is being included, before `after_setup_theme`. A
	 * translation function called that early makes WordPress load the text domain just in time
	 * and report `_doing_it_wrong`, so the message has to be assembled later - which is what this
	 * asserts by producing one without any deprecation or doing-it-wrong notice being raised.
	 */
	public function test_the_notice_is_translated_without_translating_too_early(): void {
		$reflection = new \ReflectionClass( Requirements::class );
		$failed     = $reflection->getProperty( 'failed' );
		$failed->setAccessible( true );
		$failed->setValue( null, 'php' );

		// The notice is gated on `activate_plugins`, and on multisite an administrator does not
		// have it - plugins are a network decision there, so only the super admin does. Asking for
		// the role rather than the capability made this pass on a single site and fail on the
		// nightly multisite target, which is the difference the matrix exists to find.
		$user_id = self::factory()->user->create( array( 'role' => 'administrator' ) );

		if ( is_multisite() ) {
			grant_super_admin( $user_id );
		}

		wp_set_current_user( $user_id );

		$this->assertTrue(
			current_user_can( 'activate_plugins' ),
			'the test user has to be able to act on the notice for it to be shown one'
		);

		ob_start();
		Requirements::render_notice();
		$output = (string) ob_get_clean();

		$failed->setValue( null, '' );

		$this->assertStringContainsString( 'requires PHP', $output );
		$this->assertStringContainsString( IMAGE_ICONS_MIN_PHP, $output );
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
