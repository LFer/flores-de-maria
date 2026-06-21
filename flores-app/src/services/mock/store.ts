// Tiny reactive in-memory collection used by the mock backend.
// Mirrors the subscribe/snapshot shape of the Firestore services so screens
// behave identically whether or not Firebase is configured.
import type { Unsubscribe } from '../../types';

let counter = 0;
export const genId = (prefix = 'id') => `${prefix}_${Date.now().toString(36)}_${(counter++).toString(36)}`;

export class MemoryCollection<T extends { id: string }> {
  private items: T[];
  private listeners = new Set<(items: T[]) => void>();

  constructor(seed: T[]) {
    this.items = [...seed];
  }

  subscribe(cb: (items: T[]) => void): Unsubscribe {
    this.listeners.add(cb);
    cb(this.snapshot());
    return () => this.listeners.delete(cb);
  }

  snapshot(): T[] {
    return [...this.items];
  }

  add(item: T): void {
    this.items = [item, ...this.items];
    this.emit();
  }

  update(id: string, patch: Partial<T>): void {
    this.items = this.items.map((it) => (it.id === id ? { ...it, ...patch } : it));
    this.emit();
  }

  set(items: T[]): void {
    this.items = items;
    this.emit();
  }

  private emit(): void {
    const snap = this.snapshot();
    this.listeners.forEach((cb) => cb(snap));
  }
}
