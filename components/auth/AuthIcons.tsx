interface IconProps {
  color?: string;
  size?: number;
}

export function HeartIcon({ color = "currentColor", size = 18, filled = false }: IconProps & { filled?: boolean }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? color : "none"}
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

export function GoogleIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M21.35 11.1H12v3.2h5.35c-.23 1.4-1.62 4.1-5.35 4.1-3.22 0-5.85-2.66-5.85-5.95s2.63-5.95 5.85-5.95c1.83 0 3.06.78 3.76 1.45l2.57-2.47C16.85 3.85 14.7 3 12 3 6.98 3 3 6.98 3 12s3.98 9 9 9c5.2 0 8.65-3.65 8.65-8.8 0-.6-.07-1.05-.15-1.55h-.15z"
        fill="#4285F4"
      />
      <path
        d="M5.27 7.6l2.63 1.93C8.74 7.78 10.23 6.7 12 6.7c1.4 0 2.55.5 3.32 1.18l2.45-2.4C16.4 4.05 14.36 3.2 12 3.2c-3.5 0-6.5 2-7.95 4.95l1.22-.55z"
        fill="#EA4335"
      />
      <path
        d="M12 21.05c2.62 0 4.82-.87 6.42-2.37l-3.07-2.4c-.83.6-1.97 1.02-3.35 1.02-2.62 0-4.83-1.7-5.62-4.05l-3.06 2.36C4.77 18.92 8.1 21.05 12 21.05z"
        fill="#34A853"
      />
      <path
        d="M21.35 11.1H12v3.2h5.35c-.23 1.4-1.05 2.4-2.05 3.07l3.07 2.4c1.8-1.65 2.78-4.1 2.78-7.12 0-.6-.07-1.05-.15-1.55h-.15z"
        fill="#4285F4"
      />
      <path d="M3 12c0-3.32 2.63-6 5.92-6.07l-.79-2.13C5.42 4.78 3 7.83 3 12z" fill="#FBBC05" />
    </svg>
  );
}

export function UserIcon({ color = "currentColor", size = 18 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

export function LogoutIcon({ color = "currentColor", size = 18 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

export function CloseIcon({ color = "currentColor", size = 20 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

export function TrashIcon({ color = "currentColor", size = 16 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
    </svg>
  );
}
