"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  // 실패한 질문과 오류 안내문. 화면에는 보이지만 AI에게 대화 기록으로 보내지 않는다.
  failed?: boolean;
}

interface ChatWidgetProps {
  cityId: string;
  cityName: string;
}

import { MAX_MESSAGE_LENGTH } from "@/lib/chat-limits";

// newMessageId()는 https나 localhost에서만 존재한다.
// http://192.168.x.x 로 접속한 휴대폰에서는 함수가 없어 클릭 즉시 오류가 나므로 쓰지 않는다.
let messageSeq = 0;
function newMessageId() {
  messageSeq += 1;
  return `m-${Date.now()}-${messageSeq}`;
}

async function fetchAssistantReply(
  message: string,
  history: ChatMessage[],
  cityId: string
): Promise<string> {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      cityId,
      history: history
        .filter((m) => m.id !== "welcome" && !m.failed)
        .map(({ role, content }) => ({ role, content })),
    }),
  });

  const data = (await res.json().catch(() => null)) as { reply?: string; error?: string } | null;
  if (!res.ok || !data?.reply) {
    throw new Error(data?.error ?? "답변을 가져오지 못했습니다.");
  }
  return data.reply;
}

function BotAvatar() {
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-sky-400 text-white shadow-sm">
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
        <path d="M12 2l1.8 5.2L19 9l-5.2 1.8L12 16l-1.8-5.2L5 9l5.2-1.8zM19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9z" />
      </svg>
    </span>
  );
}

