import { formatDistanceToNow } from 'date-fns';
import { Clock, Play, Trash2, X } from 'lucide-react';

const getSessionTypeName = (type) => {
  switch (type) {
    case 'quick_prep':
      return 'Quick Prep';
    case 'full_mock':
      return 'Mock Interview';
    case 'premium_audio':
      return 'Audio Mock';
    case 'pro':
      return 'Pro Session';
    default:
      return type;
  }
};

export function PausedSessionConflictDialog({
  isOpen,
  onClose,
  pausedSession,
  onResume,
  onAbandonAndStart,
  isAbandoning = false,
}: PausedSessionConflictDialogProps) {
  if (!pausedSession) return null;

  const pausedTimeAgo = formatDistanceToNow(new Date(pausedSession.paused_at), { addSuffix: true });
  const sessionTypeName = getSessionTypeName(pausedSession.session_type);

  const handleResume = () => {
    onResume(pausedSession.id, pausedSession.session_type);
    onClose();
  };

  const handleAbandon = async () => {
    await onAbandonAndStart(pausedSession.id);
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-warning" />
            Paused Session Found
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p>
              You have a paused <strong>{sessionTypeName}</strong> session from{' '}
              <strong>{pausedTimeAgo}</strong>.
            </p>
            <p>
              Starting a new session will abandon your saved progress.
            </p>
            {pausedSession.current_question_number && pausedSession.current_question_number > 0 && (
              <p className="text-sm text-muted-foreground">
                Progress: {pausedSession.current_question_number} question{pausedSession.current_question_number !== 1 ? 's' : ''} completed
              </p>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
          <Button
            onClick={handleResume}
            className="w-full gap-2"
            disabled={isAbandoning}
          >
            <Play className="h-4 w-4" />
            Resume Paused Session
          </Button>
          <Button
            variant="destructive"
            onClick={handleAbandon}
            className="w-full gap-2"
            disabled={isAbandoning}
          >
            {isAbandoning ? (
              <>
                <span className="animate-spin">⏳</span>
                Abandoning...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                Abandon & Start New
              </>
            )}
          </Button>
          <AlertDialogCancel className="w-full gap-2" disabled={isAbandoning}>
            <X className="h-4 w-4" />
            Cancel
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
