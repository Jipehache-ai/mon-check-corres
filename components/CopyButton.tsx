import React, { useState } from 'react';

interface CopyButtonProps {
  textToCopy: string;
  children: React.ReactNode;
}

export const CopyButton: React.FC<CopyButtonProps> = ({ textToCopy, children }) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(textToCopy).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-2 text-sm font-medium text-gray-300 hover:text-white bg-gray-700/50 hover:bg-gray-700 px-3 py-1.5 rounded-md transition-all duration-200"
    >
      {isCopied ? (
        <>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Copié!</span>
        </>
      ) : (
        children
      )}
    </button>
  );
};
