<?php get_header(); ?>
<div style="min-height:60vh;padding:48px 24px;">
  <div class="ld-container">
    <?php if (have_posts()): while (have_posts()): the_post(); ?>
      <h1><?= get_the_title() ?></h1>
      <div><?php the_content(); ?></div>
    <?php endwhile; endif; ?>
  </div>
</div>
<?php get_footer(); ?>
