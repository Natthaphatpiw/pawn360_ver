import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const db = await getDatabase();
    const contractId = params.id;
    const actionData = await request.json();

    if (!ObjectId.isValid(contractId)) {
      return NextResponse.json({ error: 'Invalid contract ID' }, { status: 400 });
    }

    const contractObjectId = new ObjectId(contractId);
    const now = new Date();

    // Get current contract
    const contract = await db.collection('contracts').findOne({ _id: contractObjectId });
    if (!contract) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    }

    let updateData: any = { updatedAt: now };
    let transactionData: any = {
      _id: new ObjectId(),
      contractId: contractObjectId,
      customerId: contract.customerId,
      processedBy: new ObjectId(actionData.processedBy),
      storeId: contract.storeId,
      createdAt: now,
      ...actionData
    };

    // Handle different action types
    switch (actionData.type) {
      case 'interest_payment':
        // No status change for interest payment
        break;

      case 'principal_increase':
        updateData['pawnDetails.pawnedPrice'] = contract.pawnDetails.pawnedPrice + actionData.amount;
        updateData['pawnDetails.remainingAmount'] = contract.pawnDetails.remainingAmount + actionData.amount;
        break;

      case 'principal_decrease':
        updateData['pawnDetails.pawnedPrice'] = Math.max(0, contract.pawnDetails.pawnedPrice - actionData.amount);
        updateData['pawnDetails.remainingAmount'] = Math.max(0, contract.pawnDetails.remainingAmount - actionData.amount);
        break;

      case 'redeem':
        updateData.status = 'redeemed';
        updateData['dates.redeemDate'] = now;
        break;

      case 'suspend':
        updateData.status = 'suspended';
        updateData['dates.suspendedDate'] = now;
        break;

      case 'extend':
        const newDueDate = new Date(contract.dates.dueDate);
        newDueDate.setDate(newDueDate.getDate() + (actionData.extensionDays || 30));
        updateData['dates.dueDate'] = newDueDate;

        // Calculate additional interest for extension
        const extensionInterest = contract.pawnDetails.pawnedPrice *
          (contract.pawnDetails.interestRate / 100) *
          ((actionData.extensionDays || 30) / 30);

        updateData['pawnDetails.totalInterest'] = contract.pawnDetails.totalInterest + extensionInterest;
        updateData['pawnDetails.remainingAmount'] = contract.pawnDetails.remainingAmount + extensionInterest;
        transactionData.amount = extensionInterest;
        break;

      default:
        return NextResponse.json({ error: 'Invalid action type' }, { status: 400 });
    }

    // Update contract
    await db.collection('contracts').updateOne(
      { _id: contractObjectId },
      { $set: updateData }
    );

    // Add transaction record
    await db.collection('transactions').insertOne(transactionData);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Contract action API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}