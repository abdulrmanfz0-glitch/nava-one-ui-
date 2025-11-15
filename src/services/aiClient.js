/**
 * AI Chat Client Service
 * Handles communication with OpenAI API for chat functionality
 */

import { logger } from '@/lib/logger';

// OpenAI API Configuration
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || '';
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const MODEL = import.meta.env.VITE_OPENAI_MODEL || 'gpt-4o-mini';

/**
 * AI Chat Client
 */
export const aiChatClient = {
  /**
   * Send a message to OpenAI and get a response
   * @param {Array} messages - Array of message objects with role and content
   * @param {Object} options - Additional options
   * @returns {Promise<string>} - AI response
   */
  async sendMessage(messages, options = {}) {
    try {
      if (!OPENAI_API_KEY) {
        logger.warn('OpenAI API key not configured');
        return 'OpenAI API key is not configured. Please add VITE_OPENAI_API_KEY to your environment variables.';
      }

      logger.info('Sending message to OpenAI', { messageCount: messages.length });

      const response = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: MODEL,
          messages: messages,
          temperature: options.temperature || 0.7,
          max_tokens: options.maxTokens || 1000,
          stream: false, // For now, we'll use non-streaming responses
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error?.message || `OpenAI API error: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      const aiMessage = data.choices?.[0]?.message?.content || 'No response from AI';

      logger.info('Received response from OpenAI');
      return aiMessage;
    } catch (error) {
      logger.error('AI chat request failed', error);
      throw error;
    }
  },

  /**
   * Send a message with streaming response
   * @param {Array} messages - Array of message objects
   * @param {Function} onChunk - Callback for each chunk of response
   * @param {Object} options - Additional options
   */
  async sendMessageStreaming(messages, onChunk, options = {}) {
    try {
      if (!OPENAI_API_KEY) {
        logger.warn('OpenAI API key not configured');
        onChunk('OpenAI API key is not configured. Please add VITE_OPENAI_API_KEY to your environment variables.');
        return;
      }

      logger.info('Sending streaming message to OpenAI', { messageCount: messages.length });

      const response = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: MODEL,
          messages: messages,
          temperature: options.temperature || 0.7,
          max_tokens: options.maxTokens || 1000,
          stream: true,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error?.message || `OpenAI API error: ${response.status} ${response.statusText}`
        );
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine || trimmedLine === 'data: [DONE]') continue;

          if (trimmedLine.startsWith('data: ')) {
            try {
              const jsonData = JSON.parse(trimmedLine.slice(6));
              const content = jsonData.choices?.[0]?.delta?.content;
              if (content) {
                onChunk(content);
              }
            } catch (e) {
              logger.warn('Failed to parse streaming response', e);
            }
          }
        }
      }

      logger.info('Streaming response completed');
    } catch (error) {
      logger.error('AI streaming request failed', error);
      throw error;
    }
  },

  /**
   * Generate a system message with context
   * @param {Object} context - Current page context
   * @returns {Object} - System message object
   */
  generateSystemMessage(context = {}) {
    const { brand, branch, page, metrics } = context;

    let systemPrompt = `You are NAVA AI Assistant, an intelligent helper for the NAVA Ops restaurant management platform.
You help users with data analysis, insights, recommendations, and answering questions about their restaurant operations.

Current Context:`;

    if (brand) {
      systemPrompt += `\n- Brand: ${brand.brand_name || 'Unknown'}`;
    }

    if (branch) {
      systemPrompt += `\n- Current Branch: ${branch.branch_name || 'Unknown'}`;
    }

    if (page) {
      systemPrompt += `\n- Current Page: ${page}`;
    }

    if (metrics) {
      systemPrompt += `\n- Recent Metrics: ${JSON.stringify(metrics, null, 2)}`;
    }

    systemPrompt += `\n\nYou should provide:
- Clear, concise answers
- Data-driven insights when relevant
- Actionable recommendations
- Help with understanding metrics and trends
- Suggestions for optimization

Be friendly, professional, and helpful. If you don't have enough information, ask clarifying questions.`;

    return {
      role: 'system',
      content: systemPrompt,
    };
  },
};

export default aiChatClient;
