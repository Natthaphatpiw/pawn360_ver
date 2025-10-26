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

    // Count statistics from items collection
    const totalCustomers = await db.collection('customers').countDocuments({ storeId: storeObjectId });

    // Count items by status
    const totalItems = await db.collection('items').countDocuments({ storeId: storeObjectId });
    const activeItems = await db.collection('items').countDocuments({ storeId: storeObjectId, status: 'active' });
    const pendingItems = await db.collection('items').countDocuments({ storeId: storeObjectId, status: 'pending' });
    const overdueItems = await db.collection('items').countDocuments({ storeId: storeObjectId, status: 'overdue' });

    // Calculate total pawned value from items
    const items = await db.collection('items').find({
      storeId: storeObjectId,
      status: { $in: ['active', 'pending', 'overdue'] }
    }).toArray();

    let totalPawnedValue = 0;
    for (const item of items) {
      if (item.status === 'active' && item.confirmationNewContract) {
        // Use confirmed contract price for active items
        totalPawnedValue += item.confirmationNewContract.pawnPrice || 0;
      } else if (item.status === 'pending') {
        // Use desired or estimated value for pending items
        totalPawnedValue += item.desiredAmount || item.estimatedValue || 0;
      }
    }

    return NextResponse.json({
      total_customers: totalCustomers,
      total_contracts: activeItems, // Active contracts are items with status 'active'
      active_contracts: activeItems,
      pending_contracts: pendingItems,
      overdue_contracts: overdueItems,
      total_pawned_value: totalPawnedValue
    });
  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}