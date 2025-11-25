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

    let systemPrompt = `You are NAVA Business Advisor, an AI-powered business consultant for restaurant owners and managers using the NAVA Ops platform.

Your role is to act as the client's FIRST CONSULTANT - a trusted advisor who:
- Understands their business numbers (sales, costs, profits, growth rates)
- Provides clear, practical advice on improving performance, reducing expenses, and increasing revenue
- Asks smart follow-up questions to engage deeper and provide better guidance
- Explains data in simple terms that guide toward actionable decisions
- Makes clients feel supported and understood

CONVERSATION STYLE:
- Friendly yet professional - like a trusted business partner
- Solution-oriented - always focus on what can be done
- Proactive - ask follow-up questions to better understand their situation
- Clear and practical - avoid jargon, explain concepts simply
- Empathetic - acknowledge challenges and celebrate wins

When analyzing numbers:
1. First, acknowledge what you see in the data
2. Explain what it means in practical terms
3. Provide 2-3 specific, actionable recommendations
4. Ask a follow-up question to engage deeper (e.g., "Would you like me to compare this with last month?" or "Should I suggest a step-by-step improvement plan?")

When you don't have complete data:
- Ask specific questions about their numbers: "What were your sales this week/month?"
- Request context: "What's your current cost structure?" or "What are your main expense categories?"
- Inquire about goals: "What's your target for this period?"

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

    // Format metrics in a structured, readable way
    if (metrics && !metrics.error) {
      systemPrompt += `\n\n=== BUSINESS DATA ===`;

      // Quick summary
      if (metrics.insights?.quickSummary) {
        systemPrompt += `\n\nQuick Summary:\n${metrics.insights.quickSummary}`;
      }

      // Key metrics
      if (metrics.insights?.keyMetrics) {
        systemPrompt += `\n\nKey Metrics:`;
        const km = metrics.insights.keyMetrics;
        if (km.revenue) systemPrompt += `\n- Revenue: ${km.revenue}`;
        if (km.orders) systemPrompt += `\n- Orders: ${km.orders}`;
        if (km.averageOrderValue) systemPrompt += `\n- Avg Order Value: ${km.averageOrderValue}`;
        if (km.costs) systemPrompt += `\n- Costs: ${km.costs}`;
        if (km.profit) systemPrompt += `\n- Profit: ${km.profit}`;
      }

      // Trends
      if (metrics.insights?.trends?.length > 0) {
        systemPrompt += `\n\nTrends:`;
        metrics.insights.trends.forEach((trend) => {
          systemPrompt += `\n- ${trend.description} (${trend.change > 0 ? '+' : ''}${trend.change.toFixed(1)}%)`;
        });
      }

      // Concerns/Alerts
      if (metrics.insights?.concerns?.length > 0) {
        systemPrompt += `\n\nConcerns/Alerts:`;
        metrics.insights.concerns.forEach((concern, idx) => {
          systemPrompt += `\n${idx + 1}. [${concern.severity?.toUpperCase()}] ${concern.description}`;
        });
      }

      // Opportunities
      if (metrics.insights?.opportunities?.length > 0) {
        systemPrompt += `\n\nRecommended Actions:`;
        metrics.insights.opportunities.forEach((opp, idx) => {
          systemPrompt += `\n${idx + 1}. [${opp.priority}] ${opp.action} - Expected impact: ${opp.impact}`;
        });
      }

      // AI Analysis Summary
      if (metrics.aiAnalysis?.summary) {
        const summary = metrics.aiAnalysis.summary;
        systemPrompt += `\n\nOverall Health: ${summary.overallHealth}`;
        if (summary.criticalAlerts > 0) {
          systemPrompt += `\n⚠️ ${summary.criticalAlerts} critical alerts require attention`;
        }
      }

      systemPrompt += `\n\n=== END BUSINESS DATA ===`;
    }

    systemPrompt += `\n\nRemember: You're not just a reporting tool - you're their first business advisor. Use this data to provide personalized, actionable advice. Help them make better decisions.`;

    return {
      role: 'system',
      content: systemPrompt,
    };
  },
};

export default aiChatClient;
