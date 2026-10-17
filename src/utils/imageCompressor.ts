/**
 * Client-side Canvas Image Compressor
 * Resizes images proportionally up to maxDimension (default: 1024x1024)
 * and converts to WebP/JPEG at ~0.85 quality, reducing 4-10MB mobile photos to ~100-180KB.
 */
export async function compressImage(
  input: File | Blob | string,
  maxDimension: number = 1024,
  quality: number = 0.85
): Promise<string> {
  return new Promise((resolve, reject) => {
    let sourceUrl: string;
    let shouldRevoke = false;

    if (typeof input === 'string') {
      if (input.startsWith('data:image/svg+xml')) {
        resolve(input);
        return;
      }
      sourceUrl = input;
    } else {
      sourceUrl = URL.createObjectURL(input);
      shouldRevoke = true;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      if (shouldRevoke) {
        URL.revokeObjectURL(sourceUrl);
      }

      let { width, height } = img;

      // Calculate proportional downscaling if either dimension exceeds maxDimension
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, width);
      canvas.height = Math.max(1, height);

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        // Fallback to original if canvas context unavailable
        resolve(typeof input === 'string' ? input : sourceUrl);
        return;
      }

      // High-quality downsampling
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      // Prefer WebP, fallback to JPEG
      try {
        let output = canvas.toDataURL('image/webp', quality);
        if (!output.startsWith('data:image/webp')) {
          output = canvas.toDataURL('image/jpeg', quality);
        }
        resolve(output);
      } catch (err) {
        try {
          resolve(canvas.toDataURL('image/jpeg', quality));
        } catch {
          // If canvas was tainted by cross-origin, fallback to original string if available
          if (typeof input === 'string') {
            resolve(input);
          } else {
            reject(err);
          }
        }
      }
    };

    img.onerror = (err) => {
      if (shouldRevoke) {
        URL.revokeObjectURL(sourceUrl);
      }
      // Graceful fallback to original input if available
      if (typeof input === 'string') {
        resolve(input);
      } else {
        reject(err);
      }
    };

    img.src = sourceUrl;
  });
}

