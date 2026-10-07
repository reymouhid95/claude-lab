"use client";

import { useEffect, useRef, useState } from "react";
import Chat, { type Message } from "./Chat";
import Header, { type LevelId } from "./Header";
import Presets from "./Presets";
import { getStudentId } from "@/lib/student";

export default function Assistant() {
  const [level, setLevel] = useState<LevelId>("master1");
  const [history, setHistory] = useState<Message[]>([]);
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [history.length, loading]);

  const send = async (text = value) => {
    const message = text.trim();
    if (!message || loading) return;

    setLoading(true);
    setValue("");
    setHistory((prev) => [...prev, { role: "user", content: message }]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, student_level: level, student_id: getStudentId() }),
      });
      const data = await res.json();
      setHistory((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            data.response ??
            data.error ??
            "Je n'ai pas pu formuler de réponse. Reformule ta question.",
        },
      ]);
    } catch {
      setHistory((prev) => [
        ...prev,
        { role: "assistant", content: "Connexion perdue avec le serveur. Réessaie dans un instant." },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header level={level} onLevelChange={setLevel} />

      <main className="mx-auto grid w-full max-w-6xl flex-1 gap-x-10 gap-y-10 px-5 py-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="flex min-h-0 flex-col">
          <Chat
            history={history}
            loading={loading}
            value={value}
            onChange={setValue}
            onSend={() => send()}
            inputRef={inputRef}
          />
          <div ref={bottomRef} />
        </div>

        <div className="lg:border-l lg:border-white/10 lg:pl-8">
          <Presets level={level} onPick={(prompt) => { setValue(prompt); inputRef.current?.focus(); }} />
        </div>
      </main>
    </div>
  );
}
