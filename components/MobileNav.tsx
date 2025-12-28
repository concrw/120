"use client";

import { useState } from "react";
import Link from "next/link";

interface MobileNavProps {
  currentPage?: string;
  credits: number;
  t: {
    dashboard: string;
    create: string;
    models: string;
    products: string;
    library: string;
    settings: string;
    credits: string;
    logout: string;
  };
}

export default function MobileNav({ currentPage, credits, t }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { href: "/dashboard", label: t.dashboard, page: "dashboard" },
    { href: "/create", label: t.create, page: "create" },
    { href: "/avatars", label: t.models, page: "avatars" },
    { href: "/products", label: t.products, page: "products" },
    { href: "/library", label: t.library, page: "library" },
  ];

  return (
    <>
      {/* 햄버거 버튼 */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden p-2 -mr-2 text-secondary-600 hover:text-secondary-900 transition-colors"
        aria-label="Toggle menu"
      >
        {isOpen ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        )}
      </button>

      {/* 모바일 메뉴 오버레이 */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* 모바일 메뉴 패널 */}
      <div
        className={`fixed top-0 right-0 h-full w-72 bg-white z-50 transform transition-transform duration-300 ease-in-out md:hidden shadow-strong ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* 메뉴 헤더 */}
          <div className="flex items-center justify-between p-4 border-b border-secondary-200">
            <span className="text-heading-sm text-secondary-900">Menu</span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-2 text-secondary-500 hover:text-secondary-700"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* 크레딧 표시 */}
          <Link
            href="/credits"
            onClick={() => setIsOpen(false)}
            className="mx-4 mt-4 p-4 bg-primary-50 rounded-xl flex items-center justify-between"
          >
            <span className="text-body-sm text-secondary-600">{t.credits}</span>
            <span className="text-heading-md text-primary-600 font-mono">{credits}</span>
          </Link>

          {/* 네비게이션 링크 */}
          <nav className="flex-1 p-4 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`block px-4 py-3 rounded-xl text-body-md transition-colors ${
                  currentPage === item.page
                    ? "bg-primary-100 text-primary-700 font-medium"
                    : "text-secondary-600 hover:bg-secondary-50 hover:text-secondary-900"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* 하단 메뉴 */}
          <div className="p-4 border-t border-secondary-200 space-y-1">
            <Link
              href="/settings"
              onClick={() => setIsOpen(false)}
              className={`block px-4 py-3 rounded-xl text-body-md transition-colors ${
                currentPage === "settings"
                  ? "bg-primary-100 text-primary-700 font-medium"
                  : "text-secondary-600 hover:bg-secondary-50 hover:text-secondary-900"
              }`}
            >
              {t.settings}
            </Link>
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="w-full text-left px-4 py-3 rounded-xl text-body-md text-secondary-600 hover:bg-error-50 hover:text-error-600 transition-colors"
              >
                {t.logout}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
