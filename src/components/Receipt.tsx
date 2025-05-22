
import React, { forwardRef } from 'react';
import { Student, FeePayment } from '@/types';
import { formatNepaliDate } from '@/lib/nepali-utils';
import { Receipt as ReceiptIcon } from 'lucide-react';

interface ReceiptProps {
  student: Student;
  payment: FeePayment;
  institutionName?: string;
  institutionAddress?: string;
  institutionContact?: string;
  receiptDate?: string;
  compact?: boolean;
  previousUnpaid?: FeePayment[];
}

const Receipt = forwardRef<HTMLDivElement, ReceiptProps>(
  ({ 
    student, 
    payment, 
    institutionName = "MKS Educational Institute", 
    institutionAddress = "Lalitpur, Nepal", 
    institutionContact = "9841157918",
    receiptDate,
    compact = false,
    previousUnpaid = []
  }, ref) => {
    const formattedDate = receiptDate ? formatNepaliDate(receiptDate) : formatNepaliDate(new Date().toISOString());
    
    // Calculate base fee amount for the current month (without extra dues)
    const expectedFee = student.feeAmount;
    
    // Determine if this is a partial payment
    const isPartialPayment = payment.amount < expectedFee && !payment.isPending;
    
    // Calculate remaining due amount for this month if partial payment
    const remainingDueForMonth = isPartialPayment ? expectedFee - payment.amount : 0;
    
    // Get the extra due amount that may be included in the payment amount
    // This represents previous partial payments that are being collected with this payment
    let extraDueAmount = 0;
    
    if (!payment.isPending && payment.amount > expectedFee) {
      extraDueAmount = payment.amount - expectedFee;
    }
    
    // For pending bills, determine if extra due is already included in the amount
    let includedExtraDue = 0;
    if (payment.isPending && payment.amount > expectedFee) {
      includedExtraDue = payment.amount - expectedFee;
    }
    
    // Calculate previous unpaid total WITHOUT including any extra due that might have already been added
    // This is important to avoid double counting
    const previousUnpaidTotal = previousUnpaid.reduce((sum, p) => {
      // Only add the base fee amount, not any extra amounts that might have been included
      // This prevents double-counting of extra dues
      return sum + Math.min(p.amount, student.feeAmount);
    }, 0);
    
    // Calculate the actual total due including all sources correctly
    const totalDue = (payment.isPending ? expectedFee : 0) + 
                    remainingDueForMonth + 
                    previousUnpaidTotal + 
                    (payment.isPending && includedExtraDue > 0 ? includedExtraDue : 0);
    
    return (
      <div 
        ref={ref} 
        className={`bg-white ${compact ? 'p-2' : 'p-8'} max-w-full mx-auto shadow-sm border print:shadow-none print:border receipt-container ${compact ? 'compact-receipt' : ''}`}
      >
        {/* Receipt Header */}
        <div className={`text-center ${compact ? 'mb-1 pb-1' : 'mb-6 pb-4'} border-b`}>
          <h1 className={`${compact ? 'text-sm' : 'text-2xl'} font-bold text-gray-800`}>{institutionName}</h1>
          <p className="text-gray-600">{institutionAddress}</p>
          <p className="text-gray-600">Contact: {institutionContact}</p>
          <div className="flex items-center justify-center mt-1">
            <ReceiptIcon className={`${compact ? 'h-3 w-3' : 'h-5 w-5'} text-gray-700 mr-1`} />
            <h2 className={`${compact ? 'text-sm' : 'text-xl'} font-semibold`}>Fee Receipt</h2>
          </div>
        </div>
        
        {/* Receipt Details */}
        <div className={`grid grid-cols-2 gap-${compact ? '1' : '4'} ${compact ? 'mb-1 text-xs' : 'mb-6'}`}>
          <div>
            <p className={`${compact ? 'text-xs' : 'text-sm'} text-gray-600`}>Receipt No:</p>
            <p className="font-medium">{payment.id}</p>
          </div>
          <div className="text-right">
            <p className={`${compact ? 'text-xs' : 'text-sm'} text-gray-600`}>Date:</p>
            <p className="font-medium">{formattedDate}</p>
          </div>
          <div>
            <p className={`${compact ? 'text-xs' : 'text-sm'} text-gray-600`}>Student ID:</p>
            <p className="font-medium">{student.id}</p>
          </div>
          <div className="text-right">
            <p className={`${compact ? 'text-xs' : 'text-sm'} text-gray-600`}>Class/Grade:</p>
            <p className="font-medium">{student.grade}</p>
          </div>
        </div>
        
        {/* Student Details */}
        <div className={`${compact ? 'mb-1 p-1 text-xs' : 'mb-6 p-3'} bg-gray-50 rounded-md`}>
          <h3 className={`font-medium text-gray-800 ${compact ? 'mb-1' : 'mb-2'}`}>Student Information</h3>
          <p><span className="text-gray-600">Name:</span> {student.name}</p>
          {student.guardianName && (
            <p><span className="text-gray-600">Guardian:</span> {student.guardianName}</p>
          )}
          {!compact && student.contact && (
            <p><span className="text-gray-600">Contact:</span> {student.contact}</p>
          )}
        </div>
        
        {/* Payment Details */}
        <div className={compact ? 'mb-1' : 'mb-6'}>
          <h3 className={`font-medium text-gray-800 ${compact ? 'mb-1 text-xs' : 'mb-2'}`}>Payment Details</h3>
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="bg-gray-100">
                <th className="text-left p-1 border">Description</th>
                <th className="text-right p-1 border">Amount</th>
              </tr>
            </thead>
            <tbody>
              {/* Regular monthly fee */}
              <tr>
                <td className="p-1 border">
                  Fee for {payment.month} {payment.year}
                  {payment.isAdvance && " (Advance)"}
                  {payment.isPending && " (Pending)"}
                  {isPartialPayment && " (Partial Payment)"}
                </td>
                <td className="text-right p-1 border">Rs. {expectedFee.toFixed(2)}</td>
              </tr>
              
              {/* Show extra due amount separately if included in the payment */}
              {(extraDueAmount > 0 || includedExtraDue > 0) && (
                <tr>
                  <td className="p-1 border text-blue-700 font-medium">
                    Previous Extra Due Payment
                  </td>
                  <td className="text-right p-1 border text-blue-700 font-medium">
                    Rs. {(extraDueAmount || includedExtraDue).toFixed(2)}
                  </td>
                </tr>
              )}
              
              {/* Show remaining due for this month if partial payment */}
              {isPartialPayment && (
                <tr>
                  <td className="p-1 border text-red-700 font-medium">
                    Remaining due for {payment.month} {payment.year}
                  </td>
                  <td className="text-right p-1 border text-red-700 font-medium">
                    Rs. {remainingDueForMonth.toFixed(2)}
                  </td>
                </tr>
              )}
              
              {/* Display previous unpaid fees with better formatting */}
              {previousUnpaid.length > 0 && (
                <>
                  {previousUnpaid.map((unpaid, index) => {
                    // Only show the base fee amount for each unpaid entry to avoid double counting
                    const displayAmount = Math.min(unpaid.amount, student.feeAmount);
                    
                    return (
                      <tr key={unpaid.id || index}>
                        <td className="p-1 border text-amber-700 font-medium">
                          Previous unpaid: {unpaid.month} {unpaid.year}
                          {unpaid.isPending && " (Pending)"}
                        </td>
                        <td className="text-right p-1 border text-amber-700 font-medium">
                          Rs. {displayAmount.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </>
              )}
              
              {payment.notes && !compact && (
                <tr>
                  <td colSpan={2} className="p-1 border text-xs italic">
                    Note: {payment.notes}
                  </td>
                </tr>
              )}
              
              {/* Always show Total Due for clarity */}
              <tr className={`font-bold ${payment.isPending || isPartialPayment || previousUnpaid.length > 0 ? 'bg-red-50' : 'bg-green-50'}`}>
                <td className="p-1 border">Total Due</td>
                <td className={`text-right p-1 border ${payment.isPending || isPartialPayment || previousUnpaid.length > 0 ? 'text-red-700' : 'text-green-700'}`}>
                  Rs. {totalDue.toFixed(2)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        {!compact && (
          <div className="mt-8 pt-4 border-t flex justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-8">Student Signature</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600 mb-8">Authorized Signature</p>
            </div>
          </div>
        )}
        
        <div className={`text-center ${compact ? 'mt-1' : 'mt-6'} ${compact ? 'text-xs' : 'text-sm'} text-gray-500`}>
          <p>Thank you for your payment!</p>
          {payment.isPending ? (
            <p className="font-medium text-amber-600 text-xs">* This is a pending payment receipt.</p>
          ) : isPartialPayment ? (
            <p className="font-medium text-red-600 text-xs">* This is a partial payment receipt. Remaining due: Rs. {remainingDueForMonth.toFixed(2)}</p>
          ) : (
            <p className="font-medium">Computer generated receipt.</p>
          )}
          {previousUnpaid.length > 0 && (
            <p className="font-medium text-amber-600 text-xs">* Includes {previousUnpaid.length} previous unpaid fee(s) totaling Rs. {previousUnpaidTotal.toFixed(2)}.</p>
          )}
        </div>
      </div>
    );
  }
);

Receipt.displayName = "Receipt";
export default Receipt;
