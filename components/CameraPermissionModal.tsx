import React from 'react';
import { VideoOff } from 'lucide-react';
import { toast } from 'sonner';

interface CameraPermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  permissionError: string | null;
  onPermissionGranted: () => void;
  setPermissionState: (state: 'granted' | 'denied') => void;
  setPermissionError: (error: string | null) => void;
}

export function CameraPermissionModal({ 
  isOpen, 
  onClose, 
  permissionError, 
  onPermissionGranted,
  setPermissionState,
  setPermissionError 
}: CameraPermissionModalProps) {
  if (!isOpen) return null;

  const handleAllowCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setPermissionState('granted');
      setPermissionError(null);
      onClose();
      stream.getTracks().forEach(track => track.stop());
      toast.success('Camera access granted!');
      onPermissionGranted();
    } catch (error: any) {
      if (error.name === 'NotAllowedError') {
        setPermissionError('Please click "Allow" when prompted, or enable camera in browser settings.');
        toast.error('Camera permission denied. Please check browser settings.');
      } else {
        setPermissionError(`Failed to access camera: ${error.message}`);
        toast.error('Camera access failed: ' + error.message);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-md w-full border border-white/20 shadow-2xl">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <VideoOff className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Camera Access Required
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {permissionError || 'Swipx needs camera and microphone access for video calls.'}
          </p>
        </div>

        <div className="space-y-3 mb-6">
          <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-3 text-sm">
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
              📝 How to enable camera access:
            </h4>
            <ol className="list-decimal list-inside space-y-1 text-blue-800 dark:text-blue-200">
              <li>Look for camera 🎥 icon in browser address bar</li>
              <li>Click "Allow" when browser asks for permissions</li>
              <li>Or go to browser Settings → Privacy → Camera</li>
              <li>Make sure this site is allowed to use camera</li>
              <li>Refresh the page after enabling</li>
            </ol>
          </div>
          
          <div className="bg-amber-50 dark:bg-amber-900/30 rounded-lg p-3 text-sm">
            <h4 className="font-medium text-amber-900 dark:text-amber-100 mb-1">
              🔒 Security Requirements:
            </h4>
            <div className="space-y-1 text-amber-800 dark:text-amber-200">
              <p>• Camera access requires HTTPS connection</p>
              <p>• Current protocol: <strong>{location.protocol}</strong></p>
              <p>• Make sure no other apps are using camera</p>
            </div>
          </div>

          <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-3 text-sm">
            <h4 className="font-medium text-green-900 dark:text-green-100 mb-1">
              ✅ Quick Checks:
            </h4>
            <div className="space-y-1 text-green-800 dark:text-green-200">
              <p>• Browser supports camera: {navigator.mediaDevices ? '✅' : '❌'}</p>
              <p>• HTTPS protocol: {location.protocol === 'https:' || location.hostname === 'localhost' ? '✅' : '❌'}</p>
              <p>• Modern browser: {navigator.mediaDevices ? '✅' : '❌'}</p>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleAllowCamera}
            className="flex-1 bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg transition-colors font-medium"
          >
            🎥 Allow Camera Access
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white transition-colors"
          >
            Skip
          </button>
        </div>

        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Having trouble? Try refreshing the page or using Chrome/Firefox
          </p>
        </div>
      </div>
    </div>
  );
}