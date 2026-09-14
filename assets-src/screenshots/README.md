# Sources for the directory assets

Scenes used to produce the images in `.wordpress-org/`. Nothing here is published: the deploy
workflow uploads `.wordpress-org/` and only that, so a scene file left in it would end up on the
plugin's directory page. Finished images go there; the things that made them stay here.

Each `.html` scene is laid out at a fixed size, so a plain browser screenshot *is* the finished
asset - no cropping, and the same result every time one is re-taken after a design change.

## Taking them

1. Copy a scene into the playground's web root and replace `ICON_URL` with a real attachment URL:

   ```bash
   cd ../../wordpress-playground
   ICON=http://localhost:8080/wp-content/uploads/2026/09/arrow-icon.svg
   sed "s|ICON_URL|$ICON|g" ../wordpress-plugins/image-icons/.wporg/screenshots/1-one-file-every-colour.html \
     | docker compose exec -T cli sh -c 'cat > /var/www/html/shot.html && chown 33:33 /var/www/html/shot.html'
   ```

2. Open `http://localhost:8080/shot.html` in a 1200x1000 window and screenshot it.
3. Save it into `.wordpress-org/` as `screenshot-1.png`, numbered to match the order the
   `== Screenshots ==` section of `readme.txt` lists them in.

The scene pulls in the plugin's own `style-index.css`, so what you photograph is the real
stylesheet rather than a mock-up of it.

## Which ones must be photographed from the editor

Scenes that show the plugin's interface - the settings popover, the Icon panel on a Button - are
deliberately not in here. A screenshot of an interface has to be a screenshot of that interface,
not a reconstruction of it: a mock-up that drifts from the real panel is the kind of thing the
directory guidelines call misleading, and it would be. Take those from a real editor.
