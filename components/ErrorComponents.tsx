"use client"
import React, { useEffect } from 'react'
import { useContextStore } from './CreateContext'

function ErrorComponents() {
  const {error,setError} = useContextStore();

  useEffect(()=>{
    const errorToasting = setTimeout(()=>{
      setError(undefined)
    },3000);

    return()=>{
      clearTimeout(errorToasting)
    }
  },[error])

  return (
    <div className={`errorBox rounded-md ${error?.type === "error" ? "bg-red-500":"bg-blue-500"} text-white p-2 fixed right-2 top-14 w-[350px] h-auto ${error?.message ? "topUpComponentsUpon" : "topUpComponentsCLosed"}`} 
    style={{zIndex:99}}>
      {error?.message}
    </div>
  )
}

export default ErrorComponents