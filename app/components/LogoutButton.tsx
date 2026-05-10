"use client";

import { signOut } from "next-auth/react";

function getLoginUrl() {
  const url = new URL('/login', window.location.origin);
  url.searchParams.set('callbackUrl', '/');
  return url.toString();
}

export function LogoutButton() {
  return (
    <button 
      onClick={() => signOut({ callbackUrl: getLoginUrl() })}
      className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded transition-colors"
    >
      Logout
    </button>
  );
}