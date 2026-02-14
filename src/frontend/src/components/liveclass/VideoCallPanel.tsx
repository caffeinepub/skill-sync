import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Video, VideoOff, Phone, PhoneOff, Loader2 } from 'lucide-react';
import { useWebRTCPeer } from '../../hooks/useWebRTCPeer';
import type { Call } from '../../backend';

interface VideoCallPanelProps {
  callId: bigint | null;
  activeCall: Call | null;
  isInitiator: boolean;
  onStartCall: (offer: string) => Promise<void>;
  onAnswerCall: (answer: string) => Promise<void>;
  onIceCandidate: (candidate: string) => Promise<void>;
  onEndCall: () => Promise<void>;
  connectionStatus: string;
  disabled?: boolean;
}

export default function VideoCallPanel({
  callId,
  activeCall,
  isInitiator,
  onStartCall,
  onAnswerCall,
  onIceCandidate,
  onEndCall,
  connectionStatus,
  disabled = false,
}: VideoCallPanelProps) {
  const [isInitializing, setIsInitializing] = useState(false);
  const [hasProcessedOffer, setHasProcessedOffer] = useState(false);
  const [hasProcessedAnswer, setHasProcessedAnswer] = useState(false);

  const {
    connectionState,
    error,
    initializeLocalStream,
    createOffer,
    createAnswer,
    setRemoteAnswer,
    addRemoteIceCandidate,
    closeConnection,
    localVideoRef,
    remoteVideoRef,
  } = useWebRTCPeer({
    onIceCandidate,
  });

  const isCallActive = callId !== null;
  const showLocalVideo = connectionState !== 'idle';
  const showRemoteVideo = connectionState === 'connected';

  const handleStartCall = async () => {
    if (disabled) return;
    
    setIsInitializing(true);
    const success = await initializeLocalStream();
    
    if (success) {
      const offer = await createOffer();
      if (offer) {
        await onStartCall(offer);
      }
    }
    setIsInitializing(false);
  };

  useEffect(() => {
    if (!isInitiator && activeCall?.offer && !hasProcessedOffer && connectionState === 'idle') {
      setHasProcessedOffer(true);
      
      (async () => {
        setIsInitializing(true);
        const streamSuccess = await initializeLocalStream();
        
        if (streamSuccess && activeCall.offer) {
          const answer = await createAnswer(activeCall.offer);
          if (answer) {
            await onAnswerCall(answer);
          }
        }
        setIsInitializing(false);
      })();
    }
  }, [isInitiator, activeCall?.offer, hasProcessedOffer, connectionState, initializeLocalStream, createAnswer, onAnswerCall]);

  useEffect(() => {
    if (isInitiator && activeCall?.answer && !hasProcessedAnswer) {
      setHasProcessedAnswer(true);
      setRemoteAnswer(activeCall.answer);
    }
  }, [isInitiator, activeCall?.answer, hasProcessedAnswer, setRemoteAnswer]);

  useEffect(() => {
    if (!activeCall) return;

    const candidates = isInitiator 
      ? activeCall.calleeIceCandidates 
      : activeCall.callerIceCandidates;

    candidates.forEach(candidate => {
      addRemoteIceCandidate(candidate);
    });
  }, [activeCall, isInitiator, addRemoteIceCandidate]);

  useEffect(() => {
    if (!isCallActive && connectionState !== 'idle') {
      closeConnection();
      setHasProcessedOffer(false);
      setHasProcessedAnswer(false);
    }
  }, [isCallActive, connectionState, closeConnection]);

  const handleEndCall = async () => {
    await onEndCall();
    closeConnection();
    setHasProcessedOffer(false);
    setHasProcessedAnswer(false);
  };

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Video className="h-5 w-5" />
          Video Session
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="text-center text-sm text-muted-foreground">
          {connectionStatus}
        </div>

        <div className="space-y-4">
          <div className="relative aspect-video bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg overflow-hidden border-2 border-border">
            {showRemoteVideo ? (
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center space-y-2">
                  <VideoOff className="h-12 w-12 mx-auto text-muted-foreground" />
                  <p className="text-muted-foreground">
                    {isCallActive ? 'Waiting for peer...' : 'No active call'}
                  </p>
                </div>
              </div>
            )}

            {showLocalVideo && (
              <div className="absolute bottom-4 right-4 w-32 h-24 rounded-lg overflow-hidden border-2 border-white shadow-lg bg-black">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>

          <div className="flex gap-2 justify-center">
            {!isCallActive ? (
              <Button
                onClick={handleStartCall}
                disabled={isInitializing || disabled}
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                {isInitializing ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Initializing...
                  </>
                ) : (
                  <>
                    <Phone className="h-5 w-5 mr-2" />
                    Start Call
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={handleEndCall}
                variant="destructive"
                size="lg"
              >
                <PhoneOff className="h-5 w-5 mr-2" />
                End Call
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
