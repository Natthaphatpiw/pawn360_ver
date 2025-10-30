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

    // Get current contract - first try direct lookup by contractId
    let contract = await db.collection('contracts').findOne({ _id: contractObjectId });

    // If not found, try to find by itemId or look up from items collection
    if (!contract) {
      const item = await db.collection('items').findOne({
        $or: [
          { _id: contractObjectId },
          { currentContractId: contractObjectId.toString() }
        ]
      });

      if (item && item.currentContractId) {
        contract = await db.collection('contracts').findOne({
          _id: new ObjectId(item.currentContractId)
        });
      }
    }

    if (!contract) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    }

    let updateData: any = { updatedAt: now };
    let transactionData: any = {
      _id: new ObjectId(),
      contractId: contract._id,
      customerId: contract.customerId,
      processedBy: new ObjectId(actionData.processedBy),
      storeId: contract.storeId,
      createdAt: now,
      ...actionData
    };

    // Handle different action types
    switch (actionData.type) {
      case 'pay_interest':
        // Update remaining amount after interest payment and track total interest paid
        updateData['pawnDetails.remainingAmount'] = Math.max(0, contract.pawnDetails.remainingAmount - actionData.amount);
        updateData['pawnDetails.payInterest'] = (contract.pawnDetails.payInterest || 0) + actionData.amount;
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

      case 'add_fine':
        // Add fine to the contract
        updateData['pawnDetails.fineAmount'] = (contract.pawnDetails.fineAmount || 0) + actionData.amount;
        transactionData.beforeBalance = contract.pawnDetails.fineAmount || 0;
        transactionData.afterBalance = updateData['pawnDetails.fineAmount'];
        break;

      case 'paid_fine':
        // Reduce fine amount when customer pays
        updateData['pawnDetails.fineAmount'] = Math.max(0, (contract.pawnDetails.fineAmount || 0) - actionData.amount);
        transactionData.beforeBalance = contract.pawnDetails.fineAmount || 0;
        transactionData.afterBalance = updateData['pawnDetails.fineAmount'];
        break;

      case 'sold':
        // Mark contract as sold and record sale amount
        updateData.status = 'sold';
        updateData['pawnDetails.soldAmount'] = actionData.amount;
        updateData['dates.soldDate'] = now;
        transactionData.beforeBalance = 0;
        transactionData.afterBalance = actionData.amount;
        break;

      case 'extension':
        // Extend contract due date
        const extensionDays = actionData.extensionDays || 30;
        const currentDueDate = contract.dates.dueDate ? new Date(contract.dates.dueDate) : new Date();
        const newDueDate = new Date(currentDueDate.getTime() + extensionDays * 24 * 60 * 60 * 1000);
        updateData['dates.dueDate'] = newDueDate;
        updateData['pawnDetails.periodDays'] = (contract.pawnDetails.periodDays || 30) + extensionDays;
        transactionData.extensionDays = extensionDays;
        transactionData.beforeBalance = contract.pawnDetails.remainingAmount;
        transactionData.afterBalance = contract.pawnDetails.remainingAmount; // Amount stays the same
        break;

      default:
        return NextResponse.json({ error: 'Invalid action type' }, { status: 400 });
    }

    // Update contract
    await db.collection('contracts').updateOne(
      { _id: contract._id },
      {
        $set: updateData,
        $push: { transactionHistory: transactionData._id.toString() }
      }
    );

    // Add transaction record
    await db.collection('transactions').insertOne(transactionData);

    // Also update items collection if this action affects item status
    if (['redeem', 'suspend', 'sold', 'extension'].includes(actionData.type)) {
      let itemStatus = 'active';
      if (actionData.type === 'redeem') itemStatus = 'redeemed';
      if (actionData.type === 'suspend') itemStatus = 'suspended';
      if (actionData.type === 'sold') itemStatus = 'sold';

      // Find the corresponding item
      const item = await db.collection('items').findOne({
        currentContractId: contract._id.toString()
      });

      if (item) {
        await db.collection('items').updateOne(
          { _id: item._id },
          {
            $set: {
              status: itemStatus,
              updatedAt: now
            }
          }
        );
      }
    }

    return NextResponse.json({ success: true, transactionId: transactionData._id });
  } catch (error) {
    console.error('Contract action API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}