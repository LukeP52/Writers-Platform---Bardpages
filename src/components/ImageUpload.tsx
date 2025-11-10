"use client";

import { useState, useRef } from "react";
import Image from "next/image";

interface UploadedImage {
  id?: number;
  filename: string;
  originalName: string;
  alt: string;
  caption: string;
  size: number;
  mimeType: string;
  width: number;
  height: number;
  isHero: boolean;
  url: string;
}

interface ImageUploadProps {
  postId?: number;
  images: UploadedImage[];
  onImagesChange: (images: UploadedImage[]) => void;
  maxImages?: number;
}

export default function ImageUpload({ postId, images, onImagesChange, maxImages = 10 }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (files: FileList) => {
    if (files.length === 0) return;
    
    const remainingSlots = maxImages - images.length;
    if (remainingSlots <= 0) {
      alert(`Maximum ${maxImages} images allowed`);
      return;
    }

    const filesToUpload = Array.from(files).slice(0, remainingSlots);
    setUploading(true);

    try {
      const uploadPromises = filesToUpload.map(async (file) => {
        const formData = new FormData();
        formData.append("file", file);
        if (postId) formData.append("postId", postId.toString());
        formData.append("alt", "");
        formData.append("caption", "");
        formData.append("isHero", "false");

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Failed to upload ${file.name}`);
        }

        const data = await response.json();
        
        // If we have an image object (postId was provided), use that
        // Otherwise, construct from the response data
        if (data.image) {
          return {
            ...data.image,
            url: data.url,
          };
        } else {
          return {
            filename: data.filename,
            originalName: data.originalName,
            alt: "",
            caption: "",
            size: data.size,
            mimeType: data.mimeType,
            width: data.width,
            height: data.height,
            isHero: false,
            url: data.url,
          };
        }
      });

      const uploadedImages = await Promise.all(uploadPromises);
      onImagesChange([...images, ...uploadedImages]);
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Some uploads failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    if (e.dataTransfer.files) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const removeImage = async (index: number) => {
    const imageToRemove = images[index];
    
    // If the image has an ID, it's already saved to the database
    if (imageToRemove.id) {
      try {
        await fetch(`/api/images/${imageToRemove.id}`, {
          method: "DELETE",
        });
      } catch (error) {
        console.error("Failed to delete image:", error);
      }
    }

    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
  };

  const updateImageDetails = (index: number, updates: Partial<UploadedImage>) => {
    const newImages = [...images];
    newImages[index] = { ...newImages[index], ...updates };
    onImagesChange(newImages);
  };

  const setAsHero = (index: number) => {
    const newImages = images.map((img, i) => ({
      ...img,
      isHero: i === index,
    }));
    onImagesChange(newImages);
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragOver 
            ? "border-accent bg-accent/10" 
            : "border-border hover:border-border-hover"
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
          className="hidden"
        />
        
        {uploading ? (
          <div className="text-foreground">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto mb-2"></div>
            <p>Uploading images...</p>
          </div>
        ) : (
          <div className="text-foreground-muted">
            <div className="text-4xl mb-2">📸</div>
            <p className="text-lg font-medium mb-1">Drop images here or click to upload</p>
            <p className="text-sm">PNG, JPG, WebP up to 10MB each</p>
            <p className="text-xs text-foreground-subtle mt-2">
              {images.length}/{maxImages} images uploaded
            </p>
          </div>
        )}
      </div>

      {/* Images Grid */}
      {images.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-foreground">Uploaded Images</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {images.map((image, index) => (
              <div
                key={image.filename}
                className={`bg-surface border border-border rounded-lg p-4 space-y-3 ${
                  image.isHero ? "ring-2 ring-warning" : ""
                }`}
              >
                <div className="relative">
                  <Image
                    src={image.url}
                    alt={image.alt || image.originalName}
                    width={300}
                    height={200}
                    className="w-full h-48 object-cover rounded"
                  />
                  {image.isHero && (
                    <div className="absolute top-2 left-2 bg-warning text-black px-2 py-1 rounded text-xs font-medium">
                      Hero Image
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <div>
                    <label className="block text-xs font-medium text-foreground-muted mb-1">
                      Alt Text
                    </label>
                    <input
                      type="text"
                      value={image.alt}
                      onChange={(e) => updateImageDetails(index, { alt: e.target.value })}
                      className="w-full px-2 py-1 bg-surface-elevated border border-border rounded text-foreground text-sm"
                      placeholder="Describe the image..."
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-foreground-muted mb-1">
                      Caption
                    </label>
                    <input
                      type="text"
                      value={image.caption}
                      onChange={(e) => updateImageDetails(index, { caption: e.target.value })}
                      className="w-full px-2 py-1 bg-surface-elevated border border-border rounded text-foreground text-sm"
                      placeholder="Optional caption..."
                    />
                  </div>
                </div>
                
                <div className="flex items-center justify-between pt-2">
                  <div className="text-xs text-foreground-subtle">
                    {image.originalName} ({Math.round(image.size / 1024)}KB)
                  </div>
                  
                  <div className="flex space-x-2">
                    {!image.isHero && (
                      <button
                        onClick={() => setAsHero(index)}
                        className="px-2 py-1 bg-warning hover:bg-warning/80 text-black text-xs rounded transition-colors"
                      >
                        Set as Hero
                      </button>
                    )}
                    <button
                      onClick={() => removeImage(index)}
                      className="px-2 py-1 bg-error hover:bg-error/80 text-black text-xs rounded transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}