
// import React, { useState, useEffect } from 'react';
// import { Button } from '@/components/ui/button';
// import { Label } from '@/components/ui/label';
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from '@/components/ui/select';
// import {
//   Dialog,
//   DialogContent,
//   DialogFooter,
//   DialogHeader,
//   DialogTitle,
//   DialogDescription,
// } from '@/components/ui/dialog';
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from '@/components/ui/table';
// import { Checkbox } from '@/components/ui/checkbox';
// import { toast } from 'sonner';
// import { Student, NepaliMonth, FeePayment } from '@/types';
// import { nepaliMonths, getCurrentNepaliMonth, getCurrentNepaliYear, isPreviousPeriod, calculateTotalPendingAmount, getUniquePendingPayments } from '@/lib/nepali-utils';
// import { Printer } from 'lucide-react';
// import { useNavigate } from 'react-router-dom';
// import { fetchFeePayments, saveFeePayment } from '@/utils/supabaseUtils';

// interface BulkReceiptGeneratorProps {
//   open: boolean;
//   onOpenChange: (open: boolean) => void;
//   students: Student[];
//   institutionName?: string;
// }

// const BulkReceiptGenerator: React.FC<BulkReceiptGeneratorProps> = ({ 
//   open, 
//   onOpenChange, 
//   students,
//   institutionName = "MKS Educational Institute"
// }) => {
//   const [selectedMonth, setSelectedMonth] = useState<NepaliMonth>(getCurrentNepaliMonth());
//   const [selectedYear, setSelectedYear] = useState<number>(getCurrentNepaliYear());
//   const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
//   const [unpaidStudents, setUnpaidStudents] = useState<Student[]>([]);
//   const [existingPayments, setExistingPayments] = useState<Record<string, FeePayment>>({});
//   const [allPayments, setAllPayments] = useState<FeePayment[]>([]);
//   const [previousUnpaidByStudent, setPreviousUnpaidByStudent] = useState<Record<string, FeePayment[]>>({});
//   const [remainingDueByStudent, setRemainingDueByStudent] = useState<Record<string, number>>({});
//   const navigate = useNavigate();
  
//   // Generate years for dropdown (current year and 2 previous years)
//   const currentYear = getCurrentNepaliYear();
//   const years = Array.from({ length: 3 }, (_, i) => currentYear - i);
  
//   // When month or year changes, filter for unpaid students
//   const handleMonthYearChange = async () => {
//     try {
//       // Get all payments from Supabase
//       const payments = await fetchFeePayments();
//       setAllPayments(payments);
      
//       // Track existing payments for the selected month/year
//       const existingMonthPayments: Record<string, FeePayment> = {};
//       const previousUnpaid: Record<string, FeePayment[]> = {};
//       const remainingDue: Record<string, number> = {};
      
//       // Find students who haven't paid for the selected month/year
//       const studentsWithoutPayment = students.filter(student => {
//         // Check if student already has a payment for this month/year
//         const existingPayment = payments.find(payment => 
//           payment.studentId === student.id && 
//           payment.month === selectedMonth && 
//           payment.year === selectedYear
//         );
        
//         // If payment exists, store it for reference
//         if (existingPayment) {
//           existingMonthPayments[student.id] = existingPayment;
//           // Don't include students who already have a payment for this month
//           return false;
//         }
        
//         // Find previous unpaid bills (only base fee) for this student
//         // These are the pending bills that should be included in Previous Unpaid
//         const studentPreviousUnpaid = payments.filter(payment => 
//           payment.studentId === student.id && 
//           payment.isPending && 
//           isPreviousPeriod(payment.month, payment.year, selectedMonth, selectedYear)
//         );
        
//         // Get only unique payments by month/year to avoid double counting
//         const uniquePreviousUnpaid = getUniquePendingPayments(studentPreviousUnpaid);
        
//         // Store previous unpaid payments by student
//         if (uniquePreviousUnpaid.length > 0) {
//           previousUnpaid[student.id] = uniquePreviousUnpaid;
//         }
        
