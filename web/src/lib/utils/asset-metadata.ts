import type { TimelineAsset } from '$lib/managers/timeline-manager/types';
import { mdiCameraIris, mdiCameraOutline, mdiClockOutline, mdiFileImageOutline, mdiFileVideoOutline } from '@mdi/js';
import { DateTime } from 'luxon';

export const assetMetadataPanelHeight = 92;
export const assetMetadataPanelCompactHeight = 52;

export type AssetMetadataRow = {
  icon: string;
  text: string;
};

export type AssetMetadata = {
  title: string;
  rows: AssetMetadataRow[];
};

type AssetMetadataOptions = {
  locale: string;
  compact?: boolean;
};

const separator = ' · ';

const formatTrimmedNumber = (value: number, digits = 1) => String(Number(value.toFixed(digits)));

const getFileExtension = (fileName?: string | null) => {
  if (!fileName) {
    return;
  }
  const index = fileName.lastIndexOf('.');
  if (index <= 0 || index === fileName.length - 1) {
    return;
  }
  return fileName.slice(index + 1).toUpperCase();
};

const formatFileSize = (bytes?: number | null) => {
  if (bytes === null || bytes === undefined || !Number.isFinite(bytes) || bytes <= 0) {
    return;
  }
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }
  const digits = unitIndex === 0 ? 0 : 1;
  return `${value.toFixed(digits)} ${units[unitIndex]}`;
};

const formatDuration = (milliseconds?: number | null) => {
  if (!milliseconds || milliseconds <= 0) {
    return;
  }
  const totalSeconds = Math.round(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
};

const formatUtcOffset = (hours?: number) => {
  const offset = Number.isFinite(hours) ? (hours as number) : 0;
  const sign = offset < 0 ? '-' : '+';
  const absolute = Math.abs(offset);
  const wholeHours = Math.floor(absolute);
  const minutes = Math.round((absolute - wholeHours) * 60);
  return `${sign}${String(wholeHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

const getPlaceTitle = (asset: TimelineAsset) => {
  const locality = asset.city?.trim() || asset.state?.trim();
  const place = [locality, asset.country?.trim()]
    .filter((part): part is string => !!part)
    .filter((part, index, parts) => parts.indexOf(part) === index)
    .join(' / ');
  const year = String(asset.localDateTime.year);
  if (place) {
    return `${place} / ${year}`;
  }
  const fileName = asset.originalFileName?.trim();
  return fileName ? `${fileName} / ${year}` : year;
};

const getTimeRow = (asset: TimelineAsset, locale: string) => {
  const dateTime = DateTime.fromObject(asset.localDateTime, { zone: 'utc', locale });
  if (!dateTime.isValid) {
    return;
  }
  const date = dateTime.toFormat('yyyy-MM-dd ccc', { locale });
  const time = dateTime.toFormat('HH:mm', { locale });
  return `${date} ${time} GMT${formatUtcOffset(asset.localOffsetHours)}`;
};

const getCameraRow = (asset: TimelineAsset) => {
  const make = asset.make?.trim();
  const model = asset.model?.trim();
  if (make && model) {
    return model.toLowerCase().includes(make.toLowerCase()) ? model : `${make} ${model}`;
  }
  return model || make;
};

const getLensRow = (asset: TimelineAsset) => {
  const exposureTime = asset.exposureTime?.trim();
  const lens = [
    asset.lensModel?.trim(),
    asset.focalLength ? `${formatTrimmedNumber(asset.focalLength)}mm` : undefined,
    asset.fNumber ? `f/${formatTrimmedNumber(asset.fNumber, 2)}` : undefined,
    exposureTime ? (exposureTime.endsWith('s') ? exposureTime : `${exposureTime}s`) : undefined,
  ].filter((part): part is string => !!part);
  return lens.length > 0 ? lens.join(separator) : undefined;
};

const getFileRow = (asset: TimelineAsset) => {
  const resolution =
    asset.exifImageWidth && asset.exifImageHeight ? `${asset.exifImageWidth} × ${asset.exifImageHeight}` : undefined;
  const file = [
    asset.iso ? `ISO ${asset.iso}` : undefined,
    getFileExtension(asset.originalFileName),
    resolution,
    formatFileSize(asset.fileSizeInByte),
    asset.isVideo ? formatDuration(asset.duration) : undefined,
  ].filter((part): part is string => !!part);
  return file.length > 0 ? file.join(separator) : undefined;
};

const toRow = (icon: string, text: string | undefined): AssetMetadataRow | undefined =>
  text ? { icon, text } : undefined;

export const getAssetMetadata = (
  asset: TimelineAsset,
  { locale, compact = false }: AssetMetadataOptions,
): AssetMetadata => {
  const rows = compact
    ? [toRow(mdiClockOutline, getTimeRow(asset, locale)), toRow(mdiCameraOutline, getCameraRow(asset))]
    : [
        toRow(mdiClockOutline, getTimeRow(asset, locale)),
        toRow(mdiCameraOutline, getCameraRow(asset)),
        toRow(mdiCameraIris, getLensRow(asset)),
        toRow(asset.isVideo ? mdiFileVideoOutline : mdiFileImageOutline, getFileRow(asset)),
      ];

  return {
    title: getPlaceTitle(asset),
    rows: rows.filter((row): row is AssetMetadataRow => !!row),
  };
};
