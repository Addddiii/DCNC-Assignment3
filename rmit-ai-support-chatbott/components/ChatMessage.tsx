
import React from 'react';
import { ChatMessage as ChatMessageType, GroundingSource } from '../types';
import { marked } from 'marked'; // For rendering markdown

interface ChatMessageProps {
  message: ChatMessageType;
}

// Basic markdown renderer setup
marked.setOptions({
  gfm: true,
  breaks: true,
  sanitize: true, // IMPORTANT: Sanitize HTML to prevent XSS
});

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.sender === 'user';
  const isBot = message.sender === 'bot';
  const isSystem = message.sender === 'system';

  const createMarkup = (text: string) => {
    return { __html: marked.parse(text) as string };
  };

  return (
    <div className={`flex mb-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-xl px-4 py-3 rounded-lg shadow-md ${
          isUser
            ? 'bg-red-600 text-white rounded-br-none'
            : isBot
            ? 'bg-indigo-700 text-gray-100 rounded-bl-none'
            : 'bg-gray-600 text-gray-200 text-sm italic w-full text-center rounded-none'
        }`}
      >
        <div dangerouslySetInnerHTML={createMarkup(message.text)} className="prose prose-sm prose-invert max-w-none" />
        {message.sources && message.sources.length > 0 && (
          <div className="mt-2 pt-2 border-t border-indigo-500">
            <p className="text-xs font-semibold text-indigo-300 mb-1">Sources from the web:</p>
            <ul className="list-disc list-inside pl-2">
              {message.sources.map((source, index) => (
                source.web?.uri && ( // Check if web and uri exist
                  <li key={index} className="text-xs mb-1">
                    <a
                      href={source.web.uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-300 hover:text-indigo-100 hover:underline truncate"
                      title={source.web.uri}
                    >
                      {source.web.title || source.web.uri}
                    </a>
                  </li>
                )
              ))}
            </ul>
          </div>
        )}
        {!isSystem && (
          <p className="text-xs text-gray-400 mt-1 text-right">
            {new Date(message.timestamp).toLocaleTimeString()}
          </p>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;
