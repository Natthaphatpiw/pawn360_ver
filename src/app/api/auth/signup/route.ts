import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'pawn360-super-secret-jwt-key-2024';
const JWT_EXPIRE_HOURS = 24;

export async function POST(request: NextRequest) {
  try {
    const { user, store } = await request.json();

    if (!user || !user.email || !user.password || !user.full_name) {
      return NextResponse.json(
        { error: 'User data is required' },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    // Check if user already exists
    const existingUser = await db.collection('users').findOne({ email: user.email });
    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      );
    }

    // Create user first
    const hashedPassword = await bcrypt.hash(user.password, 12);
    const userDoc = {
      fullName: user.full_name,
      email: user.email,
      passwordHash: hashedPassword,
      role: user.role || 'user',
      createdAt: new Date()
    };

    const userResult = await db.collection('users').insertOne(userDoc);
    const userId = userResult.insertedId;

    let storeDoc = null;

    // Create store if provided and link to user
    if (store) {
      storeDoc = {
        storeName: store.store_name,
        phone: store.phone,
        taxId: store.tax_id,
        address: store.address,
        passwordHash: hashedPassword, // Use owner's password hash
        ownerId: userId,
        logoUrl: null,
        stampUrl: null,
        signatureUrl: null,
        interestRate: store.interestRate || [], // Array of {days: rate} objects
        contractTemplate: {
          header: 'สัญญาจำนำ',
          footer: 'ขอบคุณที่ใช้บริการ',
          terms: 'เงื่อนไขการจำนำมาตรฐาน'
        },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await db.collection('stores').insertOne(storeDoc);
    }

    // Create access token
    const token = jwt.sign(
      { sub: userId.toString() },
      JWT_SECRET,
      { expiresIn: `${JWT_EXPIRE_HOURS}h` }
    );

    // Prepare user data
    const userData = {
      id: userId.toString(),
      email: user.email,
      full_name: user.full_name,
      role: user.role || 'user',
      store_id: storeDoc ? storeDoc._id.toString() : null
    };

    return NextResponse.json({
      message: 'User created successfully',
      access_token: token,
      token_type: 'bearer',
      user: userData,
      store: storeDoc
    });

  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
