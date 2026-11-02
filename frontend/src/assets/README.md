# Frontend artwork

## `your-name-meteor-shower.jpg`

- Film: *Your Name / Kimi no Na Wa* (2016), directed by Makoto Shinkai,
  produced by CoMix Wave Films.
- Scene: the opening meteor shower, with fine blue trails across the night sky.
- Source gallery: https://animationscreencaps.com/your-name-2016/
- Exact capture: https://i0.wp.com/imgs.screencaps.us/201/6-yourname/full/yourname-animationscreencaps.com-1.jpg?ssl=1
- Retrieved: November 2, 2026.
- Resolution: 1920 x 1090; 265,064 bytes. The downloaded JPEG is unchanged.
- The gallery describes its captures as available for non-commercial fan,
  entertainment and educational use. Film copyrights remain with their owners;
  this file is not original Targon artwork or an openly licensed asset.

This is a direct film capture, replacing the previously selected comet
wallpaper. `Starfield.tsx` imports it so Vite fingerprints and bundles it for
web and Electron, including offline use. CSS crops it to the viewport and adds
readability overlays without modifying the downloaded image.

The discarded generated landscape and rejected wallpaper are not bundled.
The comet wordmark and favicon are project SVG artwork.
