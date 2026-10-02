import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google'; 
import localFont from 'next/font/local';
import './globals.css';
import { ClerkProvider } from '@clerk/nextjs';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const jetBrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' });
const excalifont = localFont({ src: '../../public/fonts/Excalifont-Regular.woff2', variable: '--font-excalifont' });

import { ThemeProvider } from '../components/ThemeProvider';

export const metadata: Metadata = {
  title: 'Stream Mates - Watch Together',
  description: 'A social YouTube watch party app for friends.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: 'var(--accent)',
          colorBackground: 'var(--glass-bg)',
          colorText: 'var(--text-primary)',
          colorInputBackground: 'var(--bg-color)',
          colorInputText: 'var(--text-primary)',
        },
        elements: {
          card: {
            background: 'var(--glass-bg)',
            backdropFilter: 'blur(16px)',
            border: '2px solid var(--glass-border)',
            boxShadow: '8px 8px 0px var(--shadow-color)',
            borderRadius: '1.5rem',
          },
          socialButtonsBlockButtonText: {
            color: 'var(--text-primary)',
            fontSize: '1.1rem',
            fontWeight: 'bold',
          },
          userButtonPopoverCard: {
            background: 'var(--glass-bg)',
            backdropFilter: 'blur(16px)',
            border: '2px solid var(--glass-border)',
            boxShadow: '8px 8px 0px var(--shadow-color)',
            borderRadius: '1rem',
          },
          userPreviewMainIdentifier: {
            color: 'var(--text-primary)',
            fontWeight: 'bold',
          },
          userPreviewSecondaryIdentifier: {
            color: 'var(--text-muted)',
          },
          userButtonPopoverActionButtonText: {
            color: 'var(--text-primary)',
            fontWeight: 'bold',
          },
          userButtonPopoverActionButtonIcon: {
            color: 'var(--text-primary)',
          },
          userButtonPopoverFooter: {
            display: 'none',
          }
        }
      }}
    >
      <html lang="en" suppressHydrationWarning>
        <body className={`${inter.variable} ${jetBrainsMono.variable} ${excalifont.variable} font-sans min-h-screen flex flex-col`}>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
