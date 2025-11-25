/**
 * AI Chat Sidebar Component
 * A collapsible sidebar for AI-powered chat assistance
 */

import React, { useState, useRef, useEffect } from 'react';
import { useAIChat } from '../../contexts/AIChatContext';
import { X, Send, Sparkles, Trash2, Loader2 } from 'lucide-react';

// Quick suggestion templates - Business Advisor focused
const QUICK_SUGGESTIONS = [
  {
    id: 'business-health',
    icon: '💼',
    title: 'Business Health Check',
    prompt: "Act as my business consultant and give me a comprehensive health check. Analyze my current performance, identify areas of concern, and provide specific recommendations to improve. Then ask me follow-up questions to better understand my business situation.",
  },
  {
    id: 'revenue-growth',
    icon: '📈',
    title: 'Grow My Revenue',
    prompt: 'I want to increase my revenue. As my advisor, analyze my current numbers, explain where the opportunities are, and give me a step-by-step plan with 3-5 actionable strategies I can implement this week. What else do you need to know to help me better?',
  },
  {
    id: 'reduce-costs',
    icon: '💰',
    title: 'Reduce My Costs',
    prompt: 'Help me reduce costs without hurting quality. Review my expense structure, identify where I might be overspending, and suggest practical ways to cut costs. Ask me questions about my operations to give better advice.',
  },
  {
    id: 'performance-issues',
    icon: '🔍',
    title: 'Diagnose Issues',
    prompt: "Something feels off with my performance. Act as my consultant - look at my data, identify potential problems, explain what might be causing them, and recommend solutions. What specific numbers should I share with you?",
  },
  {
    id: 'compare-periods',
    icon: '📊',
    title: 'Compare Performance',
    prompt: 'Compare my current performance with previous periods. Explain the trends you see, what they mean for my business, and whether I should be concerned or celebrate. What actions should I take based on these trends?',
  },
  {
    id: 'smart-insights',
    icon: '✨',
    title: 'Smart Insights',
    prompt: "Give me your top 3 insights about my business right now - what's working well, what needs attention, and what opportunities I might be missing. Then suggest specific actions I can take today.",
  },
];

export default function AIChatSidebar() {
  const {
    isOpen,
    closeSidebar,
    messages,
    isLoading,
    sendMessage,
    sendSuggestion,
    clearMessages,
  } = useAIChat();

  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Focus input when sidebar opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSendMessage = () => {
    if (inputValue.trim() && !isLoading) {
      sendMessage(inputValue, false);
      setInputValue('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSuggestionClick = (suggestion) => {
    sendSuggestion(suggestion.prompt);
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-[199] lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 right-0 h-full w-full sm:w-[420px] bg-white dark:bg-gray-800 shadow-2xl z-[200] flex flex-col transition-transform duration-300 ease-smooth ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-indigo-500 to-purple-600">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Business Advisor</h2>
              <p className="text-xs text-white/80">Your trusted consultant</p>
            </div>
          </div>
          <button
            onClick={closeSidebar}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </header>

        {/* Advisor Suggestions (shown when no messages) */}
        {messages.length === 0 && (
          <div className="px-6 py-4 space-y-4">
            <div>
              <p className="text-sm font-bold text-gray-900 dark:text-white mb-1">
                How can I help you today?
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Choose a topic or ask me anything about your business
              </p>
            </div>
            <div className="grid gap-2 max-h-[calc(100vh-280px)] overflow-y-auto pr-2">
              {QUICK_SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion.id}
                  onClick={() => handleSuggestionClick(suggestion)}
                  disabled={isLoading}
                  className="flex items-center gap-3 px-4 py-3 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-700/30 hover:from-indigo-50 hover:to-purple-50 dark:hover:from-indigo-900/20 dark:hover:to-purple-900/20 border border-gray-200 dark:border-gray-600 hover:border-indigo-300 dark:hover:border-indigo-700 rounded-xl transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed group shadow-sm hover:shadow-md"
                >
                  <span className="text-2xl flex-shrink-0">{suggestion.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {suggestion.title}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[85%] ${
                  message.role === 'user'
                    ? 'bg-indigo-500 text-white'
                    : message.isError
                    ? 'bg-red-50 dark:bg-red-900/20 text-red-900 dark:text-red-200'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                } rounded-2xl px-4 py-3 shadow-sm`}
              >
                <div className="text-sm whitespace-pre-wrap break-words">
                  {message.content}
                  {message.isStreaming && (
                    <span className="inline-block w-2 h-4 ml-1 bg-current animate-pulse" />
                  )}
                </div>
                <div
                  className={`text-xs mt-1 ${
                    message.role === 'user'
                      ? 'text-indigo-200'
                      : 'text-gray-500 dark:text-gray-400'
                  }`}
                >
                  {formatTime(message.timestamp)}
                </div>
              </div>
            </div>
          ))}

          {/* Loading indicator */}
          {isLoading && messages[messages.length - 1]?.role === 'user' && (
            <div className="flex justify-start">
              <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl px-4 py-3 shadow-sm">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    Thinking...
                  </span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Clear Chat Button (shown when messages exist) */}
        {messages.length > 0 && (
          <div className="px-6 pb-2">
            <button
              onClick={clearMessages}
              disabled={isLoading}
              className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-4 h-4" />
              Clear conversation
            </button>
          </div>
        )}

        {/* Input Area */}
        <footer className="border-t border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-end gap-2">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything..."
                disabled={isLoading}
                rows={1}
                className="w-full px-4 py-3 pr-12 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  minHeight: '44px',
                  maxHeight: '120px',
                }}
                onInput={(e) => {
                  e.target.style.height = 'auto';
                  e.target.style.height = e.target.scrollHeight + 'px';
                }}
              />
              <div className="absolute bottom-3 right-3 text-xs text-gray-400">
                ⏎
              </div>
            </div>
            <button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading}
              className="p-3 bg-indigo-500 hover:bg-indigo-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white rounded-xl transition-colors disabled:cursor-not-allowed shadow-lg hover:shadow-xl disabled:shadow-none"
              aria-label="Send message"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
            Press <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">Ctrl</kbd> +{' '}
            <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">K</kbd> to toggle
          </p>
        </footer>
      </aside>
    </>
  );
}
