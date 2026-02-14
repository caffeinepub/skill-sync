import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Video, Play, Pause, Clock } from 'lucide-react';
import StarRating from '../components/feedback/StarRating';
import { useSessionTimer } from '../hooks/useSessionTimer';
import { calculateCredits } from '../utils/creditCalculation';
import { useStartSession, useSubmitFeedback } from '../hooks/useQueries';
import { toast } from 'sonner';
import { useNavigate } from '@tanstack/react-router';

export default function LiveClassPage() {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [sessionId, setSessionId] = useState<bigint | null>(null);
  const { elapsedSeconds, isRunning, start, stop, reset } = useSessionTimer();
  const startSession = useStartSession();
  const submitFeedback = useSubmitFeedback();
  const navigate = useNavigate();

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

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl md:text-4xl font-bold mb-2">Live Class Session</h1>
        <p className="text-muted-foreground">Connect, learn, and earn credits</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Video Placeholder */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="h-5 w-5" />
              Video Session
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="aspect-video bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg flex items-center justify-center border-2 border-dashed border-border">
              <div className="text-center space-y-4">
                <Video className="h-16 w-16 mx-auto text-muted-foreground" />
                <p className="text-muted-foreground">Video call interface placeholder</p>
                <p className="text-sm text-muted-foreground">
                  Real video integration would appear here
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Timer & Credits */}
        <div className="space-y-6">
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
                    <Play className="h-4 w-4 mr-2" />
                    Start
                  </Button>
                ) : (
                  <Button onClick={handleStopSession} variant="outline" className="flex-1">
                    <Pause className="h-4 w-4 mr-2" />
                    Pause
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
                  <span className="text-muted-foreground">Duration:</span>
                  <span className="font-medium">{durationMinutes} min</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Rating:</span>
                  <span className="font-medium">{rating}/5</span>
                </div>
                <div className="pt-3 border-t">
                  <div className="flex justify-between">
                    <span className="font-semibold">Credits Earned:</span>
                    <span className="text-2xl font-bold text-primary">{credits}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Feedback Form */}
      <Card>
        <CardHeader>
          <CardTitle>Submit Feedback</CardTitle>
          <CardDescription>Rate your session and provide feedback</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Your Rating</Label>
            <div className="flex items-center gap-4">
              <StarRating rating={rating} onRatingChange={setRating} size="lg" />
              <span className="text-lg font-medium">{rating}/5</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="comment">Your Comment</Label>
            <Textarea
              id="comment"
              placeholder="Share your experience with this session..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
            />
          </div>

          <Button 
            onClick={handleSubmitFeedback}
            disabled={!sessionId || rating === 0 || !comment.trim() || submitFeedback.isPending}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            size="lg"
          >
            {submitFeedback.isPending ? 'Submitting...' : 'Submit Feedback & Earn Credits'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
