import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Coins, Calendar, Clock } from 'lucide-react';
import { useGetCallerUserProfile } from '../hooks/useQueries';
import { useNavigate } from '@tanstack/react-router';
import StarRating from '../components/feedback/StarRating';
import { useLocalSessions } from '../hooks/useSessionsLocal';

export default function DashboardPage() {
  const { data: userProfile, isLoading } = useGetCallerUserProfile();
  const navigate = useNavigate();
  const { sessions } = useLocalSessions();

  if (isLoading) {
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
        <CardContent>
          <Button 
            onClick={() => navigate({ to: '/skill-match' })}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            size="lg"
          >
            Book a Session
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
          {sessions.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No upcoming sessions. Book a session to get started!
            </p>
          ) : (
            <div className="space-y-4">
              {sessions.map((session) => (
                <div 
                  key={session.id} 
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="space-y-1">
                    <p className="font-medium">{session.skill}</p>
                    <p className="text-sm text-muted-foreground">with {session.partnerName}</p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {session.date}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {session.time}
                      </span>
                    </div>
                  </div>
                  <Button 
                    onClick={() => navigate({ to: '/live-class' })}
                    variant="outline"
                  >
                    Join Session
                  </Button>
                </div>
              ))}
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
    </div>
  );
}
