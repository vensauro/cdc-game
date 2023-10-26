import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ReactNode } from 'react';

export function Layout(props: { children: ReactNode }) {
  return (
    <main className="bg-violet-900 min-h-screen w-screen h-full">
      <div className="bg-hero-pattern h-full w-full">
        <div className="max-w-6xl mx-auto bg-gray-900 h-full">
          {props.children}
        </div>
      </div>
      <div className="hidden md:block">
        <ReactQueryDevtools initialIsOpen={false} />
      </div>
    </main>
  );
}
