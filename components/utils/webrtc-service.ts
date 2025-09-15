// WebRTC Video Calling Service
// Replaces Daily.co with native WebRTC + Socket.io for real-time communication

export interface WebRTCConfig {
  iceServers: RTCIceServer[];
}

export interface SignalingMessage {
  type: 'offer' | 'answer' | 'ice-candidate' | 'join-room' | 'leave-room' | 'user-joined' | 'user-left';
  roomId: string;
  userId: string;
  data?: any;
}

export interface WebRTCCallbacks {
  onRemoteStream?: (stream: MediaStream) => void;
  onLocalStream?: (stream: MediaStream) => void;
  onUserJoined?: (userId: string) => void;
  onUserLeft?: (userId: string) => void;
  onConnectionStateChange?: (state: RTCPeerConnectionState) => void;
  onError?: (error: Error) => void;
}

class WebRTCService {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private socket: MockSocket | null = null;
  private roomId: string | null = null;
  private userId: string;
  private callbacks: WebRTCCallbacks = {};

  private config: WebRTCConfig = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
    ]
  };

  constructor() {
    this.userId = this.generateUserId();
  }

  private generateUserId(): string {
    return 'user-' + Math.random().toString(36).substr(2, 9);
  }

  private generateRoomId(): string {
    return 'room-' + Math.random().toString(36).substr(2, 9);
  }

  public async createRoom(): Promise<{ roomId: string; url: string }> {
    const roomId = this.generateRoomId();
    return {
      roomId,
      url: `wss://swipx-signaling.io/${roomId}`
    };
  }

  public async joinRoom(roomId: string, callbacks: WebRTCCallbacks = {}): Promise<void> {
    this.roomId = roomId;
    this.callbacks = callbacks;

    try {
      console.log('🔗 Joining WebRTC room without automatic camera request');

      // Initialize Socket.io connection (mocked)
      this.socket = new MockSocket();
      this.setupSocketListeners();

      // Initialize WebRTC peer connection
      await this.initializePeerConnection();

      // Join the room via signaling server
      this.socket.emit('join-room', {
        type: 'join-room',
        roomId,
        userId: this.userId,
        data: { name: 'User' }
      });

      // Trigger callback for local stream if available
      setTimeout(() => {
        if (this.localStream && this.callbacks.onLocalStream) {
          console.log('Triggering local stream callback');
          this.callbacks.onLocalStream(this.localStream);
        }
      }, 100);

      console.log('✅ WebRTC room joined successfully (without camera)');

    } catch (error) {
      console.error('Failed to join room:', error);
      this.callbacks.onError?.(error as Error);
    }
  }

  public async requestCameraAccess(): Promise<MediaStream | null> {
    try {
      console.log('📷 Manual camera access requested');
      await this.getUserMedia();
      
      // Add tracks to peer connection if available
      if (this.peerConnection && this.localStream) {
        console.log('🔗 Adding tracks to peer connection');
        this.localStream.getTracks().forEach(track => {
          this.peerConnection!.addTrack(track, this.localStream!);
        });
      }
      
      return this.localStream;
    } catch (error) {
      console.error('Failed to get camera access:', error);
      throw error;
    }
  }

  public setLocalStream(stream: MediaStream): void {
    console.log('🎥 Setting local stream manually');
    this.localStream = stream;
    
    // Add tracks to peer connection if available
    if (this.peerConnection) {
      console.log('🔗 Adding manually set stream tracks to peer connection');
      stream.getTracks().forEach(track => {
        this.peerConnection!.addTrack(track, stream);
      });
    }
    
    // Trigger callback
    if (this.callbacks.onLocalStream) {
      this.callbacks.onLocalStream(stream);
    }
  }

  private async initializePeerConnection(): Promise<void> {
    // Check if RTCPeerConnection is available
    if (!window.RTCPeerConnection) {
      throw new Error('WebRTC not supported in this browser');
    }

    this.peerConnection = new RTCPeerConnection(this.config);

    // Handle incoming remote stream
    this.peerConnection.ontrack = (event) => {
      const remoteStream = event.streams[0];
      this.callbacks.onRemoteStream?.(remoteStream);
    };

    // Handle ICE candidates
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate && this.socket) {
        this.socket.emit('ice-candidate', {
          type: 'ice-candidate',
          roomId: this.roomId!,
          userId: this.userId,
          data: event.candidate
        });
      }
    };

    // Handle connection state changes
    this.peerConnection.onconnectionstatechange = () => {
      const state = this.peerConnection?.connectionState;
      if (state) {
        this.callbacks.onConnectionStateChange?.(state);
      }
    };
  }

  private async getUserMedia(): Promise<void> {
    try {
      // Check if getUserMedia is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.warn('getUserMedia not supported, using fallback');
        this.localStream = await this.createFallbackStream();
        return;
      }

      // Check if we're on HTTPS (required for camera access)
      if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
        console.warn('Camera access requires HTTPS. Current protocol:', location.protocol);
        throw new Error('Camera access requires HTTPS connection');
      }

      console.log('Requesting camera and microphone access...');
      
      // First try with ideal settings
      try {
        this.localStream = await navigator.mediaDevices.getUserMedia({
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
      } catch (constraintError) {
        console.warn('Ideal constraints failed, trying basic settings:', constraintError);
        // Fallback to basic settings
        this.localStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });
      }

      console.log('Camera access granted:', this.localStream);
      console.log('Video tracks:', this.localStream.getVideoTracks());
      console.log('Audio tracks:', this.localStream.getAudioTracks());

      // Validate that we actually got tracks
      if (this.localStream.getVideoTracks().length === 0) {
        throw new Error('No video track received');
      }
      if (this.localStream.getAudioTracks().length === 0) {
        console.warn('No audio track received');
      }

      // Add local stream to peer connection if available
      if (this.peerConnection && this.localStream) {
        this.localStream.getTracks().forEach(track => {
          this.peerConnection!.addTrack(track, this.localStream!);
        });
      }
    } catch (error: any) {
      console.error('Could not access camera/microphone:', error);
      
      // Provide specific error messages
      let errorMessage = 'Unknown camera error';
      if (error.name === 'NotAllowedError') {
        errorMessage = 'Camera permission was denied. Please allow camera access and reload the page.';
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'No camera or microphone found. Please connect a camera and microphone.';
      } else if (error.name === 'NotReadableError') {
        errorMessage = 'Camera is already in use by another application. Please close other video apps.';
      } else if (error.name === 'OverconstrainedError') {
        errorMessage = 'Camera does not support the required settings.';
      } else if (error.name === 'SecurityError') {
        errorMessage = 'Camera access blocked due to security restrictions. Please use HTTPS.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      console.error('Camera error:', errorMessage);
      
      // Try to create fallback stream, but also notify about the error
      try {
        this.localStream = await this.createFallbackStream();
        // Still call the error callback to notify the UI
        this.callbacks.onError?.(new Error(errorMessage));
      } catch (fallbackError) {
        console.error('Fallback stream creation failed:', fallbackError);
        this.callbacks.onError?.(new Error(errorMessage));
      }
    }
  }

  private async createFallbackStream(): Promise<MediaStream> {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 480;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#666';
      ctx.font = '20px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Camera not available', canvas.width / 2, canvas.height / 2);

      // Check if captureStream is available
      if (!canvas.captureStream) {
        // Return empty stream if captureStream not supported
        return new MediaStream();
      }

      const videoStream = canvas.captureStream(30);
      
      // Create silent audio track
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const destination = audioContext.createMediaStreamDestination();
        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();
        gain.gain.setValueAtTime(0, audioContext.currentTime);
        oscillator.connect(gain);
        gain.connect(destination);
        oscillator.start();

        // Combine video and audio
        const combinedStream = new MediaStream();
        videoStream.getVideoTracks().forEach(track => combinedStream.addTrack(track));
        destination.stream.getAudioTracks().forEach(track => combinedStream.addTrack(track));

        return combinedStream;
      } catch (audioError) {
        console.warn('Could not create audio context, using video only:', audioError);
        return videoStream;
      }
    } catch (error) {
      console.warn('Could not create fallback stream:', error);
      return new MediaStream();
    }
  }

  private setupSocketListeners(): void {
    if (!this.socket) return;

    this.socket.on('user-joined', (message: SignalingMessage) => {
      console.log('User joined:', message.userId);
      this.callbacks.onUserJoined?.(message.userId);
      // Initiate offer to new user
      this.createOffer();
    });

    this.socket.on('user-left', (message: SignalingMessage) => {
      console.log('User left:', message.userId);
      this.callbacks.onUserLeft?.(message.userId);
    });

    this.socket.on('offer', async (message: SignalingMessage) => {
      if (this.peerConnection) {
        await this.peerConnection.setRemoteDescription(message.data);
        const answer = await this.peerConnection.createAnswer();
        await this.peerConnection.setLocalDescription(answer);
        
        this.socket!.emit('answer', {
          type: 'answer',
          roomId: this.roomId!,
          userId: this.userId,
          data: answer
        });
      }
    });

    this.socket.on('answer', async (message: SignalingMessage) => {
      if (this.peerConnection) {
        await this.peerConnection.setRemoteDescription(message.data);
      }
    });

    this.socket.on('ice-candidate', async (message: SignalingMessage) => {
      if (this.peerConnection) {
        await this.peerConnection.addIceCandidate(message.data);
      }
    });
  }

  private async createOffer(): Promise<void> {
    if (!this.peerConnection || !this.socket) return;

    try {
      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);
      
      this.socket.emit('offer', {
        type: 'offer',
        roomId: this.roomId!,
        userId: this.userId,
        data: offer
      });
    } catch (error) {
      console.error('Failed to create offer:', error);
    }
  }

  public getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  public async toggleAudio(enabled: boolean): Promise<void> {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach(track => {
        track.enabled = enabled;
      });
    }
  }

  public async toggleVideo(enabled: boolean): Promise<void> {
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach(track => {
        track.enabled = enabled;
      });
    }
  }

  public async leaveRoom(): Promise<void> {
    if (this.socket && this.roomId) {
      this.socket.emit('leave-room', {
        type: 'leave-room',
        roomId: this.roomId,
        userId: this.userId,
        data: {}
      });
    }

    // Close peer connection
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    // Stop local stream
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    // Disconnect socket
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    this.roomId = null;
  }

  public destroy(): void {
    this.leaveRoom();
  }
}

