"use client"

import React from 'react'
import { ApiEndpoint } from '../classApi/apiClasses';
import { useContextStore } from '@/components/CreateContext';
import { CheckSquare, X } from 'lucide-react';


interface PriceCardProps {
  type: string;
  rate: {
    type: string;
    rate: number;
    curreny: {
      country: string;
      time: string;
    };
  };
  caption: string;
  features: {
    icon: string | JSX.Element;
    text: string;
  }[]
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

function PriceCard({ data }: { data: PriceCardProps }) {
  const { loginUserData } = useContextStore();

  const handlePayment = async (rate:number) => {
    try {
      console.log("Initiating payment...:- ", rate);
      
      const response = await ApiEndpoint.Post('/orders', {}, { id: loginUserData?.id, amount: rate });

      console.log("responseJson:- ", response);
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: response.data.amount,
        currency: response.data.currency,
        order_id: response.data.orderId,
        handler: async function (response: any) {
          console.log("Payment successful:", response);
          // response.razorpay_payment_id
          // response.razorpay_order_id
          // response.razorpay_signature
          // --> send this to backend to verify
          // await ApiEndpoint.Post('webhook/razorpay', {"x-razorpay-signature":response.razorpay_signature}, response);
        },
        theme: {
          color: "#3399cc",
        },
      };

      const rzp1 = new window.Razorpay(options);
      rzp1.open();

      console.log("Razorpay form opened");
    } catch (error) {
      console.log('Error in payment:', error);
    }
  }

  console.log("Price Card",data.type, loginUserData?.plan);
  

  return (
    <div className='w-[350px] outline-1 outline-white bg-black text-white rounded-2xl p-4 flex flex-col gap-4'>
      <div className='font-bold text-2xl'>{data.type}</div>

      <div className='flex'>
        <span className='align-super'>{data.rate.type}</span>
        <span className='text-4xl font-semibold'>{data.rate.rate}</span>
        <span className='flex flex-col text-sm -space-y-2 justify-end ml-1'>
          <span>{data.rate.curreny.country} /</span>
          <span>{data.rate.curreny.time}</span>
        </span>
      </div>

      <div className='font-semibold'>{data.caption}</div>

      <button onClick={() => handlePayment(data.rate.rate)} className={`outline-1 outline-gray-200 rounded-full text-center px-4 py-2 font-bold cursor-pointer ${loginUserData?.plan === data.type?'bg-white text-black':''}`}>{loginUserData?.plan === data.type? "Your current plan":"Select"}</button>

      <div className='flex gap-4 mt-2 flex-col'>
        {data.features.map((v, i) => (
          <span key={i} className='flex gap-2'>
            <span>{v.icon}</span>
            <span >{v.text}</span>
            {data.type.toLowerCase() === "free" && v.text === "Able to use own Api Key"? <X color='red'/>:<CheckSquare color='green'/>}
          </span>
        ))}
      </div>

    </div>
  )
}

export default PriceCard