import "@testing-library/jest-dom/vitest";
import { beforeEach } from "vitest";

function createStorage() {
  const values = new Map<string, string>();

  return {
    get length() {
      return values.size;
    },
    clear: () => values.clear(),
    getItem: (key: string) => values.get(key) ?? null,
    key: (index: number) => Array.from(values.keys())[index] ?? null,
    removeItem: (key: string) => values.delete(key),
    setItem: (key: string, value: string) => values.set(key, value),
  };
}

Object.defineProperty(window, "localStorage", {
  value: createStorage(),
  configurable: true,
});

beforeEach(() => {
  window.localStorage.clear();
});
