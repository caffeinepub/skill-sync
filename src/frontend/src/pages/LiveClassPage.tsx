import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Clock, AlertCircle, Users } from 'lucide-react';
import StarRating from '../components/feedback/StarRating';
import VideoCallPanel from '../components/liveclass/VideoCallPanel';
import JoinLinkBox from '../components/liveclass/JoinLinkBox';
import { useSessionTimer } from '../hooks/useSessionTimer';
import { calculateCredits } from '../utils/creditCalculation';
import { useStartSession, useSubmitFeedback, useGetUserScheduledSessions, useJoinScheduledSession } from '../hooks/useQueries';
import {
  useInitiateCall,
  useGetActiveCall,
  useAnswerCall,
  useAddIceCandidate,
  useEndCall,
} from '../hooks/useCallSignaling';
import { toast } from 'sonner';
import { useNavigate } from '@tanstack/react-router';
import { getPersistedUrlParameter, clearSessionParameter } from '../utils/urlParams';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { formatScheduledTime } from '../utils/scheduledSessionTime';

export default function LiveClassPage() {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [sessionId, setSessionId] = useState<bigint | null>(null);
  const [callId, setCallId] = useState<bigint | null>(null);
  const [isInitiator, setIsInitiator] = useState(false);
  const [joinCallId, setJoinCallId] = useState<string | null>(null);
  const [scheduledSessionId, setScheduledSessionId] = useState<bigint | null>(null);
  const [scheduledSessionError, setScheduledSessionError] = useState<string | null>(null);
  const [isProcessingScheduledSession, setIsProcessingScheduledSession] = useState(false);

  const { elapsedSeconds, isRunning, start, stop, reset } = useSessionTimer();
  const { identity } = useInternetIdentity();
  const startSession = useStartSession();
  const submitFeedback = useSubmitFeedback();
  const initiateCall = useInitiateCall();
  const { data: activeCall, isLoading: isLoadingCall } = useGetActiveCall();
  const { data: scheduledSessions = [] } = useGetUserScheduledSessions();
  const joinScheduledSession = useJoinScheduledSession();
  const answerCall = useAnswerCall();
  const addIceCandidate = useAddIceCandidate();
  const endCall = useEndCall();
  const navigate = useNavigate();

  // Check for callId or sessionId in URL on mount
  useEffect(() => {
    const urlCallId = getPersistedUrlParameter('callId');
    const urlSessionId = getPersistedUrlParameter('sessionId');
    
    if (urlCallId) {
      setJoinCallId(urlCallId);
    }
    
    if (urlSessionId) {
      setScheduledSessionId(BigInt(urlSessionId));
    }
  }, []);

  // Handle scheduled session join
  useEffect(() => {
    if (!scheduledSessionId || isProcessingScheduledSession || callId) return;

    const session = scheduledSessions.find(s => s.id === scheduledSessionId);
    if (!session) return;

    const myPrincipal = identity?.getPrincipal().toString();
    const isHost = session.host.toString() === myPrincipal;
    const isParticipant = session.participant?.toString() === myPrincipal;

    // If we're already part of this session and it's active, try to get the call
    if ((isHost || isParticipant) && session.joined) {
      setIsProcessingScheduledSession(true);
      
      // The backend should have created a call when the participant joined
      // Poll for the active call
      if (activeCall && !isLoadingCall) {
        const isInCall = 
          activeCall.caller.toString() === myPrincipal ||
          activeCall.callee.toString() === myPrincipal;
        
        if (isInCall) {
          // We found our call
          setCallId(BigInt(activeCall.caller.toString() === myPrincipal ? '1' : '2')); // Placeholder
          setIsInitiator(activeCall.caller.toString() === myPrincipal);
          setScheduledSessionError(null);
        }
      }
    }
  }, [scheduledSessionId, scheduledSessions, activeCall, isLoadingCall, identity, callId, isProcessingScheduledSession]);

  // Auto-join mode when callId is present
  useEffect(() => {
    if (joinCallId && !callId && activeCall && !isLoadingCall) {
      const myPrincipal = identity?.getPrincipal().toString();
      const isParticipant = 
        activeCall.caller.toString() === myPrincipal ||
        activeCall.callee.toString() === myPrincipal;

      if (isParticipant) {
        setCallId(BigInt(joinCallId));
        setIsInitiator(activeCall.caller.toString() === myPrincipal);
      }
    }
  }, [joinCallId, callId, activeCall, isLoadingCall, identity]);

  const handleStartSession = async () => {
    try {
      const id = await startSession.mutateAsync();
      setSessionId(id);
      start();
      toast.success('Session started!');
    } catch (error) {
      toast.error('Failed to start session');
      console.error('Start session error:', error);
    }
  };

  const handleStopSession = () => {
    stop();
    toast.info('Session paused');
  };

  const handleStartCall = async (offer: string) => {
    try {
      const myPrincipal = identity?.getPrincipal().toString();
      if (!myPrincipal) {
        toast.error('Not authenticated');
        return;
      }

      // For scheduled sessions, get the other participant
      let calleePrincipal = myPrincipal; // Default to self for demo
      
      if (scheduledSessionId) {
        const session = scheduledSessions.find(s => s.id === scheduledSessionId);
        if (session) {
          const isHost = session.host.toString() === myPrincipal;
          if (isHost && session.participant) {
            calleePrincipal = session.participant.toString();
          } else if (!isHost) {
            calleePrincipal = session.host.toString();
          }
        }
      }

      const newCallId = await initiateCall.mutateAsync({
        callee: calleePrincipal,
        offer,
      });

      setCallId(newCallId);
      setIsInitiator(true);
      toast.success('Call initiated! Share the link below.');
    } catch (error: any) {
      if (error.message?.includes('Cannot call yourself')) {
        toast.error('Cannot start call: No other participant in this session yet');
      } else {
        toast.error(error.message || 'Failed to start call');
      }
      console.error('Start call error:', error);
    }
  };

  const handleAnswerCall = async (answer: string) => {
    if (!callId) return;

    try {
      await answerCall.mutateAsync({ callId, answer });
    } catch (error: any) {
      toast.error(error.message || 'Failed to answer call');
      console.error('Answer call error:', error);
    }
  };

  const handleIceCandidate = async (candidate: string) => {
    if (!callId) return;

    try {
      await addIceCandidate.mutateAsync({ callId, candidate });
    } catch (error) {
      console.warn('Failed to send ICE candidate:', error);
    }
  };

  const handleEndCall = async () => {
    if (!callId) return;

    try {
      await endCall.mutateAsync(callId);
      setCallId(null);
      setIsInitiator(false);
      clearSessionParameter('callId');
      setJoinCallId(null);
      toast.info('Call ended');
    } catch (error: any) {
      toast.error(error.message || 'Failed to end call');
      console.error('End call error:', error);
    }
  };

  const handleStartNewCall = () => {
    clearSessionParameter('callId');
    clearSessionParameter('sessionId');
    setJoinCallId(null);
    setCallId(null);
    setIsInitiator(false);
    setScheduledSessionId(null);
    setScheduledSessionError(null);
  };

  const handleSubmitFeedback = async () => {
    if (!sessionId) {
      toast.error('No active session');
      return;
    }

    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    if (!comment.trim()) {
      toast.error('Please add a comment');
      return;
    }

    try {
      await submitFeedback.mutateAsync({
        sessionId,
        rating: BigInt(rating),
        comment: comment.trim(),
      });

      toast.success('Feedback submitted successfully!');
      reset();
      setRating(0);
      setComment('');
      setSessionId(null);
      navigate({ to: '/dashboard' });
    } catch (error) {
      toast.error('Failed to submit feedback');
      console.error('Submit feedback error:', error);
    }
  };

  const durationMinutes = Math.floor(elapsedSeconds / 60);
  const credits = calculateCredits(durationMinutes, rating);

  let connectionStatus = 'Not connected';
  if (callId && activeCall) {
    if (activeCall.status === 'initiated' && !activeCall.answer) {
      connectionStatus = isInitiator ? 'Waiting for peer to join...' : 'Connecting...';
    } else if (activeCall.status === 'answered' || activeCall.answer) {
      connectionStatus = 'Connecting...';
    } else if (activeCall.status === 'ended') {
      connectionStatus = 'Call ended';
    }
  }

  const showInvalidCallError = joinCallId && !isLoadingCall && !activeCall && !scheduledSessionId;
  
  // Get scheduled session info if available
  const currentScheduledSession = scheduledSessionId 
    ? scheduledSessions.find(s => s.id === scheduledSessionId)
    : null;

  const canStartCall = !scheduledSessionId || (currentScheduledSession && currentScheduledSession.participant !== undefined && currentScheduledSession.participant !== null);

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl md:text-4xl font-bold mb-2">Live Class Session</h1>
        <p className="text-muted-foreground">Connect, learn, and earn credits</p>
      </div>

      {/* Scheduled Session Info */}
      {currentScheduledSession && (
        <Alert>
          <Users className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              <p className="font-medium">Scheduled Session #{currentScheduledSession.id.toString()}</p>
              <p className="text-sm">
                {formatScheduledTime(currentScheduledSession.scheduledTime)} • {Number(currentScheduledSession.duration)} minutes
              </p>
              {!currentScheduledSession.participant && (
                <p className="text-sm text-yellow-600">Waiting for a participant to join...</p>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Invalid Call Error */}
      {showInvalidCallError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>This call link is invalid or has expired.</span>
            <Button
              onClick={handleStartNewCall}
              variant="outline"
              size="sm"
            >
              Start New Call
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Scheduled Session Error */}
      {scheduledSessionError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{scheduledSessionError}</span>
            <Button
              onClick={handleStartNewCall}
              variant="outline"
              size="sm"
            >
              Go Back
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Video Call Panel */}
        <VideoCallPanel
          callId={callId}
          activeCall={activeCall || null}
          isInitiator={isInitiator}
          onStartCall={handleStartCall}
          onAnswerCall={handleAnswerCall}
          onIceCandidate={handleIceCandidate}
          onEndCall={handleEndCall}
          connectionStatus={connectionStatus}
          disabled={!canStartCall}
        />

        {/* Timer & Credits */}
        <div className="space-y-6">
          {/* Join Link Box */}
          {callId && isInitiator && !scheduledSessionId && <JoinLinkBox callId={callId} type="call" />}
          {scheduledSessionId && <JoinLinkBox sessionId={scheduledSessionId} type="session" />}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Session Timer
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <p className="text-4xl font-bold font-mono">
                  {Math.floor(elapsedSeconds / 60).toString().padStart(2, '0')}:
                  {(elapsedSeconds % 60).toString().padStart(2, '0')}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {durationMinutes} {durationMinutes === 1 ? 'minute' : 'minutes'}
                </p>
              </div>
              <div className="flex gap-2">
                {!isRunning ? (
                  <Button
                    onClick={handleStartSession}
                    className="flex-1"
                    disabled={startSession.isPending}
                  >
                    Start Timer
                  </Button>
                ) : (
                  <Button onClick={handleStopSession} variant="outline" className="flex-1">
                    Pause Timer
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Credit Calculation</CardTitle>
              <CardDescription>Based on duration and rating</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Duration</span>
                  <span className="font-medium">{durationMinutes} min</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Rating</span>
                  <span className="font-medium">{rating} ⭐</span>
                </div>
                <div className="pt-3 border-t">
                  <div className="flex justify-between">
                    <span className="font-medium">Total Credits</span>
                    <span className="text-2xl font-bold text-primary">{credits}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Feedback Section */}
      <Card>
        <CardHeader>
          <CardTitle>Session Feedback</CardTitle>
          <CardDescription>Rate your experience and earn credits</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Rating</Label>
            <StarRating rating={rating} onRatingChange={setRating} size="lg" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="comment">Comment</Label>
            <Textarea
              id="comment"
              placeholder="Share your thoughts about this session..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
            />
          </div>

          <Button
            onClick={handleSubmitFeedback}
            disabled={submitFeedback.isPending || rating === 0 || !comment.trim()}
            className="w-full"
            size="lg"
          >
            {submitFeedback.isPending ? 'Submitting...' : 'Submit Feedback & Earn Credits'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
