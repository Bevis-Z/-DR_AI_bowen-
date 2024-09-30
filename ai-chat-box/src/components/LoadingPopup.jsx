import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingPopup = () => {
  return (
    <div className="fixed top-0 left-0 w-full h-16 bg-blue-500 text-white flex items-center justify-center z-50">
      <Loader2 className="animate-spin mr-2" size={24} />
      <span className="font-semibold">Loading...</span>
    </div>
  );
};

export default LoadingPopup;
