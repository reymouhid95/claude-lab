"use client";

import { useEffect, useRef, useState } from "react";
import Chat, { type Message } from "./Chat";
import Describe from "./Describe";
import Header, { type LevelId } from "./Header";
import ImageLab from "./ImageLab";
import Journal from "./Journal";
import Presets from "./Presets";
import { getStudentId } from "@/lib/student";
import { useProduction } from "@/lib/production";

type PanelId = "catalog" | "journal" | "describe" | "image";

const PANELS: { id: PanelId; label: string }[] = [
  { id: "catalog", label: "Catalogue" },
  { id: "journal", label: "Journal" },
  { id: "describe", label: "Décrire" },
  { id: "image", label: "Image" },
];

export default function Assistant() {
  const [level, setLevel] = useState<LevelId>("master1");
  const [history, setHistory] = useState<Message[]>([]);
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [panel, setPanel] = useState<PanelId>("catalog");
  const [journalVersion, setJournalVersion] = useState(0);
  const bumpJournal = () => setJournalVersion((v) => v + 1);
  // REC lit la vérité : le chat (loading) et les analyses (analyzing).
  const [analyzing, setAnalyzing] = useState(false);
  const busy = loading || analyzing;
  const [production, setProduction] = useProduction();
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
      const data = (await res.json()) as { response?: string; error?: string };
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
      <Header
        level={level}
        onLevelChange={setLevel}
        production={production}
        onProductionChange={setProduction}
        busy={busy}
      />

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
          <div className="mb-5 flex flex-wrap gap-x-5 gap-y-1">
            {PANELS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPanel(p.id)}
                aria-current={panel === p.id}
                className={`flex min-h-11 items-end border-b-2 pb-1.5 text-[0.85rem] font-medium transition-colors duration-150 ${
                  panel === p.id
                    ? "border-amber text-ivory"
                    : "border-transparent text-mute hover:text-ivory"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {panel === "catalog" && (
            <Presets
              level={level}
              production={production}
              onPick={(prompt) => {
                setValue(prompt);
                inputRef.current?.focus();
              }}
              onLogged={bumpJournal}
            />
          )}
          {panel === "journal" && (
            <Journal level={level} version={journalVersion} production={production} />
          )}
          {panel === "describe" && (
            <Describe onLogged={bumpJournal} production={production} onBusyChange={setAnalyzing} />
          )}
          {panel === "image" && (
            <ImageLab onLogged={bumpJournal} production={production} onBusyChange={setAnalyzing} />
          )}
        </div>
      </main>
    </div>
  );
}
