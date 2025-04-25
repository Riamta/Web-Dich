import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

export function usePageView() {
  const pathname = usePathname();
  const lastTrackedPath = useRef<string | null>(null);
  const retryCount = useRef<number>(0);
  const maxRetries = 3;

  useEffect(() => {
    const trackPageView = async () => {
      // Only track if the path has changed and is not null
      if (pathname && pathname !== lastTrackedPath.current) {
        try {
          console.log(`Tracking page view for: ${pathname}`);
          
          const response = await fetch('/api/page-views', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ path: pathname }),
          });
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          const data = await response.json();
          console.log(`Page view tracked successfully: ${pathname}`, data);
          
          // Reset retry count on success
          retryCount.current = 0;
          lastTrackedPath.current = pathname;
        } catch (error) {
          console.error('Error tracking page view:', error);
          
          // Retry logic
          if (retryCount.current < maxRetries) {
            retryCount.current += 1;
            console.log(`Retrying page view tracking (${retryCount.current}/${maxRetries})...`);
            
            // Exponential backoff: 1s, 2s, 4s
            const delay = Math.pow(2, retryCount.current - 1) * 1000;
            setTimeout(trackPageView, delay);
          } else {
            console.error(`Failed to track page view after ${maxRetries} attempts`);
            retryCount.current = 0; // Reset for next time
          }
        }
      }
    };

    trackPageView();
  }, [pathname]);
} 