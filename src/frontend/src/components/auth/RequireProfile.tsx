import { type ReactNode, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useGetCallerUserProfile } from '../../hooks/useQueries';

interface RequireProfileProps {
  children: ReactNode;
}

export default function RequireProfile({ children }: RequireProfileProps) {
  const { data: userProfile, isLoading, isFetched } = useGetCallerUserProfile();
  const navigate = useNavigate();

  useEffect(() => {
    if (isFetched && userProfile === null) {
      navigate({ to: '/signup' });
    }
  }, [userProfile, isFetched, navigate]);

  if (isLoading || !isFetched) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (userProfile === null) {
    return null;
  }

  return <>{children}</>;
}
