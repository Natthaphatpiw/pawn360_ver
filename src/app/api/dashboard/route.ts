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

    // Count statistics matching FastAPI dashboard/stats endpoint
    const totalCustomers = await db.collection('customers').countDocuments({ storeId: storeObjectId });
    const totalContracts = await db.collection('contracts').countDocuments({ storeId: storeObjectId });
    const activeContracts = await db.collection('contracts').countDocuments({ storeId: storeObjectId, status: 'active' });
    const overdueContracts = await db.collection('contracts').countDocuments({ storeId: storeObjectId, status: 'overdue' });

    // Calculate total pawned value for active and overdue contracts
    const valuePipeline = [
      { $match: { storeId: storeObjectId, status: { $in: ['active', 'overdue'] } } },
      { $group: { _id: null, total_value: { $sum: '$pawnDetails.pawnedPrice' } } }
    ];
    const valueResult = await db.collection('contracts').aggregate(valuePipeline).toArray();
    const totalPawnedValue = valueResult.length > 0 ? valueResult[0].total_value : 0;

    return NextResponse.json({
      total_customers: totalCustomers,
      total_contracts: totalContracts,
      active_contracts: activeContracts,
      overdue_contracts: overdueContracts,
      total_pawned_value: totalPawnedValue
    });
  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}