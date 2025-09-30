import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const db = await getDatabase();
    const { id: contractId } = await params;
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
      case 'pay_interest':
        // Update remaining amount after interest payment
        updateData['pawnDetails.remainingAmount'] = Math.max(0, contract.pawnDetails.remainingAmount - actionData.amount);
        transactionData.beforeBalance = contract.pawnDetails.remainingAmount;
        transactionData.afterBalance = updateData['pawnDetails.remainingAmount'];
        break;

      case 'increase_loan':
        updateData['pawnDetails.pawnedPrice'] = contract.pawnDetails.pawnedPrice + actionData.amount;
        // Recalculate total interest with new principal
        const newTotalInterest = updateData['pawnDetails.pawnedPrice'] *
          (contract.pawnDetails.interestRate / 100) *
          (contract.pawnDetails.periodDays / 30);
        updateData['pawnDetails.totalInterest'] = newTotalInterest;
        updateData['pawnDetails.remainingAmount'] = updateData['pawnDetails.pawnedPrice'] + newTotalInterest;
        transactionData.beforeBalance = contract.pawnDetails.pawnedPrice;
        transactionData.afterBalance = updateData['pawnDetails.pawnedPrice'];
        break;

      case 'decrease_loan':
        updateData['pawnDetails.pawnedPrice'] = Math.max(0, contract.pawnDetails.pawnedPrice - actionData.amount);
        // Recalculate total interest with new principal
        const updatedTotalInterest = updateData['pawnDetails.pawnedPrice'] *
          (contract.pawnDetails.interestRate / 100) *
          (contract.pawnDetails.periodDays / 30);
        updateData['pawnDetails.totalInterest'] = updatedTotalInterest;
        updateData['pawnDetails.remainingAmount'] = updateData['pawnDetails.pawnedPrice'] + updatedTotalInterest;
        transactionData.beforeBalance = contract.pawnDetails.pawnedPrice;
        transactionData.afterBalance = updateData['pawnDetails.pawnedPrice'];
        break;

      case 'redeem':
        updateData.status = 'redeemed';
        updateData['dates.redeemDate'] = now;
        updateData['pawnDetails.remainingAmount'] = 0;
        transactionData.beforeBalance = contract.pawnDetails.remainingAmount;
        transactionData.afterBalance = 0;
        break;

      case 'suspend':
        updateData.status = 'suspended';
        updateData['dates.suspendedDate'] = now;
        transactionData.beforeBalance = contract.pawnDetails.remainingAmount;
        transactionData.afterBalance = contract.pawnDetails.remainingAmount;
        transactionData.amount = 0;
        transactionData.note = actionData.reason ? `${actionData.reason}: ${actionData.note || ''}` : actionData.note;
        break;

      default:
        return NextResponse.json({ error: 'Invalid action type' }, { status: 400 });
    }

    // Update contract
    await db.collection('contracts').updateOne(
      { _id: contractObjectId },
      {
        $set: updateData,
        $push: { transactionHistory: transactionData._id }
      }
    );

    // Add transaction record
    await db.collection('transactions').insertOne(transactionData);

    return NextResponse.json({ success: true, transactionId: transactionData._id });
  } catch (error) {
    console.error('Contract action API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}