//         // Track which months have bills that already include extra due amounts
//         // to avoid double-counting
//         const billsWithExtraDue = new Map();
        
//         // First identify all bills that already include extra dues
//         payments.forEach(bill => {
//           if (bill.studentId === student.id && bill.amount > student.feeAmount) {
//             const key = `${bill.month}-${bill.year}`;
//             billsWithExtraDue.set(key, bill.amount - student.feeAmount);
//           }
//         });
        
//         // Find partial payments that haven't been accounted for
//         const partialPayments = payments.filter(payment => {
//           // Only consider if:
//           // 1. It's for this student
//           // 2. It's not pending (was actually paid)
//           // 3. Amount is less than regular fee (partial payment)
//           // 4. It's from a previous period
//           // 5. The due amount hasn't already been included in another bill
//           if (payment.studentId === student.id && 
//               !payment.isPending && 
//               payment.amount < student.feeAmount &&
//               isPreviousPeriod(payment.month, payment.year, selectedMonth, selectedYear)) {
                
//             const key = `${payment.month}-${payment.year}`;
//             // Only include if this partial payment's month/year isn't already in a bill with extra due
//             return !billsWithExtraDue.has(key);
//           }
//           return false;
//         });
        
//         // Calculate total remaining due from partial payments
//         if (partialPayments.length > 0) {
//           let totalRemaining = 0;
//           partialPayments.forEach(payment => {
//             totalRemaining += (student.feeAmount - payment.amount);
//             console.log(`Adding ${student.feeAmount - payment.amount} from ${payment.month} ${payment.year} to remaining due`);
//           });
          
//           if (totalRemaining > 0) {
//             remainingDue[student.id] = totalRemaining;
//             console.log(`Total remaining due for ${student.name}: ${totalRemaining}`);
//           }
//         }
        
//         return student.active;
//       });
      
//       setExistingPayments(existingMonthPayments);
//       setPreviousUnpaidByStudent(previousUnpaid);
//       setRemainingDueByStudent(remainingDue);
//       setUnpaidStudents(studentsWithoutPayment);
//       setSelectedStudents(studentsWithoutPayment.map(s => s.id)); // Select all by default
//     } catch (error) {
//       console.error("Error fetching payments:", error);
//       toast.error("Failed to load payment data");
//     }
//   };
  
//   // Call this whenever dialog opens or month/year changes
//   React.useEffect(() => {
//     if (open) {
//       handleMonthYearChange();
//     }
//   }, [open, selectedMonth, selectedYear]);
  
//   const toggleSelectAll = () => {
//     if (selectedStudents.length === unpaidStudents.length) {
//       setSelectedStudents([]);
//     } else {
//       setSelectedStudents(unpaidStudents.map(s => s.id));
//     }
//   };
  
//   const toggleStudentSelection = (studentId: string) => {
//     setSelectedStudents(prev => 
//       prev.includes(studentId) 
//         ? prev.filter(id => id !== studentId) 
//         : [...prev, studentId]
//     );
//   };
  
//   // Calculate previous pending amount (just the basic fee amounts)
//   const getPreviousPendingAmount = (studentId: string): number => {
//     const previousPayments = previousUnpaidByStudent[studentId] || [];
//     // Only count the base fee amount for each payment to avoid double counting
//     return previousPayments.reduce((sum, p) => {
//       const student = students.find(s => s.id === studentId);
//       // Cap at the student's regular fee to prevent including extra due that might be in the payment
//       return sum + (student ? Math.min(p.amount, student.feeAmount) : p.amount);
//     }, 0);
//   };
  
//   // Get remaining due from partial payments
//   const getRemainingDueAmount = (studentId: string): number => {
//     return remainingDueByStudent[studentId] || 0;
//   };
  
//   // Get total amount including current fee, previous pending, and remaining due from partial payments
//   const getTotalAmount = (student: Student): number => {
//     const previousPending = getPreviousPendingAmount(student.id);
//     const remainingDue = getRemainingDueAmount(student.id);
//     return student.feeAmount + previousPending + remainingDue;
//   };
  
