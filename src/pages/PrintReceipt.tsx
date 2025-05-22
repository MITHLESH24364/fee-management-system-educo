
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Printer, ArrowLeft } from 'lucide-react';
import Receipt from '@/components/Receipt';
import { fetchStudents, fetchFeePayments } from '@/utils/supabaseUtils';
import { Student, FeePayment } from '@/types';
import { toast } from 'sonner';
import { isPreviousPeriod, getUniquePendingPayments } from '@/lib/nepali-utils';
import { ScrollArea } from '@/components/ui/scroll-area';

const PrintReceipt = () => {
  const [searchParams] = useSearchParams();
  const paymentId = searchParams.get('paymentId');
  const isBulk = searchParams.get('bulk') === 'true';
  const isExisting = searchParams.get('existing') === 'true';
  const [payment, setPayment] = useState<FeePayment | null>(null);
  const [student, setStudent] = useState<Student | null>(null);
  const [bulkPayments, setBulkPayments] = useState<Array<{payment: FeePayment, student: Student, previousUnpaid: FeePayment[]}>>([]); 
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isPrintMode, setIsPrintMode] = useState<boolean>(false);
  const [previousUnpaid, setPreviousUnpaid] = useState<FeePayment[]>([]);
  const receiptRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  
  useEffect(() => {
    const loadData = async () => {
      if (isBulk) {
        // Handle bulk printing
        if (isExisting) {
          // Display existing bills
          const existingPaymentsStr = sessionStorage.getItem('existingPayments');
          if (!existingPaymentsStr) {
            toast.error('No existing bills found');
            navigate('/students');
            return;
          }
          
          try {
            const payments: FeePayment[] = JSON.parse(existingPaymentsStr);
            const students = await fetchStudents();
            const allPayments = await fetchFeePayments();
            
            const paymentsWithStudents = await Promise.all(payments.map(async payment => {
              const studentFound = students.find(s => s.id === payment.studentId);
              if (!studentFound) return null;
              
              // Find previous unpaid payments
              const previousUnpaidPayments = allPayments.filter(p => 
                p.studentId === payment.studentId && 
                p.isPending && 
                isPreviousPeriod(p.month, p.year, payment.month, payment.year)
              );
              
              // Filter to unique payments by month/year
              const uniquePreviousUnpaid = getUniquePendingPayments(previousUnpaidPayments);
              
              return {
                payment,
                student: studentFound,
                previousUnpaid: uniquePreviousUnpaid
              };
            }));
            
            // Filter out null values
            const validPayments = paymentsWithStudents.filter(Boolean) as Array<{
              payment: FeePayment, 
              student: Student,
              previousUnpaid: FeePayment[]
            }>;
            
            setBulkPayments(validPayments);
            setIsLoading(false);
          } catch (error) {
            console.error('Error loading existing payments:', error);
            toast.error('Error loading existing bills');
            navigate('/students');
          }
        } else {
          // Handle new bulk bill generation
          const bulkPendingPaymentsStr = sessionStorage.getItem('bulkPendingPayments');
          if (!bulkPendingPaymentsStr) {
            toast.error('No bulk payments found');
            navigate('/students');
            return;
          }
          
          try {
            // Check if the data is already in the expected format
            const parsedData = JSON.parse(bulkPendingPaymentsStr);
            
            if (Array.isArray(parsedData) && parsedData.length > 0 && 'payment' in parsedData[0]) {
              // Data is already in the correct format with payment, student, and previousUnpaid
              // Ensure that previousUnpaid is filtered for unique entries
              const dataWithUniqueUnpaid = parsedData.map(item => ({
                ...item,
                previousUnpaid: getUniquePendingPayments(item.previousUnpaid || [])
              }));
              
              setBulkPayments(dataWithUniqueUnpaid);
            } else {
              // Legacy format - convert to new format
              const pendingPayments: FeePayment[] = parsedData;
              // Fetch all students at once for better performance
              const students = await fetchStudents();
              const allPayments = await fetchFeePayments();
              
              const paymentsWithStudents = await Promise.all(pendingPayments.map(async payment => {
                const studentFound = students.find(s => s.id === payment.studentId);
                
                if (!studentFound) return null;
                
                // Enhanced: Using the improved function to find previous unpaid payments
                const previousUnpaidPayments = allPayments.filter(p => 
                  p.studentId === payment.studentId && 
                  p.isPending && 
                  isPreviousPeriod(p.month, p.year, payment.month, payment.year)
                );
                
                // Filter for unique month/year combinations
                const uniquePreviousUnpaid = getUniquePendingPayments(previousUnpaidPayments);
                
                return {
                  payment,
                  student: studentFound,
                  previousUnpaid: uniquePreviousUnpaid
                };
              }));
              
              // Filter out null values (students not found)
              const validPayments = paymentsWithStudents.filter(Boolean) as Array<{
                payment: FeePayment, 
                student: Student,
                previousUnpaid: FeePayment[]
              }>;
              
              if (validPayments.length === 0) {
                toast.error('Could not find matching students for the payments');
                navigate('/students');
                return;
              }
              
              setBulkPayments(validPayments);
            }
            
            setIsLoading(false);
          } catch (error) {
            console.error('Error loading bulk payments:', error);
            toast.error('Error loading bulk payments');
            navigate('/students');
          }
        }
      } else {
        // Handle single receipt printing
        if (!paymentId) {
          toast.error('No payment ID provided');
          navigate('/fee-collection');
          return;
        }
        
        try {
          const payments = await fetchFeePayments();
          const paymentData = payments.find(p => p.id === paymentId);
          
          if (!paymentData) {
            toast.error('Payment not found');
            navigate('/fee-collection');
            return;
          }
          
          setPayment(paymentData);
          
          const students = await fetchStudents();
          const studentData = students.find(s => s.id === paymentData.studentId);
          
          if (!studentData) {
            toast.error('Student not found for this payment');
            navigate('/fee-collection');
            return;
          }

          // Find previous unpaid payments using isPreviousPeriod function
          const previousUnpaidPayments = payments.filter(p => 
            p.studentId === paymentData.studentId && 
            p.isPending && 
            isPreviousPeriod(p.month, p.year, paymentData.month, paymentData.year)
          );
          
          // Filter for unique month/year combinations
          const uniquePreviousUnpaid = getUniquePendingPayments(previousUnpaidPayments);
          
          setStudent(studentData);
          setPreviousUnpaid(uniquePreviousUnpaid);
          setIsLoading(false);
        } catch (error) {
          console.error('Error loading payment data:', error);
          toast.error('Error loading receipt data');
          navigate('/fee-collection');
        }
      }
    };
    
    loadData();
  }, [paymentId, navigate, isBulk, isExisting]);
  
  const handlePrint = () => {
    setIsPrintMode(true);
    setTimeout(() => {
      window.print();
      setIsPrintMode(false);
    }, 100);
  };
  
  const handleGoBack = () => {
    if (isBulk) {
      navigate('/students');
    } else {
      navigate('/fee-collection');
    }
  };
  
  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <p>Loading receipt...</p>
      </div>
    );
  }
  
  return (
    <div className={`print-container ${isPrintMode ? 'print-mode' : ''}`}>
      <div className="flex justify-between items-center mb-4 print-hidden">
        <Button variant="outline" onClick={handleGoBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button onClick={handlePrint}>
          <Printer className="mr-2 h-4 w-4" />
          Print {isBulk ? "All Bills" : "Receipt"}
        </Button>
      </div>
      
      <div className="bills-only">
        {isBulk ? (
          <div className={`bills-container ${isPrintMode ? 'print-grid' : ''}`}>
            {/* Add ScrollArea for bulk receipts when not in print mode */}
            {!isPrintMode ? (
              <ScrollArea className="h-[calc(100vh-150px)] w-full">
                <div className="space-y-4 p-2">
                  {bulkPayments.map((item) => (
                    <div key={item.payment.id} className="bill-item">
                      <Receipt 
                        student={item.student} 
                        payment={item.payment} 
                        receiptDate={new Date().toISOString()} // Always use current date
                        compact={true}
                        previousUnpaid={item.previousUnpaid}
                      />
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              // In print mode, render all receipts normally
              bulkPayments.map((item) => (
                <div key={item.payment.id} className="bill-item">
                  <Receipt 
                    student={item.student} 
                    payment={item.payment} 
                    receiptDate={new Date().toISOString()} // Always use current date
                    compact={true}
                    previousUnpaid={item.previousUnpaid}
                  />
                </div>
              ))
            )}
          </div>
        ) : (
          payment && student && (
            <Receipt 
              ref={receiptRef} 
              student={student} 
              payment={payment} 
              receiptDate={new Date().toISOString()} // Always use current date
              previousUnpaid={previousUnpaid}
            />
          )
        )}
      </div>
    </div>
  );
};

export default PrintReceipt;
