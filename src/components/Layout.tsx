import { ThemeProvider } from '@/lib/theme-context';
import { Sidebar } from './Sidebar';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <ThemeProvider>
      <div className="min-h-screen bg-black">
        <Sidebar />
        <main className="pl-64">
          <div className="max-w-[2560px] mx-auto py-8 px-6">
            {children}
          </div>
        </main>
      </div>
    </ThemeProvider>
  );
}
