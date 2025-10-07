import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  accept?: Record<string, string[]>;
  maxSize?: number;
  disabled?: boolean;
}

export function FileUpload({ 
  onFileSelect, 
  accept = {
    'application/octet-stream': ['.dxf', '.stl'],
    'application/pdf': ['.pdf'],
    'application/zip': ['.zip'],
    'image/*': ['.jpg', '.jpeg', '.png']
  },
  maxSize = 50 * 1024 * 1024, // 50MB
  disabled = false 
}: FileUploadProps) {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragActive, setIsDragActive] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      onFileSelect(file);
      
      // Simulate upload progress
      setUploadProgress(0);
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 10;
        });
      }, 100);
    }
  }, [onFileSelect]);

  const { getRootProps, getInputProps, isDragReject } = useDropzone({
    onDrop,
    accept,
    maxSize,
    multiple: false,
    disabled,
    onDragEnter: () => setIsDragActive(true),
    onDragLeave: () => setIsDragActive(false),
  });

  return (
    <Card className={`file-upload-zone transition-all duration-300 ${
      isDragActive ? 'border-primary bg-primary/5' : 
      isDragReject ? 'border-destructive bg-destructive/5' : 
      'border-border hover:border-primary/50'
    } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
      <CardContent className="p-8">
        <div {...getRootProps()} className="text-center" data-testid="file-upload-zone">
          <input {...getInputProps()} data-testid="file-input" />
          
          {uploadProgress > 0 && uploadProgress < 100 ? (
            <div className="space-y-4">
              <i className="fas fa-spinner fa-spin text-4xl text-primary"></i>
              <div>
                <p className="text-lg font-medium mb-2">Enviando arquivo...</p>
                <Progress value={uploadProgress} className="w-full" />
                <p className="text-sm text-muted-foreground mt-2">{uploadProgress}%</p>
              </div>
            </div>
          ) : uploadProgress === 100 ? (
            <div className="space-y-4">
              <i className="fas fa-check-circle text-4xl text-green-500"></i>
              <p className="text-lg font-medium text-green-600">Arquivo enviado com sucesso!</p>
            </div>
          ) : (
            <div className="space-y-4">
              <i className={`fas fa-cloud-upload-alt text-4xl ${
                isDragActive ? 'text-primary' : 
                isDragReject ? 'text-destructive' : 
                'text-muted-foreground'
              }`}></i>
              
              <div>
                <p className="text-lg font-medium mb-2">
                  {isDragReject ? 'Arquivo não suportado' : 'Arraste seus arquivos aqui'}
                </p>
                <p className="text-muted-foreground mb-4">ou clique para selecionar</p>
                
                {!disabled && (
                  <Button 
                    type="button"
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                    data-testid="select-files-button"
                  >
                    Selecionar Arquivos
                  </Button>
                )}
              </div>
              
              <div className="text-sm text-muted-foreground space-y-1">
                <p>Formatos suportados: DXF, STL, PDF, ZIP, JPG, PNG</p>
                <p>Tamanho máximo: {Math.round(maxSize / (1024 * 1024))}MB</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
