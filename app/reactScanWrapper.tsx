'use client'
import { scan } from 'react-scan'; // import this BEFORE react
import { ReactNode } from 'react';

if (typeof window !== 'undefined') {
  scan({
    enabled: true,
    // log: true, // logs render info to console (default: false)
    // playSound: true,
    showToolbar: true,
    animationSpeed: 'slow',
  });
}

interface ReactScanWrapperProps {
  children: ReactNode;
}

const ReactScanWrapper = ({ children }: ReactScanWrapperProps) => {
  return (
    <>
      {children}
    </>
  );
};

export default ReactScanWrapper; 