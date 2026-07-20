import { getBrandImageSources, getProjectImageSources } from '../lib/projectImages';

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
}) {
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
}) {
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
}) {
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
