import type { TimelineAsset } from '$lib/managers/timeline-manager/types';
import { getAssetMetadata } from '$lib/utils/asset-metadata';
import { AssetVisibility } from '@immich/sdk';

const createAsset = (overrides: Partial<TimelineAsset> = {}): TimelineAsset => ({
  id: 'asset-id',
  ownerId: 'owner-id',
  ratio: 1.5,
  thumbhash: null,
  localDateTime: { year: 2024, month: 5, day: 18, hour: 14, minute: 33, second: 0, millisecond: 0 },
  createdAt: { year: 2024, month: 5, day: 18, hour: 14, minute: 33, second: 0, millisecond: 0 },
  fileCreatedAt: { year: 2024, month: 5, day: 18, hour: 14, minute: 33, second: 0, millisecond: 0 },
  visibility: AssetVisibility.Timeline,
  isFavorite: false,
  isTrashed: false,
  isVideo: false,
  isImage: true,
  stack: null,
  duration: null,
  projectionType: null,
  livePhotoVideoId: null,
  city: null,
  country: null,
  people: null,
  ...overrides,
});

describe('getAssetMetadata', () => {
  it('builds the photo prism style title and rows', () => {
    const asset = createAsset({
      city: 'Berlin',
      country: 'Germany',
      originalFileName: 'IMG_1234.DNG',
      make: 'Apple',
      model: 'iPhone 15 Pro',
      lensModel: 'Summicron',
      focalLength: 35,
      fNumber: 2,
      exposureTime: '1/250',
      iso: 200,
      exifImageWidth: 6000,
      exifImageHeight: 4000,
      fileSizeInByte: 25_690_112,
      localOffsetHours: 2,
    });

    const metadata = getAssetMetadata(asset, { locale: 'en-US' });

    expect(metadata.title).toBe('Berlin / Germany / 2024');
    expect(metadata.rows.map((row) => row.text)).toEqual([
      '2024-05-18 Sat 14:33 GMT+02:00',
      'Apple iPhone 15 Pro',
      'Summicron · 35mm · f/2 · 1/250s',
      'ISO 200 · DNG · 6000 × 4000 · 24.5 MB',
    ]);
  });

  it('falls back to the file name and keeps rows short without exif', () => {
    const asset = createAsset({
      originalFileName: 'clip.mp4',
      isVideo: true,
      isImage: false,
      duration: 65_000,
      localOffsetHours: 0,
    });

    const metadata = getAssetMetadata(asset, { locale: 'en-US' });

    expect(metadata.title).toBe('clip.mp4 / 2024');
    expect(metadata.rows.map((row) => row.text)).toEqual(['2024-05-18 Sat 14:33 GMT+00:00', 'MP4 · 1:05']);
  });

  it('does not repeat the make when the model already contains it', () => {
    const asset = createAsset({ make: 'Canon', model: 'Canon EOS R5' });

    expect(getAssetMetadata(asset, { locale: 'en-US' }).rows.map((row) => row.text)).toContain('Canon EOS R5');
  });

  it('formats file sizes', () => {
    const asset = createAsset({ fileSizeInByte: 1024 });

    expect(getAssetMetadata(asset, { locale: 'en-US' }).rows.map((row) => row.text)).toContain('1.0 KB');
  });

  it('omits missing rows instead of rendering blank lines', () => {
    const asset = createAsset({ originalFileName: 'scan.png' });

    const metadata = getAssetMetadata(asset, { locale: 'en-US' });

    expect(metadata.rows.map((row) => row.text)).toEqual(['2024-05-18 Sat 14:33 GMT+00:00', 'PNG']);
  });

  it('limits the compact variant to time and camera', () => {
    const asset = createAsset({ make: 'Apple', model: 'iPhone 15 Pro', iso: 200 });

    const metadata = getAssetMetadata(asset, { locale: 'en-US', compact: true });

    expect(metadata.rows).toHaveLength(2);
    expect(metadata.rows[1].text).toBe('Apple iPhone 15 Pro');
  });
});
