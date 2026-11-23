import { PAW_PATH } from "@/lib/paw";

export function PawIcon({ className, title }: { className?: string; title?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden={!title || undefined} role={title ? "img" : undefined} fill="currentColor">
      {title ? <title>{title}</title> : null}
      <path d={PAW_PATH} />
    </svg>
  );
}
