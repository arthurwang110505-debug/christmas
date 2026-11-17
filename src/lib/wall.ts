"use client";

import { useSyncExternalStore } from "react";
import { createPersistentStore } from "./store";

/**
 * Family Wall data. Local-first: every note is written to this device
 * immediately. If the family has set up Home Sync, notes are also pushed to
 * and pulled from the server so every device shows the same wall.
 */

export type NoteKind = "message" | "wish";
export type NoteTone = "cream" | "forest" | "burgundy" | "gold";

export interface Note {
  id: string;
  author: string;
  body: string;
  kind: NoteKind;
  tone: NoteTone;
  createdAt: string;
  synced: boolean;
}

interface WallState {
  notes: Note[];
  homeCode: string | null;
  pendingDeletes: string[];
}

export const wallStore = createPersistentStore<WallState>("cw26:wall", {
  notes: [],
  homeCode: null,
  pendingDeletes: [],
});

export type SyncStatus = "local" | "syncing" | "synced" | "offline" | "gone";

let status: { state: SyncStatus; at: number | null } = { state: "local", at: null };
const statusListeners = new Set<() => void>();
const serverStatus = status;

function setStatus(state: SyncStatus) {
  status = { state, at: state === "synced" ? Date.now() : status.at };
  statusListeners.forEach((l) => l());
}

export function useSyncStatus() {
  return useSyncExternalStore(
    (l) => {
      statusListeners.add(l);
      return () => {
        statusListeners.delete(l);
      };
    },
    () => status,
    () => serverStatus,
  );
}

/** UUID v4 that also works on plain-http LAN addresses, where crypto.randomUUID is unavailable. */
export function uid(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  const b = new Uint8Array(16);
  crypto.getRandomValues(b);
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

export function formatCode(code: string): string {
  const c = code.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
  return c.match(/.{1,4}/g)?.join("-") ?? c;
}

const byNewest = (a: Note, b: Note) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0);

export function addNote(input: { author: string; body: string; kind: NoteKind; tone: NoteTone }): Note {
  const note: Note = {
    id: uid(),
    author: input.author.trim().slice(0, 40),
    body: input.body.trim().slice(0, 500),
    kind: input.kind,
    tone: input.tone,
    createdAt: new Date().toISOString(),
    synced: false,
  };
  wallStore.set((s) => ({ notes: [note, ...s.notes] }));
  void syncNow();
  return note;
}

export function removeNote(id: string) {
  wallStore.set((s) => {
    const note = s.notes.find((n) => n.id === id);
    return {
      notes: s.notes.filter((n) => n.id !== id),
      pendingDeletes: s.homeCode && note?.synced ? [...s.pendingDeletes, id] : s.pendingDeletes,
    };
  });
  void syncNow();
}

class HomeGone extends Error {}

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, headers: { "content-type": "application/json", ...init?.headers }, cache: "no-store" });
  if (res.status === 404) throw new HomeGone("home_not_found");
  if (!res.ok) throw new Error(`sync_failed_${res.status}`);
  return (await res.json()) as T;
}

type RemoteNote = Omit<Note, "synced">;

let running = false;
let again = false;

