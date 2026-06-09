import { Inter } from 'next/font/google';
import './globals.css';
import Navigation from '@/components/Navigation';
import Providers from './providers';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata = {
  title: 'EcoTrack | Carbon Footprint Tracker',
  description: 'Track and reduce your carbon footprint with personalized AI insights.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.variable}`}>
        <Providers>
          <Navigation />
          <div className="main-content">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
