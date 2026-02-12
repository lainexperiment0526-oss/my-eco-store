/**
 * Pi Browser Detection Component for DropLink
 * Shows prompt to open app in Pi Browser for full functionality
 */

import React, { useEffect, useState } from "react";

const PiBrowserPrompt = () => {
  const [isPiBrowser, setIsPiBrowser] = useState(false);

  useEffect(() => {
    const userAgent = navigator.userAgent || navigator.vendor;
    if (userAgent.toLowerCase().includes("pibrowser") || 
        userAgent.toLowerCase().includes("pi browser") ||
        typeof window.Pi !== 'undefined') {
      setIsPiBrowser(true);
    }
  }, []);

  // Only show if NOT in Pi Browser
  if (isPiBrowser) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 text-center shadow-2xl">
        <div className="mb-6">
          <div className="text-6xl mb-4">🥧</div>
          <h1 className="text-3xl font-bold text-gray-800">
            Open in Pi Browser
          </h1>
        </div>

        <div className="space-y-4 mb-6">
          <p className="text-gray-600">
            To access all features including payments, please open DropLink in the official Pi Browser.
          </p>
          
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <p className="text-sm text-purple-800 font-semibold mb-2">
              ✨ Features available in Pi Browser:
            </p>
            <ul className="text-xs text-purple-700 text-left space-y-1">
              <li>• Pi Network authentication</li>
              <li>• Subscription payments with Pi</li>
              <li>• Receive DROP tokens</li>
              <li>• Access premium features</li>
            </ul>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => window.location.href = "https://minepi.com"}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-4 rounded-xl shadow-lg transition-colors"
          >
            Download Pi Browser
          </button>
          
          <button
            onClick={() => window.history.back()}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-xl transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default PiBrowserPrompt;
