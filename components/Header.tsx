"use client"
import { HeaderList } from '@/constant'
import { CircleUser } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import React, { useEffect, useRef, useState } from 'react'

function Headers() {
  const [userProfile, setUserProfile] = useState({ name: "Chandan Yadav", email: "chandanyadavg2@gmail.com", account: "Free", image: "" });
  const [profileBox, setProfileBox] = useState(false);
  const profileBoxRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      console.log("proCur", profileBoxRef.current, "E.target", e.target);

      if (profileBoxRef.current && !profileBoxRef.current.contains(e.target as Node)) {
        console.log("2:- proCur", profileBoxRef.current, "E.target", e.target);
        setProfileBox(false)
      }
    }
    if (profileBox) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }


  }, [profileBox])

  return (
    <div className='flex bg-gray-300 px-2 py-2 justify-around items-center sticky z-50'>
      <header>
        <nav className='flex gap-4'>
          {HeaderList.map((nav, i) => (
            <Link key={i} className='font-semibold text-xl' href={nav.link}>{nav.name}</Link>
          ))}
        </nav>
      </header>
      <div ref={profileBoxRef}>
        <span onClick={()=>setProfileBox((prev=> !prev))} className='bg-black p-2 rounded-full w-[44px] h-[44px] flex justify-center items-center relative'>
          {userProfile.image ? <Image src="" alt="" height={34} width={34} /> : <CircleUser color='white' />}
        </span>
        {profileBox &&
          <div className='p-2 bg-gray-300 font-semibold rounded-md absolute mt-4 flex flex-col gap-2 transform -translate-x-1/2'>
            <span>{userProfile.name}</span>
            <span>{userProfile.email}</span>
            <span>{userProfile.account}</span>
            <span className='text-red-400 font-bold hover:bg-gray-400/40 cursor-pointer py-0.5 px-1 rounded-md w-fit'>Log out</span>
          </div>
        }
      </div>
    </div>
  )
}

export default Headers