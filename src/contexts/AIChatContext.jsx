/**
 * AI Chat Context
 * Manages AI chat sidebar state and functionality
 */

import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { aiChatClient } from '@/services/aiClient';
import { logger } from '@/lib/logger';
import { useBrand } from './BrandContext';
import { useBranchSelection } from './BranchSelectionContext';

const AIChatContext = createContext(null);

export function AIChatProvider({ children }) {
  const { brand } = useBrand();
  const { selectedBranch } = useBranchSelection();

  // State
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentContext, setCurrentContext] = useState({});

  /**
   * Open the sidebar
   */
  const openSidebar = useCallback(() => {
    setIsOpen(true);
    logger.info('AI Chat sidebar opened');
  }, []);

  /**
   * Close the sidebar
   */
  const closeSidebar = useCallback(() => {
    setIsOpen(false);
    logger.info('AI Chat sidebar closed');
  }, []);

  /**
   * Toggle sidebar
   */
  const toggleSidebar = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  /**
   * Update page context
   */
  const updateContext = useCallback((context) => {
    setCurrentContext((prev) => ({ ...prev, ...context }));
  }, []);

  /**
   * Clear all messages
   */
  const clearMessages = useCallback(() => {
    setMessages([]);
    logger.info('AI Chat messages cleared');
  }, []);

  /**
   * Send a message to AI
   */
  const sendMessage = useCallback(
    async (userMessage, streaming = false) => {
      if (!userMessage.trim()) {
        return;
      }

      setIsLoading(true);
      setError(null);

      // Add user message to chat
      const newUserMessage = {
        id: Date.now(),
        role: 'user',
        content: userMessage,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, newUserMessage]);

      try {
        // Prepare messages for API
        const context = {
          brand,
          branch: selectedBranch,
          ...currentContext,
        };

        const systemMessage = aiChatClient.generateSystemMessage(context);
        const conversationMessages = messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        }));

        const apiMessages = [
          systemMessage,
          ...conversationMessages,
          { role: 'user', content: userMessage },
        ];

        if (streaming) {
          // Streaming response
          const assistantMessageId = Date.now() + 1;
          let fullResponse = '';

          // Add placeholder for assistant message
          setMessages((prev) => [
            ...prev,
            {
              id: assistantMessageId,
              role: 'assistant',
              content: '',
              timestamp: new Date(),
              isStreaming: true,
            },
          ]);

          await aiChatClient.sendMessageStreaming(
            apiMessages,
            (chunk) => {
              fullResponse += chunk;
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantMessageId
                    ? { ...msg, content: fullResponse }
                    : msg
                )
              );
            }
          );

          // Mark streaming as complete
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId
                ? { ...msg, isStreaming: false }
                : msg
            )
          );
        } else {
          // Regular response
          const response = await aiChatClient.sendMessage(apiMessages);

          const assistantMessage = {
            id: Date.now() + 1,
            role: 'assistant',
            content: response,
            timestamp: new Date(),
          };

          setMessages((prev) => [...prev, assistantMessage]);
        }

        logger.info('AI message sent successfully');
      } catch (err) {
        logger.error('Failed to send AI message', err);
        setError(err.message || 'Failed to send message');

        // Add error message to chat
        const errorMessage = {
          id: Date.now() + 1,
          role: 'assistant',
          content: `Sorry, I encountered an error: ${err.message || 'Unknown error'}. Please try again.`,
          timestamp: new Date(),
          isError: true,
        };

        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
      }
    },
    [messages, brand, selectedBranch, currentContext]
  );

  /**
   * Send a quick suggestion
   */
  const sendSuggestion = useCallback(
    (suggestionText) => {
      sendMessage(suggestionText, false);
    },
    [sendMessage]
  );

  const value = {
    // State
    isOpen,
    messages,
    isLoading,
    error,
    currentContext,

    // Methods
    openSidebar,
    closeSidebar,
    toggleSidebar,
    sendMessage,
    sendSuggestion,
    clearMessages,
    updateContext,
  };

  return <AIChatContext.Provider value={value}>{children}</AIChatContext.Provider>;
}

/**
 * Hook to use AI Chat context
 */
export function useAIChat() {
  const context = useContext(AIChatContext);

  if (!context) {
    throw new Error('useAIChat must be used within an AIChatProvider');
  }

  return context;
}

export default AIChatContext;
