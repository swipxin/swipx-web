import React from 'react';
import { VideoOff, Video } from 'lucide-react';
import { toast } from 'sonner';

interface CameraSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  permissionError: string | null;
  onCameraGranted: (stream: MediaStream) => void;
  setPermissionState: (state: 'granted' | 'denied') => void;
  setPermissionError: (error: string | null) => void;
}

export function CameraSetupModal({ 
  isOpen, 
  onClose, 
  permissionError, 
  onCameraGranted,
  setPermissionState,
  setPermissionError 
}: CameraSetupModalProps) {
  if (!isOpen) return null;

  const handleEnableCamera = async () => {
    try {
      console.log('User clicked to enable camera - requesting with user interaction');
      
      // Request camera access with user interaction
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: {
          width: { ideal: 640, max: 1280 },
          height: { ideal: 480, max: 720 },
          facingMode: 'user'
        }, 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      console.log('✅ Camera access granted successfully:', stream);
      console.log('📹 Video tracks:', stream.getVideoTracks());
      console.log('🎤 Audio tracks:', stream.getAudioTracks());
      
      // Update states
      setPermissionState('granted');
      setPermissionError(null);
      onClose();
      
      // Pass stream to parent component
      onCameraGranted(stream);
      
      toast.success('🎉 Camera enabled! You should now see yourself in the video.');
      
    } catch (error: any) {
      console.error('❌ Camera access failed:', error);
      
      if (error.name === 'NotAllowedError') {
        setPermissionError('🚫 Camera permission denied. Please click "Allow" when browser prompts, or enable camera in browser settings.');
        toast.error('Camera permission denied. Please check your browser settings.');
      } else if (error.name === 'NotFoundError') {
        setPermissionError('📷 No camera device found. Please connect a camera to your device.');
        toast.error('No camera found. Please connect a camera.');
      } else if (error.name === 'NotReadableError') {
        setPermissionError('🔒 Camera is being used by another application. Please close other video apps and try again.');
        toast.error('Camera in use by another app. Please close other video applications.');
      } else if (error.name === 'OverconstrainedError') {
        setPermissionError('⚙️ Camera settings not supported. Trying with basic settings...');
        
        // Try with basic settings
        try {
          const basicStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          console.log('✅ Basic camera access granted');
          setPermissionState('granted');
          setPermissionError(null);
          onClose();
          onCameraGranted(basicStream);
          toast.success('🎉 Camera enabled with basic settings!');
        } catch (basicError) {
          setPermissionError('❌ Camera access failed even with basic settings.');
          toast.error('Camera failed with basic settings too.');
        }
      } else {
        setPermissionError(`❌ Camera error: ${error.message}`);
        toast.error('Camera access failed: ' + error.message);
      }
    }
  };

  const handleSkip = () => {
    setPermissionError('⚠️ Video calls require camera access. Features may be limited.');
    onClose();
    toast.info('Skipped camera setup. Video features will be limited.');
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-lg w-full border border-white/20 shadow-2xl">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <Video className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            🎥 Enable Camera for Video Calls
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {permissionError || 'To start video calls, we need access to your camera and microphone.'}
          </p>
        </div>

        <div className="space-y-3 mb-6">
          <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-3 text-sm">
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
              📝 How it works:
            </h4>
            <ol className="list-decimal list-inside space-y-1 text-blue-800 dark:text-blue-200">
              <li>Click "Enable Camera" below</li>
              <li>Browser will ask for permission - click "Allow"</li>
              <li>Your camera will turn on and you'll see yourself</li>
              <li>You can then start video calls with others</li>
            </ol>
          </div>
          
          <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-3 text-sm">
            <h4 className="font-medium text-green-900 dark:text-green-100 mb-1">
              ✅ System Status:
            </h4>
            <div className="space-y-1 text-green-800 dark:text-green-200">
              <p>• Browser camera support: {navigator.mediaDevices ? '✅' : '❌'}</p>
              <p>• Secure connection (HTTPS): {location.protocol === 'https:' || location.hostname === 'localhost' ? '✅' : '❌'}</p>
              <p>• Modern browser: {navigator.mediaDevices ? '✅' : '❌'}</p>
            </div>
          </div>

          {permissionError && (
            <div className="bg-red-50 dark:bg-red-900/30 rounded-lg p-3 text-sm">
              <h4 className="font-medium text-red-900 dark:text-red-100 mb-1">
                ⚠️ Current Issue:
              </h4>
              <p className="text-red-800 dark:text-red-200">{permissionError}</p>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleEnableCamera}
            className="flex-1 bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
          >
            <Video className="w-4 h-4" />
            Enable Camera
          </button>
          <button
            onClick={handleSkip}
            className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white transition-colors"
          >
            Skip for now
          </button>
        </div>

        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            🔒 Your privacy is important. Camera access is only used for video calls and is never recorded.
          </p>
        </div>
      </div>
    </div>
  );
}