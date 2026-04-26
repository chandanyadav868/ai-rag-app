"use client"

import { ApiEndpoint } from '@/app/(main)/classApi/apiClasses'
import { CircleUser, ChevronDown, LogOut, Menu, X } from 'lucide-react'
import { signOut, useSession } from "next-auth/react"
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React, { useEffect, useRef, useState } from 'react'
import { useContextStore } from './CreateContext'

type NavLinkItem = {
  label: string;
  href: string;
};

type NavDropdownItem = {
  label: string;
  children: NavLinkItem[];
};

type NavItem = NavLinkItem | NavDropdownItem;

const navigationGroups: NavItem[] = [
  {
    label: "Home",
    href: "/",
  },
  {
    label: "Tools",
    children: [
      // { label: "Image Editing", href: "/image-editing" },
      { label: "Image AI", href: "/image-ai" },
      { label: "GIF Maker", href: "/gif-maker" },
      // { label: "Chat AI", href: "/chat-ai" },
      // { label: "Pdf AI", href: "/pdf-ai" },
      // { label: "Hugging Face", href: "/huggingface" },
    ],
  },
  {
    label: "Company",
    children: [
      { label: "About", href: "/about" },
      { label: "Feedback", href: "/feedback" },
      { label: "Disclaimer", href: "/desclaimer" },
    ],
  },
];

