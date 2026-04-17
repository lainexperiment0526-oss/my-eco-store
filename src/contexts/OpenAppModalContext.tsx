import { createContext, useContext, useState, ReactNode } from 'react';

interface OpenAppModalContextType {
  showOpenAppModal: boolean;
  setShowOpenAppModal: (show: boolean) => void;
}

const OpenAppModalContext = createContext<OpenAppModalContextType | undefined>(undefined);

export function useOpenAppModal() {
  const context = useContext(OpenAppModalContext);
  if (context === undefined) {
    throw new Error('useOpenAppModal must be used within an OpenAppModalProvider');
  }
  return context;
}

interface OpenAppModalProviderProps {
  children: ReactNode;
}

export function OpenAppModalProvider({ children }: OpenAppModalProviderProps) {
  const [showOpenAppModal, setShowOpenAppModal] = useState(false);

  return (
    <OpenAppModalContext.Provider value={{ showOpenAppModal, setShowOpenAppModal }}>
      {children}
    </OpenAppModalContext.Provider>
  );
}
