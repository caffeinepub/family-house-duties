import { Heart } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t bg-card py-6 mt-auto">
      <div className="container text-center text-sm text-muted-foreground">
        <p className="flex items-center justify-center gap-1">
          © 2025. Built with <Heart className="h-4 w-4 fill-rose-500 text-rose-500" /> using{' '}
          <a
            href="https://caffeine.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-foreground hover:underline"
          >
            caffeine.ai
          </a>
        </p>
      </div>
    </footer>
  );
}
