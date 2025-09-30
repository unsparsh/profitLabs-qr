/**
 * Billing Service
 * 
 * This file contains business logic for billing calculations, payment processing,
 * and financial operations. Handles guest billing from check-in to check-out
 * including additional charges, taxes, and payment tracking.
 */

/**
 * Calculate total billing for guest stay
 * @param {object} guestData - Guest information with stay details
 * @returns {object} - Billing breakdown with totals
 */
const calculateGuestBilling = (guestData) => {
  const checkInDate = new Date(guestData.checkInDate);
  const checkOutDate = new Date(guestData.checkOutDate);
  
  // Calculate total nights
  const totalNights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
  
  // Base room charges
  const roomCharges = totalNights * guestData.ratePerNight;
  
  // Additional charges (if any)
  const additionalCharges = guestData.additionalCharges || 0;
  
  // Calculate taxes (assuming 12% GST)
  const taxRate = 0.12;
  const subtotal = roomCharges + additionalCharges;
  const taxes = subtotal * taxRate;
  
  // Total amount
  const totalAmount = subtotal + taxes;
  
  // Payment tracking
  const advancePayment = guestData.advancePayment || 0;
  const paidAmount = advancePayment;
  const pendingAmount = Math.max(0, totalAmount - paidAmount);

  return {
    totalNights,
    roomCharges,
    additionalCharges,
    subtotal,
    taxes,
    totalAmount,
    advancePayment,
    paidAmount,
    pendingAmount,
    breakdown: {
      roomRate: guestData.ratePerNight,
      nights: totalNights,
      roomTotal: roomCharges,
      additionalCharges,
      taxRate: `${(taxRate * 100).toFixed(0)}%`,
      taxAmount: taxes,
      grandTotal: totalAmount
    }
  };
};

/**
 * Calculate final checkout billing
 * @param {object} guest - Guest record from database
 * @param {number} additionalCharges - Extra charges during stay
 * @param {number} finalPayment - Final payment amount
 * @returns {object} - Final billing summary
 */
const calculateCheckoutBilling = (guest, additionalCharges = 0, finalPayment = 0) => {
  // Original billing
  const originalTotal = guest.totalAmount;
  
  // Add additional charges
  const finalTotalAmount = originalTotal + additionalCharges;
  
  // Calculate final payments
  const finalPaidAmount = guest.paidAmount + finalPayment;
  const finalPendingAmount = Math.max(0, finalTotalAmount - finalPaidAmount);

  return {
    originalTotal,
    additionalCharges,
    finalTotalAmount,
    previouslyPaid: guest.paidAmount,
    finalPayment,
    finalPaidAmount,
    finalPendingAmount,
    isFullyPaid: finalPendingAmount === 0
  };
};

/**
 * Generate billing receipt data
 * @param {object} guest - Guest record
 * @param {object} billing - Billing calculation result
 * @returns {object} - Receipt data structure
 */
const generateReceipt = (guest, billing) => {
  return {
    receiptId: `RCP-${Date.now()}`,
    guestName: guest.name,
    roomNumber: guest.roomNumber,
    checkInDate: guest.checkInDate,
    checkOutDate: guest.checkOutDate,
    totalNights: billing.totalNights,
    itemizedCharges: [
      {
        description: `Room charges (${billing.totalNights} nights × ₹${guest.ratePerNight})`,
        amount: billing.roomCharges
      },
      ...(billing.additionalCharges > 0 ? [{
        description: 'Additional charges',
        amount: billing.additionalCharges
      }] : []),
      {
        description: `Taxes (${(billing.taxRate || 12)}%)`,
        amount: billing.taxes
      }
    ],
    subtotal: billing.subtotal,
    taxes: billing.taxes,
    totalAmount: billing.totalAmount,
    paidAmount: billing.paidAmount,
    pendingAmount: billing.pendingAmount,
    generatedAt: new Date().toISOString()
  };
};

/**
 * Validate payment amount
 * @param {number} amount - Payment amount to validate
 * @param {number} maxAmount - Maximum allowed payment
 * @returns {object} - Validation result
 */
const validatePayment = (amount, maxAmount) => {
  const errors = [];

  if (amount < 0) {
    errors.push('Payment amount cannot be negative');
  }

  if (amount > maxAmount) {
    errors.push(`Payment amount cannot exceed ₹${maxAmount.toLocaleString()}`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

module.exports = {
  calculateGuestBilling,
  calculateCheckoutBilling,
  generateReceipt,
  validatePayment
};