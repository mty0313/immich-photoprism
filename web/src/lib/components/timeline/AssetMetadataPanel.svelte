<script lang="ts">
  import type { TimelineAsset } from '$lib/managers/timeline-manager/types';
  import { getAssetMetadata } from '$lib/utils/asset-metadata';
  import { Icon } from '@immich/ui';
  import { locale } from 'svelte-i18n';

  interface Props {
    asset: TimelineAsset;
    height: number;
    compact?: boolean;
  }

  let { asset, height, compact = false }: Props = $props();

  const metadata = $derived(getAssetMetadata(asset, { locale: $locale ?? 'en', compact }));
</script>

<div
  class="pointer-events-none flex flex-col overflow-hidden border-t border-black/10 bg-gray-200/80 px-1.5 pt-1.5 pb-1 select-none dark:border-white/10 dark:bg-neutral-800/80"
  style:height="{height}px"
  aria-hidden="true"
  data-testid="asset-metadata-panel"
>
  <p class="truncate text-[12.5px]/4 font-semibold tracking-[-0.01em] text-black dark:text-white">
    {metadata.title}
  </p>
  <div class="flex min-h-0 flex-1 flex-col justify-center gap-y-0.5">
    {#each metadata.rows as row, index (index)}
      <div class="flex min-w-0 items-center gap-1.5">
        <Icon
          icon={row.icon}
          size="12"
          class="shrink-0 text-gray-400 transition-colors group-hover/asset-card:text-gray-600 dark:text-gray-500 dark:group-hover/asset-card:text-gray-400"
        />
        <p
          class="min-w-0 flex-1 truncate text-[11px]/[14px] text-gray-500 tabular-nums transition-colors group-hover/asset-card:text-gray-700 dark:text-gray-400 dark:group-hover/asset-card:text-gray-300"
        >
          {row.text}
        </p>
      </div>
    {/each}
  </div>
</div>
