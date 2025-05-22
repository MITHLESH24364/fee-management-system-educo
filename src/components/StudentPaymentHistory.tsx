
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Student, FeePayment } from '@/types';
import { formatNepaliDate, calculateTotalPendingAmount, getUniquePendingPayments } from '@/lib/nepali-utils';
import { supabase } from '@/integrations/supabase/client';

interface StudentPaymentHistoryProps {
  student: Student;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const StudentPaymentHistory: React.FC<StudentPaymentHistoryProps> = ({ 
  student, 
  open, 
  onOpenChange 
}) => {
  const [payments, setPayments] = useState<FeePayment[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [uniquePendingPayments, setUniquePendingPayments] = useState<FeePayment[]>([]);

  useEffect(() => {
    if (open && student?.id) {
      fetchStudentPayments(student.id);
    }
  }, [open, student]);

  const fetchStudentPayments = async (studentId: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('fee_payments')
        .select('*')
        .eq('student_id', studentId)
        .order('year', { ascending: false })
        .order('month');

      if (error) {
        console.error('Error fetching student payments:', error);
        throw error;
      }
      
      // Transform the data to match our application's type structure
      const formattedPayments: FeePayment[] = data.map(payment => ({
        id: payment.id,
        studentId: payment.student_id,
        amount: payment.amount,
        month: payment.month as FeePayment['month'], // Cast to the correct type
        year: payment.year,
        paidDate: payment.paid_date,
        isAdvance: payment.is_advance || false,
        isPending: payment.is_pending || false,
        notes: payment.notes || ''
      }));
      
      setPayments(formattedPayments);
      
      // Filter to get unique pending payments to avoid double counting
      const pendingPayments = formattedPayments.filter(p => p.isPending);
      const uniquePending = getUniquePendingPayments(pendingPayments);
      setUniquePendingPayments(uniquePending);
      
    } catch (error) {
      console.error('Error:', error);
      setPayments([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate total paid, pending, and advance amounts
  const totalPaid = payments
    .filter(p => !p.isPending)
    .reduce((sum, payment) => sum + payment.amount, 0);

  // Use the unique pending payments for accurate pending amount calculation
  const totalPending = calculateTotalPendingAmount(uniquePendingPayments);

  // Calculate total due (includes partial payments)
  const totalDue = payments.reduce((sum, payment) => {
    if (!payment.isPending) {
      // For partial payments, add the difference to the sum
      const regularFee = student.feeAmount;
      const remainingDue = payment.amount < regularFee ? regularFee - payment.amount : 0;
      return sum + remainingDue;
    } else {
      // For pending payments, add the full amount
      return sum + student.feeAmount;
    }
  }, 0);

  const totalAdvance = payments
    .filter(p => p.isAdvance)
    .reduce((sum, payment) => {
      const advanceAmount = payment.amount > student.feeAmount ? payment.amount - student.feeAmount : 0;
      return sum + advanceAmount;
    }, 0);

  // Helper function to determine payment status
  const getPaymentStatus = (payment: FeePayment): string => {
    if (payment.isPending) return 'Pending';
    if (payment.amount < student.feeAmount) return 'Partial';
    return 'Paid';
  };

  // Helper function to calculate remaining due
  const getRemainingDue = (payment: FeePayment): number => {
    if (payment.isPending) return student.feeAmount;
    if (payment.amount < student.feeAmount) return student.feeAmount - payment.amount;
    return 0;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] flex flex-col">
        <DialogHeader className="sticky top-0 bg-background z-10">
          <DialogTitle>Payment History for {student?.name}</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : (
          <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
            {/* Summary */}
            <div className="grid grid-cols-4 gap-3">
              <div className="bg-green-50 rounded p-3">
                <p className="text-sm font-medium text-gray-600">Total Paid</p>
                <p className="text-xl font-bold text-green-700">Rs. {totalPaid}</p>
              </div>
              <div className="bg-amber-50 rounded p-3">
                <p className="text-sm font-medium text-gray-600">Total Pending</p>
                <p className="text-xl font-bold text-amber-700">Rs. {totalPending}</p>
              </div>
              <div className="bg-red-50 rounded p-3">
                <p className="text-sm font-medium text-gray-600">Total Due</p>
                <p className="text-xl font-bold text-red-700">Rs. {totalDue}</p>
              </div>
              <div className="bg-blue-50 rounded p-3">
                <p className="text-sm font-medium text-gray-600">Total Advance</p>
                <p className="text-xl font-bold text-blue-700">Rs. {totalAdvance}</p>
              </div>
            </div>

            {/* Payments Table with ScrollArea */}
            <div className="border rounded flex-1 overflow-hidden">
              <ScrollArea className="h-[400px] w-full">
                <Table>
                  <TableHeader className="sticky top-0 bg-background z-10">
                    <TableRow>
                      <TableHead>Month</TableHead>
                      <TableHead>Year</TableHead>
                      <TableHead>Regular Fee</TableHead>
                      <TableHead>Paid Amount</TableHead>
                      <TableHead>Due Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Paid Date</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.length > 0 ? (
                      payments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell>{payment.month}</TableCell>
                          <TableCell>{payment.year}</TableCell>
                          <TableCell>Rs. {student.feeAmount}</TableCell>
                          <TableCell>
                            {payment.isPending ? (
                              <span className="text-gray-500">-</span>
                            ) : (
                              `Rs. ${payment.amount}`
                            )}
                          </TableCell>
                          <TableCell>
                            <span className={getRemainingDue(payment) > 0 ? 'text-red-600 font-medium' : 'text-gray-500'}>
                              {getRemainingDue(payment) > 0 ? `Rs. ${getRemainingDue(payment)}` : '-'}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                getPaymentStatus(payment) === 'Pending' 
                                  ? 'bg-amber-100 text-amber-700' 
                                  : getPaymentStatus(payment) === 'Partial'
                                    ? 'bg-orange-100 text-orange-700'
                                    : 'bg-green-100 text-green-700'
                              }`}>
                                {getPaymentStatus(payment)}
                              </span>
                              {payment.isAdvance && (
                                <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700">
                                  Advance
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {payment.isPending ? '-' : formatNepaliDate(payment.paidDate)}
                          </TableCell>
                          <TableCell className="text-xs">{payment.notes || '-'}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-4">
                          No payment records found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default StudentPaymentHistory;
