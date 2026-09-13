<?php
/**
 * Module: settings screen in the admin.
 *
 * @package Sobolewski\MaskedIcon
 */

declare( strict_types=1 );

namespace Sobolewski\MaskedIcon\Modules\Settings;

use Sobolewski\MaskedIcon\Core\Module as ModuleContract;
use Sobolewski\MaskedIcon\Core\Plugin;
use Sobolewski\MaskedIcon\Core\Settings;

defined( 'ABSPATH' ) || exit;

/**
 * Adds a settings page built on the Settings API.
 *
 * Removing this module only takes away the UI - the values and defaults keep living in
 * Sobolewski\MaskedIcon\Core\Settings.
 */
final class Module implements ModuleContract {

	/**
	 * Admin page slug.
	 */
	const PAGE_SLUG = 'masked-icon';

	/**
	 * Capability required to manage the settings.
	 */
	const CAPABILITY = 'manage_options';

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
		return 'settings';
	}

	/**
	 * Module hooks.
	 */
	public function register(): void {
		add_action( 'admin_menu', array( $this, 'add_menu_page' ) );
		add_action( 'admin_init', array( $this, 'register_settings' ) );
		add_filter( 'plugin_action_links_' . MASKED_ICON_BASENAME, array( $this, 'add_action_link' ) );
	}

	/**
	 * Adds the entry under the Settings menu.
	 */
	public function add_menu_page(): void {
		add_options_page(
			__( 'Masked Icon', 'masked-icon' ),
			__( 'Masked Icon', 'masked-icon' ),
			self::CAPABILITY,
			self::PAGE_SLUG,
			array( $this, 'render_page' )
		);
	}

	/**
	 * Adds a "Settings" shortcut on the plugins list.
	 *
	 * @param string[] $links Existing links.
	 *
	 * @return string[]
	 */
	public function add_action_link( $links ): array {
		$links = is_array( $links ) ? $links : array();

		$settings_link = sprintf(
			'<a href="%s">%s</a>',
			esc_url( admin_url( 'options-general.php?page=' . self::PAGE_SLUG ) ),
			esc_html__( 'Settings', 'masked-icon' )
		);

		array_unshift( $links, $settings_link );

		return $links;
	}

	/**
	 * Registers the option, the section and the fields.
	 */
	public function register_settings(): void {
		register_setting(
			Settings::GROUP,
			Settings::OPTION,
			array(
				'type'              => 'array',
				'sanitize_callback' => array( Settings::class, 'sanitize' ),
				'default'           => Settings::defaults(),
				'show_in_rest'      => false,
			)
		);

		add_settings_section(
			'masked_icon_general',
			__( 'General settings', 'masked-icon' ),
			static function () {
				echo '<p>' . esc_html__( 'Basic plugin configuration.', 'masked-icon' ) . '</p>';
			},
			self::PAGE_SLUG
		);

		add_settings_field(
			'enabled',
			__( 'Enable functionality', 'masked-icon' ),
			array( $this, 'render_checkbox' ),
			self::PAGE_SLUG,
			'masked_icon_general',
			array(
				'key'         => 'enabled',
				'description' => __( 'Global on/off switch for the plugin.', 'masked-icon' ),
			)
		);

		add_settings_field(
			'items_per_page',
			__( 'Items per page', 'masked-icon' ),
			array( $this, 'render_number' ),
			self::PAGE_SLUG,
			'masked_icon_general',
			array(
				'key'         => 'items_per_page',
				'description' => __( 'How many items to show in lists and in the REST API.', 'masked-icon' ),
			)
		);

		add_settings_field(
			'api_label',
			__( 'API label', 'masked-icon' ),
			array( $this, 'render_text' ),
			self::PAGE_SLUG,
			'masked_icon_general',
			array(
				'key'         => 'api_label',
				'description' => __( 'Free-form text returned by the REST endpoint.', 'masked-icon' ),
			)
		);
	}

	/**
	 * Renders a checkbox field.
	 *
	 * @param array<string, string> $args Field arguments.
	 */
	public function render_checkbox( $args ): void {
		$key   = (string) ( $args['key'] ?? '' );
		$value = (bool) Settings::get( $key, false );

		printf(
			'<label><input type="checkbox" name="%1$s[%2$s]" value="1" %3$s /> %4$s</label>',
			esc_attr( Settings::OPTION ),
			esc_attr( $key ),
			checked( $value, true, false ), // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- checked() returns a safe attribute string.
			esc_html( (string) ( $args['description'] ?? '' ) )
		);
	}

	/**
	 * Renders a number field.
	 *
	 * @param array<string, string> $args Field arguments.
	 */
	public function render_number( $args ): void {
		$key = (string) ( $args['key'] ?? '' );

		printf(
			'<input type="number" min="1" step="1" class="small-text" name="%1$s[%2$s]" value="%3$s" /><p class="description">%4$s</p>',
			esc_attr( Settings::OPTION ),
			esc_attr( $key ),
			esc_attr( (string) Settings::get( $key, 10 ) ),
			esc_html( (string) ( $args['description'] ?? '' ) )
		);
	}

	/**
	 * Renders a text field.
	 *
	 * @param array<string, string> $args Field arguments.
	 */
	public function render_text( $args ): void {
		$key = (string) ( $args['key'] ?? '' );

		printf(
			'<input type="text" class="regular-text" name="%1$s[%2$s]" value="%3$s" /><p class="description">%4$s</p>',
			esc_attr( Settings::OPTION ),
			esc_attr( $key ),
			esc_attr( (string) Settings::get( $key, '' ) ),
			esc_html( (string) ( $args['description'] ?? '' ) )
		);
	}

	/**
	 * Renders the settings page.
	 */
	public function render_page(): void {
		// Belt and braces: WordPress checks the capability when adding the page, but the callback
		// can also be reached directly.
		if ( ! current_user_can( self::CAPABILITY ) ) {
			wp_die( esc_html__( 'You are not allowed to access this page.', 'masked-icon' ) );
		}

		?>
		<div class="wrap" id="masked-icon-settings">
			<h1><?php echo esc_html( get_admin_page_title() ); ?></h1>
			<form action="options.php" method="post">
				<?php
				// settings_fields() prints the nonce and the option_page field - without it the
				// save request is rejected.
				settings_fields( Settings::GROUP );
				do_settings_sections( self::PAGE_SLUG );
				submit_button();
				?>
			</form>
		</div>
		<?php
	}
}
