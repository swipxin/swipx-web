import React, { useState, useEffect, useRef } from "react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { ScrollArea } from "./ui/scroll-area";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Flag,
  Coins,
  Users,
  Globe,
  MessageCircle,
  Send,
  X,
  Phone,
  PhoneOff,
} from "lucide-react";
import { toast } from "sonner";
import type { User, Screen } from "../types";
import { createWebRTCRoom, deleteWebRTCRoom, findRandomUser, isApiConfigured } from "./utils/api-config";
import { webRTCService, WebRTCCallbacks } from "./utils/webrtc-service";

interface VideoCallProps {
  user: User | null;
  updateUser: (updates: Partial<User>) => void;
  navigateTo: (screen: Screen) => void;
  callDuration: number;
  onDurationUpdate: (duration: number) => void;
}

interface ChatMessage {
  id: string;
  text: string;
  sender: "user" | "partner";
  timestamp: Date;
}

// Mock partners array for switching
const mockPartners = [
  { name: "Alex", country: "Canada", gender: "female", isPremium: true },
  { name: "Sam", country: "United States", gender: "male", isPremium: false },
  { name: "Maya", country: "India", gender: "female", isPremium: true },
  { name: "Jordan", country: "United Kingdom", gender: "other", isPremium: false },
  { name: "Riley", country: "Australia", gender: "female", isPremium: true },
  { name: "Casey", country: "Brazil", gender: "male", isPremium: false },
];

