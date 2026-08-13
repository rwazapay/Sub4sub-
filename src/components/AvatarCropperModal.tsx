import React, { useState, useRef, useEffect } from 'react';
import { Crop, ZoomIn, ZoomOut, RotateCw, Upload, Check, X, Move, Sparkles } from 'lucide-react';
import { apiClient } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface AvatarCropperModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAvatar?: string;
  onSuccess: (newAvatarUrl: string) => void;
}

export const AvatarCropperModal: React.FC<AvatarCropperModalProps> = ({
  isOpen,
  onClose,
  currentAvatar,
  onSuccess,
}) => {
  const { user, updateUser } = useAuth();
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [zoom, setZoom] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    if (currentAvatar) {
      setImageSrc(currentAvatar);
    }
  }, [currentAvatar]);

  // Load Image onto Ref
  useEffect(() => {
    if (!imageSrc) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageSrc;
    img.onload = () => {
      imageRef.current = img;
      setOffset({ x: 0, y: 0 });
      setZoom(1);
      setRotation(0);
      drawCanvas();
    };
    img.onerror = () => {
      setErrorMessage('Failed to load selected image. Please try another image file.');
    };
  }, [imageSrc]);

  // Redraw Canvas whenever zoom, rotation, or offset changes
  const drawCanvas = () => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = 300;
    canvas.width = size;
    canvas.height = size;

    // Clear canvas
    ctx.clearRect(0, 0, size, size);

    // Background fill
    ctx.fillStyle = '#0d0b09';
    ctx.fillRect(0, 0, size, size);

    ctx.save();
    // Move origin to canvas center
    ctx.translate(size / 2 + offset.x, size / 2 + offset.y);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(zoom, zoom);

    // Calculate scaling to cover size
    const aspect = img.width / img.height;
    let drawW = size;
    let drawH = size;
    if (aspect > 1) {
      drawW = size * aspect;
    } else {
      drawH = size / aspect;
    }

    ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();
  };

  useEffect(() => {
    drawCanvas();
  }, [zoom, rotation, offset]);

  // Handle Drag / Pan
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    setOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Handle File Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 8 * 1024 * 1024) {
        setErrorMessage('File size exceeds 8MB. Please choose a smaller image.');
        return;
      }
      setErrorMessage(null);
      const reader = new FileReader();
      reader.onload = () => {
        setImageSrc(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Export cropped canvas to base64 Data URL and post to MongoDB API
  const handleSaveCroppedAvatar = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Create a square cropped high-res canvas (250x250)
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = 250;
    exportCanvas.height = 250;
    const ctx = exportCanvas.getContext('2d');
    if (!ctx) return;

    // Circular Clip mask option or crisp square output
    ctx.save();
    ctx.beginPath();
    ctx.arc(125, 125, 125, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.clip();

    ctx.drawImage(canvas, 0, 0, 250, 250);
    ctx.restore();

    const croppedBase64 = exportCanvas.toDataURL('image/jpeg', 0.88);

    setIsSaving(true);
    setErrorMessage(null);

    try {
      const res = await apiClient.post('/users/avatar', {
        avatar: croppedBase64,
      });

      if (res.data.success) {
        if (user) {
          updateUser({
            ...user,
            avatar: croppedBase64,
          });
        }
        onSuccess(croppedBase64);
        onClose();
      } else {
        setErrorMessage(res.data.message || 'Failed to save cropped avatar.');
      }
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.message || 'Server error while saving avatar.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-[#161310] border border-[#262018] rounded-3xl p-6 max-w-md w-full text-white space-y-5 shadow-2xl relative">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#262018] pb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-500">
              <Crop className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-stone-100 flex items-center gap-1.5">
                Avatar Cropper & Studio
                <Sparkles className="w-4 h-4 text-amber-400 fill-amber-400" />
              </h3>
              <p className="text-[11px] text-stone-400">Position, zoom and crop your creator photo</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMessage && (
          <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold">
            {errorMessage}
          </div>
        )}

        {/* Canvas Workspace */}
        <div className="flex flex-col items-center space-y-4">
          <div className="relative group">
            {/* Round Crop Overlay Guide */}
            <div className="relative w-[260px] h-[260px] rounded-full overflow-hidden border-4 border-amber-500 shadow-xl shadow-amber-500/10 cursor-grab active:cursor-grabbing">
              <canvas
                ref={canvasRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 pointer-events-none rounded-full border border-amber-400/40" />
            </div>

            <div className="absolute bottom-2 right-2 bg-stone-900/90 text-amber-400 px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 border border-amber-500/30">
              <Move className="w-3 h-3" />
              <span>Drag to Pan</span>
            </div>
          </div>

          {/* Interactive Controls Bar */}
          <div className="w-full bg-[#0d0b09] p-4 rounded-2xl border border-[#262018] space-y-3">
            
            {/* Zoom Slider */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-stone-300 font-bold">
                <span className="flex items-center gap-1">
                  <ZoomIn className="w-3.5 h-3.5 text-amber-500" /> Zoom Level
                </span>
                <span className="text-amber-400">{Math.round(zoom * 100)}%</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.max(0.5, z - 0.2))}
                  className="p-1.5 rounded-lg bg-[#161310] text-stone-400 hover:text-white border border-[#262018]"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <input
                  type="range"
                  min="0.5"
                  max="3"
                  step="0.05"
                  value={zoom}
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                  className="w-full accent-amber-500 bg-stone-800 h-1.5 rounded-lg cursor-pointer"
                />
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.min(3, z + 0.2))}
                  className="p-1.5 rounded-lg bg-[#161310] text-stone-400 hover:text-white border border-[#262018]"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Action buttons: Rotate & Change File */}
            <div className="flex items-center justify-between pt-2 border-t border-[#262018]">
              <button
                type="button"
                onClick={() => setRotation((r) => (r + 90) % 360)}
                className="py-1.5 px-3 rounded-xl bg-[#161310] border border-[#262018] text-xs font-bold text-stone-300 hover:text-white flex items-center gap-1.5 hover:bg-stone-800 transition-colors"
              >
                <RotateCw className="w-3.5 h-3.5 text-amber-500" />
                <span>Rotate ({rotation}°)</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="py-1.5 px-3 rounded-xl bg-[#161310] border border-[#262018] text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1.5 hover:bg-stone-800 transition-colors"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload New Image</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-4 rounded-xl text-xs font-bold text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isSaving || !imageSrc}
            onClick={handleSaveCroppedAvatar}
            className="py-2.5 px-5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95 transition-all disabled:opacity-50"
          >
            {isSaving ? (
              <span>Saving to MongoDB...</span>
            ) : (
              <>
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Crop & Save to MongoDB</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
