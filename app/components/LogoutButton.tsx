"use client";

import { signOut } from "next-auth/react";

function getLoginUrl() {
  const url = new URL('/login', window.location.origin);
  url.searchParams.set('callbackUrl', '/');
  return url.toString();
}

export function LogoutButton() {
  const handleLogout = async () => {
    const targetUrl = getLoginUrl();
    await signOut({ redirect: false, callbackUrl: targetUrl });
    window.location.href = targetUrl;
  };

  return (
    <button 
      onClick={handleLogout}
      className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded transition-colors"
    >
      Logout
    </button>
  );
}