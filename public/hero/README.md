# Hero Carousel Images

Drop the following files into this folder. Each should be a wide landscape JPG/WebP, ideally **1920×1080** (or wider) and optimized to ~200–400 KB.

| Filename | Suggested content |
|---|---|
| `driver-tablet.jpg` | Driver / dispatcher reviewing the trip board on a tablet (the image you attached fits here). |
| `family-booking.jpg` | A family or passenger booking a ride / arriving at a facility. |
| `community-driver.jpg` | A community driver greeting passengers next to their van. |

The carousel is wired up in [src/components/hero-carousel.tsx](../../src/components/hero-carousel.tsx). To change filenames, captions, or add more slides, edit the `SLIDES` array at the top of that file.

> **Note:** The site uses `next/image` with `unoptimized: true` (static export), so images are served as-is. Compress them before committing.
