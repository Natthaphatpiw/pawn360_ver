import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(request: NextRequest) {
  try {
    const db = await getDatabase();
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');

    if (!storeId) {
      return NextResponse.json({ error: 'Store ID is required' }, { status: 400 });
    }

    const storeObjectId = new ObjectId(storeId);

    // Get contracts stats
    const contractsStats = await Promise.all([
      // Total contracts
      db.collection('contracts').countDocuments({ storeId: storeObjectId }),
      // Active contracts
      db.collection('contracts').countDocuments({ storeId: storeObjectId, status: 'active' }),
      // Overdue contracts
      db.collection('contracts').countDocuments({ storeId: storeObjectId, status: 'overdue' }),
      // Contracts due today
      db.collection('contracts').countDocuments({
        storeId: storeObjectId,
        status: 'active',
        'dates.dueDate': {
          $gte: new Date(new Date().setHours(0, 0, 0, 0)),
          $lt: new Date(new Date().setHours(23, 59, 59, 999))
        }
      })
    ]);

    // Get financial stats
    const financialPipeline = [
      { $match: { storeId: storeObjectId } },
      {
        $group: {
          _id: null,
          totalValue: { $sum: '$pawnDetails.pawnedPrice' },
          totalInterest: { $sum: '$pawnDetails.totalInterest' },
          avgValue: { $avg: '$pawnDetails.pawnedPrice' }
        }
      }
    ];

    const financialStats = await db.collection('contracts').aggregate(financialPipeline).toArray();

    // Get recent contracts
    const recentContracts = await db.collection('contracts')
      .aggregate([
        { $match: { storeId: storeObjectId } },
        { $sort: { createdAt: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: 'customers',
            localField: 'customerId',
            foreignField: '_id',
            as: 'customer'
          }
        }
      ])
      .toArray();

    // Get daily transactions for the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const dailyTransactions = await db.collection('transactions')
      .aggregate([
        {
          $match: {
            storeId: storeObjectId,
            createdAt: { $gte: sevenDaysAgo }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
            },
            count: { $sum: 1 },
            totalAmount: { $sum: '$amount' }
          }
        },
        { $sort: { '_id': 1 } }
      ])
      .toArray();

    const dashboardData = {
      stats: {
        totalContracts: contractsStats[0],
        activeContracts: contractsStats[1],
        overdueContracts: contractsStats[2],
        dueToday: contractsStats[3],
        totalValue: financialStats[0]?.totalValue || 0,
        totalInterest: financialStats[0]?.totalInterest || 0,
        avgContractValue: financialStats[0]?.avgValue || 0
      },
      recentContracts: recentContracts.map(contract => ({
        ...contract,
        customer: contract.customer[0] || null
      })),
      chartData: dailyTransactions
    };

    return NextResponse.json(dashboardData);
  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}