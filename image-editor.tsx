import { useState, useRef } from 'react';
import ReactCrop, { Crop, PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RotateCw, RotateCcw, Check, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

interface ImageEditorProps {
  image: string;
  onSave: (editedImage: Blob) => void;
  onCancel: () => void;
  open: boolean;
}

export function ImageEditor({ image, onSave, onCancel, open }: ImageEditorProps) {
  const [crop, setCrop] = useState<Crop>({
    unit: '%',
    width: 90,
    height: 90,
    x: 5,
    y: 5,
  });
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [rotation, setRotation] = useState(0);
  const [watermarkText, setWatermarkText] = useState('');
  const imgRef = useRef<HTMLImageElement>(null);

  const handleRotate = (degrees: number) => {
    setRotation((prev) => (prev + degrees) % 360);
  };

  const getCroppedImg = async (): Promise<Blob> => {
    const image = imgRef.current;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!image || !ctx || !completedCrop) {
      throw new Error('Failed to process image');
    }

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    // Calculate cropped dimensions
    const cropWidth = completedCrop.width * scaleX;
    const cropHeight = completedCrop.height * scaleY;

    // Calculate canvas size after rotation
    const radians = (rotation * Math.PI) / 180;
    const sin = Math.abs(Math.sin(radians));
    const cos = Math.abs(Math.cos(radians));
    
    const rotatedWidth = cropWidth * cos + cropHeight * sin;
    const rotatedHeight = cropWidth * sin + cropHeight * cos;

    canvas.width = rotatedWidth;
    canvas.height = rotatedHeight;

    ctx.save();
    
    // Move to center of canvas
    ctx.translate(canvas.width / 2, canvas.height / 2);
    
    // Rotate around center
    if (rotation !== 0) {
      ctx.rotate(radians);
    }
    
    // Draw image centered
    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      cropWidth,
      cropHeight,
      -cropWidth / 2,
      -cropHeight / 2,
      cropWidth,
      cropHeight
    );

    ctx.restore();

    // Add watermark after rotation
    if (watermarkText) {
      ctx.font = '20px Arial';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.textAlign = 'right';
      ctx.fillText(watermarkText, canvas.width - 10, canvas.height - 10);
    }

    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Canvas is empty'));
            return;
          }
          resolve(blob);
        },
        'image/jpeg',
        0.95
      );
    });
  };

  const handleSave = async () => {
    try {
      const croppedImage = await getCroppedImg();
      onSave(croppedImage);
    } catch (error) {
      console.error('Error cropping image:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onCancel}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Editar Imagem</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2 items-center justify-center">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleRotate(-90)}
              data-testid="button-rotate-left"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Girar Esquerda
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleRotate(90)}
              data-testid="button-rotate-right"
            >
              <RotateCw className="h-4 w-4 mr-2" />
              Girar Direita
            </Button>
          </div>

          <div className="max-h-[500px] overflow-auto flex items-center justify-center bg-muted/50 rounded-lg">
            <ReactCrop
              crop={crop}
              onChange={(c) => setCrop(c)}
              onComplete={(c) => setCompletedCrop(c)}
              data-testid="image-crop"
            >
              <img
                ref={imgRef}
                src={image}
                alt="Imagem para editar"
                style={{ transform: `rotate(${rotation}deg)` }}
                className="max-w-full"
              />
            </ReactCrop>
          </div>

          <div>
            <Label htmlFor="watermark">Marca d'água (opcional)</Label>
            <Input
              id="watermark"
              value={watermarkText}
              onChange={(e) => setWatermarkText(e.target.value)}
              placeholder="Digite o texto da marca d'água"
              data-testid="input-watermark"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            data-testid="button-cancel-edit"
          >
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            data-testid="button-save-edit"
          >
            <Check className="h-4 w-4 mr-2" />
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
