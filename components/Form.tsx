"use client"

import React from 'react'
import Input from './Input'
import Button from './Button'
import { useForm, SubmitHandler } from "react-hook-form"
import { signIn } from "next-auth/react"

interface IFormInput {
  email: string;
  password: string;
}


function Form() {
  const { register, handleSubmit } = useForm<IFormInput>();

  const submissionHandle = async (data: IFormInput) => {
    try {
      console.log(data);
      const result = await signIn("credentials", {
        redirect: false,   // ✅ taaki page reload na ho
        email: data.email,
        password: data.password,
      });

      console.log("User saved by Creadentials:- ", result);
      
    } catch (error) {
      console.log("error in credential in", error);
    }
  }

  return (
    <form onSubmit={handleSubmit(submissionHandle)}
      className='w-full flex gap-2 flex-col mt-4'>
      <label htmlFor="email" className='font-semibold'>Email</label>
      <Input className='bg-gray-600 text-white font-semibold' placeholder='Enter your email' {...register("email", { required: true })} />
      <label htmlFor="email" className='font-semibold'>Passowrd</label>
      <Input className='bg-gray-600 text-white font-semibold' placeholder='Enter your password...' {...register("password", { required: true })} />
      <Button text='Submit' type='submit' className=' font-bold text-xl' style={{ backgroundColor: "white", color: "black" }} />
    </form>
  )
}

export default Form