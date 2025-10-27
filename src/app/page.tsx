'use client';

import React from 'react';
import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="bg-white min-h-screen font-inter">
      {/* Navigation */}
      <nav className="container mx-auto px-6 py-8 flex justify-between items-center">
        <div className="font-bold text-3xl text-leaf-green tracking-wider">
          Pawn360
        </div>
        <div>
          <Link href="/auth/login" className="text-gray-600 hover:text-leaf-green mx-4">
            เข้าสู่ระบบ
          </Link>
          <Link href="/auth/signup" className="bg-leaf-green text-white font-bold rounded-full py-3 px-6 hover:bg-green-600 transition duration-300">
            เริ่มใช้งานฟรี
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="container mx-auto px-6 py-24 text-center">
        <h1 className="text-4xl md:text-6xl font-bold text-gray-800 leading-tight">
          Welcome to the Future <br className="hidden md:block" /> of Valuables & Loans, <span className="text-leaf-green">Pawn360.</span>
        </h1>
        <p className="text-gray-600 mt-6 text-lg max-w-3xl mx-auto">
          แพลตฟอร์มที่จะปฏิวัติวงการโรงรับจำนำให้ง่ายขึ้น ปลอดภัย และมีประสิทธิภาพ
        </p>
        <div className="mt-8">
          <Link href="/auth/login" className="bg-leaf-green text-white font-bold rounded-full py-4 px-8 text-lg hover:bg-green-600 transition duration-300 mr-4">
            เริ่มใช้งาน
          </Link>
          <Link href="/auth/signup" className="border-2 border-leaf-green text-leaf-green font-bold rounded-full py-4 px-8 text-lg hover:bg-leaf-green hover:text-white transition duration-300">
            สมัครใช้งานฟรี
          </Link>
        </div>
      </header>

      {/* What is Pawn360 Section */}
      <section id="what-is-pawn360" className="py-20 bg-gray-50">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-gray-800">What is Pawn360?</h2>
          <div className="w-24 h-1 bg-leaf-green mx-auto mt-4 mb-8"></div>
          <p className="text-gray-600 max-w-3xl mx-auto">
            Pawn360 คือแพลตฟอร์ม SaaS ที่ออกแบบมาเพื่อร้านรับจำนำโดยเฉพาะ ผสานการทำงานระหว่างระบบเว็บแอปพลิเคชันและระบบ LINE ช่วยให้การบริหารจัดการร้านเป็นไปอย่างราบรื่นตั้งแต่การรับจำนำ, การจัดการสัญญา, จนถึงการไถ่ถอน พร้อมระบบแจ้งเตือนแบบ real-time และ Dashboard ที่สรุปข้อมูลสำคัญให้คุณไม่พลาดทุกการเคลื่อนไหว
          </p>
        </div>
      </section>
      
      {/* Services Section */}
      <section id="features" className="py-20">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-gray-800 text-center">บริการของเรา</h2>
          <div className="w-24 h-1 bg-leaf-green mx-auto mt-4 mb-12"></div>
          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-8">
            <div className="bg-white p-8 rounded-lg shadow-md text-center hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-leaf-green rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="font-bold text-xl mb-3">Dashboard</h3>
              <p className="text-gray-600">ภาพรวมสถิติของร้าน, ยอดรวม, สัญญาใกล้ครบกำหนด และข้อมูลสำคัญอื่นๆ</p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-md text-center hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-leaf-green rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <h3 className="font-bold text-xl mb-3">ลงข้อมูลจำนำ</h3>
              <p className="text-gray-600">บันทึกข้อมูลผู้จำนำและทรัพย์สินใหม่เข้าระบบอย่างง่ายดายและรวดเร็ว</p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-md text-center hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-leaf-green rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="font-bold text-xl mb-3">จัดการสัญญา</h3>
              <p className="text-gray-600">ดูรายการสัญญาทั้งหมด, จัดการการไถ่ถอน, ต่อดอกเบี้ย และพิมพ์สัญญา</p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-md text-center hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-leaf-green rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4.868 12.683A17.925 17.925 0 0112 21c7.962 0 12-1.21 12-2.683m-12 2.683a17.925 17.925 0 01-7.132-8.317M12 21c4.411 0 8-4.03 8-9s-3.589-9-8-9-8 4.03-8 9a9.06 9.06 0 001.832 5.683L4 21l4.868-8.317z" />
                </svg>
              </div>
              <h3 className="font-bold text-xl mb-3">ระบบแจ้งเตือน</h3>
              <p className="text-gray-600">รับแจ้งเตือนแบบ real-time จากลูกค้า ผ่านระบบ LINE และจัดการคำขอต่างๆ</p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-md text-center hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-leaf-green rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="font-bold text-xl mb-3">จัดการบัญชี</h3>
              <p className="text-gray-600">จัดการข้อมูลส่วนตัวของร้านและผู้ใช้งาน รวมถึงการตั้งค่า QR Code</p>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-gray-800 text-center">วิธีการทำงาน</h2>
          <div className="w-24 h-1 bg-leaf-green mx-auto mt-4 mb-12"></div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-leaf-green rounded-full flex items-center justify-center mx-auto mb-6 text-white text-2xl font-bold">
                1
              </div>
              <h3 className="font-bold text-xl mb-3">ลูกค้าส่งคำขอ</h3>
              <p className="text-gray-600">ลูกค้าทำรายการผ่านระบบ LINE และส่งคำขอไถ่ถอนหรือต่อดอกเบี้ย</p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-leaf-green rounded-full flex items-center justify-center mx-auto mb-6 text-white text-2xl font-bold">
                2
              </div>
              <h3 className="font-bold text-xl mb-3">รับแจ้งเตือน</h3>
              <p className="text-gray-600">ระบบส่งแจ้งเตือนแบบ real-time มาที่หน้า Monitor ของพนักงาน</p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-leaf-green rounded-full flex items-center justify-center mx-auto mb-6 text-white text-2xl font-bold">
                3
              </div>
              <h3 className="font-bold text-xl mb-3">จัดการคำขอ</h3>
              <p className="text-gray-600">พนักงานตรวจสอบและยืนยันคำขอ พร้อมส่ง QR Code สำหรับการชำระเงิน</p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-leaf-green rounded-full flex items-center justify-center mx-auto mb-6 text-white text-2xl font-bold">
                4
              </div>
              <h3 className="font-bold text-xl mb-3">เสร็จสิ้นการทำรายการ</h3>
              <p className="text-gray-600">ลูกค้าชำระเงินและอัพโหลดสลิป พนักงานตรวจสอบและยืนยันการทำรายการ</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-12">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-2">
              <div className="font-bold text-3xl text-white tracking-wider mb-4">
                Pawn360
              </div>
              <p className="text-gray-300 mb-4">
                แพลตฟอร์ม SaaS สำหรับร้านรับจำนำที่ผสานระบบเว็บและ LINE
                เพื่อให้การจัดการร้านค้าเป็นไปอย่างมีประสิทธิภาพและปลอดภัย
              </p>
              <div className="flex space-x-4">
                <Link href="/auth/login" className="bg-leaf-green text-white font-bold rounded-full py-2 px-6 hover:bg-green-600 transition duration-300 text-sm">
                  เริ่มใช้งาน
                </Link>
                <Link href="/auth/signup" className="border border-white text-white font-bold rounded-full py-2 px-6 hover:bg-white hover:text-gray-800 transition duration-300 text-sm">
                  สมัครฟรี
                </Link>
              </div>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-4">บริการ</h3>
              <ul className="space-y-2 text-gray-300">
                <li><Link href="/dashboard" className="hover:text-white transition">Dashboard</Link></li>
                <li><Link href="/pawn-entry" className="hover:text-white transition">ลงข้อมูลจำนำ</Link></li>
                <li><Link href="/contracts" className="hover:text-white transition">จัดการสัญญา</Link></li>
                <li><Link href="/monitor" className="hover:text-white transition">ระบบแจ้งเตือน</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-4">สนับสนุน</h3>
              <ul className="space-y-2 text-gray-300">
                <li><Link href="/auth/login" className="hover:text-white transition">เข้าสู่ระบบ</Link></li>
                <li><Link href="/auth/signup" className="hover:text-white transition">สมัครใช้งาน</Link></li>
                <li><a href="mailto:support@pawn360.com" className="hover:text-white transition">ติดต่อเรา</a></li>
                <li><a href="#features" className="hover:text-white transition">เอกสาร API</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-700 pt-8 text-center">
            <p className="text-gray-400">© 2025 Pawn360. สงวนลิขสิทธิ์.</p>
            <p className="text-gray-500 text-sm mt-2">สร้างด้วย ❤️ สำหรับร้านรับจำนำทุกแห่ง</p>
          </div>
        </div>
      </footer>
    </div>
  );
}