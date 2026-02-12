import React from "react";

export const DroplinkSpinner: React.FC<{ size?: number }> = ({ size = 48 }) => (
  <div
    style={{
      width: size,
      height: size,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
    }}
    aria-label="Loading"
  >
    {/* Outer rotating ring */}
    <div
      style={{
        position: "absolute",
        width: size,
        height: size,
        borderRadius: "50%",
        border: `3px solid transparent`,
        borderTopColor: "#60a5fa",
        borderRightColor: "#3b82f6",
        animation: "droplink-ring-spin 1.5s ease-in-out infinite",
      }}
    />
    
    {/* Inner pulsing glow */}
    <div
      style={{
        position: "absolute",
        width: size * 0.85,
        height: size * 0.85,
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(96, 165, 250, 0.3) 0%, rgba(59, 130, 246, 0) 70%)",
        animation: "droplink-pulse 2s ease-in-out infinite",
      }}
    />
    
    <style>{`
      @keyframes droplink-ring-spin {
        0% { 
          transform: rotate(0deg);
          opacity: 1;
        }
        50% {
          opacity: 0.7;
        }
        100% { 
          transform: rotate(360deg);
          opacity: 1;
        }
      }
      
      @keyframes droplink-pulse {
        0%, 100% { 
          transform: scale(0.95);
          opacity: 0.5;
        }
        50% { 
          transform: scale(1.05);
          opacity: 0.8;
        }
      }
    `}</style>
  </div>
);
