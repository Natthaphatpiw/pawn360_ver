import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// Helper function to calculate daily interest rate from monthly/period rate
function calculateDailyInterestRate(interestRate: number, periodDays: number): number {
  // interestRate is the rate for the entire period (e.g., 10% for 30 days)
  // We need to convert this to a daily rate
  return (interestRate / 100) / periodDays;
}

// Helper function to calculate accrued interest
function calculateAccruedInterest(
  principal: number,
  dailyRate: number,
  days: number
): number {
  return Math.round(principal * dailyRate * days * 100) / 100;
}

// Helper function to calculate days between dates
function daysBetween(date1: Date, date2: Date): number {
  const diffTime = Math.abs(date2.getTime() - date1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

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
    let contract = await db.collection('contracts').findOne({ _id: contractObjectId });

    // If not found, try to find by itemId
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
      processedBy: actionData.processedBy ? new ObjectId(actionData.processedBy) : null,
      storeId: contract.storeId,
      createdAt: now,
      type: actionData.type,
      paymentMethod: actionData.paymentMethod,
      note: actionData.note,
      paymentSlipUrl: actionData.paymentSlipUrl // For image uploads
    };

    // Calculate daily interest rate
    const dailyRate = calculateDailyInterestRate(
      contract.pawnDetails.interestRate,
      contract.pawnDetails.periodDays
    );

    // Handle different action types
    switch (actionData.type) {
      case 'pay_interest':
        // จ่ายดอกเบี้ย และเพิ่ม dueDate ตาม periodDays
        const interestAmount = actionData.amount || contract.pawnDetails.totalInterest;

        // บันทึกดอกเบี้ยที่จ่าย
        updateData['pawnDetails.payInterest'] = (contract.pawnDetails.payInterest || 0) + interestAmount;

        // เพิ่ม dueDate ตาม periodDays
        const currentDueDate = contract.dates.dueDate ? new Date(contract.dates.dueDate) : new Date();
        const extensionDays = contract.pawnDetails.periodDays || 30;
        const newDueDate = new Date(currentDueDate.getTime() + extensionDays * 24 * 60 * 60 * 1000);
        updateData['dates.dueDate'] = newDueDate;

        // อัพเดท remainingAmount (ลดลงเท่ากับดอกเบี้ยที่จ่าย)
        updateData['pawnDetails.remainingAmount'] = Math.round((contract.pawnDetails.remainingAmount - interestAmount) * 100) / 100;

        transactionData.amount = interestAmount;
        transactionData.beforeBalance = contract.pawnDetails.remainingAmount;
        transactionData.afterBalance = updateData['pawnDetails.remainingAmount'];
        transactionData.extensionDays = extensionDays;
        transactionData.newDueDate = newDueDate;
        break;

      case 'increase_loan':
        // เพิ่มเงินต้น - ต้องคำนวณดอกเบี้ยค้างก่อน
        const increaseAmount = actionData.amount;

        // คำนวณจำนวนวันที่ผ่านไปตั้งแต่ startDate
        const startDate = contract.dates.startDate ? new Date(contract.dates.startDate) : new Date(contract.createdAt);
        const daysElapsed = daysBetween(startDate, now);

        // คำนวณดอกเบี้ยค้างจากเงินต้นเดิม
        const accruedInterestBeforeIncrease = calculateAccruedInterest(
          contract.pawnDetails.pawnedPrice,
          dailyRate,
          daysElapsed
        );

        // เงินต้นใหม่
        const newPrincipalIncrease = contract.pawnDetails.pawnedPrice + increaseAmount;

        // คำนวณจำนวนวันที่เหลือ
        const dueDate = contract.dates.dueDate ? new Date(contract.dates.dueDate) : new Date();
        const daysRemaining = Math.max(0, daysBetween(now, dueDate));

        // คำนวณดอกเบี้ยใหม่สำหรับช่วงที่เหลือ
        const newInterestForRemaining = calculateAccruedInterest(
          newPrincipalIncrease,
          dailyRate,
          daysRemaining
        );

        // อัพเดทข้อมูล
        updateData['pawnDetails.pawnedPrice'] = newPrincipalIncrease;
        updateData['pawnDetails.totalInterest'] = accruedInterestBeforeIncrease + newInterestForRemaining;
        updateData['pawnDetails.remainingAmount'] = newPrincipalIncrease + accruedInterestBeforeIncrease + newInterestForRemaining;
        updateData['pawnDetails.accruedInterest'] = accruedInterestBeforeIncrease;
        updateData['dates.lastPrincipalChangeDate'] = now;

        transactionData.amount = increaseAmount;
        transactionData.beforeBalance = contract.pawnDetails.pawnedPrice;
        transactionData.afterBalance = newPrincipalIncrease;
        transactionData.accruedInterestSettled = accruedInterestBeforeIncrease;
        transactionData.daysElapsed = daysElapsed;
        transactionData.daysRemaining = daysRemaining;
        break;

      case 'decrease_loan':
        // ลดเงินต้น - ต้องคำนวณดอกเบี้ยค้างก่อน
        const decreaseAmount = actionData.amount;

        // คำนวณจำนวนวันที่ผ่านไปตั้งแต่ startDate
        const startDateDecrease = contract.dates.startDate ? new Date(contract.dates.startDate) : new Date(contract.createdAt);
        const daysElapsedDecrease = daysBetween(startDateDecrease, now);

        // คำนวณดอกเบี้ยค้างจากเงินต้นเดิม
        const accruedInterestBeforeDecrease = calculateAccruedInterest(
          contract.pawnDetails.pawnedPrice,
          dailyRate,
          daysElapsedDecrease
        );

        // เงินต้นใหม่
        const newPrincipalDecrease = Math.max(0, contract.pawnDetails.pawnedPrice - decreaseAmount);

        // คำนวณจำนวนวันที่เหลือ
        const dueDateDecrease = contract.dates.dueDate ? new Date(contract.dates.dueDate) : new Date();
        const daysRemainingDecrease = Math.max(0, daysBetween(now, dueDateDecrease));

        // คำนวณดอกเบี้ยใหม่สำหรับช่วงที่เหลือ
        const newInterestForRemainingDecrease = calculateAccruedInterest(
          newPrincipalDecrease,
          dailyRate,
          daysRemainingDecrease
        );

        // อัพเดทข้อมูล
        updateData['pawnDetails.pawnedPrice'] = newPrincipalDecrease;
        updateData['pawnDetails.totalInterest'] = accruedInterestBeforeDecrease + newInterestForRemainingDecrease;
        updateData['pawnDetails.remainingAmount'] = newPrincipalDecrease + accruedInterestBeforeDecrease + newInterestForRemainingDecrease;
        updateData['pawnDetails.accruedInterest'] = accruedInterestBeforeDecrease;
        updateData['dates.lastPrincipalChangeDate'] = now;

        // ลูกค้าต้องจ่าย: decreaseAmount + accruedInterestBeforeDecrease
        const totalPaymentRequired = decreaseAmount + accruedInterestBeforeDecrease;

        transactionData.amount = decreaseAmount;
        transactionData.beforeBalance = contract.pawnDetails.pawnedPrice;
        transactionData.afterBalance = newPrincipalDecrease;
        transactionData.accruedInterestSettled = accruedInterestBeforeDecrease;
        transactionData.totalPaymentRequired = totalPaymentRequired;
        transactionData.daysElapsed = daysElapsedDecrease;
        transactionData.daysRemaining = daysRemainingDecrease;
        break;

      case 'redeem':
        // ไถ่ถอน - จ่ายเต็มจำนวน
        updateData.status = 'redeemed';
        updateData['dates.redeemDate'] = now;
        updateData['pawnDetails.remainingAmount'] = 0;

        // บันทึก URL ของสลิปถ้ามี
        if (actionData.paymentSlipUrl) {
          updateData['documents.redeemSlipUrl'] = actionData.paymentSlipUrl;
        }

        transactionData.amount = contract.pawnDetails.remainingAmount;
        transactionData.beforeBalance = contract.pawnDetails.remainingAmount;
        transactionData.afterBalance = 0;
        break;

      case 'suspend':
        // หลุดจำนำ
        updateData.status = 'suspended';
        updateData['dates.suspendedDate'] = now;
        transactionData.beforeBalance = contract.pawnDetails.remainingAmount;
        transactionData.afterBalance = contract.pawnDetails.remainingAmount;
        transactionData.amount = 0;
        transactionData.reason = actionData.reason;
        transactionData.note = actionData.reason ? `${actionData.reason}: ${actionData.note || ''}` : actionData.note;
        break;

      case 'add_fine':
        // เพิ่มค่าปรับ
        const fineToAdd = actionData.amount;
        updateData['pawnDetails.fineAmount'] = (contract.pawnDetails.fineAmount || 0) + fineToAdd;
        updateData['pawnDetails.remainingAmount'] = contract.pawnDetails.remainingAmount + fineToAdd;

        transactionData.amount = fineToAdd;
        transactionData.beforeBalance = contract.pawnDetails.fineAmount || 0;
        transactionData.afterBalance = updateData['pawnDetails.fineAmount'];
        break;

      case 'paid_fine':
        // จ่ายค่าปรับ
        const fineToPay = actionData.amount;
        updateData['pawnDetails.fineAmount'] = Math.max(0, (contract.pawnDetails.fineAmount || 0) - fineToPay);
        updateData['pawnDetails.remainingAmount'] = Math.max(0, contract.pawnDetails.remainingAmount - fineToPay);

        transactionData.amount = fineToPay;
        transactionData.beforeBalance = contract.pawnDetails.fineAmount || 0;
        transactionData.afterBalance = updateData['pawnDetails.fineAmount'];
        break;

      case 'sold':
        // ขายของแล้ว
        updateData.status = 'sold';
        updateData['pawnDetails.soldAmount'] = actionData.amount;
        updateData['dates.soldDate'] = now;

        transactionData.amount = actionData.amount;
        transactionData.beforeBalance = 0;
        transactionData.afterBalance = actionData.amount;
        break;

      default:
        return NextResponse.json({ error: 'Invalid action type' }, { status: 400 });
    }

    // Update contract
    await db.collection('contracts').updateOne(
      { _id: contract._id },
      {
        $set: updateData,
        $push: { transactionHistory: transactionData._id.toString() } as any
      }
    );

    // Add transaction record
    await db.collection('transactions').insertOne(transactionData);

    // Update items collection status if needed
    if (['redeem', 'suspend', 'sold'].includes(actionData.type)) {
      let itemStatus = 'active';
      if (actionData.type === 'redeem') itemStatus = 'redeemed';
      if (actionData.type === 'suspend') itemStatus = 'suspended';
      if (actionData.type === 'sold') itemStatus = 'sold';

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

    return NextResponse.json({
      success: true,
      transactionId: transactionData._id,
      updatedContract: {
        ...contract,
        ...updateData
      }
    });
  } catch (error) {
    console.error('Contract action API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
