import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Coins, Calendar, Clock, Users, AlertCircle } from 'lucide-react';
import { useGetCallerUserProfile, useGetUserScheduledSessions, useJoinScheduledSession } from '../hooks/useQueries';
import { useNavigate } from '@tanstack/react-router';
import StarRating from '../components/feedback/StarRating';
import CreateSessionDialog from '../components/sessions/CreateSessionDialog';
import SessionJoinLinkDialog from '../components/sessions/SessionJoinLinkDialog';
import { formatScheduledDate, formatScheduledTimeOnly, canJoinSession, getJoinAvailabilityMessage } from '../utils/scheduledSessionTime';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { toast } from 'sonner';
import { storeSessionParameter } from '../utils/urlParams';

export default function DashboardPage() {
  const { data: userProfile, isLoading: profileLoading } = useGetCallerUserProfile();
  const { data: scheduledSessions = [], isLoading: sessionsLoading } = useGetUserScheduledSessions();
  const { identity } = useInternetIdentity();
  const navigate = useNavigate();
  const joinSession = useJoinScheduledSession();

  const [showJoinLinkDialog, setShowJoinLinkDialog] = useState(false);
  const [createdSessionId, setCreatedSessionId] = useState<bigint | null>(null);

  const handleSessionCreated = (sessionId: bigint) => {
    setCreatedSessionId(sessionId);
    setShowJoinLinkDialog(true);
  };

  const handleJoinSession = async (sessionId: bigint, scheduledTime: bigint) => {
    if (!canJoinSession(scheduledTime)) {
      toast.error('This session is not available to join yet');
      return;
    }

    try {
      await joinSession.mutateAsync(sessionId);
      
      // Store sessionId for navigation
      storeSessionParameter('sessionId', sessionId.toString());
      
      toast.success('Joining session...');
      navigate({ to: '/live-class', search: { sessionId: sessionId.toString() } });
    } catch (error: any) {
      if (error.message?.includes('not started yet')) {
        toast.error('Session has not started yet. Please wait until the scheduled time.');
      } else if (error.message?.includes('already has a participant')) {
        toast.error('This session is already full');
      } else {
        toast.error(error.message || 'Failed to join session');
      }
      console.error('Join session error:', error);
    }
  };

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return null;
  }

  const averageRating = userProfile.feedback.length > 0
    ? userProfile.feedback.reduce((sum, f) => sum + Number(f.rating), 0) / userProfile.feedback.length
    : 0;

  const myPrincipal = identity?.getPrincipal().toString();
  const upcomingSessions = scheduledSessions.filter(s => !s.isActive);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl md:text-4xl font-bold mb-2">Welcome back, {userProfile.name}!</h1>
        <p className="text-muted-foreground">Manage your sessions and track your progress</p>
      </div>

      {/* Profile Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-yellow-500" />
              Credits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{Number(userProfile.credits)}</p>
            <p className="text-sm text-muted-foreground mt-1">Available to spend</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Your Skills</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {userProfile.skills.map((skill, index) => (
                <Badge key={index} variant="secondary">
                  {skill}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Feedback Rating</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <StarRating rating={averageRating} readonly size="md" />
              <span className="text-2xl font-bold">{averageRating.toFixed(1)}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {userProfile.feedback.length} {userProfile.feedback.length === 1 ? 'review' : 'reviews'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Start your learning journey</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <CreateSessionDialog onSuccess={handleSessionCreated} />
          <Button 
            onClick={() => navigate({ to: '/skill-match' })}
            variant="outline"
            size="lg"
          >
            <Users className="h-5 w-5 mr-2" />
            Find Learning Partners
          </Button>
        </CardContent>
      </Card>

      {/* Upcoming Sessions */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Sessions</CardTitle>
          <CardDescription>Your scheduled learning sessions</CardDescription>
        </CardHeader>
        <CardContent>
          {sessionsLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-sm text-muted-foreground">Loading sessions...</p>
            </div>
          ) : upcomingSessions.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No upcoming sessions. Create or book a session to get started!
            </p>
          ) : (
            <div className="space-y-4">
              {upcomingSessions.map((session) => {
                const isHost = session.host.toString() === myPrincipal;
                const hasParticipant = session.participant !== undefined && session.participant !== null;
                const canJoin = canJoinSession(session.scheduledTime);
                const joinMessage = getJoinAvailabilityMessage(session.scheduledTime);

                return (
                  <div 
                    key={session.id.toString()} 
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant={isHost ? 'default' : 'secondary'}>
                          {isHost ? 'Host' : 'Guest'}
                        </Badge>
                        {isHost && !hasParticipant && (
                          <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                            Waiting for participant
                          </Badge>
                        )}
                        {hasParticipant && (
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            Participant joined
                          </Badge>
                        )}
                      </div>
                      <p className="font-medium">Session #{session.id.toString()}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {formatScheduledDate(session.scheduledTime)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {formatScheduledTimeOnly(session.scheduledTime)}
                        </span>
                        <span>{Number(session.duration)} min</span>
                      </div>
                      {!canJoin && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {joinMessage}
                        </p>
                      )}
                    </div>
                    <Button 
                      onClick={() => handleJoinSession(session.id, session.scheduledTime)}
                      disabled={!canJoin || joinSession.isPending}
                      variant={canJoin ? 'default' : 'outline'}
                      className="shrink-0"
                    >
                      {joinSession.isPending ? 'Joining...' : canJoin ? 'Join Session' : 'Not Available'}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Feedback */}
      {userProfile.feedback.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Feedback</CardTitle>
            <CardDescription>What others are saying about your sessions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {userProfile.feedback.slice(-3).reverse().map((feedback, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <StarRating rating={Number(feedback.rating)} readonly size="sm" />
                    <span className="text-sm text-muted-foreground">
                      Session #{Number(feedback.sessionId)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{feedback.comment}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Session Join Link Dialog */}
      {createdSessionId && (
        <SessionJoinLinkDialog
          open={showJoinLinkDialog}
          onOpenChange={setShowJoinLinkDialog}
          sessionId={createdSessionId}
        />
      )}
    </div>
  );
}
