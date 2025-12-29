import React, { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from './ui/dialog';
import { type ChatRequest, type ChatResponse, type ChatHistoryItem, type ChatSource } from '../types/knowledge';
import { Send, Bot, User, Trash2, Info, Eye } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { SourceModal } from './SourceModal';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const TypingIndicator: React.FC = () => {
  return (
    <div className="flex items-center space-x-1 p-3 bg-gray-100 rounded-2xl rounded-bl-md max-w-xs">
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
      </div>
      <span className="text-xs text-gray-500 ml-2">AI sedang mengetik...</span>
    </div>
  );
};

const Chat: React.FC = () => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sources, setSources] = useState<ChatResponse['sources']>([]);
  const [isClearDialogOpen, setIsClearDialogOpen] = useState(false);
  const [isInfoDialogOpen, setIsInfoDialogOpen] = useState(false);
  const [selectedSource, setSelectedSource] = useState<ChatSource | null>(null);
  const [isSourceModalOpen, setIsSourceModalOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Load chat history from localStorage on component mount
  useEffect(() => {
    const savedMessages = localStorage.getItem('chatHistory');
    if (savedMessages) {
      try {
        const parsedMessages = JSON.parse(savedMessages).map((msg: Message) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
        setMessages(parsedMessages);
      } catch (error) {
        console.error('Error loading chat history:', error);
      }
    }
  }, []);

  // Save messages to localStorage whenever messages change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('chatHistory', JSON.stringify(messages));
    }
  }, [messages]);

  // Auto scroll to bottom when new messages are added
  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isLoading) return;

    const userMessage = message.trim();
    const userMessageObj: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: userMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessageObj]);
    setMessage('');
    setIsLoading(true);
    setError(null);

    try {
      // Convert messages to ChatHistoryItem format
      const history: ChatHistoryItem[] = [];
      for (let i = 0; i < messages.length; i += 2) {
        if (messages[i] && messages[i + 1] && messages[i].type === 'user' && messages[i + 1].type === 'assistant') {
          history.push({
            user: messages[i].content,
            assistant: messages[i + 1].content
          });
        }
      }

      const requestBody: ChatRequest = {
        message: userMessage,
        history: history
      };

      const response = await fetch(`${import.meta.env.VITE_BACKEND_BASE_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ChatResponse = await response.json();

      const assistantMessageObj: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: data.response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessageObj]);
      setSources(data.sources || []);

    } catch (err) {
      console.error('Error sending message:', err);
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan saat mengirim pesan');
    } finally {
      setIsLoading(false);
    }
  };

  const openClearDialog = () => {
    setIsClearDialogOpen(true);
  };

  const closeClearDialog = () => {
    setIsClearDialogOpen(false);
  };

  const confirmClearHistory = () => {
    setMessages([]);
    setSources([]);
    setError(null);
    localStorage.removeItem('chatHistory');
    setIsClearDialogOpen(false);
  };

  const openInfoDialog = () => {
    setIsInfoDialogOpen(true);
  };

  const closeInfoDialog = () => {
    setIsInfoDialogOpen(false);
  };

  const handleSourceView = (source: ChatSource) => {
    setSelectedSource(source);
    setIsSourceModalOpen(true);
  };

  const closeSourceModal = () => {
    setIsSourceModalOpen(false);
    setSelectedSource(null);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Chat Container */}
      <div className="flex flex-col h-[600px] max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b bg-white rounded-t-lg">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Chat dengan AI</h2>
            <p className="text-sm text-gray-500">
              Tanyakan apapun tentang knowledge base Anda
            </p>
            <p className="text-sm text-gray-500">
              Model : Groq LLaMA 3.3 70B
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={openInfoDialog} className="flex items-center gap-2">
              <Info className="w-4 h-4" />
              Info
            </Button>
            {messages.length > 0 && (
              <Button variant="outline" size="sm" onClick={openClearDialog} className="flex items-center gap-2">
                <Trash2 className="w-4 h-4" />
                Clear Chat
              </Button>
            )}
          </div>
        </div>

        {/* Chat Messages Container */}
        <div
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50"
          style={{ scrollBehavior: 'smooth' }}
        >
          {messages.length === 0 && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-gray-500">
                <Bot className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-lg font-medium">Mulai percakapan</p>
                <p className="text-sm">Ketik pesan untuk memulai chat dengan AI</p>
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex items-end space-x-2 max-w-xs lg:max-w-md ${msg.type === 'user' ? 'flex-row-reverse space-x-reverse' : 'flex-row'
                }`}>
                {/* Avatar */}
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${msg.type === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-600'
                  }`}>
                  {msg.type === 'user' ? (
                    <User className="w-4 h-4" />
                  ) : (
                    <Bot className="w-4 h-4" />
                  )}
                </div>

                {/* Message Bubble */}
                <div className="flex flex-col">
                  <div className={`px-4 py-2 rounded-2xl ${msg.type === 'user'
                      ? 'bg-blue-500 text-white rounded-br-md'
                      : 'bg-white text-gray-800 rounded-bl-md shadow-sm border'
                    }`}>
                    {msg.type === 'user' ? (
                      <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                    ) : (
                      <div className="text-sm prose prose-sm max-w-none">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm, remarkMath]}
                          rehypePlugins={[rehypeKatex]}
                          components={{
                            // Customize code blocks
                            code: ({ inline, className, children, ...props }: React.ComponentPropsWithRef<'code'> & { inline?: boolean }) => {
                              /language-(\w+)/.exec(className || '');
                              return !inline ? (
                                <pre className="bg-gray-100 rounded p-2 overflow-x-auto">
                                  <code className={className} {...props}>
                                    {children}
                                  </code>
                                </pre>
                              ) : (
                                <code className="bg-gray-100 px-1 rounded text-xs" {...props}>
                                  {children}
                                </code>
                              );
                            },
                            // Customize paragraphs
                            p: ({ children }) => (
                              <p className="mb-2 last:mb-0">{children}</p>
                            ),
                            // Customize lists
                            ul: ({ children }) => (
                              <ul className="list-disc list-inside mb-2">{children}</ul>
                            ),
                            ol: ({ children }) => (
                              <ol className="list-decimal list-inside mb-2">{children}</ol>
                            ),
                            // Customize headings
                            h1: ({ children }) => (
                              <h1 className="text-lg font-bold mb-2">{children}</h1>
                            ),
                            h2: ({ children }) => (
                              <h2 className="text-base font-bold mb-2">{children}</h2>
                            ),
                            h3: ({ children }) => (
                              <h3 className="text-sm font-bold mb-1">{children}</h3>
                            ),
                            // Customize tables
                            table: ({ children }) => (
                              <div className="overflow-x-auto mb-2">
                                <table className="min-w-full border-collapse border border-gray-300">
                                  {children}
                                </table>
                              </div>
                            ),
                            th: ({ children }) => (
                              <th className="border border-gray-300 px-2 py-1 bg-gray-100 font-semibold text-left">
                                {children}
                              </th>
                            ),
                            td: ({ children }) => (
                              <td className="border border-gray-300 px-2 py-1">
                                {children}
                              </td>
                            ),
                            // Customize blockquotes
                            blockquote: ({ children }) => (
                              <blockquote className="border-l-4 border-gray-300 pl-3 italic mb-2">
                                {children}
                              </blockquote>
                            ),
                          }}
                        >
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                    )}
                  </div>
                  <span className={`text-xs text-gray-400 mt-1 ${msg.type === 'user' ? 'text-right' : 'text-left'
                    }`}>
                    {formatTime(msg.timestamp)}
                  </span>
                </div>
              </div>
            </div>
          ))}

          {/* Typing Indicator */}
          {isLoading && (
            <div className="flex justify-start">
              <div className="flex items-end space-x-2">
                <div className="flex-shrink-0 w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                  <Bot className="w-4 h-4 text-gray-600" />
                </div>
                <TypingIndicator />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-3 mx-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Input Area */}
        <div className="p-4 bg-white border-t rounded-b-lg">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ketik pesan Anda di sini..."
              disabled={isLoading}
              className="flex-1 rounded-full border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
            <Button
              type="submit"
              disabled={isLoading || !message.trim()}
              className="rounded-full w-10 h-10 p-0 bg-blue-500 hover:bg-blue-600"
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </div>

      {/* Sources - Separate from chat container */}
      {sources.length > 0 && (
        <div className="max-w-4xl mx-auto space-y-3">
          <h3 className="text-sm font-medium text-gray-700">Sumber Referensi:</h3>
          <div className="grid gap-3 md:grid-cols-2">
            {sources.map((source, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow cursor-pointer group">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-sm">{source.title}</CardTitle>
                      <CardDescription className="text-xs">
                        {source.source}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-1">
                      {source.similarity_score && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {(source.similarity_score * 100).toFixed(1)}% match
                        </span>
                      )}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSourceView(source);
                          }}
                          className="h-6 w-6 p-0 hover:bg-blue-100"
                        >
                          <Eye className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent onClick={() => handleSourceView(source)}>
                  <p className="text-xs text-gray-600 line-clamp-2">
                    {source.content}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Source Modal */}
      <SourceModal
        source={selectedSource}
        isOpen={isSourceModalOpen}
        onClose={closeSourceModal}
      />

      {/* Info Dialog */}
      <Dialog open={isInfoDialogOpen} onOpenChange={closeInfoDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Informasi Penyimpanan Chat</DialogTitle>
            <DialogDescription>
              Riwayat percakapan Anda disimpan secara lokal di browser menggunakan localStorage.
              Data chat akan tetap tersimpan meskipun Anda menutup dan membuka kembali aplikasi,
              namun akan hilang jika Anda menghapus data browser atau menggunakan mode incognito.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={closeInfoDialog}>
              Mengerti
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Clear Chat Confirmation Dialog */}
      <Dialog open={isClearDialogOpen} onOpenChange={closeClearDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Riwayat Chat</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus semua riwayat percakapan? Tindakan ini tidak dapat dibatalkan dan akan menghapus seluruh pesan chat yang tersimpan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={closeClearDialog}>
              Batal
            </Button>
            <Button variant="destructive" onClick={confirmClearHistory}>
              Hapus Semua
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Chat;