//   const handleGenerateReceipts = async () => {
//     if (selectedStudents.length === 0) {
//       toast.error("Please select at least one student");
//       return;
//     }
    
//     try {
//       // Generate pending payment objects for receipt generation
//       const pendingPayments: Array<{payment: FeePayment, student: Student, previousUnpaid: FeePayment[]}>  = await Promise.all(
//         selectedStudents.map(async (studentId) => {
//           const student = students.find(s => s.id === studentId);
//           if (!student) {
//             console.error(`Student with ID ${studentId} not found`);
//             return null;
//           }
          
//           // Get previous unpaid payments for this student - using unique filter to avoid duplicates
//           const previousUnpaid = previousUnpaidByStudent[studentId] || [];
//           // Calculate previous unpaid total using ONLY the base fee amount
//           const previousUnpaidTotal = previousUnpaid.reduce((sum, payment) => {
//             return sum + Math.min(payment.amount, student.feeAmount);
//           }, 0);
          
//           // Get remaining due from partial payments that haven't been accounted for
//           const remainingDueTotal = getRemainingDueAmount(studentId);
          
//           // Create a note about partial payments if any
//           let partialPaymentNote = '';
//           if (remainingDueTotal > 0) {
//             partialPaymentNote = ` (Includes Rs. ${remainingDueTotal} from previous partial payments)`;
//           }
          
//           // The current month's fee
//           const payment: FeePayment = {
//             id: `BULK-${selectedMonth}-${studentId}-${Date.now()}`, // Add timestamp for uniqueness
//             studentId,
//             // Set amount to include both the current fee and remaining due from partial payments
//             amount: student.feeAmount + remainingDueTotal,
//             month: selectedMonth,
//             year: selectedYear,
//             paidDate: "",
//             isAdvance: false,
//             isPending: true,
//             notes: `Generated as part of bulk bill from ${institutionName}` + 
//                   (previousUnpaidTotal > 0 ? ` (Previous unpaid total: Rs. ${previousUnpaidTotal})` : '') +
//                   partialPaymentNote
//           };
          
//           return {
//             payment,
//             student,
//             previousUnpaid
//           };
//         })
//       );
      
//       // Filter out null values
//       const validPayments = pendingPayments.filter(Boolean) as Array<{
//         payment: FeePayment, 
//         student: Student,
//         previousUnpaid: FeePayment[]
//       }>;
      
//       if (validPayments.length === 0) {
//         toast.error("Could not generate bills due to missing student data");
//         return;
//       }
      
//       // Store the pending payments in session storage for the receipt page
//       sessionStorage.setItem('bulkPendingPayments', JSON.stringify(validPayments));
      
//       // Save the payments to the database
//       for (const item of validPayments) {
//         try {
//           // Omit the id as it will be generated by the database
//           const { id, ...paymentData } = item.payment;
//           await saveFeePayment(paymentData);
//         } catch (error) {
//           console.error(`Error saving payment for student ${item.student.name}:`, error);
//         }
//       }
      
//       // Navigate to the bulk print page
//       toast.success(`Generated ${validPayments.length} bills for ${selectedMonth} ${selectedYear}`);
//       onOpenChange(false);
//       navigate('/print-receipt?bulk=true');
//     } catch (error) {
//       console.error("Error generating bills:", error);
//       toast.error("Failed to generate bills");
//     }
//   };
  
//   return (
//     <Dialog open={open} onOpenChange={onOpenChange}>
//       <DialogContent className="sm:max-w-[700px]">
//         <DialogHeader>
//           <DialogTitle>{institutionName} - Generate Bills in Bulk</DialogTitle>
//           <DialogDescription className="text-xs text-muted-foreground mt-2">
//             Generate bills with correct calculations of current and previous unpaid fees
//           </DialogDescription>
//         </DialogHeader>
        
