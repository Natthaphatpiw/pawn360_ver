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

    // Count statistics from customers collection
    const totalCustomers = await db.collection('customers').countDocuments({ storeId: storeObjectId });

    // ⚠️ ใช้ contracts collection ที่มี contractNumber ขึ้นต้นด้วย "PW" เท่านั้น
    const contractFilter = {
      storeId: storeObjectId,
      contractNumber: { $regex: /^PW/ } // เฉพาะ contractNumber ที่ขึ้นต้นด้วย PW
    };

    // Count contracts by status
    const totalContracts = await db.collection('contracts').countDocuments(contractFilter);
    const activeContracts = await db.collection('contracts').countDocuments({
      ...contractFilter,
      status: 'active'
    });
    const pendingContracts = await db.collection('contracts').countDocuments({
      ...contractFilter,
      status: 'pending'
    });
    const overdueContracts = await db.collection('contracts').countDocuments({
      ...contractFilter,
      status: 'overdue'
    });

    // ⚠️ คำนวณมูลค่ารวมจาก pawnDetails.pawnedPrice เท่านั้น
    const contracts = await db.collection('contracts').find({
      ...contractFilter,
      status: { $in: ['active', 'pending', 'overdue'] }
    }).toArray();

    let totalPawnedValue = 0;
    for (const contract of contracts) {
      // ✅ ใช้ pawnDetails.pawnedPrice เท่านั้น
      const pawnedPrice = contract.pawnDetails?.pawnedPrice || 0;
      totalPawnedValue += pawnedPrice;
    }

    return NextResponse.json({
      total_customers: totalCustomers,
      total_contracts: totalContracts,
      active_contracts: activeContracts,
      pending_contracts: pendingContracts,
      overdue_contracts: overdueContracts,
      total_pawned_value: totalPawnedValue
    });
  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}