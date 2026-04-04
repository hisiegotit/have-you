interface HaveYouLogoProps {
  className?: string;
}

export function HaveYouLogo({ className }: HaveYouLogoProps) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Film strip outer frame */}
      <rect x="1" y="1" width="18" height="18" rx="2.5" stroke="currentColor" strokeWidth="1.5" />
      {/* Top strip band */}
      <line x1="1.75" y1="5" x2="18.25" y2="5" stroke="currentColor" strokeWidth="0.75" />
      {/* Bottom strip band */}
      <line x1="1.75" y1="15" x2="18.25" y2="15" stroke="currentColor" strokeWidth="0.75" />
      {/* Top perforations */}
      <rect x="3"   y="2.25" width="2" height="1.5" rx="0.4" fill="currentColor" />
      <rect x="9"   y="2.25" width="2" height="1.5" rx="0.4" fill="currentColor" />
      <rect x="15"  y="2.25" width="2" height="1.5" rx="0.4" fill="currentColor" />
      {/* Bottom perforations */}
      <rect x="3"   y="16.25" width="2" height="1.5" rx="0.4" fill="currentColor" />
      <rect x="9"   y="16.25" width="2" height="1.5" rx="0.4" fill="currentColor" />
      <rect x="15"  y="16.25" width="2" height="1.5" rx="0.4" fill="currentColor" />
      {/* Question mark — arc hook */}
      <path
        d="M7.8 8.2 C7.8 6.5 8.7 5.8 10 5.8 C11.3 5.8 12.2 6.6 12.2 7.8 C12.2 9.1 11.1 9.6 10.3 10.3 L10.3 11.4"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Question mark — dot */}
      <circle cx="10.3" cy="13" r="0.75" fill="currentColor" />
    </svg>
  );
}
