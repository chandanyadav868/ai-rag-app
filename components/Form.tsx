"use client"

import React, { useEffect, useState } from 'react'
import Input from './Input'
import Button from './Button'
import { useForm, SubmitHandler } from "react-hook-form"
import { signIn } from "next-auth/react"
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

interface IFormInput {
  email: string;
  password: string;
}

type AuthPramasProp = "signin" | "signup"

function Form() {
  const { register, handleSubmit, watch } = useForm<IFormInput>();
  const { auth } = useParams<{ auth: AuthPramasProp }>();
  const [loading, setLoading] = useState<boolean>(false);
  const [successData, setSuccessData] = useState<Record<string, string | boolean | undefined>>({});
  const [errorData, setErrorData] = useState<Record<string, string | boolean | undefined>>({});
  const router = useRouter()



  const submissionHandle = async (data: IFormInput) => {
    try {
      setSuccessData({});
      setErrorData({});
      setLoading(true);
      if (auth === "signin") {
        console.log("data going through signIn---", data);

        const result = await signIn("credentials", {
          redirect: false,   // ✅ taaki page reload na ho
          email: data.email,
          password: data.password,
        });

        console.log("User saved by Creadentials:- ", result);
        if (result.status === 200 && !result.error) {
          router.push("/")
        }

        setErrorData({
            error: true,
            message: result.code==="credentials"?"Please provide correct Credentials":result.code
          })

      } else if (auth === "signup") {
        console.log("Logging going tot he api Register:----");

        const response = await fetch("/api/register", {
          method: "POST",
          body: JSON.stringify(data),
          headers: {
            "Content-Type": "application/json"
          }
        });

        const responseJson = await response.json();
        console.log("responseJson:- ", responseJson);
        if (responseJson.status > 400 && responseJson.status <= 500) {
          const parseData = JSON.parse(responseJson.error);
          console.log("response:- ", parseData);
          setErrorData({
            error: true,
            message: "Already user exist"
          })
        } else {
          setSuccessData({
            success: true,
            message: "Created User successfully"
          })
        }

      }
    } catch (error) {
      console.log("error in credential in", error);

    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(submissionHandle)}
      className='w-full flex gap-2 flex-col mt-4'>
      <label htmlFor="email" className='font-semibold'>Email</label>
      <Input className='bg-gray-600 text-white font-semibold' placeholder='Enter your email' {...register("email", { required: true })} />
      <label htmlFor="email" className='font-semibold'>Passowrd</label>
      <Input className='bg-gray-600 text-white font-semibold' placeholder='Enter your password...' {...register("password", { required: true })} />
      <Button loader={loading} text='Submit' type='submit' className=' font-bold text-xl bg-white text-black text-center' style={{ backgroundColor: "white", color: "black" }} />

      <div>
        {errorData.error && <p className='font-bold text-center text-red-400'>{errorData.message}</p>}
        {successData.success && <p className='font-bold text-center text-blue-400'>{successData.message}</p>}
      </div>

      <div>
        {auth === "signup" && <p className='text-center'>if you already make account <Link className='text-blue-500 font-bold hover:underline underline-offset-2' href={"/login/signin"}>Sign in</Link></p>}

        {auth === "signin" && <p className='text-center'>If you did not make account <Link className='text-blue-500 font-bold hover:underline underline-offset-2' href={"/login/signup"}>Sign Up</Link></p>}
      </div>
    </form>
  )
}

export default Form