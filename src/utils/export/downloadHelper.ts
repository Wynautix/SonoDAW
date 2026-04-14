import { useStore } from '../../store/useStore';

export const triggerDownload = async (blob: Blob, filename: string) => {
  const { addNotification } = useStore.getState();
  console.log(`[SonoDAW] Triggering download: ${filename} (${blob.size} bytes)`);
  
  // 1. Attempt FileSystem Access API (Modern Chrome/Edge)
  if ('showSaveFilePicker' in window) {
    try {
        const handle = await (window as any).showSaveFilePicker({
            suggestedName: filename,
            types: [{
                description: 'SonoDAW File',
                accept: { [blob.type]: [`.${filename.split('.').pop()}`] },
            }],
        });
        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
        addNotification(`Successfully saved ${filename}`, 'success');
        return;
    } catch (err: any) {
        // User cancelled picker, or error
        if (err.name === 'AbortError') return;
        console.warn('FileSystem Access API failed, falling back to Blob method', err);
    }
  }

  // 2. Fallback to Robust Blob Trigger
  addNotification(`Saving ${filename}...`, 'info');
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  
  link.style.display = 'none';
  link.href = url;
  link.download = filename;
  link.target = '_blank'; 
  
  document.body.appendChild(link);
  link.click();
  
  setTimeout(() => {
    if (document.body.contains(link)) {
      document.body.removeChild(link);
    }
    window.URL.revokeObjectURL(url);
    addNotification(`Download initiated for ${filename}`, 'success');
  }, 30000);
};
