<script lang="ts">
  import type { TimelineAsset } from '$lib/managers/timeline-manager/types';
  import type { ViewerAsset } from '$lib/managers/timeline-manager/viewer-asset.svelte';
  import type { VirtualScrollManager } from '$lib/managers/VirtualScrollManager/VirtualScrollManager.svelte';
  import { uploadAssetsStore } from '$lib/stores/upload';
  import type { CommonPosition } from '$lib/utils/layout-utils';
  import type { Snippet } from 'svelte';
  import { flip } from 'svelte/animate';
  import { scale } from 'svelte/transition';

  let { isUploading } = uploadAssetsStore;

  type Props = {
    viewerAssets: ViewerAsset[];
    width: number;
    height: number;
    manager: VirtualScrollManager;
    footerHeight?: number;
    thumbnail: Snippet<
      [
        {
          asset: TimelineAsset;
          position: CommonPosition;
        },
      ]
    >;
    customThumbnailLayout?: Snippet<[asset: TimelineAsset]>;
    metadataFooter?: Snippet<[asset: TimelineAsset]>;
  };

  const {
    viewerAssets,
    width,
    height,
    manager,
    footerHeight = 0,
    thumbnail,
    customThumbnailLayout,
    metadataFooter,
  }: Props = $props();

  const transitionDuration = $derived(manager.suspendTransitions && !$isUploading ? 0 : 150);
  const scaleDuration = $derived(transitionDuration === 0 ? 0 : transitionDuration + 100);
</script>

<!-- Image grid -->
<div data-image-grid class="relative overflow-clip" style:height={height + 'px'} style:width={width + 'px'}>
  {#each viewerAssets as viewerAsset (viewerAsset.id)}
    {@const position = viewerAsset.position!}
    {@const asset = viewerAsset.asset!}

    <!-- note: don't remove data-asset-id - its used by web e2e tests -->
    <div
      data-asset-id={asset.id}
      class={[
        'group/asset-card absolute',
        !!metadataFooter &&
          'overflow-hidden rounded-md shadow-sm transition-shadow duration-200 group-hover/asset-card:shadow-lg',
      ]}
      style:top={position.top + 'px'}
      style:inset-inline-start={position.left + 'px'}
      style:width={position.width + 'px'}
      style:height={position.height + footerHeight + 'px'}
      out:scale|global={{ start: 0.1, duration: scaleDuration }}
      animate:flip={{ duration: transitionDuration }}
    >
      <div
        class={[
          'relative overflow-hidden',
          metadataFooter ? '' : footerHeight > 0 ? 'rounded-t-md' : 'rounded-md',
        ]}
        style:height={position.height + 'px'}
        style:width={position.width + 'px'}
      >
        {@render thumbnail({ asset, position })}
      </div>
      {@render customThumbnailLayout?.(asset)}
      {#if footerHeight > 0 && metadataFooter}
        {@render metadataFooter(asset)}
      {/if}
      {#if metadataFooter}
        <div
          class="pointer-events-none absolute inset-0 rounded-md ring-1 ring-black/10 ring-inset dark:ring-white/10"
        ></div>
      {/if}
    </div>
  {/each}
</div>

<style>
  [data-image-grid] {
    user-select: none;
  }
</style>
