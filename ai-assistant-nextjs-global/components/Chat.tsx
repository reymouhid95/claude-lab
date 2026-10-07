"use client";

import type { FormEvent, RefObject } from "react";

export type Message = { role: "user" | "assistant"; content: string };

export default function Chat({
  history,
  loading,
  value,
  onChange,
  onSend,
  inputRef,
}: {
  history: Message[];
  loading: boolean;
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  inputRef: RefObject<HTMLInputElement | null>;
}) {
  const submit = (e: FormEvent) => {
    e.preventDefault();
    onSend();
  };

  return (
    <section className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 overflow-y-auto px-1 py-6" aria-live="polite">
        {history.length === 0 && (
          <div className="max-w-[52ch] border-l-2 border-amber/70 pl-4">
            <p className="font-display text-[1.5rem] font-bold leading-snug tracking-tight text-ivory">
              Une question de cadrage, de lumière ou de prompt ?
            </p>
            <p className="mt-3 leading-relaxed text-mute">
              Pose ta question en français. L&apos;assistant connaît les presets de plans du
              catalogue ATA SUARL et le programme de ton niveau.
            </p>
          </div>
        )}

        <ol className="space-y-4">
          {history.map((msg, i) => (
            <li
              key={i}
              className={`rise flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={
                  msg.role === "user"
                    ? "max-w-[85%] bg-amber px-4 py-2.5 text-[0.95rem] leading-relaxed text-[#0e1418] shadow-[0_2px_14px_-6px_rgba(255,122,24,0.5)] sm:max-w-[75%]"
                    : "max-w-[92%] border-l-2 border-white/15 bg-bezel px-4 py-2.5 text-[0.95rem] leading-relaxed text-ivory shadow-[0_4px_20px_-10px_rgba(6,10,16,0.9)] sm:max-w-[85%]"
                }
              >
                {msg.content}
              </div>
            </li>
          ))}

          {loading && (
            <li className="flex justify-start">
              <div className="flex items-center gap-1.5 border-l-2 border-amber/70 bg-bezel px-4 py-3.5">
                {[0, 1, 2].map((d) => (
                  <span
                    key={d}
                    className="rec-dot size-1.5 rounded-full bg-mute"
                    style={{ animationDelay: `${d * 0.18}s` }}
                  />
                ))}
                <span className="ml-1 font-mono text-[0.72rem] text-mute">montage en cours</span>
              </div>
            </li>
          )}
        </ol>
      </div>

      <form
        onSubmit={submit}
        className="sticky bottom-0 flex items-center gap-2 border-t border-white/10 bg-base/95 py-4 shadow-[0_-10px_28px_-18px_rgba(3,6,9,0.9)] backdrop-blur"
      >
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Ta question sur le tournage, le cadrage, le montage…"
          disabled={loading}
          className="min-w-0 flex-1 border border-white/15 bg-bezel px-4 py-3 text-[0.95rem] text-ivory transition-colors duration-150 placeholder:text-mute/80 focus:border-amber"
        />
        <button
          type="submit"
          disabled={loading || !value.trim()}
          className="shrink-0 bg-amber px-5 py-3 text-[0.9rem] font-semibold text-[#0e1418] transition duration-150 hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-35"
        >
          {loading ? "…" : "Envoyer"}
        </button>
      </form>
    </section>
  );
}
