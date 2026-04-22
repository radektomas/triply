interface BubbleProps {
  color: string;
  active: boolean;
}

export function SoloBubble({ color }: BubbleProps) {
  return (
    <svg width="36" height="24" viewBox="0 0 36 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="transition-all duration-300">
      <circle cx="18" cy="12" r="6" fill={color} />
    </svg>
  );
}

export function CoupleBubble({ color }: BubbleProps) {
  return (
    <svg width="36" height="24" viewBox="0 0 36 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="transition-all duration-300">
      <path
        d="M10 19
           C 5 15, 3 12, 3 9
           C 3 6.5, 5 5, 7 5
           C 8.5 5, 10 6, 10 7.5
           C 10 6, 11.5 5, 13 5
           C 15 5, 17 6.5, 17 9
           C 17 12, 15 15, 10 19 Z"
        fill={color}
      />
      <path
        d="M26 19
           C 21 15, 19 12, 19 9
           C 19 6.5, 21 5, 23 5
           C 24.5 5, 26 6, 26 7.5
           C 26 6, 27.5 5, 29 5
           C 31 5, 33 6.5, 33 9
           C 33 12, 31 15, 26 19 Z"
        fill={color}
      />
    </svg>
  );
}

export function FamilyBubble({ color }: BubbleProps) {
  return (
    <svg width="36" height="24" viewBox="0 0 36 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="transition-all duration-300">
      <circle cx="9" cy="12" r="5.5" fill={color} />
      <circle cx="22" cy="8" r="3" fill={color} />
      <circle cx="22" cy="17" r="3" fill={color} />
      <circle cx="30" cy="12" r="3.5" fill={color} />
    </svg>
  );
}

export function GroupBubble({ color }: BubbleProps) {
  return (
    <svg width="36" height="24" viewBox="0 0 36 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="transition-all duration-300">
      <circle cx="6" cy="10" r="3" fill={color} />
      <circle cx="13" cy="7" r="3.5" fill={color} />
      <circle cx="20" cy="11" r="4" fill={color} />
      <circle cx="28" cy="8" r="3" fill={color} />
      <circle cx="22" cy="18" r="2.5" fill={color} />
      <circle cx="13" cy="17" r="2.5" fill={color} />
    </svg>
  );
}
