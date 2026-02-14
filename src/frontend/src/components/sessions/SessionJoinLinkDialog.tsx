import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Copy, Check, Link2 } from 'lucide-react';
import { toast } from 'sonner';

interface SessionJoinLinkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId: bigint;
}

export default function SessionJoinLinkDialog({
  open,
  onOpenChange,
  sessionId,
}: SessionJoinLinkDialogProps) {
  const [copied, setCopied] = useState(false);

  const joinUrl = `${window.location.origin}${window.location.pathname}#/live-class?sessionId=${sessionId}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(joinUrl);
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy link');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Session Created!
          </DialogTitle>
          <DialogDescription>
            Share this link with others to let them join your session
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex gap-2">
            <Input
              value={joinUrl}
              readOnly
              className="font-mono text-sm"
            />
            <Button
              onClick={handleCopy}
              variant="outline"
              size="icon"
              className="shrink-0"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Session ID: {sessionId.toString()}
          </p>
          <p className="text-sm text-muted-foreground">
            Participants can join 5 minutes before the scheduled time.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
