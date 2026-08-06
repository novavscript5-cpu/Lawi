'use client';

interface ChatMessageProps {
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
  imageUrl?: string;
}

export function ChatMessage({ role, text, timestamp, imageUrl }: ChatMessageProps) {
  const isUser = role === 'user';
  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[92%] ${isUser ? 'text-right' : 'text-left'} md:max-w-[84%]`}>
        <div
          className={`inline-block rounded-[24px] px-4 py-3 text-sm leading-7 md:px-5 md:py-4 ${
            isUser
              ? 'rounded-br-[8px] bg-gradient-to-br from-indigo-500 to-cyan-400 text-white shadow-[0_16px_40px_rgba(99,102,241,0.22)]'
              : 'rounded-bl-[8px] border border-slate-200 bg-white text-slate-900 shadow-sm'
          }`}
        >
          {imageUrl ? <img src={imageUrl} alt="업로드된 이미지" className="mb-3 max-h-72 w-full rounded-[16px] object-cover" /> : null}
          {text ? <p className="whitespace-pre-wrap break-words text-base leading-7">{text}</p> : null}
        </div>
        <div className="mt-2 text-xs text-slate-500">
          {new Date(timestamp).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
}

export function LoadingMessage() {
  return (
    <div className="flex justify-start">
      <div className="max-w-[88%] text-left md:max-w-[78%]">
        <div className="inline-flex items-center gap-2 rounded-[24px] rounded-bl-[8px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm md:px-5 md:py-4">
          <span>생각하는 중</span>
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-pulseDot" />
            <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-pulseDot [animation-delay:0.15s]" />
            <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-pulseDot [animation-delay:0.3s]" />
          </div>
        </div>
      </div>
    </div>
  );
}
