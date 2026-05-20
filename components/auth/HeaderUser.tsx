"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { LogoutIcon, UserIcon } from "./AuthIcons";

function Avatar({ url, initial }: { url: string | null; initial: string }) {
  const [failed, setFailed] = useState(false);
  if (!url || failed) {
    return (
      <span
        className="w-7 h-7 rounded-full flex items-center justify-center bg-accent text-white text-xs font-bold shrink-0"
        aria-hidden="true"
      >
        {initial}
      </span>
    );
  }
  // Plain <img> on purpose — Google CDN avatars need no optimization, and
  // skipping next/image avoids the remotePatterns whitelist and handles
  // 403/CORS failures via onError → initial fallback.
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt=""
      width={28}
      height={28}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className="w-7 h-7 rounded-full object-cover shrink-0"
    />
  );
}

export function HeaderUser() {
  const { user, openAuthModal, signOut } = useAuth();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setMenuOpen(false);
    }
    if (menuOpen) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [menuOpen]);

  if (!user) {
    return (
      <button
        type="button"
        onClick={openAuthModal}
        className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[#0D7377] hover:bg-[#0A5D60] text-white text-sm font-semibold transition-colors cursor-pointer shadow-md ring-1 ring-[#0D7377]/30 hover:shadow-lg"
      >
        Sign in
      </button>
    );
  }

  const meta = user.user_metadata ?? {};
  const avatarUrl =
    (meta.avatar_url as string | undefined) ??
    (meta.picture as string | undefined) ??
    null;
  const displayName =
    (meta.display_name as string | undefined) ??
    (meta.full_name as string | undefined) ??
    (meta.name as string | undefined) ??
    user.email ??
    "Traveler";
  const initial = displayName.trim()[0]?.toUpperCase() ?? "?";

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setMenuOpen((v) => !v)}
        className="flex items-center gap-2 p-1 pr-3 rounded-full bg-white hover:bg-[#F5F5F5] border border-[#0D7377]/20 shadow-sm transition-colors cursor-pointer"
      >
        <Avatar url={avatarUrl} initial={initial} />
        <span className="text-xs font-semibold text-[#1a1a1a] max-w-[120px] truncate">
          {displayName}
        </span>
      </button>

      {menuOpen && (
        <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl border border-border shadow-lg overflow-hidden z-50">
          <Link
            href="/profile"
            onClick={() => setMenuOpen(false)}
            className="flex items-center gap-2 px-4 py-3 text-sm text-[#1a1a1a] hover:bg-[#F5F5F5] transition-colors"
          >
            <UserIcon size={16} />
            <span className="font-medium">Profile</span>
          </Link>
          <button
            type="button"
            onClick={async () => {
              setMenuOpen(false);
              await signOut();
              // Navigate off any protected/personalized route (e.g. /profile)
              // and refresh so server components re-evaluate auth state.
              router.replace("/");
              router.refresh();
            }}
            className="w-full flex items-center gap-2 px-4 py-3 text-sm text-[#1a1a1a] hover:bg-[#F5F5F5] transition-colors cursor-pointer border-t border-border"
          >
            <LogoutIcon size={16} />
            <span className="font-medium">Sign out</span>
          </button>
        </div>
      )}
    </div>
  );
}
