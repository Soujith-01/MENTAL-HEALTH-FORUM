import React from 'react'
import { Outlet } from 'react-router'
import Header from './Header'

function RootLayout() {
  return (
    <div className='h-screen flex flex-col bg-[#050505] text-white'>
        <Header/>
        <div className ='flex-1 overflow-y-auto'>
            <Outlet/>
        </div>
    </div>
  )
}

export default RootLayout
