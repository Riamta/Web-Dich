import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

export function usePageView() {
  const pathname = usePathname();
  const lastTrackedPath = useRef<string | null>(null);
  const retryCount = useRef<number>(0);
  const maxRetries = 3;
  const [pageViews, setPageViews] = useState<Record<string, number>>({});

  // Fetch page views on component mount
  useEffect(() => {
    const fetchPageViews = async () => {
      try {
        const response = await fetch('/api/page-views');
        if (response.ok) {
          const data = await response.json();
          const viewsMap: Record<string, number> = {};
          data.forEach((item: any) => {
            if (item.path) {
              viewsMap[item.path] = item.views || 0;
            }
          });
          setPageViews(viewsMap);
        }
      } catch (error) {
        console.error('Error fetching page views:', error);
      }
    };

    fetchPageViews();
  }, []);

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
          
          // Update local state with the new view count
          if (data && data.path) {
            setPageViews(prev => ({
              ...prev,
              [data.path]: data.views || 0
            }));
          }
          
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

  // Return the current page views for display
  return pageViews;
} 