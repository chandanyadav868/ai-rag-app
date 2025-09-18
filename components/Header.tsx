"use client"
import { HeaderList } from '@/constant'
import { CircleUser, LogOut } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import React, { useEffect, useRef, useState } from 'react'
import { useSession, signOut } from "next-auth/react"
import { useContextStore } from './CreateContext'

function Headers() {
  const [profileBox, setProfileBox] = useState(false);
  const profileBoxRef = useRef<HTMLDivElement>(null);
  const {setLoginUserData} = useContextStore();
  const { auth } = useParams();
  // console.log("auth:--", auth);
  

  const session = useSession();
  // console.log("Session:-- --- --",session);
  


  useEffect(() => {
    // i am doing like this because i can remove this function from click when i unmounts the components
    // this function have parameter e of which type is MouseEvent
    const handleClickOutside = (e: MouseEvent) => {
      
      // console.log("proCur", profileBoxRef.current, "E.target", e.target);
      // check that profileBoxRef.current have tag element attach not the null then check that profileBoxRef.current have methods of contains which will check that e.target which are at the end is the html tags , find where you click is under the profileBox containing div undar or not,
      if (profileBoxRef.current && !profileBoxRef.current.contains(e.target as Node)) {
        // console.log("2:- proCur", profileBoxRef.current, "E.target", e.target);
        setProfileBox(false)
      }
    }
    // aap check karo ki profileBox ki value true ho gyi hai or nhi agar yes then attach addEventListner to the document of which event will be mousedown, and a function in which custome logic written
    if (profileBox) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [profileBox]);


  useEffect(()=>{
    setLoginUserData(session.data?.user);
  },[session])

  return (
    <>
      {(auth === "signin" || auth === "signup") ?
        <></>
        :
        <>
          <div className='flex bg-gray-300 px-2 py-2 justify-around items-center sticky z-50'>
            <header>
              <nav className='flex gap-4'>
                {HeaderList.map((nav, i) => (
                  <Link key={i} className='font-semibold text-xl' href={nav.link}>{nav.name}</Link>
                ))}
              </nav>
            </header>
            <div ref={profileBoxRef} className='relative'>
              <span onClick={() => setProfileBox((prev => !prev))} className='flex justify-center items-center relative cursor-pointer'>
                {session.data?.user?.avatar ? <Image src={session.data?.user?.avatar} alt="user avatar" height={34} width={34} className='rounded-full' /> : <CircleUser color='white' className='bg-black p-2 rounded-full w-[44px] h-[44px] ' />}
              </span>
              {profileBox && session &&
                <div className={`p-2 bg-gray-300 font-semibold rounded-md absolute mt-4 flex flex-col gap-2 transform ${session.data?.user ? "-translate-x-1/2" : ""}`}>
                  <span>{session.data?.user?.name}</span>
                  <span>{session.data?.user?.email}</span>
                  <span className='text-red-400 font-bold cursor-pointer py-0.5 px-1 rounded-md w-fit'>
                    {
                      session.data?.user?.email ?
                        <>
                          <LogOut onClick={() => {
                            signOut()
                          }} size={22} />
                        </>
                        :
                        <>
                          <Link href={"/login/signin"} className='font-black'>Login</Link>
                        </>
                    }
                  </span>
                </div>
              }
            </div>
          </div>
        </>}
    </>
  )
}

export default Headers