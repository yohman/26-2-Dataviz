import { geographicPaths } from './week09-tokyo-geography.mjs';

for (const path of document.querySelectorAll('[data-hero-route]')) {
  path.setAttribute('d', geographicPaths[path.dataset.heroRoute]);
}
