export {};

declare global {
  interface Window {
    // Supabase public config injected by the root layout at runtime so the
    // browser client works regardless of which env var name holds the anon key.
    __IE_SUPABASE__?: { url: string; anonKey: string };
  }
}