export function VideoCall({
  user,
  updateUser,
  navigateTo,
  callDuration,
  onDurationUpdate,
}: VideoCallProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [showTokenDeduction, setShowTokenDeduction] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const [currentPartnerIndex, setCurrentPartnerIndex] = useState(0);
  const [isConnecting, setIsConnecting] = useState(false);
  
  // WebRTC integration states
  const [roomUrl, setRoomUrl] = useState<string | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [isCallActive, setIsCallActive] = useState(false);
  const [participantCount, setParticipantCount] = useState(0);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [showCameraDebug, setShowCameraDebug] = useState(false);
  const [permissionState, setPermissionState] = useState<'unknown' | 'granted' | 'denied' | 'prompt'>('unknown');
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [showPermissionModal, setShowPermissionModal] = useState(false);

  // Get current partner from API
  const [currentPartner, setCurrentPartner] = useState(() => 
    findRandomUser({ 
      country: null, 
      gender: null, 
      excludeId: user?.id 
    })
  );

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLInputElement>(null);

  // Initialize WebRTC when room is available and permissions are granted
  useEffect(() => {
    const initializeWebRTC = async () => {
      if (!roomId) return;

      try {
        // Setup WebRTC callbacks
        const callbacks: WebRTCCallbacks = {
          onLocalStream: (stream: MediaStream) => {
            console.log('Local stream received:', stream);
            setLocalStream(stream);
            if (localVideoRef.current) {
              localVideoRef.current.srcObject = stream;
              console.log('Local video element updated with stream');
            }
          },
          onRemoteStream: (stream: MediaStream) => {
            console.log('Remote stream received:', stream);
            setRemoteStream(stream);
            if (remoteVideoRef.current) {
              remoteVideoRef.current.srcObject = stream;
            }
          },
          onUserJoined: (userId: string) => {
            setParticipantCount(prev => prev + 1);
            setIsCallActive(true);
            toast.success('Partner connected to video call!');
          },
          onUserLeft: (userId: string) => {
            setParticipantCount(prev => Math.max(0, prev - 1));
            setRemoteStream(null);
            if (remoteVideoRef.current) {
              remoteVideoRef.current.srcObject = null;
            }
          },
          onConnectionStateChange: (state: RTCPeerConnectionState) => {
            console.log('WebRTC connection state:', state);
            if (state === 'connected') {
              setIsCallActive(true);
            } else if (state === 'disconnected' || state === 'failed' || state === 'closed') {
              setIsCallActive(false);
            }
          },
          onError: (error: Error) => {
            console.error('WebRTC error:', error);
            toast.error('Video call error occurred');
          }
        };

        // Always join WebRTC room without camera (camera will be added manually after user grants permission)
        await webRTCService.joinRoom(roomId, callbacks);
        
        // Only try to get stream if permissions are granted
        if (permissionState === 'granted') {
          setTimeout(() => {
            const localStream = webRTCService.getLocalStream();
            console.log('Retrieved local stream:', localStream);
            if (localStream) {
              setLocalStream(localStream);
              if (localVideoRef.current) {
                localVideoRef.current.srcObject = localStream;
                console.log('Local video ref updated');
                localVideoRef.current.play().catch(e => {
                  console.log('Auto-play prevented, user interaction required:', e);
                });
              }
            }
          }, 100);
        }

      } catch (error) {
        console.error('Failed to initialize WebRTC:', error);
        toast.error('Failed to initialize video call');
      }
    };

    initializeWebRTC();

    return () => {
      webRTCService.destroy();
    };
  }, [roomId, permissionState]);

  // Check camera permission status (without requesting)
  useEffect(() => {
    const checkPermissions = async () => {
      try {
        // Check if browser supports camera
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          setPermissionError('❌ Your browser does not support camera access. Please use a modern browser like Chrome, Firefox, or Safari.');
          setPermissionState('denied');
          setShowPermissionModal(true);
          return;
        }

        // Check if we can query permissions (without requesting)
        if ('permissions' in navigator) {
          try {
            const cameraPermission = await navigator.permissions.query({ name: 'camera' as any });
            const micPermission = await navigator.permissions.query({ name: 'microphone' as any });
            
            console.log('Camera permission:', cameraPermission.state);
            console.log('Microphone permission:', micPermission.state);
            
            if (cameraPermission.state === 'denied' || micPermission.state === 'denied') {
              setPermissionState('denied');
              setPermissionError('🚫 Camera or microphone access was previously denied. Please enable permissions to continue.');
              setShowPermissionModal(true);
              return;
            }
            
            if (cameraPermission.state === 'granted' && micPermission.state === 'granted') {
              setPermissionState('granted');
              setPermissionError(null);
              return;
            }
            
            // If permissions are 'prompt', show permission modal for user to click
            setPermissionState('prompt');
            setPermissionError('🎥 Camera access is required for video calls. Click below to enable permissions.');
            setShowPermissionModal(true);
            
          } catch (permError) {
            console.log('Permission query not supported, will show permission modal');
            setPermissionState('unknown');
            setPermissionError('🎥 Camera access is required for video calls. Click below to enable permissions.');
            setShowPermissionModal(true);
          }
        } else {
          // Browser doesn't support permission query
          setPermissionState('unknown');
          setPermissionError('🎥 Camera access is required for video calls. Click below to enable permissions.');
          setShowPermissionModal(true);
        }
      } catch (error: any) {
        console.error('Permission check failed:', error);
        setPermissionError('❌ Failed to check camera permissions. Click below to try enabling access.');
        setPermissionState('unknown');
        setShowPermissionModal(true);
      }
    };

    checkPermissions();
  }, []);

  // Create WebRTC room when component mounts
  useEffect(() => {
    const createRoom = async () => {
      try {
        const room = await createWebRTCRoom();
        setRoomUrl(room.url);
        setRoomId(room.roomId);
        
        // If WebRTC is not configured, simulate connection
        if (!isApiConfigured.webrtc && !isApiConfigured.socketio) {
          setTimeout(() => {
            setIsCallActive(true);
            setParticipantCount(2);
            toast.success('Connected! (Demo Mode - Configure WebRTC signaling server for real video calls)');
          }, 1500);
        }
      } catch (error) {
        console.error('Failed to create room:', error);
        toast.error('Failed to create video room');
      }
    };

    createRoom();
  }, []);

  // Ensure chat starts closed on component mount
  useEffect(() => {
    setIsChatOpen(false);
    setUnreadCount(0);
  }, []);

  // Reset chat when partner changes
  useEffect(() => {
    setIsChatOpen(false);
    setUnreadCount(0);
  }, [currentPartnerIndex]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages]);

  // Simulate partner messages - only add to unread count, don't auto-open chat
  useEffect(() => {
    if (callDuration > 0) {
      const partnerMessages = [
        { delay: 5000, text: "Hey! Nice to meet you! 👋" },
        { delay: 15000, text: "Where are you from?" },
        {
          delay: 30000,
          text: "The video quality looks great!",
        },
        { delay: 45000, text: "Do you use this app often?" },
      ];

      const timeouts = partnerMessages.map((msg) =>
        setTimeout(() => {
          const message: ChatMessage = {
            id: Date.now().toString(),
            text: msg.text,
            sender: "partner",
            timestamp: new Date(),
          };
          setChatMessages((prev) => [...prev, message]);
          // Only increase unread count if chat is closed
          if (!isChatOpen) {
            setUnreadCount((prev) => prev + 1);
          }
        }, msg.delay),
      );

      return () => timeouts.forEach(clearTimeout);
    }
  }, [callDuration, isChatOpen]);

  // Clear unread count when chat is opened
  useEffect(() => {
    if (isChatOpen) {
      setUnreadCount(0);
    }
  }, [isChatOpen]);

  useEffect(() => {
    if (!user) {
      navigateTo("auth");
      return;
    }

    // Timer for call duration
    const timer = setInterval(() => {
      onDurationUpdate(callDuration + 1);
    }, 1000);

    // Check if tokens should be deducted (only when a premium user swipes)
    if (
      (user.isPremium || currentPartner?.isPremium) &&
      callDuration === 0
    ) {
      const tokensToDeduct = 8;

      if (user.isPremium) {
        if (user.tokens >= tokensToDeduct) {
          updateUser({ tokens: user.tokens - tokensToDeduct });
          setShowTokenDeduction(true);
          toast.info(
            `${tokensToDeduct} tokens deducted for premium match`,
          );
          setTimeout(() => setShowTokenDeduction(false), 3000);
        } else {
          toast.error("Insufficient tokens for premium match");
          navigateTo("wallet");
          return;
        }
      } else {
        toast.info(
          "Connected with a premium user - enjoy the enhanced experience!",
        );
      }
    }

    return () => clearInterval(timer);
  }, [
    callDuration,
    user,
    updateUser,
    navigateTo,
    onDurationUpdate,
  ]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleSwipeNext = async () => {
    if (user?.isPremium && user.tokens < 8) {
      toast.error("Insufficient tokens for next premium match");
      navigateTo("wallet");
      return;
    }

    // Show connecting state
    setIsConnecting(true);
    toast.success("Finding next person...");
    
    try {
      // Leave current WebRTC room
      await webRTCService.leaveRoom();

      // Delete current room
      if (roomId) {
        await deleteWebRTCRoom(roomId);
      }

      // Find new partner
      const newPartner = findRandomUser({ 
        country: null, 
        gender: null, 
        excludeId: user?.id 
      });
      setCurrentPartner(newPartner);

      // Create new WebRTC room
      const newRoom = await createWebRTCRoom();
      setRoomUrl(newRoom.url);
      setRoomId(newRoom.roomId);

      // Reset call state
      onDurationUpdate(0);
      setChatMessages([]);
      setIsChatOpen(false);
      setUnreadCount(0);
      setNewMessage("");

      // Join new WebRTC room
      setTimeout(async () => {
        try {
          const callbacks: WebRTCCallbacks = {
            onLocalStream: (stream: MediaStream) => {
              console.log('New local stream received:', stream);
              setLocalStream(stream);
              if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
                localVideoRef.current.play().catch(e => {
                  console.log('Auto-play prevented:', e);
                });
              }
            },
            onRemoteStream: (stream: MediaStream) => {
              setRemoteStream(stream);
              if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = stream;
              }
            },
            onUserJoined: (userId: string) => {
              setParticipantCount(prev => prev + 1);
              setIsCallActive(true);
              toast.success('Connected! Say hello!');
            },
            onUserLeft: (userId: string) => {
              setParticipantCount(prev => Math.max(0, prev - 1));
            },
            onConnectionStateChange: (state: RTCPeerConnectionState) => {
              if (state === 'connected') {
                setIsCallActive(true);
              }
            },
            onError: (error: Error) => {
              console.error('WebRTC error:', error);
              toast.error('Failed to connect to new person');
            }
          };
          
          await webRTCService.joinRoom(newRoom.roomId, callbacks);
          
          // Get local stream and display it immediately
          setTimeout(() => {
            const localStream = webRTCService.getLocalStream();
            if (localStream) {
              setLocalStream(localStream);
              if (localVideoRef.current) {
                localVideoRef.current.srcObject = localStream;
                localVideoRef.current.play().catch(e => {
                  console.log('Auto-play prevented:', e);
                });
              }
            }
          }, 100);
          
          setIsConnecting(false);
        } catch (error) {
          console.error('Failed to join new room:', error);
          setIsConnecting(false);
          toast.error("Failed to connect to new person");
        }
      }, 1500);

    } catch (error) {
      console.error('Error switching to next person:', error);
      setIsConnecting(false);
      toast.error("Failed to find next person");
    }
  };

  const handleSwipeStop = async () => {
    try {
      // Leave the WebRTC call
      await webRTCService.leaveRoom();

      // Delete the room
      if (roomId) {
        await deleteWebRTCRoom(roomId);
      }

      toast.info("Call ended");
      onDurationUpdate(0);
      
      // Reset all states
      setChatMessages([]);
      setIsChatOpen(false);
      setUnreadCount(0);
      setNewMessage("");
      setRoomUrl(null);
      setRoomId(null);
      setIsCallActive(false);
      setParticipantCount(0);
      setLocalStream(null);
      setRemoteStream(null);
      
      navigateTo("home");
    } catch (error) {
      console.error('Error ending call:', error);
      toast.error("Error ending call");
      navigateTo("home");
    }
  };

  const handleReport = () => {
    toast.success(
      "User reported. Thank you for keeping our community safe.",
    );
  };

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    const message: ChatMessage = {
      id: Date.now().toString(),
      text: newMessage.trim(),
      sender: "user",
      timestamp: new Date(),
    };

    setChatMessages((prev) => [...prev, message]);
    setNewMessage("");

    setTimeout(() => messageInputRef.current?.focus(), 100);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };

  const formatMessageTime = (timestamp: Date) => {
    return timestamp.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Only allow opening chat when user explicitly clicks the chat button
  const handleToggleChat = () => {
    const newChatState = !isChatOpen;
    setIsChatOpen(newChatState);
    // If opening chat, clear unread count immediately
    if (newChatState) {
      setUnreadCount(0);
    }
  };

  // Close chat only when user clicks close button
  const handleCloseChat = () => {
    setIsChatOpen(false);
  };

  // Handle camera enable with user interaction
  const handleEnableCamera = async () => {
    try {
      console.log('🎯 User clicked Enable Camera - requesting with user interaction');
      
      // Request camera with proper constraints
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
      
      console.log('✅ Camera enabled successfully!', stream);
      console.log('📹 Video tracks:', stream.getVideoTracks());
      console.log('🎤 Audio tracks:', stream.getAudioTracks());
      
      // Update states
      setPermissionState('granted');
      setPermissionError(null);
      setShowPermissionModal(false);
      
      // Set local stream immediately
      setLocalStream(stream);
      
      // Update video element
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        localVideoRef.current.play().catch(e => {
          console.log('Auto-play prevented:', e);
        });
      }
      
      // Pass stream to WebRTC service
      webRTCService.setLocalStream(stream);
      
      toast.success('🎉 Camera enabled! You can now see yourself in video calls.');
      
    } catch (error: any) {
      console.error('❌ Camera enable failed:', error);
      
      let errorMessage = 'Failed to enable camera';
      let toastMessage = 'Camera access failed';
      
      switch (error.name) {
        case 'NotAllowedError':
          errorMessage = '🚫 Camera permission denied. Please click "Allow" when prompted, or enable camera manually in browser settings (look for 🎥 icon in address bar).';
          toastMessage = 'Permission denied. Please allow camera access.';
          break;
        case 'NotFoundError':
          errorMessage = '📷 No camera device found. Please connect a camera and try again.';
          toastMessage = 'No camera found. Please connect a camera.';
          break;
        case 'NotReadableError':
          errorMessage = '🔒 Camera is being used by another application. Please close other video apps (Zoom, Skype, etc.) and try again.';
          toastMessage = 'Camera in use. Close other video apps.';
          break;
        case 'OverconstrainedError':
          errorMessage = '⚙️ Camera settings not supported. Trying basic settings...';
          toastMessage = 'Trying basic camera settings...';
          
          // Try with basic constraints
          try {
            console.log('🔄 Trying basic camera constraints...');
            const basicStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            
            setPermissionState('granted');
            setPermissionError(null);
            setShowPermissionModal(false);
            setLocalStream(basicStream);
            
            if (localVideoRef.current) {
              localVideoRef.current.srcObject = basicStream;
              localVideoRef.current.play().catch(e => console.log('Auto-play prevented:', e));
            }
            
            webRTCService.setLocalStream(basicStream);
            toast.success('🎉 Camera enabled with basic settings!');
            return;
            
          } catch (basicError) {
            errorMessage = '❌ Camera failed even with basic settings. Please check your device.';
            toastMessage = 'Camera failed with basic settings too.';
          }
          break;
        default:
          errorMessage = `❌ Camera error: ${error.message}`;
          toastMessage = 'Camera error: ' + error.message;
      }
      
      setPermissionError(errorMessage);
      toast.error(toastMessage);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-black flex flex-col relative overflow-hidden">
      {/* Video Area (Full Screen) */}
      <div className="flex-1 relative bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
        {/* Video Feed Display */}
        <div className="w-full h-full flex items-center justify-center">
          {isConnecting ? (
            // Show connecting state
            <div className="text-center text-white/80">
              <div className="w-32 h-32 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                <div className="w-24 h-24 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
                  <Video className="w-12 h-12 text-white animate-bounce" />
                </div>
              </div>
              <p className="text-lg font-medium">
                Connecting...
              </p>
              <p className="text-sm text-white/60">
                Finding your next match
              </p>
            </div>
          ) : isChatOpen ? (
            // Show your own screen when chat is open
            <div className="text-center text-white/80">
              <div className="w-32 h-32 bg-gradient-to-br from-slate-600 to-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <Video className="w-16 h-16 text-white" />
              </div>
              <p className="text-lg font-medium">
                Your Screen
              </p>
              <p className="text-sm text-white/60">
                Chat is open - Your video feed
              </p>
            </div>
          ) : (
            // Show partner's screen when chat is closed
            <div className="text-center text-white/80">
              <div className="w-32 h-32 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center mx-auto mb-4">
                <Video className="w-16 h-16 text-white" />
              </div>
              <p className="text-lg font-medium">
                {currentPartner?.name || 'Unknown User'}
              </p>
              <p className="text-sm text-white/60">
                {isCallActive 
                  ? (isApiConfigured.webrtc ? 'WebRTC video call active' : 'Demo mode - Video call simulated')
                  : 'Establishing connection...'
                }
              </p>
              {roomUrl && (
                <div className="mt-4">
                  <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    muted={false}
                    className="w-full max-w-sm rounded-lg border-2 border-white/20"
                    style={{ transform: 'scaleX(-1)' }}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Top Info Bar */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
          {/* Partner Info */}
          <div className="flex items-center gap-2">
            <Badge className="glass-strong text-white border-white/20 bg-black/30">
              <Globe className="w-3 h-3 mr-1" />
              {currentPartner?.country || 'Unknown'}
            </Badge>
            <Badge className="glass-strong text-white border-white/20 bg-black/30">
              <Users className="w-3 h-3 mr-1" />
              {currentPartner?.gender || 'Unknown'}
            </Badge>
            <Badge className={`text-white border-0 ${isCallActive ? 'bg-green-500' : 'bg-red-500'}`}>
              <Phone className="w-3 h-3 mr-1" />
              {isCallActive ? 'Connected' : 'Connecting...'}
            </Badge>
          </div>

          {/* Timer & Token Info */}
          <div className="flex items-center gap-2">
            <Badge className="glass-strong text-white border-white/20 bg-black/30">
              {formatTime(callDuration)}
            </Badge>
            {user.isPremium && (
              <Badge className="glass-strong text-white border-white/20 bg-black/30">
                <Coins className="w-3 h-3 mr-1 text-accent" />
                {user.tokens}
              </Badge>
            )}
          </div>
        </div>

        {/* Token Deduction Toast */}
        {showTokenDeduction && (
          <div className="absolute top-16 left-4 right-4">
            <Card className="glass-strong bg-black/50 border-accent/30 p-3">
              <div className="flex items-center gap-2 text-white">
                <Coins className="w-4 h-4 text-accent" />
                <span className="text-sm">
                  8 tokens deducted for premium match
                </span>
              </div>
            </Card>
          </div>
        )}

        {/* Camera Debug Button */}
        <button
          onClick={() => setShowCameraDebug(!showCameraDebug)}
          className="absolute top-4 right-16 w-8 h-8 bg-black/50 hover:bg-black/70 text-white/60 hover:text-white rounded-md border border-white/20 transition-colors"
          title="Debug Camera"
        >
          🎥
        </button>

        {/* Permission Modal */}
        {showPermissionModal && (
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
                  <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">How to enable camera access:</h4>
                  <ol className="list-decimal list-inside space-y-1 text-blue-800 dark:text-blue-200">
                    <li>Click the camera icon in your browser's address bar</li>
                    <li>Select "Allow" for camera and microphone</li>
                    <li>Refresh the page if needed</li>
                  </ol>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={async () => {
                    try {
                      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                      setPermissionState('granted');
                      setPermissionError(null);
                      setShowPermissionModal(false);
                      stream.getTracks().forEach(track => track.stop());
                      toast.success('Camera access granted!');
                      // Restart the video call setup
                      window.location.reload();
                    } catch (error: any) {
                      if (error.name === 'NotAllowedError') {
                        setPermissionError('Please click "Allow" when prompted, or enable camera in browser settings.');
                      } else {
                        setPermissionError(`Failed to access camera: ${error.message}`);
                      }
                    }
                  }}
                  className="flex-1 bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  🎥 Enable Camera
                </button>
                <button
                  onClick={() => setShowPermissionModal(false)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white transition-colors"
                >
                  Skip
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Camera Debug Panel */}
        {showCameraDebug && (
          <div className="absolute top-16 right-4 bg-black/95 text-white p-4 rounded-lg border border-white/20 max-w-xs text-xs space-y-2 z-40">
            <h3 className="font-medium mb-2">Camera Debug</h3>
            <p>Permission: {permissionState}</p>
            <p>Local Stream: {localStream ? '✅ Active' : '❌ Inactive'}</p>
            <p>Video Tracks: {localStream?.getVideoTracks().length || 0}</p>
            <p>Audio Tracks: {localStream?.getAudioTracks().length || 0}</p>
            <p>getUserMedia: {typeof navigator.mediaDevices?.getUserMedia === 'function' ? '✅' : '❌'}</p>
            <p>HTTPS: {location.protocol === 'https:' ? '✅' : '❌'}</p>
            {localStream && (
              <>
                <p>Video Enabled: {localStream.getVideoTracks()[0]?.enabled ? '✅' : '❌'}</p>
                <p>Video State: {localStream.getVideoTracks()[0]?.readyState || 'N/A'}</p>
              </>
            )}
            {permissionError && (
              <p className="text-red-400 text-xs mt-2">{permissionError}</p>
            )}
            <div className="flex gap-2 mt-3">
              <button
                onClick={async () => {
                  try {
                    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                    setLocalStream(stream);
                    setPermissionState('granted');
                    setPermissionError(null);
                    if (localVideoRef.current) {
                      localVideoRef.current.srcObject = stream;
                      localVideoRef.current.play();
                    }
                    toast.success('Camera reinitialized');
                  } catch (error: any) {
                    setPermissionError(error.message);
                    toast.error('Camera failed: ' + error.message);
                  }
                }}
                className="flex-1 bg-primary hover:bg-primary/90 text-white px-2 py-1 rounded text-xs"
              >
                Test Camera
              </button>
              <button
                onClick={() => setShowPermissionModal(true)}
                className="px-2 py-1 bg-gray-600 hover:bg-gray-500 text-white rounded text-xs"
              >
                Help
              </button>
            </div>
          </div>
        )}

        {/* Self Video (PIP) - Enhanced */}
        <div className="absolute bottom-20 right-4 w-32 h-40 bg-gradient-to-br from-slate-700 to-slate-800 rounded-xl border-2 border-white/30 overflow-hidden shadow-lg">
          {localStream && !isVideoOff ? (
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              style={{ transform: 'scaleX(-1)' }}
              onLoadedMetadata={() => {
                console.log('Local video metadata loaded');
                if (localVideoRef.current) {
                  localVideoRef.current.play().catch(e => {
                    console.log('Auto-play prevented:', e);
                  });
                }
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              {isVideoOff ? (
                <div className="text-center text-white/60">
                  <VideoOff className="w-8 h-8 mx-auto mb-1" />
                  <p className="text-xs">Camera Off</p>
                </div>
              ) : (
                <div className="text-center text-white/60">
                  <Video className="w-8 h-8 mx-auto mb-1 animate-pulse" />
                  <p className="text-xs">Loading...</p>
                </div>
              )}
            </div>
          )}
          {/* Corner label and status */}
          <div className="absolute top-1 left-1 bg-black/50 text-white text-xs px-1 rounded">
            You
          </div>
          <div className="absolute top-1 right-1">
            {localStream ? (
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" title="Camera Active" />
            ) : (
              <div className="w-2 h-2 bg-red-400 rounded-full" title="Camera Inactive" />
            )}
          </div>
        </div>

        {/* Chat Tab - Only opens when clicked, shows as closed initially */}
        <div className="absolute top-1/2 right-0 transform -translate-y-1/2">
          <Button
            onClick={handleToggleChat}
            className={`h-16 w-12 rounded-l-xl rounded-r-none relative transition-all duration-300 ${
              isChatOpen
                ? "bg-primary hover:bg-primary/90 text-white shadow-lg"
                : "bg-black/60 hover:bg-black/80 text-white/80 hover:text-white border-l border-t border-b border-white/20 hover:border-white/40"
            }`}
          >
            <div className="flex flex-col items-center gap-1">
              <MessageCircle className="w-5 h-5" />
              <span className="text-xs rotate-90 whitespace-nowrap">
                Chat
              </span>
              {unreadCount > 0 && !isChatOpen && (
                <div className="absolute -top-1 -left-1 w-5 h-5 bg-accent rounded-full flex items-center justify-center animate-pulse">
                  <span className="text-xs text-white font-medium">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                </div>
              )}
            </div>
          </Button>
        </div>

        {/* Chat Panel - Completely hidden when closed, only visible when explicitly opened */}
        {isChatOpen && (
          <div className="absolute top-0 right-0 h-full w-80 transform transition-all duration-300 ease-in-out z-50">
            <div className="h-full glass-strong bg-black/95 border-l border-white/20 flex flex-col shadow-2xl">
              {/* Chat Header */}
              <div className="flex items-center justify-between p-4 border-b border-white/20">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
                    <MessageCircle className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-medium text-sm">
                      Chat with {currentPartner?.name || 'Unknown User'}
                    </h3>
                    <p className="text-white/60 text-xs">
                      Online now
                    </p>
                  </div>
                </div>
                {/* Enhanced Close Button with Red Color */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCloseChat}
                  className="w-8 h-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/20 transition-colors duration-200 rounded-md"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Messages Area */}
              <ScrollArea className="flex-1 px-4 py-2">
                <div className="space-y-3">
                  {chatMessages.length === 0 ? (
                    <div className="text-center text-white/60 py-8">
                      <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No messages yet</p>
                      <p className="text-xs">
                        Start the conversation!
                      </p>
                    </div>
                  ) : (
                    chatMessages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[75%] rounded-lg px-3 py-2 ${
                            message.sender === "user"
                              ? "bg-primary text-white"
                              : "bg-white/20 text-white"
                          }`}
                        >
                          <p className="text-sm">
                            {message.text}
                          </p>
                          <p
                            className={`text-xs mt-1 ${
                              message.sender === "user"
                                ? "text-white/70"
                                : "text-white/50"
                            }`}
                          >
                            {formatMessageTime(message.timestamp)}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={chatEndRef} />
                </div>
              </ScrollArea>

              {/* Message Input */}
              <div className="p-4 border-t border-white/20">
                <div className="flex gap-2">
                  <Input
                    ref={messageInputRef}
                    value={newMessage}
                    onChange={(e) =>
                      setNewMessage(e.target.value)
                    }
                    onKeyPress={handleKeyPress}
                    placeholder="Type a message..."
                    className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-primary"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                    size="sm"
                    className="bg-primary hover:bg-primary/90 px-3"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Controls */}
      <div className="bg-black/80 backdrop-blur-md p-4 space-y-4">
        {/* Primary Actions */}
        <div className="flex items-center justify-center gap-4">
          <Button
            onClick={handleSwipeStop}
            size="lg"
            variant="destructive"
            className="flex-1 h-12"
            disabled={isConnecting}
          >
            Stop & Exit
          </Button>

          <Button
            onClick={handleSwipeNext}
            size="lg"
            className="flex-1 h-12 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
            disabled={isConnecting}
          >
            {isConnecting ? "Connecting..." : "Next Person"}
          </Button>
        </div>

        {/* Secondary Controls */}
        <div className="flex items-center justify-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              const newMutedState = !isMuted;
              setIsMuted(newMutedState);
              try {
                await webRTCService.toggleAudio(!newMutedState);
              } catch (error) {
                console.error('Failed to toggle microphone:', error);
              }
            }}
            className={`w-12 h-12 p-0 glass-strong border-white/20 ${
              isMuted
                ? "bg-destructive/20 text-destructive"
                : "text-white"
            }`}
          >
            {isMuted ? (
              <MicOff className="w-5 h-5" />
            ) : (
              <Mic className="w-5 h-5" />
            )}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              const newVideoState = !isVideoOff;
              setIsVideoOff(newVideoState);
              try {
                await webRTCService.toggleVideo(!newVideoState);
              } catch (error) {
                console.error('Failed to toggle camera:', error);
              }
            }}
            className={`w-12 h-12 p-0 glass-strong border-white/20 ${
              isVideoOff
                ? "bg-destructive/20 text-destructive"
                : "text-white"
            }`}
          >
            {isVideoOff ? (
              <VideoOff className="w-5 h-5" />
            ) : (
              <Video className="w-5 h-5" />
            )}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleReport}
            className="w-12 h-12 p-0 glass-strong border-white/20 text-white hover:bg-destructive/20 hover:text-destructive"
          >
            <Flag className="w-5 h-5" />
          </Button>
        </div>

        {/* Helper Text */}
        <p className="text-center text-xs text-white/60">
          {user.isPremium
            ? "Swipe next to meet someone new or stop to return home"
            : "Free account - unlimited video chats with global matching"}
        </p>
      </div>
    </div>
  );
}