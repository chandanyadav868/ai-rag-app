import React from 'react'

interface PriceCardProps{
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
        icon: string|JSX.Element;
        text: string;
    }[]
}

function PriceCard({data}:{data:PriceCardProps}) {
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

      <button className='outline-1 outline-gray-200 rounded-full text-center px-4 py-2 '>Your current plan</button>

      <div className='flex gap-4 mt-2 flex-col'>
        {data.features.map((v,i)=>(
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