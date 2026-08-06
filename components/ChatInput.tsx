'use client';

import { useRef, useState, type ChangeEvent, type KeyboardEvent } from 'react';

interface ChatInputProps {
  onSend: (message: string, imageUrl?: string) => void;
  onNewChat?: () => void;
  loading: boolean;
  onUploadImage?: (imageUrl?: string, errorMessage?: string) => void;
}

export function ChatInput({ onSend, onNewChat, loading, onUploadImage }: ChatInputProps) {
  const [text, setText] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  };

  const submit = () => {
    const trimmed = text.trim();
    if ((!trimmed && !previewImage) || loading) return;
    onSend(trimmed, previewImage ?? undefined);
    setText('');
    setPreviewImage(null);
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setPreviewImage(null);
      onUploadImage?.(undefined, '이미지를 다시 업로드해 주세요.');
      event.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setPreviewImage(result);
      onUploadImage?.(result);
    };
    reader.onerror = () => {
      setPreviewImage(null);
      onUploadImage?.(undefined, '이미지를 다시 업로드해 주세요.');
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  return (
    <div className="flex w-full flex-col gap-2">
      {previewImage && (
        <div className="relative inline-block max-w-32">
          <img src={previewImage} alt="선택된 이미지" className="max-h-32 rounded-lg object-cover" />
          <button
            type="button"
            onClick={() => setPreviewImage(null)}
            className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs text-white transition hover:bg-red-600"
          >
            ✕
          </button>
        </div>
      )}
      <div className="flex w-full items-center gap-3">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-[14px] border border-slate-200 bg-slate-50 text-xl text-slate-700 transition hover:bg-slate-100"
          aria-label="이미지 업로드"
        >
          ＋
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
        <input
          type="text"
          value={text}
          onChange={(event: ChangeEvent<HTMLInputElement>) => setText(event.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
          placeholder="메시지를 입력하세요..."
          className="h-12 w-full rounded-[14px] border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-slate-300 focus:bg-white"
        />
        <button
          type="button"
          onClick={submit}
          disabled={loading || (!text.trim() && !previewImage)}
          className="inline-flex h-11 items-center justify-center rounded-[14px] bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          전송
        </button>
      </div>
    </div>
  );
}
