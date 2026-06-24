import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import axios from 'axios';

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: Date;
}

interface ApiMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

interface HistoryResponse {
  messages: ApiMessage[];
}

interface SendMessageResponse {
  reply: string;
  sessionId: string;
}

interface ApiErrorResponse {
  message?: string;
}

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

function toChatMessage(message: ApiMessage): ChatMessage {
  return {
    ...message,
    timestamp: new Date(message.timestamp),
  };
}

function isCanceledRequest(error: unknown): boolean {
  return axios.isAxiosError(error) && error.code === 'ERR_CANCELED';
}

export default function Chat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(() =>
    localStorage.getItem('sessionId'),
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const activeSendControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      activeSendControllerRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (!sessionId) {
      return;
    }

    const controller = new AbortController();
    void loadHistory(sessionId, controller.signal);

    return () => {
      controller.abort();
    };
  }, [sessionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const loadHistory = async (sid: string, signal: AbortSignal) => {
    try {
      const { data } = await axios.get<HistoryResponse>(`${API_URL}/chat/history/${sid}`, {
        signal,
      });

      if (!isMountedRef.current) {
        return;
      }

      setMessages(data.messages.map(toChatMessage));
    } catch (requestError: unknown) {
      if (!isCanceledRequest(requestError) && isMountedRef.current) {
        setError('Could not load previous messages.');
      }
    }
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    setInput('');
    setError('');

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      sender: 'user',
      text,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    const controller = new AbortController();
    activeSendControllerRef.current = controller;

    try {
      const { data } = await axios.post<SendMessageResponse>(
        `${API_URL}/chat/message`,
        {
          message: text,
          sessionId,
        },
        {
          signal: controller.signal,
        },
      );

      if (!isMountedRef.current) {
        return;
      }

      if (!sessionId) {
        setSessionId(data.sessionId);
        localStorage.setItem('sessionId', data.sessionId);
      }

      const aiMsg: ChatMessage = {
        id: crypto.randomUUID(),
        sender: 'ai',
        text: data.reply,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (requestError: unknown) {
      if (!isMountedRef.current || isCanceledRequest(requestError)) {
        return;
      }

      const message = axios.isAxiosError<ApiErrorResponse>(requestError)
        ? requestError.response?.data?.message
        : undefined;

      setError(message ?? 'Something went wrong. Please try again.');
    } finally {
      if (activeSendControllerRef.current === controller) {
        activeSendControllerRef.current = null;
      }

      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#0f0f0f]">
      <div className="w-[480px] h-[680px] bg-[#1a1a1a] rounded-2xl border border-[#2a2a2a] flex flex-col overflow-hidden shadow-2xl">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#2a2a2a] flex items-center gap-3">
          <div className="w-2 h-2 bg-green-500 rounded-full" />
          <h2 className="text-sm font-semibold text-white">SpurStore Support</h2>
          <span className="ml-auto text-xs text-[#555]">AI Agent</span>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3">
          {messages.length === 0 && (
            <div className="flex-1 flex items-center justify-center text-[#444] text-sm">
              Ask me anything about SpurStore 👋
            </div>
          )}
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col max-w-[80%] ${
                msg.sender === 'user' ? 'self-end items-end' : 'self-start items-start'
              }`}
            >
              <div
                className={`px-4 py-2.5 rounded-xl text-sm leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-indigo-500 text-white rounded-br-sm'
                    : 'bg-[#2a2a2a] text-[#f0f0f0] rounded-bl-sm'
                }`}
              >
               <div className="prose-chat">
                <ReactMarkdown>{msg.text}</ReactMarkdown>
               </div>

              </div>
              <span className="text-[11px] text-[#555] mt-1 px-1">
                {formatTime(msg.timestamp)}
              </span>
            </div>
          ))}

          {/* Typing indicator */}
          {isLoading && (
            <div className="self-start bg-[#2a2a2a] px-4 py-3 rounded-xl rounded-bl-sm flex gap-1.5 items-center">
              <span className="w-1.5 h-1.5 bg-[#666] rounded-full animate-bounce [animation-delay:0ms]" />
              <span className="w-1.5 h-1.5 bg-[#666] rounded-full animate-bounce [animation-delay:150ms]" />
              <span className="w-1.5 h-1.5 bg-[#666] rounded-full animate-bounce [animation-delay:300ms]" />
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Error */}
        {error && (
          <p className="text-xs text-red-400 text-center px-5 pb-2">{error}</p>
        )}

        {/* Input */}
        <div className="px-4 py-3 border-t border-[#2a2a2a] flex gap-2 items-end">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            maxLength={2000}
            rows={1}
            className="flex-1 bg-[#2a2a2a] border border-[#333] rounded-xl px-4 py-2.5 text-sm text-white placeholder-[#555] outline-none resize-none focus:border-indigo-500 transition-colors font-inherit"
          />
          <button
            onClick={sendMessage}
            disabled={isLoading || !input.trim()}
            className="w-10 h-10 bg-indigo-500 hover:bg-indigo-600 disabled:bg-[#333] disabled:text-[#555] rounded-xl flex items-center justify-center text-white transition-colors cursor-pointer disabled:cursor-not-allowed"
          >
            ↑
          </button>
        </div>
      </div>
    </div>
  );
}