//         <div className="space-y-6 py-4">
//           <div className="grid grid-cols-2 gap-4">
//             <div className="space-y-2">
//               <Label htmlFor="month">Month</Label>
//               <Select 
//                 value={selectedMonth} 
//                 onValueChange={(value: NepaliMonth) => setSelectedMonth(value)}
//               >
//                 <SelectTrigger>
//                   <SelectValue placeholder="Select month" />
//                 </SelectTrigger>
//                 <SelectContent>
//                   {nepaliMonths.map(month => (
//                     <SelectItem key={month} value={month}>{month}</SelectItem>
//                   ))}
//                 </SelectContent>
//               </Select>
//             </div>
            
//             <div className="space-y-2">
//               <Label htmlFor="year">Year</Label>
//               <Select 
//                 value={selectedYear.toString()}
//                 onValueChange={(value) => setSelectedYear(parseInt(value))}
//               >
//                 <SelectTrigger>
//                   <SelectValue placeholder="Select year" />
//                 </SelectTrigger>
//                 <SelectContent>
//                   {years.map(year => (
//                     <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
//                   ))}
//                 </SelectContent>
//               </Select>
//             </div>
//           </div>
          
//           <div className="border rounded-md">
//             <div className="p-4 bg-muted/50 flex items-center justify-between rounded-t-md">
//               <div className="flex items-center space-x-2">
//                 <Checkbox 
//                   id="selectAll" 
//                   checked={selectedStudents.length === unpaidStudents.length && unpaidStudents.length > 0}
//                   onCheckedChange={toggleSelectAll}
//                 />
//                 <Label htmlFor="selectAll">Select All Students</Label>
//               </div>
//               <span className="text-sm text-muted-foreground">
//                 {selectedStudents.length} of {unpaidStudents.length} selected
//               </span>
//             </div>
            
//             <Table>
//               <TableHeader>
//                 <TableRow>
//                   <TableHead className="w-[50px]">Select</TableHead>
//                   <TableHead>Student Name</TableHead>
//                   <TableHead>Grade</TableHead>
//                   <TableHead className="text-right">Fee Amount</TableHead>
//                   <TableHead className="text-right">Previous Unpaid</TableHead>
//                   <TableHead className="text-right">Remaining Due</TableHead>
//                   <TableHead className="text-right">Total Amount</TableHead>
//                 </TableRow>
//               </TableHeader>
//               <TableBody>
//                 {unpaidStudents.length > 0 ? (
//                   unpaidStudents.map(student => {
//                     const previousPendingAmount = getPreviousPendingAmount(student.id);
//                     const remainingDueAmount = getRemainingDueAmount(student.id);
//                     const totalAmount = student.feeAmount + previousPendingAmount + remainingDueAmount;
                    
//                     return (
//                       <TableRow key={student.id}>
//                         <TableCell>
//                           <Checkbox 
//                             checked={selectedStudents.includes(student.id)}
//                             onCheckedChange={() => toggleStudentSelection(student.id)}
//                           />
//                         </TableCell>
//                         <TableCell>{student.name}</TableCell>
//                         <TableCell>{student.grade}</TableCell>
//                         <TableCell className="text-right">Rs. {student.feeAmount}</TableCell>
//                         <TableCell className={`text-right ${previousPendingAmount > 0 ? 'text-amber-700 font-medium' : ''}`}>
//                           {previousPendingAmount > 0 ? `Rs. ${previousPendingAmount}` : '-'}
//                         </TableCell>
//                         <TableCell className={`text-right ${remainingDueAmount > 0 ? 'text-red-700 font-medium' : ''}`}>
//                           {remainingDueAmount > 0 ? `Rs. ${remainingDueAmount}` : '-'}
//                         </TableCell>
//                         <TableCell className="text-right font-medium">
//                           Rs. {totalAmount}
//                         </TableCell>
//                       </TableRow>
//                     );
//                   })
//                 ) : (
//                   <TableRow>
//                     <TableCell colSpan={7} className="text-center py-6">
//                       All students have paid for {selectedMonth} {selectedYear}.
//                     </TableCell>
//                   </TableRow>
//                 )}
//               </TableBody>
//             </Table>
//           </div>
          
