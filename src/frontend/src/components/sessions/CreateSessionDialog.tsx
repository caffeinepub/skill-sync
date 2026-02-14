import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Clock, Plus } from 'lucide-react';
import { useCreateScheduledSession } from '../../hooks/useQueries';
import { dateToNanos, isValidFutureDate } from '../../utils/scheduledSessionTime';
import { toast } from 'sonner';

interface CreateSessionDialogProps {
  onSuccess?: (sessionId: bigint) => void;
}

const SKILLS = [
  'Python',
  'JavaScript',
  'React',
  'UI/UX Design',
  'Figma',
  'Guitar',
  'Music Theory',
  'Spanish',
  'French',
  'Calculus',
  'Physics',
  'Chemistry',
];

const DURATIONS = [
  { label: '30 minutes', value: 30 },
  { label: '45 minutes', value: 45 },
  { label: '60 minutes', value: 60 },
  { label: '90 minutes', value: 90 },
  { label: '120 minutes', value: 120 },
];

export default function CreateSessionDialog({ onSuccess }: CreateSessionDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [skill, setSkill] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState('60');

  const createSession = useCreateScheduledSession();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!skill) {
      toast.error('Please select a skill');
      return;
    }

    if (!date || !time) {
      toast.error('Please select date and time');
      return;
    }

    // Combine date and time
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

      toast.success('Session created successfully!');
      
      // Reset form
      setTitle('');
      setSkill('');
      setDate('');
      setTime('');
      setDuration('60');
      setOpen(false);

      if (onSuccess) {
        onSuccess(sessionId);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to create session');
      console.error('Create session error:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
          <Plus className="h-5 w-5 mr-2" />
          Create Session
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create a New Session</DialogTitle>
            <DialogDescription>
              Schedule a session and share the join link with others
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Session Title (Optional)</Label>
              <Input
                id="title"
                placeholder="e.g., Learn React Basics"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="skill">Skill *</Label>
              <Select value={skill} onValueChange={setSkill}>
                <SelectTrigger id="skill">
                  <SelectValue placeholder="Select a skill" />
                </SelectTrigger>
                <SelectContent>
                  {SKILLS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date" className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Date *
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="time" className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  Time *
                </Label>
                <Input
                  id="time"
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Duration *</Label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger id="duration">
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
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createSession.isPending}>
              {createSession.isPending ? 'Creating...' : 'Create Session'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
