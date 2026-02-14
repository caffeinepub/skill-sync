import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Copy, Check, Link2 } from 'lucide-react';
import { toast } from 'sonner';

interface JoinLinkBoxProps {
  callId?: bigint;
  sessionId?: bigint;
  type?: 'call' | 'session';
}

export default function JoinLinkBox({ callId, sessionId, type = 'call' }: JoinLinkBoxProps) {
  const [copied, setCopied] = useState(false);

  const id = type === 'call' ? callId : sessionId;
  const paramName = type === 'call' ? 'callId' : 'sessionId';
  const joinUrl = `${window.location.origin}${window.location.pathname}#/live-class?${paramName}=${id}`;

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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link2 className="h-5 w-5" />
          Share Join Link
        </CardTitle>
        <CardDescription>
          {type === 'call' 
            ? 'Share this link with the person you want to call'
            : 'Share this link to let others join your session'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
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
          {type === 'call' ? 'Call' : 'Session'} ID: {id?.toString()}
        </p>
      </CardContent>
    </Card>
  );
}
