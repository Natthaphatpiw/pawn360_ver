import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ contractId: string }> }
) {
  try {
    const db = await getDatabase();
    const { contractId } = await params;

    if (!contractId) {
      return NextResponse.json(
        { error: 'Contract ID is required' },
        { status: 400 }
      );
    }

    // Validate contractId format
    let objectId;
    try {
      objectId = new ObjectId(contractId);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid contract ID format' },
        { status: 400 }
      );
    }

    // Query items collection with contractId as _id
    const item = await db.collection('items').findOne({
      _id: objectId,
      status: 'active'
    });

    if (!item) {
      return NextResponse.json(
        { error: 'pawn360.vercel.app ไม่พบรายการจำนำ' },
        { status: 404 }
      );
    }

    // Get contract details if exists
    let contractDetails = null;
    if (item.currentContractId) {
      const contract = await db.collection('contracts').findOne({
        _id: item.currentContractId
      });

      if (contract) {
        contractDetails = {
          contractNumber: contract.contractNumber,
          status: contract.status,
          pawnDetails: contract.pawnDetails,
          dates: contract.dates,
          createdAt: contract.createdAt
        };
      }
    }

    // Return item data as per spec
    const response = {
      _id: item._id.toString(),
      lineId: item.lineId,
      storeId: item.storeId.toString(),
      brand: item.brand,
      model: item.model,
      type: item.type,
      desiredAmount: item.desiredAmount,
      loanDays: item.loanDays,
      interestRate: item.interestRate,
      status: item.status,
      createdAt: item.createdAt,
      contractDetails: contractDetails
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Customer contract details error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