/** Push local changes, then pull the shared wall. Safe to call at any time. */
export async function syncNow(): Promise<void> {
  const home = wallStore.get().homeCode;
  if (!home) {
    setStatus("local");
    return;
  }
  if (running) {
    again = true;
    return;
  }
  running = true;
  setStatus("syncing");
  try {
    for (const id of wallStore.get().pendingDeletes) {
      await api(`/api/wall?home=${encodeURIComponent(home)}&id=${encodeURIComponent(id)}`, { method: "DELETE" });
      wallStore.set((s) => ({ pendingDeletes: s.pendingDeletes.filter((x) => x !== id) }));
    }

    const unsynced = wallStore.get().notes.filter((n) => !n.synced);
    for (let i = 0; i < unsynced.length; i += 40) {
      const batch = unsynced.slice(i, i + 40).map(({ synced: _synced, ...n }) => n);
      await api("/api/wall", { method: "POST", body: JSON.stringify({ home, notes: batch }) });
      const ids = new Set(batch.map((n) => n.id));
      wallStore.set((s) => ({ notes: s.notes.map((n) => (ids.has(n.id) ? { ...n, synced: true } : n)) }));
    }

    const { notes: remote } = await api<{ notes: RemoteNote[] }>(`/api/wall?home=${encodeURIComponent(home)}`);
    // The home may have been left while the request was in flight.
    if (wallStore.get().homeCode !== home) return;
    wallStore.set((s) => {
      const pending = new Set(s.pendingDeletes);
      const localOnly = s.notes.filter((n) => !n.synced);
      const shared = remote.filter((r) => !pending.has(r.id)).map((r) => ({ ...r, synced: true }) as Note);
      return { notes: [...shared, ...localOnly].sort(byNewest) };
    });
    setStatus("synced");
  } catch (e) {
    setStatus(e instanceof HomeGone ? "gone" : "offline");
  } finally {
    running = false;
    if (again) {
      again = false;
      void syncNow();
    }
  }
}

export async function createHome(): Promise<string> {
  const { code } = await api<{ code: string }>("/api/homes", { method: "POST" });
  wallStore.set((s) => ({ homeCode: code, pendingDeletes: [], notes: s.notes.map((n) => ({ ...n, synced: false })) }));
  await syncNow();
  return code;
}

/** Join an existing home. Throws "not_found" for an unknown code, "unavailable" if sync can't be reached. */
export async function joinHome(input: string): Promise<void> {
  const code = input.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
  if (code.length !== 12) throw new Error("not_found");
  try {
    await api(`/api/wall?home=${encodeURIComponent(code)}`);
  } catch (e) {
    throw new Error(e instanceof HomeGone ? "not_found" : "unavailable");
  }
  wallStore.set((s) => ({ homeCode: code, pendingDeletes: [], notes: s.notes.map((n) => ({ ...n, synced: false })) }));
  await syncNow();
}

/** Stop syncing. Everything currently on the wall stays on this device. */
export function leaveHome() {
  wallStore.set((s) => ({ homeCode: null, pendingDeletes: [], notes: s.notes.map((n) => ({ ...n, synced: false })) }));
  setStatus("local");
}

/* ---- Photos: IndexedDB, on this device only ---------------------------- */

export interface Photo {
  id: string;
  blob: Blob;
  createdAt: number;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("no_indexeddb"));
      return;
    }
    const req = indexedDB.open("cw26", 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains("photos")) req.result.createObjectStore("photos", { keyPath: "id" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("idb_open_failed"));
  });
}

function tx<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const t = db.transaction("photos", mode);
        const req = run(t.objectStore("photos"));
        t.oncomplete = () => {
          db.close();
          resolve(req.result);
        };
        t.onerror = () => {
          db.close();
          reject(t.error ?? new Error("idb_tx_failed"));
        };
        t.onabort = () => {
          db.close();
          reject(t.error ?? new Error("idb_tx_aborted"));
        };
      }),
  );
}

export async function listPhotos(): Promise<Photo[]> {
  const all = await tx<Photo[]>("readonly", (s) => s.getAll());
  return all.sort((a, b) => b.createdAt - a.createdAt);
}

/** Downscale to at most 1600px and store as JPEG so the gallery stays light. */
async function shrink(file: File): Promise<Blob> {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const scale = Math.min(1, 1600 / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("no_canvas");
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("encode_failed"))), "image/jpeg", 0.85),
    );
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function addPhoto(file: File): Promise<Photo> {
  const blob = await shrink(file);
  const photo: Photo = { id: uid(), blob, createdAt: Date.now() };
  await tx("readwrite", (s) => s.put(photo));
  return photo;
}

export async function deletePhoto(id: string): Promise<void> {
  await tx("readwrite", (s) => s.delete(id));
}
