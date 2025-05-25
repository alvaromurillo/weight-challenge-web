'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  onRemove?: () => void;
  disabled?: boolean;
  maxSizeMB?: number;
  acceptedTypes?: string[];
  className?: string;
}

export function ImageUpload({
  value,
  onChange,
  onRemove,
  disabled = false,
  maxSizeMB = 5,
  acceptedTypes = ['image/jpeg', 'image/png', 'image/webp'],
  className = '',
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (!acceptedTypes.includes(file.type)) {
      return `File type not supported. Please use: ${acceptedTypes.join(', ')}`;
    }
    
    if (file.size > maxSizeMB * 1024 * 1024) {
      return `File size too large. Maximum size is ${maxSizeMB}MB`;
    }
    
    return null;
  };

  const uploadFile = async (file: File) => {
    setUploading(true);
    
    try {
      // Validate file
      const validationError = validateFile(file);
      if (validationError) {
        toast.error(validationError);
        return;
      }

      // Create a unique filename
      const timestamp = Date.now();
      const filename = `images/${timestamp}-${file.name}`;
      const storageRef = ref(storage, filename);

      // Upload file
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      onChange(downloadURL);
      toast.success('Image uploaded successfully');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    uploadFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    if (disabled || uploading) return;
    
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled && !uploading) {
      setDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleRemove = async () => {
    if (!value || !onRemove) return;
    
    try {
      // Extract the path from the Firebase Storage URL
      const url = new URL(value);
      const pathMatch = url.pathname.match(/\/o\/(.+)\?/);
      if (pathMatch) {
        const path = decodeURIComponent(pathMatch[1]);
        const storageRef = ref(storage, path);
        await deleteObject(storageRef);
      }
      
      onRemove();
      toast.success('Image removed successfully');
    } catch (error) {
      console.error('Error removing image:', error);
      toast.error('Failed to remove image');
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {value ? (
        <Card className="relative overflow-hidden">
          <CardContent className="p-0">
            <div className="relative aspect-video w-full">
              <Image
                src={value}
                alt="Uploaded image"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                priority={false}
              />
              {onRemove && (
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={handleRemove}
                  disabled={disabled}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div
          className={`
            border-2 border-dashed rounded-lg p-8 text-center transition-colors
            ${dragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-primary/50'}
          `}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => !disabled && !uploading && fileInputRef.current?.click()}
        >
          <div className="flex flex-col items-center space-y-4">
            {uploading ? (
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            ) : (
              <Upload className="h-8 w-8 text-muted-foreground" />
            )}
            
            <div className="space-y-2">
              <p className="text-sm font-medium">
                {uploading ? 'Uploading...' : 'Drop an image here or click to browse'}
              </p>
              <p className="text-xs text-muted-foreground">
                Supports: {acceptedTypes.join(', ')} (max {maxSizeMB}MB)
              </p>
            </div>
          </div>
        </div>
      )}

      <Input
        ref={fileInputRef}
        type="file"
        accept={acceptedTypes.join(',')}
        onChange={(e) => handleFileSelect(e.target.files)}
        className="hidden"
        disabled={disabled || uploading}
      />
      
      {!value && (
        <div className="text-center">
          <Label htmlFor="url-input" className="text-sm font-medium">
            Or enter an image URL
          </Label>
          <Input
            id="url-input"
            type="url"
            placeholder="https://example.com/image.jpg"
            className="mt-1"
            disabled={disabled || uploading}
            onBlur={(e) => {
              const url = e.target.value.trim();
              if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
                onChange(url);
                e.target.value = '';
              }
            }}
          />
        </div>
      )}
    </div>
  );
} 