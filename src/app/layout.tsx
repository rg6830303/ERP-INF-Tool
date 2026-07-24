import type { Metadata, Viewport } from 'next';
import './globals.css';
import {
  APP_NAME,
  APP_TAGLINE,
  getSupabaseUrl,
  getSupabaseAnonKey,
} from '@/lib/constants';

export const metadata: Metadata = {
  title: `${APP_NAME} — ${APP_TAGLINE}`,
  description: 'In-house ERP for Import / Export business management.',
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#2f49c0',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Inject the PUBLIC Supabase config at runtime so the browser client works no
  // matter which env var name holds the anon key. (Anon key is public and every
  // request is still governed by Row Level Security.)
  const cfg = { url: getSupabaseUrl(), anonKey: getSupabaseAnonKey() };

  return (
    <html lang="en">
      <body>
        <script
          dangerouslySetInnerHTML={{
            __html: `window.__IE_SUPABASE__=${JSON.stringify(cfg)};`,
          }}
        />
        {children}
      </body>
    </html>
  );
}
