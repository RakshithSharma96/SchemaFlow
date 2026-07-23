import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { SessionProvider } from '@/context/SessionContext';
import { ChatHistoryProvider } from '@/context/ChatHistoryContext';
import Navigation from '@/components/Navigation';

export const metadata: Metadata = {
  title: 'SchemaFlow',
  description:
    'Enterprise-grade SchemaFlow — ask questions in natural language, get instant SQL queries and results.',
  keywords: ['AI', 'SQL', 'database', 'natural language', 'Groq', 'LLM'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        <AuthProvider>
          <SessionProvider>
            <ChatHistoryProvider>
              <Navigation />
              {children}
            </ChatHistoryProvider>
          </SessionProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
