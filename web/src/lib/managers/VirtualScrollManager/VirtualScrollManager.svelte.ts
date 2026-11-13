import { debounce } from 'lodash-es';

type LayoutOptions = {
  headerHeight: number;
  rowHeight: number;
  gap: number;
  footerHeight: number;
  spacing: number;
  minColumnWidth: number;
};
export abstract class VirtualScrollManager {
  topSectionHeight = $state(0);
  bodySectionHeight = $state(0);
  bottomSectionHeight = $state(0);
  totalViewerHeight = $derived.by(() => this.topSectionHeight + this.bodySectionHeight + this.bottomSectionHeight);

  visibleWindow = $derived.by(() => ({
    top: this.#scrollTop,
    bottom: this.#scrollTop + this.viewportHeight,
  }));

  #viewportHeight = $state(0);
  #viewportWidth = $state(0);
  #scrollTop = $state(0);
  #rowHeight = $state(235);
  #headerHeight = $state(48);
  #gap = $state(12);
  #footerHeight = $state(0);
  #spacing = $state(2);
  #minColumnWidth = $state(220);
  #scrolling = $state(false);
  #suspendTransitions = $state(false);
  #resetScrolling = debounce(() => (this.#scrolling = false), 1000);
  #resetSuspendTransitions = debounce(() => (this.suspendTransitions = false), 1000);
  #justifiedLayoutOptions = $derived({
    spacing: this.#spacing,
    heightTolerance: 0.5,
    rowHeight: this.#rowHeight,
    rowWidth: Math.floor(this.viewportWidth),
    footerHeight: this.#footerHeight,
    minColumnWidth: this.#minColumnWidth,
  });

  constructor() {
    this.setLayoutOptions();
  }

  get scrollTop() {
    return 0;
  }

  get justifiedLayoutOptions() {
    return this.#justifiedLayoutOptions;
  }

  get maxScrollPercent() {
    const totalHeight = this.totalViewerHeight;
    return (totalHeight - this.viewportHeight) / totalHeight;
  }

  get maxScroll() {
    return this.totalViewerHeight - this.viewportHeight;
  }

  #setHeaderHeight(value: number) {
    if (this.#headerHeight === value) {
      return false;
    }
    this.#headerHeight = value;
    return true;
  }

  get headerHeight() {
    return this.#headerHeight;
  }

  #setGap(value: number) {
    if (this.#gap === value) {
      return false;
    }
    this.#gap = value;
    return true;
  }

  get gap() {
    return this.#gap;
  }

  #setRowHeight(value: number) {
    if (this.#rowHeight === value) {
      return false;
    }
    this.#rowHeight = value;
    return true;
  }

  get rowHeight() {
    return this.#rowHeight;
  }

  #setFooterHeight(value: number) {
    if (this.#footerHeight === value) {
      return false;
    }
    this.#footerHeight = value;
    return true;
  }

  get footerHeight() {
    return this.#footerHeight;
  }

  #setSpacing(value: number) {
    if (this.#spacing === value) {
      return false;
    }
    this.#spacing = value;
    return true;
  }

  get spacing() {
    return this.#spacing;
  }

  #setMinColumnWidth(value: number) {
    if (this.#minColumnWidth === value) {
      return false;
    }
    this.#minColumnWidth = value;
    return true;
  }

  get minColumnWidth() {
    return this.#minColumnWidth;
  }

  set scrolling(value: boolean) {
    this.#scrolling = value;
    if (value) {
      this.suspendTransitions = true;
      this.#resetScrolling();
    }
  }

  get scrolling() {
    return this.#scrolling;
  }

  set suspendTransitions(value: boolean) {
    this.#suspendTransitions = value;
    if (value) {
      this.#resetSuspendTransitions();
    }
  }

  get suspendTransitions() {
    return this.#suspendTransitions;
  }

  set viewportWidth(value: number) {
    const changed = value !== this.#viewportWidth;
    this.#viewportWidth = value;
    this.suspendTransitions = true;
    void this.updateViewportGeometry(changed);
  }

  get viewportWidth() {
    return this.#viewportWidth;
  }

  set viewportHeight(value: number) {
    this.#viewportHeight = value;
    this.#suspendTransitions = true;
    void this.updateViewportGeometry(false);
  }

  get viewportHeight() {
    return this.#viewportHeight;
  }

  get hasEmptyViewport() {
    return this.viewportWidth === 0 || this.viewportHeight === 0;
  }

  protected updateViewportProximities(): void {}

  protected updateViewportGeometry(_: boolean) {}

  setLayoutOptions({
    headerHeight = 48,
    rowHeight = 235,
    gap = 12,
    footerHeight = 0,
    spacing = 2,
    minColumnWidth = 220,
  }: Partial<LayoutOptions> = {}) {
    let changed = false;
    changed ||= this.#setHeaderHeight(headerHeight);
    changed ||= this.#setGap(gap);
    changed ||= this.#setRowHeight(rowHeight);
    changed ||= this.#setFooterHeight(footerHeight);
    changed ||= this.#setSpacing(spacing);
    changed ||= this.#setMinColumnWidth(minColumnWidth);
    if (changed) {
      this.refreshLayout();
    }
  }

  updateSlidingWindow() {
    const scrollTop = this.scrollTop;
    if (this.#scrollTop !== scrollTop) {
      this.#scrollTop = scrollTop;
      this.updateViewportProximities();
    }
  }

  refreshLayout() {
    this.updateViewportProximities();
  }

  destroy(): void {}
}
