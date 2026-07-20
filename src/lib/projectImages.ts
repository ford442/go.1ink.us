export type ImageProfile = 'thumb' | 'card' | 'modal';
export type BrandImage = 'title' | 'go1inkus';

export interface ImageSources {
  avifSrcSet: string;
  webpSrcSet: string;
  fallbackSrc: string;
  sizes: string;
}

const CARD_WIDTHS = [400, 800] as const;
const MODAL_WIDTHS = [800, 1200] as const;
const THUMB_WIDTHS = [400] as const;

const CARD_SIZES = '(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw';
const MODAL_SIZES = '(min-width: 768px) 448px, 100vw';
const THUMB_SIZES = '80px';

const BRAND_WIDTHS: Record<BrandImage, readonly number[]> = {
  title: [352, 704],
  go1inkus: [96, 192],
};

const BRAND_SIZES: Record<BrandImage, string> = {
  title: '(min-width: 768px) 672px, 512px',
  go1inkus: '192px',
};

/** "/pixel.png" → "pixel" */
export function imageSlug(path: string): string {
  return path.replace(/^\//, '').replace(/\.(png|jpe?g|webp|avif)$/i, '');
}

function buildSrcSet(slug: string, widths: readonly number[], dir: 'projects' | 'brand', ext: 'webp' | 'avif'): string {
  return widths
    .map((width) => `/images/${dir}/${slug}-${width}.${ext} ${width}w`)
    .join(', ');
}

function buildSources(
  slug: string,
  widths: readonly number[],
  dir: 'projects' | 'brand',
  sizes: string
): ImageSources {
  const fallbackWidth = widths[widths.length - 1];
  return {
    avifSrcSet: buildSrcSet(slug, widths, dir, 'avif'),
    webpSrcSet: buildSrcSet(slug, widths, dir, 'webp'),
    fallbackSrc: `/images/${dir}/${slug}-${fallbackWidth}.webp`,
    sizes,
  };
}

export function getProjectImageSources(imagePath: string, profile: ImageProfile): ImageSources {
  const slug = imageSlug(imagePath);

  switch (profile) {
    case 'thumb':
      return buildSources(slug, THUMB_WIDTHS, 'projects', THUMB_SIZES);
    case 'modal':
      return buildSources(slug, MODAL_WIDTHS, 'projects', MODAL_SIZES);
    case 'card':
    default:
      return buildSources(slug, CARD_WIDTHS, 'projects', CARD_SIZES);
  }
}

export function getBrandImageSources(brand: BrandImage): ImageSources {
  return buildSources(brand, BRAND_WIDTHS[brand], 'brand', BRAND_SIZES[brand]);
}
