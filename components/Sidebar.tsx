'use client';

interface ConversationType {
  id: string;
  title: string;
  createdAt: string;
  messages: Array<{ id: string }>;
}

interface SidebarProps {
  isOpen: boolean;
  conversations: ConversationType[];
  currentConversationId: string | null;
  onToggle: () => void;
  onNewChat: () => void;
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
}

export function Sidebar({
  isOpen,
  conversations,
  currentConversationId,
  onToggle,
  onNewChat,
  onSelectConversation,
  onDeleteConversation,
}: SidebarProps) {
  return (
    <>
      <div
        className={`fixed inset-0 z-30 bg-slate-950/60 transition-opacity duration-300 md:hidden ${
          isOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={onToggle}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[18rem] flex-col overflow-hidden rounded-r-[30px] border-r border-white/10 bg-slate-950/85 p-4 shadow-[0_24px_80px_rgba(2,6,23,0.45)] backdrop-blur-2xl transition-transform duration-300 ease-out md:static md:h-auto md:w-80 md:translate-x-0 md:rounded-[30px] md:border md:border-white/10 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.32em] text-indigo-300">Lawi</p>
            <h2 className="mt-1 text-2xl font-semibold text-white">법률 상담</h2>
          </div>
          <button
            type="button"
            onClick={onToggle}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-sm text-slate-200 md:hidden"
            aria-label="사이드바 닫기"
          >
            ✕
          </button>
        </div>

        <button
          type="button"
          onClick={onNewChat}
          className="mb-4 flex w-full items-center justify-center gap-2 rounded-[20px] border border-indigo-400/30 bg-indigo-500/10 px-4 py-3 text-sm font-semibold text-indigo-100 transition hover:bg-indigo-500/20"
        >
          + 새 대화
        </button>

        <div className="flex-1 space-y-2 overflow-y-auto pr-1 pb-2">
          {conversations.length === 0 ? (
            <p className="rounded-[20px] border border-white/10 bg-white/[0.03] px-4 py-4 text-sm text-slate-400">
              시작하려면 새 대화를 눌러주세요.
            </p>
          ) : (
            conversations.map((conversation) => {
              const isActive = currentConversationId === conversation.id;
              return (
                <div
                  key={conversation.id}
                  className={`rounded-[20px] border px-3 py-3 transition ${
                    isActive
                      ? 'border-indigo-400/30 bg-indigo-500/10'
                      : 'border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => onSelectConversation(conversation.id)}
                      className="flex-1 text-left"
                    >
                      <p className="truncate text-sm font-semibold text-white">{conversation.title}</p>
                      <p className="mt-1 text-xs text-slate-400">
                        {new Date(conversation.createdAt).toLocaleDateString('ko-KR')}
                      </p>
                    </button>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        onDeleteConversation(conversation.id);
                      }}
                      className="rounded-full p-2 text-slate-400 transition hover:bg-red-500/10 hover:text-red-300"
                      aria-label="대화 삭제"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </aside>
    </>
  );
}