// Mock Socket.io implementation for demo/development
class MockSocket {
  private listeners: Map<string, Function[]> = new Map();
  private connected: boolean = false;

  constructor() {
    // Simulate connection after a delay
    setTimeout(() => {
      this.connected = true;
      console.log('Mock Socket.io connected');
    }, 1000);
  }

  public emit(event: string, data: SignalingMessage): void {
    console.log('Mock Socket emit:', event, data);
    
    // Simulate signaling responses
    setTimeout(() => {
      if (event === 'join-room') {
        // Simulate another user joining
        this.trigger('user-joined', {
          type: 'user-joined',
          roomId: data.roomId,
          userId: 'mock-partner-' + Math.random().toString(36).substr(2, 4),
          data: { name: 'Mock Partner' }
        });
      }
    }, 2000);
  }

  public on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  public off(event: string, callback?: Function): void {
    if (callback) {
      const callbacks = this.listeners.get(event) || [];
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    } else {
      this.listeners.delete(event);
    }
  }

  private trigger(event: string, data: SignalingMessage): void {
    const callbacks = this.listeners.get(event) || [];
    callbacks.forEach(callback => callback(data));
  }

  public disconnect(): void {
    this.connected = false;
    this.listeners.clear();
    console.log('Mock Socket.io disconnected');
  }

  public isConnected(): boolean {
    return this.connected;
  }
}

// Singleton instance
export const webRTCService = new WebRTCService();
export default WebRTCService;