//           {Object.keys(existingPayments).length > 0 && (
//             <div className="p-4 bg-amber-50 border border-amber-200 rounded-md">
//               <h3 className="font-medium text-amber-700 mb-2">Already Generated Bills</h3>
//               <p className="text-sm text-amber-600">
//                 {Object.keys(existingPayments).length} student(s) already have bills generated for {selectedMonth} {selectedYear}.
//                 These students are not shown in the selection list.
//               </p>
//               <Button 
//                 variant="outline" 
//                 size="sm" 
//                 className="mt-2 text-amber-700 border-amber-300 hover:bg-amber-100"
//                 onClick={() => {
//                   const existingPaymentsList = Object.values(existingPayments);
//                   sessionStorage.setItem('existingPayments', JSON.stringify(existingPaymentsList));
//                   navigate('/print-receipt?bulk=true&existing=true');
//                   onOpenChange(false);
//                 }}
//               >
//                 <Printer className="h-4 w-4 mr-1" /> 
//                 View Existing Bills
//               </Button>
//             </div>
//           )}
//         </div>
        
//         <DialogFooter>
//           <Button variant="outline" onClick={() => onOpenChange(false)}>
//             Cancel
//           </Button>
//           <Button 
//             onClick={handleGenerateReceipts}
//             disabled={selectedStudents.length === 0}
//           >
//             <Printer className="mr-2 h-4 w-4" />
//             Generate {selectedStudents.length} Bill{selectedStudents.length !== 1 ? 's' : ''}
//           </Button>
//         </DialogFooter>
//       </DialogContent>
//     </Dialog>
//   );
// };

// export default BulkReceiptGenerator;




import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Student, NepaliMonth, FeePayment } from '@/types';
import { nepaliMonths, getCurrentNepaliMonth, getCurrentNepaliYear, isPreviousPeriod, calculateTotalPendingAmount, getUniquePendingPayments } from '@/lib/nepali-utils';
import { Printer } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { fetchFeePayments, saveFeePayment } from '@/utils/supabaseUtils';

interface BulkReceiptGeneratorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  students: Student[];
  institutionName?: string;
}

