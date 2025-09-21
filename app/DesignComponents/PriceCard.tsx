"use client"

import React from 'react'
import { ApiEndpoint } from '../classApi/apiClasses';
import { useContextStore } from '@/components/CreateContext';


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
  const { loginUserData } = useContextStore()

  const handlePayment = async () => {
    try {
      console.log("Initiating payment...");
      
      const response = await ApiEndpoint.Post('/orders', {}, { id: loginUserData?.id, amount: 200 });

      console.log("responseJson:- ", response);
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, // Only key_id (not secret) can be exposed
        amount: response.amount,
        currency: response.currenct,
        name: "PolishAI",
        description: "Purchase Description",
        order_id: response.orderId,   // important: order id from backend
        handler: function (response: any) {
          console.log("Payment successful:", response);
          // response.razorpay_payment_id
          // response.razorpay_order_id
          // response.razorpay_signature
          // --> send this to backend to verify
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

      <button onClick={() => handlePayment()} className='outline-1 outline-gray-200 rounded-full text-center px-4 py-2 '>Your current plan</button>

      <div className='flex gap-4 mt-2 flex-col'>
        {data.features.map((v, i) => (
          <span key={i} className='flex gap-2'>
            <span>{v.icon}</span>
            <span>{v.text}</span>
          </span>
        ))}
      </div>

    </div>
  )
}

export default PriceCard