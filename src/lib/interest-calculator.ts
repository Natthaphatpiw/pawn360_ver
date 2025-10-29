/**
 * Interest Calculator Utility
 * คำนวณดอกเบี้ยสำหรับสัญญาจำนำ
 */

interface InterestCalculation {
  principal: number; // เงินต้น
  days: number; // จำนวนวัน
  interestAmount: number; // ดอกเบี้ยที่คำนวณได้
  totalAmount: number; // เงินต้น + ดอกเบี้ย
}

/**
 * คำนวณดอกเบี้ยแบบรายวัน
 * @param principal - เงินต้น (บาท)
 * @param interestRatePerMonth - อัตราดอกเบี้ยต่อเดือน (%)
 * @param days - จำนวนวัน
 * @returns InterestCalculation
 */
export function calculateDailyInterest(
  principal: number,
  interestRatePerMonth: number,
  days: number
): InterestCalculation {
  // แปลงอัตราดอกเบี้ยจากรายเดือนเป็นรายวัน
  // เช่น 3% ต่อเดือน = 0.1% ต่อวัน
  const dailyRate = interestRatePerMonth / 30;

  // คำนวณดอกเบี้ย
  const interestAmount = principal * (dailyRate / 100) * days;

  return {
    principal,
    days,
    interestAmount: Math.round(interestAmount * 100) / 100, // ปัดเศษ 2 ตำแหน่ง
    totalAmount: Math.round((principal + interestAmount) * 100) / 100
  };
}

/**
 * คำนวณวันครบกำหนดใหม่สำหรับการต่อดอก
 * @param currentDueDate - วันครบกำหนดปัจจุบัน
 * @param extensionDays - จำนวนวันที่ต้องการต่อ
 * @returns Date - วันครบกำหนดใหม่
 */
export function calculateNewDueDate(
  currentDueDate: Date,
  extensionDays: number
): Date {
  const newDate = new Date(currentDueDate);
  newDate.setDate(newDate.getDate() + extensionDays);
  return newDate;
}

/**
 * คำนวณจำนวนวันระหว่างสองวัน
 * @param startDate - วันเริ่มต้น
 * @param endDate - วันสิ้นสุด
 * @returns number - จำนวนวัน
 */
export function calculateDaysBetween(
  startDate: Date,
  endDate: Date
): number {
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * คำนวณดอกเบี้ยสะสมถึงวันปัจจุบัน
 * @param contract - ข้อมูลสัญญา
 * @returns InterestCalculation
 */
export function calculateAccruedInterest(contract: {
  principalAmount: number;
  interestRate: number;
  startDate: Date;
  lastInterestCutoffDate?: Date; // วันที่ตัดดอกครั้งล่าสุด
}): InterestCalculation {
  const startDate = contract.lastInterestCutoffDate || contract.startDate;
  const today = new Date();
  const days = calculateDaysBetween(startDate, today);

  return calculateDailyInterest(
    contract.principalAmount,
    contract.interestRate,
    days
  );
}

/**
 * คำนวณยอดที่ต้องชำระเมื่อลดเงินต้น
 * @param currentPrincipal - เงินต้นปัจจุบัน
 * @param reduceAmount - จำนวนเงินที่ต้องการลด
 * @param interestRate - อัตราดอกเบี้ยต่อเดือน
 * @param daysSinceLastCutoff - จำนวนวันนับจากวันตัดดอกครั้งล่าสุด
 * @returns { principalPayment, interestPayment, totalPayment, newPrincipal }
 */
export function calculatePrincipalReduction(
  currentPrincipal: number,
  reduceAmount: number,
  interestRate: number,
  daysSinceLastCutoff: number
): {
  principalPayment: number;
  interestPayment: number;
  totalPayment: number;
  newPrincipal: number;
} {
  // คำนวณดอกเบี้ยค้างจ่าย
  const accruedInterest = calculateDailyInterest(
    currentPrincipal,
    interestRate,
    daysSinceLastCutoff
  );

  return {
    principalPayment: reduceAmount,
    interestPayment: accruedInterest.interestAmount,
    totalPayment: reduceAmount + accruedInterest.interestAmount,
    newPrincipal: currentPrincipal - reduceAmount
  };
}

/**
 * คำนวณดอกเบี้ยที่ต้องตัดรอบเมื่อเพิ่มเงินต้น
 * @param currentPrincipal - เงินต้นปัจจุบัน
 * @param interestRate - อัตราดอกเบี้ยต่อเดือน
 * @param daysSinceLastCutoff - จำนวนวันนับจากวันตัดดอกครั้งล่าสุด
 * @returns { interestAmount, cutoffDate }
 */
export function calculateInterestCutoff(
  currentPrincipal: number,
  interestRate: number,
  daysSinceLastCutoff: number
): {
  interestAmount: number;
  cutoffDate: Date;
} {
  const interest = calculateDailyInterest(
    currentPrincipal,
    interestRate,
    daysSinceLastCutoff
  );

  return {
    interestAmount: interest.interestAmount,
    cutoffDate: new Date()
  };
}

/**
 * คำนวณยอดรวมที่ต้องชำระเมื่อไถ่ถอน
 * @param contract - ข้อมูลสัญญา
 * @returns { principal, interest, total }
 */
export function calculateRedemptionAmount(contract: {
  principalAmount: number;
  interestRate: number;
  startDate: Date;
  lastInterestCutoffDate?: Date;
  accruedInterest?: number; // ดอกเบี้ยค้างจากการตัดรอบก่อนหน้า
}): {
  principal: number;
  interest: number;
  total: number;
  days: number;
} {
  const accrued = calculateAccruedInterest(contract);
  const previousInterest = contract.accruedInterest || 0;

  return {
    principal: contract.principalAmount,
    interest: accrued.interestAmount + previousInterest,
    total: contract.principalAmount + accrued.interestAmount + previousInterest,
    days: accrued.days
  };
}