function Headers() {
  const [profileBox, setProfileBox] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const profileBoxRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const { setLoginUserData, setError } = useContextStore();
  const pathname = usePathname();
  const { data } = useSession();

  useEffect(() => {
    if (!data?.user?.email) return;

    const responseJson = async () => {
      try {
        const response = await ApiEndpoint.Post('/mongoose', {}, { email: data.user.email });
        setLoginUserData(response.data);
      } catch (error) {
        const errorData = error as { message: string }
        const errorJson = JSON.parse(errorData.message) as { error: { message: string, stack: string } }
        setError({ type: 'error', message: errorJson.error.message })
      }
    }

    responseJson();
  }, [data?.user?.email, data?.user?.id, setError, setLoginUserData])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileBoxRef.current && !profileBoxRef.current.contains(e.target as Node)) {
        setProfileBox(false)
      }

      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
        setOpenDropdown(null);
      }
    }

    if (profileBox || menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [profileBox, menuOpen]);

  useEffect(() => {
    setMenuOpen(false);
    setOpenDropdown(null);
    setProfileBox(false);
  }, [pathname]);

  const isAuthPage = pathname?.startsWith("/login");

  const isActiveLink = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname?.startsWith(`${href}/`);
  };

  const isGroupActive = (children: ReadonlyArray<{ label: string; href: string }>) => {
    return children.some((item) => isActiveLink(item.href));
  };

  const hasChildren = (item: NavItem): item is NavDropdownItem => {
    return 'children' in item;
  };

  if (isAuthPage) {
    return null;
  }

  return (
    <div ref={menuRef} className='header-Section'>
      <div className='flex w-full items-center justify-between gap-3'>
        <Link href="/" className='text-lg font-black tracking-wide text-white sm:text-xl'>
          AI App
        </Link>

        <header className='hidden lg:block'>
          <nav className='flex items-center gap-2'>
            {navigationGroups.map((item) => (
              hasChildren(item) ? (
                <div
                  key={item.label}
                  className='relative'
                  onMouseEnter={() => setOpenDropdown(item.label)}
                  onMouseLeave={() => setOpenDropdown((prev) => prev === item.label ? null : prev)}
                >
                  <button
                    type="button"
                    onClick={() => setOpenDropdown((prev) => prev === item.label ? null : item.label)}
                    className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition hover:bg-white/10 ${isGroupActive(item.children) ? 'bg-white text-black' : 'text-white/90'}`}
                  >
                    {item.label}
                    <ChevronDown size={16} className={`transition ${openDropdown === item.label ? 'rotate-180' : ''}`} />
                  </button>

                  {openDropdown === item.label && (
                    <div className='absolute right-0 top-full mt-3 min-w-[220px] rounded-2xl border border-white/10 bg-[#0c0c0d] p-2 shadow-2xl'>
                      {item.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          className={`block rounded-xl px-4 py-3 text-sm font-medium transition hover:bg-white/10 ${isActiveLink(child.href) ? 'bg-white text-black' : 'text-white/85'}`}
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  key={item.href}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition hover:bg-white/10 ${isActiveLink(item.href) ? 'bg-white text-black' : 'text-white/90'}`}
                  href={item.href}
                >
                  {item.label}
                </Link>
              )
            ))}
          </nav>
        </header>

        <div className='flex items-center gap-2'>
          <div ref={profileBoxRef} className='relative hidden sm:block'>
            {!data && <Link href={"/login/signin"} className='rounded-full bg-white px-4 py-2 font-black text-black'>Login</Link>}
            {data &&
              <>
                <span onClick={() => setProfileBox((prev => !prev))} className='flex cursor-pointer items-center justify-center'>
                  {data?.user?.avatar ? <Image src={data.user.avatar} alt="user avatar" height={40} width={40} className='rounded-full object-cover' /> : <CircleUser color='white' className='h-[44px] w-[44px] rounded-full bg-black p-2' />}
                </span>

                {profileBox &&
                  <div className='absolute right-0 mt-4 flex min-w-[220px] flex-col gap-2 rounded-2xl border border-white/10 bg-black p-4 text-sm font-semibold text-white shadow-2xl'>
                    <span>{data?.user?.name}</span>
                    <span className='break-all text-white/70'>{data?.user?.email}</span>
                    <button
                      type="button"
                      className='mt-1 flex w-fit items-center gap-2 rounded-full bg-white/8 px-3 py-2 text-red-400'
                      onClick={() => signOut()}
                    >
                      <LogOut size={18} />
                      Logout
                    </button>
                  </div>
                }
              </>
            }
          </div>

          <button
            type="button"
            className='inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white lg:hidden'
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label="Toggle navigation"
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className='mt-4 flex flex-col gap-3 rounded-2xl border border-white/10 bg-[#0c0c0d] p-4 lg:hidden'>
          {navigationGroups.map((item) => (
            hasChildren(item) ? (
              <div key={item.label} className='rounded-2xl border border-white/8 bg-white/[0.03] p-2'>
                <button
                  type="button"
                  onClick={() => setOpenDropdown((prev) => prev === item.label ? null : item.label)}
                  className='flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm font-semibold text-white'
                >
                  <span>{item.label}</span>
                  <ChevronDown size={16} className={`transition ${openDropdown === item.label ? 'rotate-180' : ''}`} />
                </button>

                {openDropdown === item.label && (
                  <div className='mt-2 flex flex-col gap-1'>
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={`rounded-xl px-3 py-2 text-sm transition ${isActiveLink(child.href) ? 'bg-white text-black' : 'text-white/80 hover:bg-white/8'}`}
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-xl px-3 py-3 text-sm font-semibold ${isActiveLink(item.href) ? 'bg-white text-black' : 'bg-white/[0.03] text-white'}`}
              >
                {item.label}
              </Link>
            )
          ))}

          {!data ? (
            <Link href="/login/signin" className='rounded-xl bg-white px-3 py-3 text-center text-sm font-black text-black sm:hidden'>
              Login
            </Link>
          ) : (
            <div className='flex flex-col gap-2 rounded-2xl border border-white/8 bg-white/[0.03] p-3 text-sm sm:hidden'>
              <span className='font-semibold'>{data?.user?.name}</span>
              <span className='break-all text-white/70'>{data?.user?.email}</span>
              <button type="button" onClick={() => signOut()} className='flex items-center gap-2 text-red-400'>
                <LogOut size={18} />
                Logout
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default Headers
