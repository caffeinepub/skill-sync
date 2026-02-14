import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Clock } from 'lucide-react';
import { useCreateScheduledSession } from '../../hooks/useQueries';
import { dateToNanos, isValidFutureDate } from '../../utils/scheduledSessionTime';
import { toast } from 'sonner';

interface BookSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  matchName: string;
  skill: string;
  onSuccess?: (sessionId: bigint) => void;
}

const DURATIONS = [
  { label: '30 minutes', value: 30 },
  { label: '45 minutes', value: 45 },
  { label: '60 minutes', value: 60 },
  { label: '90 minutes', value: 90 },
  { label: '120 minutes', value: 120 },
];

export default function BookSessionDialog({
  open,
  onOpenChange,
  matchName,
  skill,
  onSuccess,
}: BookSessionDialogProps) {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState('60');

  const createSession = useCreateScheduledSession();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!date || !time) {
      toast.error('Please select date and time');
      return;
    }

    const scheduledDateTime = new Date(`${date}T${time}`);

    if (!isValidFutureDate(scheduledDateTime)) {
      toast.error('Cannot schedule sessions in the past');
      return;
    }

    try {
      const scheduledTimeNanos = dateToNanos(scheduledDateTime);
      const durationMinutes = BigInt(duration);

      const sessionId = await createSession.mutateAsync({
        scheduledTime: scheduledTimeNanos,
        duration: durationMinutes,
      });

      toast.success(`Session booked with ${matchName}!`);
      
      setDate('');
      setTime('');
      setDuration('60');
      onOpenChange(false);

      if (onSuccess) {
        onSuccess(sessionId);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to book session');
      console.error('Book session error:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Book Session with {matchName}</DialogTitle>
            <DialogDescription>
              Schedule a {skill} learning session
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="book-date" className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Date *
                </Label>
                <Input
                  id="book-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="book-time" className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  Time *
                </Label>
                <Input
                  id="book-time"
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="book-duration">Duration *</Label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger id="book-duration">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DURATIONS.map((d) => (
                    <SelectItem key={d.value} value={d.value.toString()}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createSession.isPending}>
              {createSession.isPending ? 'Booking...' : 'Book Session'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
