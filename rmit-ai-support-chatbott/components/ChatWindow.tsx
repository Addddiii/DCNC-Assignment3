
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage as ChatMessageType } from '../types';
import ChatMessage from './ChatMessage';
import LoadingSpinner from './LoadingSpinner';

interface ChatWindowProps {
  messages: ChatMessageType[];
  isLoading: boolean;
  error: string | null;
  onSendMessage: (messageText: string) => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ messages, isLoading, error, onSendMessage }) => {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onSendMessage(inputValue.trim());
      setInputValue('');
    }
  };

  return (
    <div className="flex flex-col h-screen bg-indigo-950 max-w-4xl mx-auto shadow-2xl border-x-2 border-indigo-800">
      <header className="bg-red-700 p-4 text-white text-center shadow-lg">
        <h1 className="text-2xl font-bold">RMIT AI Support</h1>
      </header>

      <main className="flex-grow p-6 overflow-y-auto space-y-4 bg-indigo-900 scrollbar-thin scrollbar-thumb-indigo-600 scrollbar-track-indigo-950">
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}
        {isLoading && messages.some(m => m.isStreaming) && <ChatMessage key="streaming-msg" message={{id:'streaming', text: messages.find(m=>m.isStreaming)?.text || "...", sender: 'bot', timestamp: new Date()}} /> }
        {isLoading && !messages.some(m => m.isStreaming) && <LoadingSpinner />}
        {error && <div className="text-red-400 p-3 bg-red-900 rounded-md text-center">{error}</div>}
        <div ref={messagesEndRef} />
      </main>

      <footer className="bg-indigo-800 p-4 shadow-up">
        <form onSubmit={handleSubmit} className="flex items-center space-x-3">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask RMIT Assist..."
            className="flex-grow p-3 border border-indigo-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none bg-indigo-700 text-gray-100 placeholder-gray-400 transition duration-150"
            disabled={isLoading && !messages.some(m => m.isStreaming)}
          />
          <button
            type="submit"
            className="bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-opacity-75 transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            disabled={isLoading && !messages.some(m => m.isStreaming)}
          >
            Send
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 ml-2">
              <path d="M3.105 2.289a.75.75 0 00-.826.95l1.414 4.949a.75.75 0 00.95.826L11.25 9.25v1.5L4.643 11.984a.75.75 0 00-.95.826l-1.414 4.949a.75.75 0 00.826.95L17.53 12.5a.75.75 0 000-1.414L3.105 2.289z" />
            </svg>
          </button>
        </form>
      </footer>
    </div>
  );
};

export default ChatWindow;
