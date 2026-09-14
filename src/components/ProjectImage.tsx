import { getBrandImageSources, getProjectImageSources } from '../lib/projectImages';
import type { CSSProperties } from 'react';
import type { BrandImage as BrandImageId, ImageProfile, ImageSources } from '../lib/projectImages';

interface SharedImageProps {
  alt: string;
  className?: string;
  pictureClassName?: string;
  style?: CSSProperties;
  loading?: 'lazy' | 'eager';
  fetchPriority?: 'high' | 'low' | 'auto';
  onLoad?: () => void;
  onError?: () => void;
}

interface PictureImageProps extends SharedImageProps {
  sources: ImageSources;
}

function PictureImage({
  sources,
  alt,
  className,
  pictureClassName,
  style,
  loading,
  fetchPriority,
  onLoad,
  onError,
}: PictureImageProps) {
  return (
    <picture className={pictureClassName}>
      <source type="image/avif" srcSet={sources.avifSrcSet} sizes={sources.sizes} />
      <source type="image/webp" srcSet={sources.webpSrcSet} sizes={sources.sizes} />
      <img
        src={sources.fallbackSrc}
        alt={alt}
        className={className}
        style={style}
        loading={loading}
        fetchPriority={fetchPriority}
        onLoad={onLoad}
        onError={onError}
      />
    </picture>
  );
}

interface ProjectImageProps extends SharedImageProps {
  imagePath: string;
  profile: ImageProfile;
}

export function ProjectImage({
  imagePath,
  profile,
  alt,
  className,
  pictureClassName,
  style,
  loading = 'lazy',
  fetchPriority,
  onLoad,
  onError,
}: ProjectImageProps) {
  const sources = getProjectImageSources(imagePath, profile);
  return (
    <PictureImage
      sources={sources}
      alt={alt}
      className={className}
      pictureClassName={pictureClassName}
      style={style}
      loading={loading}
      fetchPriority={fetchPriority}
      onLoad={onLoad}
      onError={onError}
    />
  );
}

interface BrandImageProps extends SharedImageProps {
  brand: BrandImageId;
}

export function BrandImage({
  brand,
  alt,
  className,
  pictureClassName,
  style,
  loading = 'lazy',
  fetchPriority,
  onLoad,
  onError,
}: BrandImageProps) {
  const sources = getBrandImageSources(brand);
  return (
    <PictureImage
      sources={sources}
      alt={alt}
      className={className}
      pictureClassName={pictureClassName}
      style={style}
      loading={loading}
      fetchPriority={fetchPriority}
      onLoad={onLoad}
      onError={onError}
    />
  );
}
