import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';

const JWT_SECRET = process.env.JWT_SECRET || 'pawn360-super-secret-jwt-key-2024';
const JWT_EXPIRE_HOURS = 24;

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    // Find user by email
    const user = await db.collection('users').findOne({ email });

    if (!user || !await bcrypt.compare(password, user.passwordHash)) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Get stores owned by this user
    const stores = await db.collection('stores').find({ ownerId: user._id }).toArray();

    // Convert ObjectIds to strings
    const storesFormatted = stores.map(store => ({
      ...store,
      _id: store._id.toString(),
      ownerId: store.ownerId.toString()
    }));

    // For backward compatibility, set the first store as primary store
    const primaryStore = storesFormatted.length > 0 ? storesFormatted[0] : null;

    // Create token
    const token = jwt.sign(
      { sub: user._id.toString() },
      JWT_SECRET,
      { expiresIn: `${JWT_EXPIRE_HOURS}h` }
    );

    // Prepare user data (remove sensitive info)
    const userData = {
      id: user._id.toString(),
      email: user.email,
      full_name: user.fullName,
      role: user.role || 'user',
      store_id: primaryStore?._id || null
    };

    return NextResponse.json({
      access_token: token,
      token_type: 'bearer',
      user: userData,
      store: primaryStore,
      stores: storesFormatted
    });

  } catch (error) {
    console.error('Signin error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
