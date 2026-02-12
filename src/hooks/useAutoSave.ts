import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

interface AutoSaveOptions {
  delay?: number; // Debounce delay in ms (default: 2000)
  tableName: string;
  recordId: string;
  onSave?: (data: any) => Promise<void>;
  onError?: (error: Error) => void;
}

export function useAutoSave<T extends Record<string, any>>(options: AutoSaveOptions) {
  const { delay = 2000, tableName, recordId, onSave, onError } = options;
  const [data, setData] = useState<T>({} as T);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  const { toast } = useToast();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const initialDataRef = useRef<T>({} as T);

  // Save function
  const saveData = useCallback(async (dataToSave: T) => {
    if (!dataToSave || Object.keys(dataToSave).length === 0) return;
    
    setIsSaving(true);
    try {
      if (onSave) {
        await onSave(dataToSave);
      } else {
        // Default Supabase save
        const { error } = await supabase
          .from(tableName as any)
          .update(dataToSave)
          .eq('id', recordId);
        
        if (error) throw error;
      }
      
      setLastSaved(new Date());
      setHasUnsavedChanges(false);
      initialDataRef.current = { ...dataToSave };
      
      toast({
        title: "Auto-saved",
        description: "Your changes have been saved automatically.",
        duration: 2000,
      });
    } catch (error) {
      console.error('Auto-save error:', error);
      const errorMessage = error instanceof Error ? error : new Error('Unknown error');
      
      if (onError) {
        onError(errorMessage);
      } else {
        toast({
          title: "Save failed",
          description: "Unable to auto-save your changes. Please try saving manually.",
          variant: "destructive",
          duration: 5000,
        });
      }
    } finally {
      setIsSaving(false);
    }
  }, [supabase, tableName, recordId, onSave, onError, toast]);

  // Update data and trigger auto-save
  const updateData = useCallback((newData: Partial<T> | ((prev: T) => T)) => {
    setData(prevData => {
      const updatedData = typeof newData === 'function' 
        ? newData(prevData) 
        : { ...prevData, ...newData };
      
      // Check if data has actually changed
      const hasChanged = JSON.stringify(updatedData) !== JSON.stringify(initialDataRef.current);
      setHasUnsavedChanges(hasChanged);
      
      if (hasChanged) {
        // Clear existing timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        
        // Set new timeout for auto-save
        timeoutRef.current = setTimeout(() => {
          saveData(updatedData);
        }, delay);
      }
      
      return updatedData;
    });
  }, [delay, saveData]);

  // Manual save function
  const save = useCallback(async () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    await saveData(data);
  }, [data, saveData]);

  // Initialize data
  const initialize = useCallback((initialData: T) => {
    setData(initialData);
    initialDataRef.current = { ...initialData };
    setHasUnsavedChanges(false);
    setLastSaved(new Date());
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Auto-save on page unload
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
        // Trigger immediate save
        saveData(data);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges, data, saveData]);

  return {
    data,
    updateData,
    save,
    initialize,
    isSaving,
    lastSaved,
    hasUnsavedChanges,
  };
}