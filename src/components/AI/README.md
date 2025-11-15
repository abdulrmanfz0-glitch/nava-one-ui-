# AI Chat Sidebar Feature

## Overview
The AI Chat Sidebar is an intelligent assistant integrated into NAVA Ops that helps users with data analysis, insights, and recommendations across all pages.

## Features

### 1. **Floating AI Assistant Button**
- Located at the bottom-right corner of every page
- Animated glow effect to attract attention
- Click to open/close the sidebar
- Shows tooltip on hover

### 2. **Collapsible Right-Side Panel**
- Slides in smoothly from the right
- 420px width on desktop, full-width on mobile
- Dark mode supported
- High z-index (200) ensures it's always on top

### 3. **Keyboard Shortcut**
- Press `Ctrl + K` (or `Cmd + K` on Mac) to toggle the sidebar
- Works from any page in the application

### 4. **Quick Suggestions**
When you first open the chat, you'll see three quick action buttons:
- **Analyze Performance**: Get insights on today's performance
- **Sales Analysis**: Understand sales trends and drops
- **Optimization Ideas**: Get recommendations for improvement

### 5. **Context-Aware AI**
The AI assistant is aware of:
- Current brand
- Selected branch
- Current page
- Recent metrics and data

### 6. **Chat Features**
- Send messages and receive AI-powered responses
- Message history preserved during session
- Clear conversation button
- Timestamp on each message
- Loading indicators
- Error handling with user-friendly messages

## Technical Details

### Components

#### `AIChatSidebar.jsx`
Main sidebar component with chat interface.

#### `AIFloatingButton.jsx`
Floating button to toggle the sidebar.

### Context

#### `AIChatContext.jsx`
Manages chat state and provides methods:
- `openSidebar()` - Open the sidebar
- `closeSidebar()` - Close the sidebar
- `toggleSidebar()` - Toggle sidebar state
- `sendMessage(message)` - Send a message to AI
- `sendSuggestion(prompt)` - Send a quick suggestion
- `clearMessages()` - Clear chat history
- `updateContext(context)` - Update page context

### Service

#### `aiClient.js`
Handles communication with OpenAI API:
- `sendMessage(messages, options)` - Send messages and get response
- `sendMessageStreaming(messages, onChunk, options)` - Streaming responses
- `generateSystemMessage(context)` - Generate context-aware system prompt

## Configuration

### Environment Variables

Add to your `.env` file:

```env
VITE_OPENAI_API_KEY=your-openai-api-key-here
VITE_OPENAI_MODEL=gpt-4o-mini
```

### Getting an OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in
3. Navigate to API Keys section
4. Create a new secret key
5. Copy and paste it into your `.env` file

## Usage

### Integration
The AI Chat feature is already integrated into the Layout component and available on all pages.

### Using in Code

```jsx
import { useAIChat } from '@/contexts/AIChatContext';

function MyComponent() {
  const { openSidebar, updateContext } = useAIChat();

  const handleAnalyzeClick = () => {
    // Update context with current page data
    updateContext({
      page: 'Dashboard',
      metrics: { revenue: 5000, orders: 150 }
    });

    // Open the sidebar
    openSidebar();
  };

  return <button onClick={handleAnalyzeClick}>Analyze with AI</button>;
}
```

## Future Enhancements

- [ ] Streaming responses for real-time feedback
- [ ] Voice input support
- [ ] Suggested actions based on AI recommendations
- [ ] Export chat history
- [ ] Custom AI prompts per page
- [ ] Integration with NAVA analytics data
- [ ] Multi-language support
- [ ] Chat history persistence

## Troubleshooting

### AI not responding
- Check if `VITE_OPENAI_API_KEY` is set in `.env`
- Verify API key is valid
- Check browser console for errors
- Ensure internet connection is active

### Sidebar not opening
- Verify `AIChatProvider` is wrapping the app
- Check browser console for context errors
- Try using keyboard shortcut (Ctrl+K)

### Keyboard shortcut not working
- Check if another extension is using Ctrl+K
- Try clicking the floating button instead
- Verify Layout component has the keyboard listener

## Support

For issues or feature requests, please contact the development team or create an issue in the project repository.
