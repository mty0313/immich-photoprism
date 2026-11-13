import { MediaQuery } from 'svelte/reactivity';

const pointerCoarse = new MediaQuery('pointer:coarse');
const maxMd = new MediaQuery('max-width: 767px');
const maxLg = new MediaQuery('max-width: 1023px');
const sidebar = new MediaQuery(`min-width: 850px`);
const reducedMotion = new MediaQuery('prefers-reduced-motion: reduce');

export const mediaQueryManager = {
  get pointerCoarse() {
    return pointerCoarse.current;
  },
  get maxMd() {
    return maxMd.current;
  },
  get maxLg() {
    return maxLg.current;
  },
  get isFullSidebar() {
    return sidebar.current;
  },
  get reducedMotion() {
    return reducedMotion.current;
  },
};
