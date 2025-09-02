1.  Don't optimize the images every time?
    - Use a plugin to optimize images only when they are changed or added.
    - Dynamically render the build by overriding meta.json in plugin with env variable
2.  Add a template for the robots.txt
3.  Add a sitemap in html for user discovery
4.  Add rollup critical plugin!
5.  Have a rollup plugin or something else to have the global css merge into one css optimize instead of 5 ?
6.  have several resolution for images for srcset purposes
    -       /assets/images/landing-page/INPLUG_illustration_cylindre_sansechelle%201_clear_sky.png 800w,
    -       /assets/images/landing-page/INPLUG_illustration_cylindre_sansechelle%201_clear_sky.png 1600w

7.  Add a way to ignore .DS_Store for build etc ?

8.  Add polyfill for safari and firefox maybe ?

- Test so firefox (1280x3003)
- y'a de problèmes de resolutions:. des lenovo avec des pixelRatio de 3
- possibilité de cliquer sur la minimap (les nombres)
