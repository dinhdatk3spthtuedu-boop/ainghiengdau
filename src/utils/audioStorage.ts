import { set, get, del } from 'idb-keyval';

export const saveMedia = async (id: string, file: File | Blob): Promise<string> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const type = file.type;
    await set(id, { arrayBuffer, type });
    return id;
  } catch (error) {
    console.error('Error saving media to IndexedDB:', error);
    throw error;
  }
};

export const getMedia = async (id: string): Promise<string | null> => {
  try {
    const data = await get<{ arrayBuffer: ArrayBuffer, type: string }>(id);
    if (!data) return null;
    
    const blob = new Blob([data.arrayBuffer], { type: data.type });
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error('Error retrieving media from IndexedDB:', error);
    return null;
  }
};

export const deleteMedia = async (id: string): Promise<void> => {
  try {
    await del(id);
  } catch (error) {
    console.error('Error deleting media from IndexedDB:', error);
  }
};

// Keep old names for compatibility or export them as aliases
export const saveAudio = saveMedia;
export const getAudio = getMedia;
export const deleteAudio = deleteMedia;
