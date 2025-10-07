import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';
import { useState } from 'react';

interface ImageLightboxProps {
  images: Array<{
    src: string;
    alt?: string;
    caption?: string;
  }>;
  index?: number;
  onClose?: () => void;
}

export function ImageLightbox({ images, index = 0, onClose }: ImageLightboxProps) {
  const [open, setOpen] = useState(index >= 0);

  const handleClose = () => {
    setOpen(false);
    onClose?.();
  };

  const slides = images.map((image) => ({
    src: image.src,
    title: image.caption || image.alt,
  }));

  return (
    <Lightbox
      open={open}
      close={handleClose}
      slides={slides}
      index={index}
      data-testid="image-lightbox"
    />
  );
}

interface ImageGalleryProps {
  images: Array<{
    src: string;
    alt?: string;
    caption?: string;
  }>;
  className?: string;
}

export function ImageGallery({ images, className = '' }: ImageGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const openLightbox = (index: number) => {
    setCurrentIndex(index);
    setLightboxOpen(true);
  };

  return (
    <>
      <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 ${className}`} data-testid="image-gallery">
        {images.map((image, index) => (
          <div
            key={index}
            className="relative aspect-square cursor-pointer overflow-hidden rounded-lg group"
            onClick={() => openLightbox(index)}
            data-testid={`image-thumbnail-${index}`}
          >
            <img
              src={image.src}
              alt={image.alt || `Imagem ${index + 1}`}
              className="w-full h-full object-cover transition-transform group-hover:scale-110"
            />
            {image.caption && (
              <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-2 text-white text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                {image.caption}
              </div>
            )}
          </div>
        ))}
      </div>

      {lightboxOpen && (
        <ImageLightbox
          images={images}
          index={currentIndex}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </>
  );
}
