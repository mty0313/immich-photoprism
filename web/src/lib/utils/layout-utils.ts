import { JustifiedLayout, type LayoutOptions } from '@immich/justified-layout-wasm';
import type { AssetResponseDto } from '@immich/sdk';
import createJustifiedLayout from 'justified-layout';
import type { TimelineAsset } from '$lib/managers/timeline-manager/types';
import { getAssetRatio } from '$lib/utils/asset-utils';
import { isTimelineAsset, isTimelineAssets } from '$lib/utils/timeline-util';
import { TUNABLES } from '$lib/utils/tunables';

const useWasm = TUNABLES.LAYOUT.WASM;

export type CommonJustifiedLayout = {
  containerWidth: number;
  containerHeight: number;
  getTop(boxIdx: number): number;
  getLeft(boxIdx: number): number;
  getWidth(boxIdx: number): number;
  getHeight(boxIdx: number): number;
  getPosition(boxIdx: number): { top: number; left: number; width: number; height: number };
};

export type CommonLayoutOptions = {
  rowHeight: number;
  rowWidth: number;
  spacing: number;
  heightTolerance: number;
  footerHeight?: number;
  minColumnWidth?: number;
};

export function getJustifiedLayoutFromAssets(
  assets: TimelineAsset[] | AssetResponseDto[],
  options: CommonLayoutOptions,
): CommonJustifiedLayout {
  if (useWasm) {
    return isTimelineAssets(assets) ? wasmLayoutFromTimeline(assets, options) : wasmLayoutFromDto(assets, options);
  }
  return justifiedLayout(assets, options);
}

function wasmLayoutFromTimeline(assets: TimelineAsset[], options: LayoutOptions) {
  const aspectRatios = new Float32Array(assets.length);
  for (let i = 0; i < assets.length; i++) {
    aspectRatios[i] = assets[i].ratio;
  }
  return new JustifiedLayout(aspectRatios, options);
}

function wasmLayoutFromDto(assets: AssetResponseDto[], options: LayoutOptions) {
  const aspectRatios = new Float32Array(assets.length);
  for (let i = 0; i < assets.length; i++) {
    aspectRatios[i] = getAssetRatio(assets[i]) ?? 1;
  }
  return new JustifiedLayout(aspectRatios, options);
}

type Geometry = ReturnType<typeof createJustifiedLayout>;
class Adapter {
  result;
  width;
  constructor(result: Geometry) {
    this.result = result;
    this.width = 0;
    for (const box of this.result.boxes) {
      if (box.top === 0) {
        this.width = box.left + box.width;
      } else {
        break;
      }
    }
  }

  get containerWidth() {
    return this.width;
  }

  get containerHeight() {
    return this.result.containerHeight;
  }

  getTop(boxIdx: number) {
    return this.result.boxes[boxIdx]?.top;
  }

  getLeft(boxIdx: number) {
    return this.result.boxes[boxIdx]?.left;
  }

  getWidth(boxIdx: number) {
    return this.result.boxes[boxIdx]?.width;
  }

  getHeight(boxIdx: number) {
    return this.result.boxes[boxIdx]?.height;
  }

  getPosition(boxIdx: number) {
    const box = this.result.boxes[boxIdx];
    return { top: box.top, left: box.left, width: box.width, height: box.height };
  }
}

export function justifiedLayout(assets: (TimelineAsset | AssetResponseDto)[], options: CommonLayoutOptions) {
  const adapter = {
    targetRowHeight: options.rowHeight,
    containerWidth: options.rowWidth,
    boxSpacing: options.spacing,
    targetRowHeightTolerange: options.heightTolerance,
    containerPadding: 0,
  };

  const result = createJustifiedLayout(
    assets.map((asset) => (isTimelineAsset(asset) ? asset.ratio : (getAssetRatio(asset) ?? 1))),
    adapter,
  );
  return new Adapter(result);
}

export type CommonPosition = {
  top: number;
  left: number;
  width: number;
  height: number;
};

export class SquareGridLayout implements CommonJustifiedLayout {
  #containerWidth: number;
  #columns: number;
  #cellSize: number;
  #gap: number;
  #rows: number;

  constructor(count: number, options: CommonLayoutOptions) {
    const { rowWidth, spacing } = options;
    const minColumnWidth = options.minColumnWidth ?? 200;
    this.#containerWidth = rowWidth;
    this.#gap = spacing;
    this.#columns = Math.max(1, Math.floor((rowWidth + spacing) / (minColumnWidth + spacing)));
    this.#cellSize = (rowWidth - spacing * (this.#columns - 1)) / this.#columns;
    this.#rows = count === 0 ? 0 : Math.ceil(count / this.#columns);
  }

  get containerWidth() {
    return this.#containerWidth;
  }

  get containerHeight() {
    return this.#rows === 0 ? 0 : this.#rows * this.#cellSize + (this.#rows - 1) * this.#gap;
  }

  getTop(index: number) {
    return Math.floor(index / this.#columns) * (this.#cellSize + this.#gap);
  }

  getLeft(index: number) {
    return (index % this.#columns) * (this.#cellSize + this.#gap);
  }

  getWidth(_index: number) {
    return this.#cellSize;
  }

  getHeight(_index: number) {
    return this.#cellSize;
  }

  getPosition(index: number) {
    return {
      top: this.getTop(index),
      left: this.getLeft(index),
      width: this.#cellSize,
      height: this.#cellSize,
    };
  }
}

export function getGridLayoutFromAssets(
  assets: TimelineAsset[] | AssetResponseDto[],
  options: CommonLayoutOptions,
): CommonJustifiedLayout {
  return new SquareGridLayout(assets.length, options);
}

export function getSquareCellSize(options: CommonLayoutOptions) {
  const { rowWidth, spacing } = options;
  const minColumnWidth = options.minColumnWidth ?? 200;
  const columns = Math.max(1, Math.floor((rowWidth + spacing) / (minColumnWidth + spacing)));
  return {
    columns,
    cellSize: (rowWidth - spacing * (columns - 1)) / columns,
  };
}
