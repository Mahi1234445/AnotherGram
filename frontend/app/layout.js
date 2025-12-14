import './globals.css';
import Navbar from './components/Navbar';
import { ThemeProvider } from './components/ThemeProvider';
import BackgroundController from './components/BackgroundController';

export const metadata = {
  title: 'AnotherGram',
  description: 'Share your moments',
  icons: {
    icon: '/logo.png',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Grand+Hotel&display=swap" rel="stylesheet" />
      </head>
      <body>
        <ThemeProvider>
          <BackgroundController />
          <Navbar />
          <main className="container">
            {children}
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
