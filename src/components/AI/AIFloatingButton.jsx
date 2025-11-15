/**
 * AI Floating Button Component
 * A floating button to open/close the AI Chat Sidebar
 */

import React from 'react';
import { useAIChat } from '../../contexts/AIChatContext';
import { Sparkles, X } from 'lucide-react';

export default function AIFloatingButton() {
  const { isOpen, toggleSidebar } = useAIChat();

  return (
    <button
      onClick={toggleSidebar}
      className={`fixed bottom-6 right-6 z-[198] w-14 h-14 rounded-full shadow-glow-lg transition-all duration-300 ease-smooth group hover:scale-110 active:scale-95 ${
        isOpen
          ? 'bg-gray-600 hover:bg-gray-700'
          : 'bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700'
      }`}
      aria-label={isOpen ? 'Close AI Assistant' : 'Open AI Assistant'}
    >
      <div className="relative w-full h-full flex items-center justify-center">
        {/* Pulsing ring animation when closed */}
        {!isOpen && (
          <>
            <span className="absolute inset-0 rounded-full bg-indigo-400 opacity-75 animate-ping"></span>
            <span className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600"></span>
          </>
        )}

        {/* Icon */}
        <div className="relative z-10 transition-transform duration-300 group-hover:rotate-12">
          {isOpen ? (
            <X className="w-6 h-6 text-white" />
          ) : (
            <Sparkles className="w-6 h-6 text-white" />
          )}
        </div>
      </div>

      {/* Tooltip */}
      <div className="absolute bottom-full right-0 mb-2 px-3 py-1.5 bg-gray-900 dark:bg-gray-700 text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
        {isOpen ? 'Close AI Assistant' : 'AI Assistant (Ctrl+K)'}
        <div className="absolute top-full right-4 w-2 h-2 bg-gray-900 dark:bg-gray-700 transform rotate-45 -mt-1"></div>
      </div>
    </button>
  );
}
