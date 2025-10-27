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

    console.log('Signin attempt:', { email, hasPassword: !!password });

    if (!email || !password) {
      console.log('Missing email or password');
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    // Handle demo user
    if (email === 'demo@pawn360.com' && password === 'demo123') {
      console.log('Demo user login attempt');

      // Check if demo user exists, if not create it
      let demoUser = await db.collection('users').findOne({ email: 'demo@pawn360.com' });

      if (!demoUser) {
        console.log('Creating demo user');
        const hashedPassword = await bcrypt.hash('demo123', 12);

        const demoUserDoc = {
          fullName: 'Demo User',
          email: 'demo@pawn360.com',
          passwordHash: hashedPassword,
          role: 'user',
          createdAt: new Date()
        };

        const result = await db.collection('users').insertOne(demoUserDoc);
        demoUser = { ...demoUserDoc, _id: result.insertedId };
        console.log('Demo user created:', demoUser._id);
      }

      // Create demo store if not exists
      let demoStore = await db.collection('stores').findOne({ ownerId: demoUser._id });

      if (!demoStore) {
        console.log('Creating demo store');
        const demoStoreDoc = {
          storeName: 'ร้านทองจำนำเดโม',
          phone: '02-555-0123',
          taxId: '0123456789012',
          address: {
            houseNumber: '123',
            village: 'หมู่บ้านสุขใจ',
            street: 'ถนนรัชดาภิเษก',
            subDistrict: 'ดินแดง',
            district: 'ดินแดง',
            province: 'กรุงเทพมหานคร',
            country: 'ประเทศไทย',
            postcode: '10400'
          },
          passwordHash: demoUser.passwordHash, // Use owner's password hash
          ownerId: demoUser._id,
          logoUrl: null,
          stampUrl: null,
          signatureUrl: null,
          interestPresets: [
            { days: 7, rate: 3.0 },
            { days: 15, rate: 5.0 },
            { days: 30, rate: 10.0 }
          ],
          contractTemplate: {
            header: 'สัญญาจำนำทองคำ',
            footer: 'ขอบคุณที่ใช้บริการ',
            terms: 'เงื่อนไขการจำนำมาตรฐาน'
          },
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          googlemap: 'https://maps.app.goo.gl/demo',
          bankUrl: 'https://piwp360.s3.ap-southeast-2.amazonaws.com/bank/demo.png',
          interestPerday: 0.025,
          interestSet: { '7': 0.07, '14': 0.08, '30': 0.10 },
          logo: null,
          signature: null,
          delayed: {
            maxday: 7,
            feeperday: 100
          }
        };

        const storeResult = await db.collection('stores').insertOne(demoStoreDoc);
        demoStore = { ...demoStoreDoc, _id: storeResult.insertedId };
        console.log('Demo store created:', demoStore._id);
      }

      // Get stores for demo user
      const stores = await db.collection('stores').find({ ownerId: demoUser._id }).toArray();
      const storesFormatted = stores.map(store => ({
        ...store,
        _id: store._id.toString(),
        ownerId: store.ownerId.toString()
      }));

      const primaryStore = storesFormatted.length > 0 ? storesFormatted[0] : null;

      // Create token
      const token = jwt.sign(
        { sub: demoUser._id.toString() },
        JWT_SECRET,
        { expiresIn: `${JWT_EXPIRE_HOURS}h` }
      );

      const userData = {
        id: demoUser._id.toString(),
        email: demoUser.email,
        full_name: demoUser.fullName,
        role: demoUser.role || 'user',
        store_id: primaryStore?._id || null
      };

      console.log('Demo login successful');
      return NextResponse.json({
        access_token: token,
        token_type: 'bearer',
        user: userData,
        store: primaryStore,
        stores: storesFormatted
      });
    }

    // Find user by email
    const user = await db.collection('users').findOne({ email });

    if (!user || !await bcrypt.compare(password, user.passwordHash)) {
      console.log('Invalid credentials for:', email);
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