export default function ChatWidget({ cityId, cityName }: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "안녕하세요! 실시간 날씨 데이터를 바탕으로 답해드려요. 옷차림, 우산, 주말 나들이 무엇이든 물어보세요.",
    },
  ]);
  const scrollRef = useRef<HTMLDivElement>(null);
  // 상태값은 다음 렌더링 전까지 갱신되지 않아 빠른 연속 클릭을 막지 못하므로 ref로 잠근다
  const sendingRef = useRef(false);
  const messagesRef = useRef(messages);
  const inputRef = useRef<HTMLInputElement>(null);

  const suggestions = [
    `${cityName} 오늘 우산 챙겨야 해?`,
    "내일 출근 옷차림 추천해줘",
    "이번 주말 나들이하기 좋은 곳은?",
  ];

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isSending]);

  useEffect(() => {
    if (!isOpen) return;
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setIsOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen]);

  async function send(raw: string) {
    const text = raw.trim();
    if (!text || sendingRef.current || text.length > MAX_MESSAGE_LENGTH) return;
    sendingRef.current = true;

    const userMessage: ChatMessage = { id: newMessageId(), role: "user", content: text };
    const historyForRequest = messagesRef.current;
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsSending(true);

    try {
      const reply = await fetchAssistantReply(text, historyForRequest, cityId);
      setMessages((prev) => [...prev, { id: newMessageId(), role: "assistant", content: reply }]);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "";
      setMessages((prev) => [
        ...prev.map((m) => (m.id === userMessage.id ? { ...m, failed: true } : m)),
        {
          id: newMessageId(),
          role: "assistant",
          failed: true,
          content: msg.includes("요청이 너무 많") ? msg : "답변을 가져오는 중 문제가 발생했어요. 잠시 후 다시 시도해주세요.",
        },
      ]);
    } finally {
      sendingRef.current = false;
      setIsSending(false);
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    void send(input);
  }

  const showSuggestions = messages.length === 1 && !isSending;

  return (
    <>
      {isOpen && (
        <div
          role="dialog"
          aria-label="AI 날씨 비서"
          className="fixed inset-x-3 bottom-24 z-50 flex h-[min(560px,calc(100dvh-8rem))] flex-col overflow-hidden rounded-3xl bg-white shadow-[0_24px_64px_-12px_rgba(15,23,42,0.35)] ring-1 ring-slate-900/10 animate-[chat-in_180ms_ease-out] sm:inset-x-auto sm:right-6 sm:w-[380px] dark:bg-slate-900 dark:ring-white/10"
        >
          <header className="flex items-center gap-3 bg-gradient-to-r from-blue-600 to-sky-500 px-4 py-3.5 text-white">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
                <path d="M12 2l1.8 5.2L19 9l-5.2 1.8L12 16l-1.8-5.2L5 9l5.2-1.8zM19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9z" />
              </svg>
            </span>
            <div className="flex-1 leading-tight">
              <p className="text-sm font-bold">AI 날씨 비서</p>
              <p className="flex items-center gap-1 text-xs text-white/80">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" aria-hidden />
                {cityName} 실시간 데이터 연결됨
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="채팅창 닫기"
              className="cursor-pointer rounded-full p-1.5 text-white/90 transition-colors hover:bg-white/20"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden>
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </header>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-slate-50 px-4 py-4 dark:bg-slate-950/40">
            {messages.map((m) =>
              m.role === "user" ? (
                <div key={m.id} className="flex justify-end">
                  <p className="max-w-[80%] whitespace-pre-wrap rounded-2xl rounded-br-md bg-blue-600 px-3.5 py-2.5 text-sm leading-relaxed text-white shadow-sm">
                    {m.content}
                  </p>
                </div>
              ) : (
                <div key={m.id} className="flex items-end gap-2">
                  <BotAvatar />
                  <p className="max-w-[80%] whitespace-pre-wrap rounded-2xl rounded-bl-md bg-white px-3.5 py-2.5 text-sm leading-relaxed text-slate-800 shadow-sm ring-1 ring-slate-900/5 dark:bg-slate-800 dark:text-slate-100 dark:ring-white/5">
                    {m.content}
                  </p>
                </div>
              )
            )}

            {isSending && (
              <div className="flex items-end gap-2" aria-live="polite" aria-label="답변 작성 중">
                <BotAvatar />
                <span className="flex gap-1 rounded-2xl rounded-bl-md bg-white px-4 py-3.5 shadow-sm ring-1 ring-slate-900/5 dark:bg-slate-800">
                  {[0, 150, 300].map((d) => (
                    <span key={d} className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: `${d}ms` }} />
                  ))}
                </span>
              </div>
            )}

            {showSuggestions && (
              <div className="flex flex-col items-start gap-2 pl-10 pt-1">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => void send(s)}
                    className="cursor-pointer rounded-full border border-blue-200 bg-white px-3 py-1.5 text-left text-xs font-medium text-blue-700 transition-colors hover:bg-blue-50 dark:border-blue-500/30 dark:bg-transparent dark:text-blue-300 dark:hover:bg-blue-500/10"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t border-slate-100 bg-white p-3 dark:border-white/10 dark:bg-slate-900">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`${cityName} 날씨를 물어보세요`}
              maxLength={MAX_MESSAGE_LENGTH}
              disabled={isSending}
              aria-label="질문 입력"
              className="flex-1 rounded-full bg-slate-100 px-4 py-2.5 text-sm outline-none ring-blue-500/40 transition focus:ring-2 disabled:opacity-60 dark:bg-slate-800 dark:text-slate-100"
            />
            <button
              type="submit"
              disabled={isSending || !input.trim()}
              aria-label="전송"
              className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-blue-600 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 dark:disabled:bg-slate-700"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
                <path d="M3.4 20.4l17.45-7.48a1 1 0 0 0 0-1.84L3.4 3.6a.993.993 0 0 0-1.39.91L2 9.12c0 .5.37.93.87.99L17 12 2.87 13.88c-.5.07-.87.5-.87 1l.01 4.61c0 .71.73 1.2 1.39.91z" />
              </svg>
            </button>
          </form>
        </div>
      )}

      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        aria-label={isOpen ? "채팅창 닫기" : "AI 날씨 비서 열기"}
        aria-expanded={isOpen}
        className="fixed bottom-5 right-5 z-50 flex h-14 cursor-pointer items-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-sky-500 pl-4 pr-5 text-white shadow-[0_12px_32px_-8px_rgba(37,99,235,0.6)] transition-transform hover:scale-[1.03] active:scale-95 sm:right-6"
      >
        {isOpen ? (
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden>
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor" aria-hidden>
            <path d="M12 3C6.5 3 2 6.8 2 11.5c0 2.4 1.2 4.6 3.1 6.1L4.5 21l3.9-2.1c1.1.4 2.3.6 3.6.6 5.5 0 10-3.8 10-8.5S17.5 3 12 3z" />
          </svg>
        )}
        <span className="text-sm font-bold">{isOpen ? "닫기" : "AI에게 물어보기"}</span>
      </button>
    </>
  );
}
