import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(request: NextRequest) {
  try {
    const db = await getDatabase();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId || !ObjectId.isValid(userId)) {
      return NextResponse.json({ error: 'Valid User ID is required' }, { status: 400 });
    }

    // Get user with store data
    const user = await db.collection('users')
      .aggregate([
        { $match: { _id: new ObjectId(userId) } },
        {
          $lookup: {
            from: 'stores',
            localField: 'storeId',
            foreignField: '_id',
            as: 'store'
          }
        },
        {
          $addFields: {
            store: { $arrayElemAt: ['$store', 0] }
          }
        }
      ])
      .toArray();

    if (!user || user.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userData = user[0];

    // Remove sensitive data
    delete userData.passwordHash;

    return NextResponse.json(userData);
  } catch (error) {
    console.error('User profile API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const db = await getDatabase();
    const updateData = await request.json();
    const { userId, ...userUpdate } = updateData;

    if (!userId || !ObjectId.isValid(userId)) {
      return NextResponse.json({ error: 'Valid User ID is required' }, { status: 400 });
    }

    // Update user data
    const userResult = await db.collection('users').updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          ...userUpdate.user,
          updatedAt: new Date()
        }
      }
    );

    // Update store data if provided
    if (userUpdate.store && userUpdate.store.storeId) {
      await db.collection('stores').updateOne(
        { _id: new ObjectId(userUpdate.store.storeId) },
        {
          $set: {
            ...userUpdate.store,
            updatedAt: new Date()
          }
        }
      );
    }

    if (userResult.matchedCount === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update user profile API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}