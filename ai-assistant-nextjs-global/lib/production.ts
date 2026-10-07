"use client";

import { useSyncExternalStore } from "react";

export const DEFAULT_PRODUCTION = "Ma production";

const EVENT = "production-change";

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  return () => window.removeEventListener(EVENT, onChange);
}

function getSnapshot() {
  return window.sessionStorage.getItem("production") || DEFAULT_PRODUCTION;
}

function getServerSnapshot() {
  return DEFAULT_PRODUCTION;
}

/**
 * Production courante, persistée par onglet. External store plutôt qu'un
 * useEffect : aucune écriture pendant le rendu, et l'hydratisation part du
 * même état que le serveur.
 */
export function useProduction(): [string, (value: string) => void] {
  const production = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setProduction = (value: string) => {
    window.sessionStorage.setItem("production", value.trim() || DEFAULT_PRODUCTION);
    window.dispatchEvent(new Event(EVENT));
  };

  return [production, setProduction];
}
