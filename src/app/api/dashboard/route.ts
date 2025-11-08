import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { getUserIdFromToken } from '@/lib/auth';
import { ObjectId } from 'mongodb';

export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromToken(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDatabase();
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');

    if (!storeId) {
      return NextResponse.json({ error: 'Store ID is required' }, { status: 400 });
    }

    const storeObjectId = new ObjectId(storeId);

    // ดึงข้อมูลร้านค้าเพื่อใช้ delayed.maxday
    const store = await db.collection('stores').findOne({ _id: storeObjectId });
    const maxDelayDays = store?.delayed?.maxday || 7; // ค่า default 7 วัน

    // Count statistics from customers collection
    const totalCustomers = await db.collection('customers').countDocuments({ storeId: storeObjectId });

    // ⚠️ ใช้ contracts collection ที่มี contractNumber ขึ้นต้นด้วย "PW" เท่านั้น
    const contractFilter = {
      storeId: storeObjectId,
      contractNumber: { $regex: /^PW/ }
    };

    // Count total contracts
    const totalContracts = await db.collection('contracts').countDocuments(contractFilter);

    // ดึงสัญญาทั้งหมดของร้านนี้มาคำนวณ
    const allContracts = await db.collection('contracts').find(contractFilter).toArray();

    // คำนวณวันที่ปัจจุบัน
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0); // ตั้งเวลาเป็นเที่ยงคืนเพื่อเปรียบเทียบวันที่

    // ========== Today Value (status = "active") ==========
    let todayValue = 0;
    let activeContractsCount = 0;
    for (const contract of allContracts) {
      if (contract.status === 'active') {
        activeContractsCount++;
        const remainingAmount = contract.pawnDetails?.remainingAmount || 0;
        todayValue += remainingAmount;
      }
    }
    todayValue = Math.round(todayValue * 100) / 100;

    // ========== Awaiting Sale (status = "suspended" หรือ "suspend") ==========
    let awaitingSaleValue = 0;
    let awaitingSaleCount = 0;
    for (const contract of allContracts) {
      if (contract.status === 'suspended' || contract.status === 'suspend') {
        awaitingSaleCount++;
        const remainingAmount = contract.pawnDetails?.remainingAmount || 0;
        awaitingSaleValue += remainingAmount;
      }
    }
    awaitingSaleValue = Math.round(awaitingSaleValue * 100) / 100;

    // ========== Sold (status = "sold") ==========
    let soldValue = 0;
    let soldCount = 0;
    for (const contract of allContracts) {
      if (contract.status === 'sold') {
        soldCount++;
        const remainingAmount = contract.pawnDetails?.remainingAmount || 0;
        soldValue += remainingAmount;
      }
    }
    soldValue = Math.round(soldValue * 100) / 100;

    // ========== Contracts Due Soon (D+3) ==========
    // สัญญาที่ dueDate - 3 = current date (อีก 3 วันจะครบกำหนด)
    let dueSoonValue = 0;
    let dueSoonCount = 0;
    for (const contract of allContracts) {
      if (contract.dates?.dueDate) {
        const dueDate = new Date(contract.dates.dueDate);
        dueDate.setHours(0, 0, 0, 0);

        // คำนวณจำนวนวันที่เหลือ (dueDate - currentDate)
        const daysUntilDue = Math.ceil((dueDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));

        // ถ้าเหลืออีก 3 วัน (หรือน้อยกว่า แต่ยังไม่เกินกำหนด)
        if (daysUntilDue >= 0 && daysUntilDue <= 3) {
          dueSoonCount++;
          const remainingAmount = contract.pawnDetails?.remainingAmount || 0;
          dueSoonValue += remainingAmount;
        }
      }
    }
    dueSoonValue = Math.round(dueSoonValue * 100) / 100;

    // ========== Overdue Contracts (D-7) ==========
    // สัญญาที่ current date - dueDate >= 7 (เลยกำหนด 7 วันขึ้นไป)
    let overdueValue = 0;
    let overdueCount = 0;
    for (const contract of allContracts) {
      if (contract.dates?.dueDate) {
        const dueDate = new Date(contract.dates.dueDate);
        dueDate.setHours(0, 0, 0, 0);

        // คำนวณจำนวนวันที่เลยกำหนด (currentDate - dueDate)
        const daysOverdue = Math.ceil((currentDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

        // ถ้าเลยกำหนด 7 วันขึ้นไป
        if (daysOverdue >= 7) {
          overdueCount++;
          const remainingAmount = contract.pawnDetails?.remainingAmount || 0;
          overdueValue += remainingAmount;
        }
      }
    }
    overdueValue = Math.round(overdueValue * 100) / 100;

    // ========== Suspended Contracts ==========
    // สัญญาที่ current date - dueDate >= (maxday - 2)
    let suspendedValue = 0;
    let suspendedCount = 0;
    const suspendThreshold = maxDelayDays - 2;

    for (const contract of allContracts) {
      if (contract.dates?.dueDate) {
        const dueDate = new Date(contract.dates.dueDate);
        dueDate.setHours(0, 0, 0, 0);

        // คำนวณจำนวนวันที่เลยกำหนด
        const daysOverdue = Math.ceil((currentDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

        // ถ้าเลยกำหนด >= (maxday - 2) วัน
        if (daysOverdue >= suspendThreshold) {
          suspendedCount++;
          const remainingAmount = contract.pawnDetails?.remainingAmount || 0;
          suspendedValue += remainingAmount;
        }
      }
    }
    suspendedValue = Math.round(suspendedValue * 100) / 100;

    return NextResponse.json({
      total_customers: totalCustomers,
      total_contracts: totalContracts,
      active_contracts: activeContractsCount,

      // Today Value - สัญญาที่ active
      today_value: todayValue,
      today_value_count: activeContractsCount,

      // Awaiting Sale - สัญญาที่รอขาย
      awaiting_sale_value: awaitingSaleValue,
      awaiting_sale_count: awaitingSaleCount,

      // Sold - สัญญาที่ขายแล้ว
      sold_value: soldValue,
      sold_count: soldCount,

      // Due Soon (D+3) - สัญญาที่ใกล้ครบกำหนด
      due_soon_value: dueSoonValue,
      due_soon_count: dueSoonCount,

      // Overdue (D-7) - สัญญาที่เลยกำหนด 7 วันขึ้นไป
      overdue_value: overdueValue,
      overdue_count: overdueCount,

      // Suspended - สัญญาที่เลยกำหนด (maxday - 2) วันขึ้นไป
      suspended_value: suspendedValue,
      suspended_count: suspendedCount,
      suspended_threshold_days: suspendThreshold,

      // Legacy fields (เก็บไว้เพื่อ backward compatibility)
      pending_contracts: 0,
      overdue_contracts: overdueCount,
      total_pawned_value: todayValue
    });
  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}