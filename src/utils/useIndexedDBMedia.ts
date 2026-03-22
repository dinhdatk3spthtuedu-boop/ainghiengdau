import { useState, useEffect } from 'react';
import { getMedia } from './audioStorage';

export const useIndexedDBMedia = (mediaId?: string) => {
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(!!mediaId);

  useEffect(() => {
    let isMounted = true;
    let url: string | null = null;

    const loadMedia = async () => {
      setIsLoading(true);
      if (!mediaId) {
        setMediaUrl(null);
        setIsLoading(false);
        return;
      }

      if (mediaId.startsWith('data:')) {
        setMediaUrl(mediaId);
        setIsLoading(false);
        return;
      }
      
      url = await getMedia(mediaId);
      if (isMounted) {
        setMediaUrl(url);
        setIsLoading(false);
      }
    };

    loadMedia();

    return () => {
      isMounted = false;
      if (url && !url.startsWith('data:')) {
        URL.revokeObjectURL(url);
      }
    };
  }, [mediaId]);

  return { mediaUrl, isLoading };
};

// Keep old name for compatibility
export const useIndexedDBAudio = useIndexedDBMedia;
