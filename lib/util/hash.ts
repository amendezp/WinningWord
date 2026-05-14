// Tiny string hash for paragraph-level dismissal keys.
// Not cryptographic — just needs to be stable and collision-resistant enough.
export function fnv1a(input: string): string {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h.toString(36);
}
