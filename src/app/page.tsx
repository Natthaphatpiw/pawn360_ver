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
          <Link href="/auth/signin" className="text-gray-600 hover:text-leaf-green mx-4">
            เข้าสู่ระบบ
          </Link>
          <Link href="/auth/signin" className="bg-leaf-green text-white font-bold rounded-full py-3 px-6 hover:bg-green-600 transition duration-300">
            Book Demo
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
          <Link href="/auth/signin" className="bg-leaf-green text-white font-bold rounded-full py-4 px-8 text-lg hover:bg-green-600 transition duration-300">
            เริ่มใช้งาน
          </Link>
        </div>
      </header>

      {/* What is Pawn360 Section */}
      <section id="what-is-pawn360" className="py-20 bg-gray-50">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-gray-800">What is Pawn360?</h2>
          <div className="w-24 h-1 bg-leaf-green mx-auto mt-4 mb-8"></div>
          <p className="text-gray-600 max-w-3xl mx-auto">
            Pawn360 คือ Software as a Service (SaaS) ที่ออกแบบมาเพื่อร้านรับจำนำโดยเฉพาะ ช่วยให้การบริหารจัดการร้านเป็นไปอย่างราบรื่นตั้งแต่การรับจำนำ, การจัดการสัญญา, จนถึงการไถ่ถอน พร้อมระบบ Dashboard ที่สรุปข้อมูลสำคัญให้คุณไม่พลาดทุกการเคลื่อนไหว
          </p>
        </div>
      </section>
      
      {/* Services Section */}
      <section id="features" className="py-20">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-gray-800 text-center">บริการของเรา</h2>
          <div className="w-24 h-1 bg-leaf-green mx-auto mt-4 mb-12"></div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white p-8 rounded-lg shadow-md text-center">
              <h3 className="font-bold text-xl mb-3">Dashboard</h3>
              <p>ภาพรวมสถิติของร้าน, ยอดรวม, สัญญาใกล้ครบกำหนด และข้อมูลสำคัญอื่นๆ</p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-md text-center">
              <h3 className="font-bold text-xl mb-3">ลงข้อมูลจำนำ</h3>
              <p>บันทึกข้อมูลผู้จำนำและทรัพย์สินใหม่เข้าระบบอย่างง่ายดายและรวดเร็ว</p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-md text-center">
              <h3 className="font-bold text-xl mb-3">จัดการรายการจำนำ</h3>
              <p>ดูรายการสัญญาทั้งหมด, จัดการการไถ่ถอน, ต่อดอกเบี้ย และพิมพ์สัญญา</p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-md text-center">
              <h3 className="font-bold text-xl mb-3">จัดการบัญชี</h3>
              <p>จัดการข้อมูลส่วนตัวของร้านและผู้ใช้งานในระบบ</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="bg-gray-800 text-white py-12">
        <div className="container mx-auto px-6 text-center">
          <div className="font-bold text-3xl text-white tracking-wider mb-4">
            Pawn360
          </div>
          <p className="mt-4">Pawn360 © 2025. All Rights Reserved.</p>
        </div>
      </footer>
    </div>
  );
}