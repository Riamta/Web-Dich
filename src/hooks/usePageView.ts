import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

export function usePageView() {
  const pathname = usePathname();
  const lastTrackedPath = useRef<string | null>(null);

  useEffect(() => {
    const trackPageView = async () => {
      // Only track if the path has changed and is not null
      if (pathname && pathname !== lastTrackedPath.current) {
        try {
          await fetch('/api/page-views', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ path: pathname }),
          });
          lastTrackedPath.current = pathname;
        } catch (error) {
          console.error('Error tracking page view:', error);
        }
      }
    };

    trackPageView();
  }, [pathname]);
} 