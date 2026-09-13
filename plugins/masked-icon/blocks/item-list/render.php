<?php
/**
 * Server rendering for the "Item list" block.
 *
 * WordPress calls this file with $attributes, $content and $block in scope.
 *
 * @package Sobolewski\MaskedIcon
 */

declare( strict_types=1 );

defined( 'ABSPATH' ) || exit;

use Sobolewski\MaskedIcon\Core\Settings;
use Sobolewski\MaskedIcon\Modules\ContentType\Module as ContentType;

if ( ! class_exists( ContentType::class ) || ! post_type_exists( ContentType::POST_TYPE ) ) {
	return;
}

$masked_icon_limit = isset( $attributes['limit'] )
	? max( 1, (int) $attributes['limit'] )
	: (int) Settings::get( 'items_per_page', 10 );

$masked_icon_items = get_posts(
	array(
		'post_type'      => ContentType::POST_TYPE,
		'post_status'    => 'publish',
		'posts_per_page' => $masked_icon_limit,
	)
);

if ( ! $masked_icon_items ) {
	printf(
		'<p %1$s>%2$s</p>',
		wp_kses_data( get_block_wrapper_attributes() ),
		esc_html__( 'No items to show.', 'masked-icon' )
	);

	return;
}
?>
<ul <?php echo wp_kses_data( get_block_wrapper_attributes( array( 'class' => 'masked-icon-item-list' ) ) ); ?>>
	<?php foreach ( $masked_icon_items as $masked_icon_item ) : ?>
		<li>
			<a href="<?php echo esc_url( (string) get_permalink( $masked_icon_item ) ); ?>">
				<?php echo esc_html( get_the_title( $masked_icon_item ) ); ?>
			</a>
		</li>
	<?php endforeach; ?>
</ul>
