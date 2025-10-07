/**
 * Utilitário para redimensionar imagens automaticamente antes do upload
 * Garante que imagens não excedam limites de tamanho
 */

export interface ResizeOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'image/jpeg' | 'image/png' | 'image/webp';
}

const DEFAULT_OPTIONS: Required<ResizeOptions> = {
  maxWidth: 1920,
  maxHeight: 1920,
  quality: 0.85,
  format: 'image/jpeg',
};

/**
 * Redimensiona uma imagem mantendo a proporção
 */
export async function resizeImage(
  file: File,
  options: ResizeOptions = {}
): Promise<File> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Não foi possível criar contexto do canvas'));
      return;
    }

    img.onload = () => {
      try {
        let { width, height } = img;

        // Calcular novo tamanho mantendo proporção
        if (width > opts.maxWidth || height > opts.maxHeight) {
          const ratio = Math.min(
            opts.maxWidth / width,
            opts.maxHeight / height
          );
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        // Configurar canvas com novo tamanho
        canvas.width = width;
        canvas.height = height;

        // Desenhar imagem redimensionada
        ctx.drawImage(img, 0, 0, width, height);

        // Converter para Blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Falha ao converter imagem'));
              return;
            }

            // Criar novo File a partir do Blob
            const resizedFile = new File([blob], file.name, {
              type: opts.format,
              lastModified: Date.now(),
            });

            resolve(resizedFile);
          },
          opts.format,
          opts.quality
        );
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error('Falha ao carregar imagem'));
    };

    // Carregar imagem
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        img.src = e.target.result as string;
      }
    };
    reader.onerror = () => {
      reject(new Error('Falha ao ler arquivo'));
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Redimensiona imagem com feedback visual (retorna URL para preview)
 */
export async function resizeImageWithPreview(
  file: File,
  options: ResizeOptions = {}
): Promise<{ file: File; previewUrl: string }> {
  const resizedFile = await resizeImage(file, options);
  const previewUrl = URL.createObjectURL(resizedFile);
  
  return { file: resizedFile, previewUrl };
}

/**
 * Verifica se o arquivo precisa ser redimensionado
 */
export async function needsResize(
  file: File,
  maxWidth: number = 1920,
  maxHeight: number = 1920
): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      resolve(img.width > maxWidth || img.height > maxHeight);
    };
    img.onerror = () => {
      resolve(false);
    };
    
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        img.src = e.target.result as string;
      }
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Obtém dimensões da imagem
 */
export async function getImageDimensions(
  file: File
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
    };
    img.onerror = () => {
      reject(new Error('Falha ao carregar imagem'));
    };
    
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        img.src = e.target.result as string;
      }
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Formata tamanho de arquivo para exibição
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}
