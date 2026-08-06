'use client';

import { useEffect, useRef, useState } from 'react';
import { ChatInput } from '@/components/ChatInput';
import { ChatMessage, LoadingMessage } from '@/components/ChatMessage';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
  imageUrl?: string;
}

interface Conversation {
  id: string;
  title: string;
  preview: string;
  messages: Message[];
  createdAt: string;
}

const exampleQueries = [
  '퇴사했는데 퇴직금을 받지 못했습니다.',
  '온라인 쇼핑몰에서 환불을 거부하고 있습니다.',
  '현재 가지고 있는 증거로 충분한지 확인해 주세요.',
];

const TYPING_SPEED_MS = 12;

function createConversation(id: string, title = '새 대화'): Conversation {
  return {
    id,
    title,
    preview: '새 대화',
    messages: [],
    createdAt: new Date().toISOString(),
  };
}

function downloadAsText(messages: Message[], conversationTitle: string) {
  const content = messages
    .map((msg) => {
      const time = new Date(msg.timestamp).toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit',
      });
      return `[${time}] ${msg.role === 'user' ? '나' : 'Lawi'}:\n${msg.text}`;
    })
    .join('\n\n');

  const element = document.createElement('a');
  element.setAttribute('href', `data:text/plain;charset=utf-8,${encodeURIComponent(content)}`);
  element.setAttribute('download', `${conversationTitle}.txt`);
  element.style.display = 'none';
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [typingText, setTypingText] = useState('');
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingIntervalRef = useRef<number | null>(null);

  const activeConversation = conversations.find((conversation) => conversation.id === activeConversationId) ?? null;
  const messages = activeConversation?.messages ?? [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingText]);

  useEffect(() => {
    return () => {
      if (typingIntervalRef.current) {
        window.clearInterval(typingIntervalRef.current);
      }
    };
  }, []);

  const ensureConversation = (fallbackTitle = '새 대화') => {
    if (activeConversationId) {
      return activeConversationId;
    }

    const conversationId = `conv-${Date.now()}`;
    const newConversation = createConversation(conversationId, fallbackTitle);
    setConversations((prev) => [newConversation, ...prev]);
    setActiveConversationId(conversationId);
    return conversationId;
  };

  const updateConversation = (conversationId: string, updater: (conversation: Conversation) => Conversation) => {
    setConversations((prev) => prev.map((conversation) => (conversation.id === conversationId ? updater(conversation) : conversation)));
  };

  const handleSendMessage = async (text: string, imageUrl?: string) => {
    if (!text.trim() && !imageUrl) return;

    if (typingIntervalRef.current) {
      window.clearInterval(typingIntervalRef.current);
    }

    const trimmedText = text.trim();
    const conversationId = ensureConversation(trimmedText.slice(0, 20) || '이미지 첨부');
    const userMessage: Message = {
      id: `msg-${Date.now()}-user`,
      role: 'user',
      text: trimmedText,
      timestamp: new Date().toISOString(),
      imageUrl,
    };

    updateConversation(conversationId, (conversation) => ({
      ...conversation,
      title: conversation.title === '새 대화' ? trimmedText.slice(0, 20) || '이미지' : conversation.title,
      preview: trimmedText.slice(0, 48) || '이미지 첨부',
      messages: [...conversation.messages, userMessage],
    }));

    setTypingText('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: trimmedText }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '서버와의 연결에 실패했습니다.');
      }

      const replyText = data.reply || '답변을 확인할 수 없습니다.';
      setTypingText('');

      let index = 0;
      typingIntervalRef.current = window.setInterval(() => {
        index += 1;
        setTypingText(replyText.slice(0, index));

        if (index >= replyText.length) {
          window.clearInterval(typingIntervalRef.current ?? undefined);
          typingIntervalRef.current = null;

          const assistantMessage: Message = {
            id: `msg-${Date.now()}-assistant`,
            role: 'assistant',
            text: replyText,
            timestamp: new Date().toISOString(),
          };

          updateConversation(conversationId, (conversation) => ({
            ...conversation,
            preview: replyText.slice(0, 48),
            messages: [...conversation.messages, assistantMessage],
          }));
          setTypingText('');
        }
      }, TYPING_SPEED_MS);
    } catch (error) {
      console.error(error);
      setTypingText('');
      updateConversation(conversationId, (conversation) => ({
        ...conversation,
        preview: '서버 연결 실패',
        messages: [
          ...conversation.messages,
          {
            id: `msg-${Date.now()}-error`,
            role: 'assistant',
            text: '죄송합니다. 서버와의 연결에 실패했습니다. 잠시 후 다시 시도해 주세요.',
            timestamp: new Date().toISOString(),
          },
        ],
      }));
    } finally {
      setIsLoading(false);
      setPendingImage(null);
      setUploadError('');
    }
  };

  const handleUploadImage = (imageUrl?: string, errorMessage?: string) => {
    if (errorMessage) {
      setPendingImage(null);
      setUploadError(errorMessage);
      return;
    }

    if (!imageUrl) {
      setPendingImage(null);
      setUploadError('이미지를 다시 업로드해 주세요.');
      return;
    }

    setPendingImage(imageUrl);
    setUploadError('');
  };

  const handleDownloadConversation = () => {
    if (activeConversation) {
      downloadAsText(activeConversation.messages, activeConversation.title);
    }
  };

  const handleNewChat = () => {
    if (typingIntervalRef.current) {
      window.clearInterval(typingIntervalRef.current);
      typingIntervalRef.current = null;
    }
    const newConversation = createConversation(`conv-${Date.now()}`, '새 대화');
    setConversations((prev) => [newConversation, ...prev]);
    setActiveConversationId(newConversation.id);
    setTypingText('');
    setIsLoading(false);
    setPendingImage(null);
    setUploadError('');
  };

  const handleDeleteConversation = (conversationId: string) => {
    setConversations((prev) => prev.filter((conversation) => conversation.id !== conversationId));
    if (activeConversationId === conversationId) {
      const remaining = conversations.filter((conversation) => conversation.id !== conversationId);
      setActiveConversationId(remaining.length > 0 ? remaining[0].id : null);
      setTypingText('');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <div className="relative mx-auto flex min-h-screen max-w-[1600px] gap-4 px-4 py-4 md:px-6 md:py-6">
        <button
          type="button"
          onClick={() => setSidebarOpen((prev) => !prev)}
          aria-label={sidebarOpen ? '사이드바 닫기' : '사이드바 열기'}
          className="fixed top-6 right-4 z-40 inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white shadow-lg shadow-slate-200/60 transition duration-300 hover:scale-105 hover:bg-slate-100"
        >
          <div className="flex flex-col gap-1.5">
            <span className={`block h-0.5 w-5 rounded-full bg-slate-900 transition-transform duration-300 ${sidebarOpen ? 'translate-y-2 rotate-45' : ''}`} />
            <span className={`block h-0.5 w-5 rounded-full bg-slate-900 transition-opacity duration-300 ${sidebarOpen ? 'opacity-0' : 'opacity-100'}`} />
            <span className={`block h-0.5 w-5 rounded-full bg-slate-900 transition-transform duration-300 ${sidebarOpen ? '-translate-y-2 -rotate-45' : ''}`} />
          </div>
        </button>

        <div
          className={`fixed inset-0 z-10 bg-slate-950/30 backdrop-blur-[1px] transition-opacity duration-300 md:hidden ${sidebarOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'}`}
          onClick={() => setSidebarOpen(false)}
        />

        <aside className={`fixed inset-y-0 left-0 z-20 flex w-[18rem] flex-col gap-5 rounded-r-[32px] border border-slate-200 bg-gradient-to-b from-white via-white to-slate-50/50 p-6 shadow-[0_25px_90px_rgba(15,23,42,0.12)] transition-all duration-300 ease-out md:sticky md:inset-auto md:h-[calc(100vh-2.5rem)] md:translate-x-0 md:rounded-[32px] ${sidebarOpen ? 'translate-x-0 opacity-100 md:w-80' : '-translate-x-full opacity-0 md:w-0 md:border-0 md:p-0'}`}>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-cyan-400 text-lg font-bold text-white shadow-md">
                    L
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">Lawi</p>
                    <p className="text-xs text-slate-500">법률 상담</p>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleNewChat}
                className="flex w-full items-center justify-center gap-2 rounded-[16px] bg-gradient-to-r from-indigo-500 to-cyan-400 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:shadow-lg hover:shadow-indigo-600/30"
              >
                <span className="text-lg">＋</span>
                새 채팅 시작
              </button>
              <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
              <nav className="flex-1 space-y-2">
                <p className="px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">대화 히스토리</p>
                <div className="max-h-64 space-y-2 overflow-y-auto pr-2">
                  {conversations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 px-4 py-6 text-center">
                      <div className="text-2xl mb-2">✨</div>
                      <p className="text-xs font-medium text-slate-600">아직 저장된 대화가 없어요.</p>
                      <p className="mt-1 text-xs text-slate-500">새 채팅을 시작해 보세요!</p>
                    </div>
                  ) : (
                    conversations.map((conversation) => (
                      <button
                        key={conversation.id}
                        type="button"
                        onClick={() => setActiveConversationId(conversation.id)}
                        className={`group relative w-full rounded-[12px] border px-3 py-2.5 text-left transition duration-200 ${
                          activeConversationId === conversation.id
                            ? 'border-indigo-200 bg-indigo-50 shadow-sm'
                            : 'border-transparent bg-slate-50 hover:bg-slate-100'
                        }`}
                      >
                        <div className="truncate text-sm font-medium text-slate-900">{conversation.title}</div>
                        <div className="mt-0.5 truncate text-xs text-slate-500">{conversation.preview}</div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteConversation(conversation.id);
                          }}
                          className="absolute right-2 top-2.5 flex h-6 w-6 items-center justify-center rounded-md bg-red-500/10 text-red-600 opacity-0 transition group-hover:opacity-100 hover:bg-red-500/20"
                          aria-label="대화 삭제"
                        >
                          ✕
                        </button>
                      </button>
                    ))
                  )}
                </div>
              </nav>
            </div>
          </aside>

        <main className="flex-1">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <h1 className="text-4xl font-semibold tracking-tight text-slate-950">Lawi AI</h1>
                <p className="mt-2 text-sm text-slate-600">법률 상담을 빠르게 시작해 보세요.</p>
              </div>
            </div>

            <div className="flex h-[calc(100vh-120px)] w-full flex-col rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_30px_60px_rgba(15,23,42,0.08)]">
              <div className="mx-auto flex h-full w-full max-w-5xl flex-col">
                <div className="mt-6 flex-1 overflow-y-auto pr-2">
                  {messages.length === 0 ? (
                    <div className="flex h-full min-h-[24rem] items-center justify-center rounded-[20px] border border-slate-200 bg-white/50 p-8 text-center text-slate-600">
                      <div className="w-full max-w-2xl space-y-5">
                        <div className="rounded-[24px] border border-slate-200 bg-white p-6 text-left shadow-sm">
                          <p className="text-sm font-semibold text-indigo-600">새 대화</p>
                          <h2 className="mt-2 text-2xl font-semibold text-slate-900">새 대화가 시작되었습니다.</h2>
                          <p className="mt-2 text-sm text-slate-600">무엇을 도와드릴까요? 법률 문제를 편하게 설명해 주세요.</p>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-3">
                          {exampleQueries.map((query) => (
                            <button
                              key={query}
                              type="button"
                              onClick={() => handleSendMessage(query)}
                              className="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-left text-sm text-slate-700 shadow-sm transition hover:bg-slate-50"
                            >
                              {query}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages.map((message) => (
                        <ChatMessage key={message.id} role={message.role} text={message.text} timestamp={message.timestamp} imageUrl={message.imageUrl} />
                      ))}
                      {isLoading && !typingText && <LoadingMessage />}
                      {typingText && (
                        <div className="flex justify-start">
                          <div className="max-w-[92%] text-left md:max-w-[84%]">
                            <div className="rounded-[24px] rounded-bl-[8px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm md:px-5 md:py-4">
                              <p className="whitespace-pre-wrap break-words text-base leading-7">
                                {typingText}
                                <span className="ml-0.5 inline-block h-5 min-h-[1.25rem] w-[2px] animate-typingCursor rounded-full bg-slate-900 align-middle" />
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </div>

                <div className="mt-4 sticky bottom-0 bg-transparent pt-4">
                  <div className="rounded-[20px] border border-slate-200 bg-white px-4 py-3 shadow-sm">
                    {pendingImage && (
                      <div className="mb-3 rounded-[16px] border border-indigo-200 bg-indigo-50/70 p-3">
                        <div className="mb-2 flex items-center justify-between">
                          <p className="text-sm font-semibold text-indigo-700">첨부된 이미지</p>
                          <button
                            type="button"
                            onClick={() => {
                              setPendingImage(null);
                              setUploadError('');
                            }}
                            className="text-xs font-medium text-slate-500 transition hover:text-slate-700"
                          >
                            제거
                          </button>
                        </div>
                        <img src={pendingImage} alt="첨부 이미지 미리보기" className="max-h-40 rounded-[12px] object-cover" />
                      </div>
                    )}

                    {uploadError && (
                      <div className="mb-3 rounded-[14px] border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-700">
                        {uploadError}
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <ChatInput onSend={handleSendMessage} onNewChat={handleNewChat} loading={isLoading} onUploadImage={handleUploadImage} />
                      <button
                        type="button"
                        onClick={handleDownloadConversation}
                        disabled={!activeConversation || activeConversation.messages.length === 0}
                        className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-[14px] border border-slate-200 bg-slate-50 text-lg text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
                        title="대화 다운로드"
                      >
                        ⬇
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
