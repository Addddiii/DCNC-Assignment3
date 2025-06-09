
import React, { useState, useEffect, useCallback } from 'react';
import { Chat } from '@google/genai';
import { ChatMessage, GroundingSource } from './types';
import ChatWindow from './components/ChatWindow';
import { startChatSession, sendMessageStream } from './services/geminiService';
import { ALL_POLICY_TEXT } from './policyData';
import { INITIAL_SYSTEM_MESSAGE, RMIT_SYSTEM_INSTRUCTION } from './constants';

const App: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [chatSession, setChatSession] = useState<Chat | null>(null);

  useEffect(() => {
    const initializeChat = () => {
      try {
        // Initial history can include the system instruction as the first "bot" turn.
        // Or, system instruction is part of chat.create config.
        // For explicit display, add a system message.
        setMessages([{
          id: 'system-init-0',
          text: RMIT_SYSTEM_INSTRUCTION, // Display system prompt for transparency (optional)
          sender: 'system',
          timestamp: new Date(),
        },
        {
          id: 'system-init-1',
          text: INITIAL_SYSTEM_MESSAGE,
          sender: 'system',
          timestamp: new Date(),
        }]);
        
        const session = startChatSession(); // System instruction is handled in startChatSession
        setChatSession(session);
      } catch (e) {
        console.error("Failed to initialize chat session:", e);
        setError(e instanceof Error ? e.message : "Failed to initialize chat session. Ensure API_KEY is set.");
      }
    };
    initializeChat();
  }, []);

  const handleSendMessage = useCallback(async (text: string) => {
    if (!chatSession) {
      setError("Chat session not initialized. Please refresh.");
      return;
    }

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      text,
      sender: 'user',
      timestamp: new Date(),
    };
    setMessages(prevMessages => [...prevMessages, userMessage]);
    setIsLoading(true);
    setError(null);

    const botMessageId = `bot-${Date.now()}`;
    // Add a placeholder for the streaming bot message
    setMessages(prevMessages => [
      ...prevMessages,
      { id: botMessageId, text: '', sender: 'bot', timestamp: new Date(), isStreaming: true, sources: [] },
    ]);

    let accumulatedText = "";
    let finalSources: GroundingSource[] = [];

    try {
      const stream = sendMessageStream(chatSession, text, ALL_POLICY_TEXT);
      for await (const chunk of stream) {
        accumulatedText += chunk.text;
        finalSources = chunk.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        
        setMessages(prevMessages =>
          prevMessages.map(msg =>
            msg.id === botMessageId
              ? { ...msg, text: accumulatedText, sources: finalSources } 
              : msg
          )
        );
      }
    } catch (e) {
      console.error("Error during Gemini API call:", e);
      const errorMessage = e instanceof Error ? e.message : "An unexpected error occurred.";
      setError(errorMessage);
      accumulatedText = `Sorry, I encountered an error: ${errorMessage}`;
    } finally {
      setMessages(prevMessages =>
        prevMessages.map(msg =>
          msg.id === botMessageId
            ? { ...msg, text: accumulatedText || "No response from AI.", isStreaming: false, sources: finalSources }
            : msg
        )
      );
      setIsLoading(false);
    }
  }, [chatSession]);

  return (
    <div className="min-h-screen bg-indigo-950 flex items-center justify-center">
      <ChatWindow
        messages={messages}
        isLoading={isLoading}
        error={error}
        onSendMessage={handleSendMessage}
      />
    </div>
  );
};

export default App;
