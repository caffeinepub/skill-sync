import { useRef, useState, useEffect, useCallback } from 'react';

export type ConnectionState = 
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'failed';

export interface WebRTCPeerConfig {
  onIceCandidate?: (candidate: string) => void;
  onConnectionStateChange?: (state: ConnectionState) => void;
  onRemoteStream?: (stream: MediaStream) => void;
}

export interface WebRTCPeerReturn {
  connectionState: ConnectionState;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  error: string | null;
  
  initializeLocalStream: () => Promise<boolean>;
  createOffer: () => Promise<string | null>;
  createAnswer: (offer: string) => Promise<string | null>;
  setRemoteOffer: (offer: string) => Promise<boolean>;
  setRemoteAnswer: (answer: string) => Promise<boolean>;
  addRemoteIceCandidate: (candidate: string) => Promise<boolean>;
  closeConnection: () => void;
  
  localVideoRef: React.RefObject<HTMLVideoElement>;
  remoteVideoRef: React.RefObject<HTMLVideoElement>;
}

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

export function useWebRTCPeer(config?: WebRTCPeerConfig): WebRTCPeerReturn {
  const [connectionState, setConnectionState] = useState<ConnectionState>('idle');
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null!);
  const remoteVideoRef = useRef<HTMLVideoElement>(null!);
  const pendingIceCandidatesRef = useRef<string[]>([]);

  const updateConnectionState = useCallback((state: ConnectionState) => {
    setConnectionState(state);
    config?.onConnectionStateChange?.(state);
  }, [config]);

  const initializePeerConnection = useCallback(() => {
    if (peerConnectionRef.current) {
      return peerConnectionRef.current;
    }

    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        const candidateStr = JSON.stringify(event.candidate.toJSON());
        config?.onIceCandidate?.(candidateStr);
      }
    };

    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
        config?.onRemoteStream?.(event.streams[0]);
        
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      }
    };

    pc.oniceconnectionstatechange = () => {
      const state = pc.iceConnectionState;
      
      if (state === 'connected' || state === 'completed') {
        updateConnectionState('connected');
      } else if (state === 'disconnected') {
        updateConnectionState('disconnected');
      } else if (state === 'failed') {
        updateConnectionState('failed');
        setError('Connection failed');
      } else if (state === 'checking' || state === 'new') {
        updateConnectionState('connecting');
      }
    };

    peerConnectionRef.current = pc;
    return pc;
  }, [config, updateConnectionState]);

  const initializeLocalStream = useCallback(async (): Promise<boolean> => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      
      setLocalStream(stream);
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      const pc = initializePeerConnection();
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });

      return true;
    } catch (err: any) {
      const errorMsg = err.name === 'NotAllowedError' 
        ? 'Camera/microphone permission denied'
        : err.name === 'NotFoundError'
        ? 'No camera/microphone found'
        : 'Failed to access camera/microphone';
      
      setError(errorMsg);
      return false;
    }
  }, [initializePeerConnection]);

  const createOffer = useCallback(async (): Promise<string | null> => {
    try {
      const pc = initializePeerConnection();
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      return JSON.stringify(offer);
    } catch (err) {
      setError('Failed to create offer');
      return null;
    }
  }, [initializePeerConnection]);

  const setRemoteOffer = useCallback(async (offerStr: string): Promise<boolean> => {
    try {
      const pc = initializePeerConnection();
      const offer = JSON.parse(offerStr);
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      
      // Process pending ICE candidates
      for (const candidateStr of pendingIceCandidatesRef.current) {
        try {
          const candidate = JSON.parse(candidateStr);
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.warn('Failed to add pending ICE candidate:', e);
        }
      }
      pendingIceCandidatesRef.current = [];
      
      return true;
    } catch (err) {
      setError('Failed to set remote offer');
      return false;
    }
  }, [initializePeerConnection]);

  const createAnswer = useCallback(async (offerStr: string): Promise<string | null> => {
    try {
      await setRemoteOffer(offerStr);
      const pc = peerConnectionRef.current;
      if (!pc) return null;
      
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      return JSON.stringify(answer);
    } catch (err) {
      setError('Failed to create answer');
      return null;
    }
  }, [setRemoteOffer]);

  const setRemoteAnswer = useCallback(async (answerStr: string): Promise<boolean> => {
    try {
      const pc = peerConnectionRef.current;
      if (!pc) return false;
      
      const answer = JSON.parse(answerStr);
      await pc.setRemoteDescription(new RTCSessionDescription(answer));
      
      // Process pending ICE candidates
      for (const candidateStr of pendingIceCandidatesRef.current) {
        try {
          const candidate = JSON.parse(candidateStr);
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.warn('Failed to add pending ICE candidate:', e);
        }
      }
      pendingIceCandidatesRef.current = [];
      
      return true;
    } catch (err) {
      setError('Failed to set remote answer');
      return false;
    }
  }, []);

  const addRemoteIceCandidate = useCallback(async (candidateStr: string): Promise<boolean> => {
    try {
      const pc = peerConnectionRef.current;
      if (!pc || !pc.remoteDescription) {
        // Queue candidates until remote description is set
        pendingIceCandidatesRef.current.push(candidateStr);
        return true;
      }
      
      const candidate = JSON.parse(candidateStr);
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
      return true;
    } catch (err) {
      console.warn('Failed to add ICE candidate:', err);
      return false;
    }
  }, []);

  const closeConnection = useCallback(() => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    
    setRemoteStream(null);
    pendingIceCandidatesRef.current = [];
    updateConnectionState('idle');
    setError(null);
  }, [localStream, updateConnectionState]);

  useEffect(() => {
    return () => {
      closeConnection();
    };
  }, [closeConnection]);

  return {
    connectionState,
    localStream,
    remoteStream,
    error,
    initializeLocalStream,
    createOffer,
    createAnswer,
    setRemoteOffer,
    setRemoteAnswer,
    addRemoteIceCandidate,
    closeConnection,
    localVideoRef,
    remoteVideoRef,
  };
}