const BulkReceiptGenerator: React.FC<BulkReceiptGeneratorProps> = ({ 
  open, 
  onOpenChange, 
  students,
  institutionName = "MKS Educational Institute"
}) => {
  const [selectedMonth, setSelectedMonth] = useState<NepaliMonth>(getCurrentNepaliMonth());
  const [selectedYear, setSelectedYear] = useState<number>(getCurrentNepaliYear());
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [unpaidStudents, setUnpaidStudents] = useState<Student[]>([]);
  const [existingPayments, setExistingPayments] = useState<Record<string, FeePayment>>({});
  const [allPayments, setAllPayments] = useState<FeePayment[]>([]);
  const [previousUnpaidByStudent, setPreviousUnpaidByStudent] = useState<Record<string, FeePayment[]>>({});
  const navigate = useNavigate();
  
  // Generate years for dropdown (current year and 2 previous years)
  const currentYear = getCurrentNepaliYear();
  const years = Array.from({ length: 3 }, (_, i) => currentYear - i);
  
  // When month or year changes, filter for unpaid students
  const handleMonthYearChange = async () => {
    try {
      // Get all payments from Supabase
      const payments = await fetchFeePayments();
      setAllPayments(payments);
      
      // Track existing payments for the selected month/year
      const existingMonthPayments: Record<string, FeePayment> = {};
      const previousUnpaid: Record<string, FeePayment[]> = {};
      
      // Find students who haven't paid for the selected month and year
      const studentsWithoutPayment = students.filter(student => {
        // Check if student already has a payment for this month/year
        const existingPayment = payments.find(payment => 
          payment.studentId === student.id && 
          payment.month === selectedMonth && 
          payment.year === selectedYear
        );
        
        // If payment exists, store it for reference
        if (existingPayment) {
          existingMonthPayments[student.id] = existingPayment;
          // Don't include students who already have a payment for this month
          return false;
        }
        
        // Find previous unpaid payments for this student
        const studentPreviousUnpaid = payments.filter(payment => 
          payment.studentId === student.id && 
          payment.isPending && 
          isPreviousPeriod(payment.month, payment.year, selectedMonth, selectedYear)
        );
        
        // Get only unique payments by month/year to avoid double counting
        const uniquePreviousUnpaid = getUniquePendingPayments(studentPreviousUnpaid);
        
        // Store previous unpaid payments by student
        if (uniquePreviousUnpaid.length > 0) {
          previousUnpaid[student.id] = uniquePreviousUnpaid;
        }
        
        return student.active;
      });
      
      setExistingPayments(existingMonthPayments);
      setPreviousUnpaidByStudent(previousUnpaid);
      setUnpaidStudents(studentsWithoutPayment);
      setSelectedStudents(studentsWithoutPayment.map(s => s.id)); // Select all by default
    } catch (error) {
      console.error("Error fetching payments:", error);
      toast.error("Failed to load payment data");
    }
  };
  
  // Call this whenever dialog opens or month/year changes
  React.useEffect(() => {
    if (open) {
      handleMonthYearChange();
    }
  }, [open, selectedMonth, selectedYear]);
  
  const toggleSelectAll = () => {
    if (selectedStudents.length === unpaidStudents.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(unpaidStudents.map(s => s.id));
    }
  };
  
  const toggleStudentSelection = (studentId: string) => {
    setSelectedStudents(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId) 
        : [...prev, studentId]
    );
  };
  
  // Calculate total pending amount for a student
  const getPreviousPendingAmount = (studentId: string): number => {
    const previousPayments = previousUnpaidByStudent[studentId] || [];
    return calculateTotalPendingAmount(previousPayments);
  };
  
  // Get total amount including current fee and previous pending
  const getTotalAmount = (student: Student): number => {
    const previousPending = getPreviousPendingAmount(student.id);
    return student.feeAmount + previousPending;
  };
  
  const handleGenerateReceipts = async () => {
    if (selectedStudents.length === 0) {
      toast.error("Please select at least one student");
      return;
    }
    
    try {
      // Generate pending payment objects for receipt generation
      const pendingPayments: Array<{payment: FeePayment, student: Student, previousUnpaid: FeePayment[]}> = await Promise.all(
        selectedStudents.map(async (studentId) => {
          const student = students.find(s => s.id === studentId);
          if (!student) {
            console.error(`Student with ID ${studentId} not found`);
            return null;
          }
          
          // Get previous unpaid payments for this student - using unique filter to avoid duplicates
          const previousUnpaid = previousUnpaidByStudent[studentId] || [];
          const previousUnpaidTotal = calculateTotalPendingAmount(previousUnpaid);
          
          // The current month's fee - FIX: Now only include student's normal fee amount here
          // and track previous unpaid separately
          const payment: FeePayment = {
            id: `BULK-${selectedMonth}-${studentId}-${Date.now()}`, // Add timestamp for uniqueness
            studentId,
            // FIX: We're setting the amount to just the current fee, not adding previous unpaid
            amount: student.feeAmount,
            month: selectedMonth,
            year: selectedYear,
            paidDate: "",
            isAdvance: false,
            isPending: true,
            notes: `Generated as part of bulk bill from ${institutionName}` + 
                  (previousUnpaidTotal > 0 ? ` (Previous unpaid total: Rs. ${previousUnpaidTotal})` : '')
          };
          
          return {
            payment,
            student,
            previousUnpaid
          };
        })
      );
      
      // Filter out null values
      const validPayments = pendingPayments.filter(Boolean) as Array<{
        payment: FeePayment, 
        student: Student,
        previousUnpaid: FeePayment[]
      }>;
      
      if (validPayments.length === 0) {
        toast.error("Could not generate bills due to missing student data");
        return;
      }
      
      // Store the pending payments in session storage for the receipt page
      sessionStorage.setItem('bulkPendingPayments', JSON.stringify(validPayments));
      
      // Save the payments to the database
      for (const item of validPayments) {
        try {
          // Omit the id as it will be generated by the database
          const { id, ...paymentData } = item.payment;
          await saveFeePayment(paymentData);
        } catch (error) {
          console.error(`Error saving payment for student ${item.student.name}:`, error);
        }
      }
      
      // Navigate to the bulk print page
      toast.success(`Generated ${validPayments.length} bills for ${selectedMonth} ${selectedYear}`);
      onOpenChange(false);
      navigate('/print-receipt?bulk=true');
    } catch (error) {
      console.error("Error generating bills:", error);
      toast.error("Failed to generate bills");
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{institutionName} - Generate Bills in Bulk</DialogTitle>
          <DialogDescription>Select students to generate bills for the chosen month and year</DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-2 flex-1 overflow-auto">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="month">Month</Label>
              <Select 
                value={selectedMonth} 
                onValueChange={(value: NepaliMonth) => setSelectedMonth(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select month" />
                </SelectTrigger>
                <SelectContent>
                  {nepaliMonths.map(month => (
                    <SelectItem key={month} value={month}>{month}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="year">Year</Label>
              <Select 
                value={selectedYear.toString()}
                onValueChange={(value) => setSelectedYear(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  {years.map(year => (
                    <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="border rounded-md">
            <div className="p-4 bg-muted/50 flex items-center justify-between rounded-t-md">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="selectAll" 
                  checked={selectedStudents.length === unpaidStudents.length && unpaidStudents.length > 0}
                  onCheckedChange={toggleSelectAll}
                />
                <Label htmlFor="selectAll">Select All Students</Label>
              </div>
              <span className="text-sm text-muted-foreground">
                {selectedStudents.length} of {unpaidStudents.length} selected
              </span>
            </div>
            
            <ScrollArea className="h-[250px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">Select</TableHead>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead className="text-right">Fee Amount</TableHead>
                    <TableHead className="text-right">Previous Unpaid</TableHead>
                    <TableHead className="text-right">Total Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {unpaidStudents.length > 0 ? (
                    unpaidStudents.map(student => {
                      const previousPendingAmount = getPreviousPendingAmount(student.id);
                      const totalAmount = student.feeAmount + previousPendingAmount;
                      
                      return (
                        <TableRow key={student.id}>
                          <TableCell>
                            <Checkbox 
                              checked={selectedStudents.includes(student.id)}
                              onCheckedChange={() => toggleStudentSelection(student.id)}
                            />
                          </TableCell>
                          <TableCell>{student.name}</TableCell>
                          <TableCell>{student.grade}</TableCell>
                          <TableCell className="text-right">Rs. {student.feeAmount}</TableCell>
                          <TableCell className={`text-right ${previousPendingAmount > 0 ? 'text-amber-700 font-medium' : ''}`}>
                            {previousPendingAmount > 0 ? `Rs. ${previousPendingAmount}` : '-'}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            Rs. {totalAmount}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-6">
                        All students have paid for {selectedMonth} {selectedYear}.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>
          
          {/* Already Generated Bills section - more compact now */}
          {Object.keys(existingPayments).length > 0 && (
            <div className="border border-amber-200 rounded-md bg-amber-50 p-3">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium text-amber-700 mb-1">Already Generated Bills</h3>
                  <p className="text-xs text-amber-600">
                    {Object.keys(existingPayments).length} student(s) already have bills for {selectedMonth} {selectedYear}
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-amber-700 border-amber-300 hover:bg-amber-100"
                  onClick={() => {
                    const existingPaymentsList = Object.values(existingPayments);
                    sessionStorage.setItem('existingPayments', JSON.stringify(existingPaymentsList));
                    navigate('/print-receipt?bulk=true&existing=true');
                    onOpenChange(false);
                  }}
                >
                  <Printer className="h-4 w-4 mr-1" /> 
                  View Existing Bills
                </Button>
              </div>
            </div>
          )}
        </div>
        
        <DialogFooter className="pt-3 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleGenerateReceipts}
            disabled={selectedStudents.length === 0}
          >
            <Printer className="mr-2 h-4 w-4" />
            Generate {selectedStudents.length} Bill{selectedStudents.length !== 1 ? 's' : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BulkReceiptGenerator;