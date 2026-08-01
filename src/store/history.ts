const HISTORY_LIMIT = 100;

/**
 * Pilha de snapshots genérica. Cada snapshot representa o estado completo
 * de `shapes` em um momento estável (ex: depois de um drag ser finalizado),
 * nunca em cada evento intermediário de ponteiro.
 */
export class HistoryStack<T> {
  private past: T[] = [];
  private future: T[] = [];

  /** Registra um novo snapshot, descartando o "futuro" (redo) anterior. */
  push(snapshot: T): void {
    this.past.push(snapshot);
    if (this.past.length > HISTORY_LIMIT) {
      this.past.shift();
    }
    this.future = [];
  }

  canUndo(): boolean {
    return this.past.length > 1;
  }

  canRedo(): boolean {
    return this.future.length > 0;
  }

  /** Retorna o snapshot anterior, ou null se não houver. */
  undo(): T | null {
    if (!this.canUndo()) return null;
    const current = this.past.pop() as T;
    this.future.push(current);
    return this.past[this.past.length - 1];
  }

  /** Retorna o próximo snapshot no futuro, ou null se não houver. */
  redo(): T | null {
    if (!this.canRedo()) return null;
    const next = this.future.pop() as T;
    this.past.push(next);
    return next;
  }
}
