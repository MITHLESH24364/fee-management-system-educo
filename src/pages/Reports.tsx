
import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { DollarSign, Download, ArrowUp, ArrowDown } from 'lucide-react';
import { Student, FeePayment, NepaliMonth } from '@/types';
import { nepaliMonths, getCurrentNepaliMonth, getCurrentNepaliYear } from '@/lib/nepali-utils';
import { toast } from 'sonner';
import { fetchStudents, fetchFeePayments, generateMonthlyReport } from '@/utils/supabaseUtils';

const Reports = () => {
  const [payments, setPayments] = useState<FeePayment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<NepaliMonth>(getCurrentNepaliMonth());
  const [selectedYear, setSelectedYear] = useState<number>(getCurrentNepaliYear());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // Load data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [loadedStudents, loadedPayments] = await Promise.all([
        fetchStudents(),
        fetchFeePayments()
      ]);
      setStudents(loadedStudents);
      setPayments(loadedPayments);
    } catch (error) {
      console.error("Error loading report data:", error);
      toast.error("Failed to load report data");
    } finally {
      setIsLoading(false);
    }
  };

  // Generate years for dropdown
  const currentYear = getCurrentNepaliYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);
  
  // Filter payments by selected month and year
  const filteredPayments = payments.filter(payment => 
    payment.month === selectedMonth && payment.year === selectedYear
  );
  
  // Calculate report statistics
  const totalCollection = filteredPayments
    .filter(p => !p.isPending)
    .reduce((sum, p) => sum + p.amount, 0);
  
  const totalPending = filteredPayments
    .filter(p => p.isPending)
    .reduce((sum, p) => {
      const student = students.find(s => s.id === p.studentId);
      return sum + (student?.feeAmount || 0);
    }, 0);
  
  // Calculate total due (including partial payments)
  const totalDue = filteredPayments.reduce((sum, p) => {
    const student = students.find(s => s.id === p.studentId);
    if (!student) return sum;
    
    if (p.isPending) {
      // Pending payment means full amount is due
      return sum + student.feeAmount;
    } else {
      // For paid but partial payments, add the difference
      return sum + (p.amount < student.feeAmount ? student.feeAmount - p.amount : 0);
    }
  }, 0);
  
  const totalAdvance = filteredPayments
    .filter(p => p.isAdvance)
    .reduce((sum, p) => {
      const student = students.find(s => s.id === p.studentId);
      const regularFee = student?.feeAmount || 0;
      const advanceAmount = p.amount > regularFee ? p.amount - regularFee : 0;
      return sum + advanceAmount;
    }, 0);
  
  const studentsPaid = new Set(
    filteredPayments
      .filter(p => !p.isPending && p.amount >= (students.find(s => s.id === p.studentId)?.feeAmount || 0))
      .map(p => p.studentId)
  ).size;
  
  const studentsPartial = new Set(
    filteredPayments
      .filter(p => !p.isPending && p.amount < (students.find(s => s.id === p.studentId)?.feeAmount || 0))
      .map(p => p.studentId)
  ).size;
  
  const studentsPending = new Set(
    filteredPayments
      .filter(p => p.isPending)
      .map(p => p.studentId)
  ).size;
  
  const activeStudents = students.filter(s => s.active).length;
  
  // Helper function to get payment status
  const getPaymentStatus = (student: Student, payment?: FeePayment): string => {
    if (!payment) return 'Not Recorded';
    if (payment.isPending) return 'Pending';
    return payment.amount < student.feeAmount ? 'Partial' : 'Paid';
  };
  
  // Helper function to get due amount
  const getDueAmount = (student: Student, payment?: FeePayment): number => {
    if (!payment) return student.feeAmount;
    if (payment.isPending) return student.feeAmount;
    return payment.amount < student.feeAmount ? student.feeAmount - payment.amount : 0;
  };
  
  // Prepare data for student payment status table
  const studentsWithPaymentStatus = students
    .filter(s => s.active)
    .map(student => {
      const payment = filteredPayments.find(p => p.studentId === student.id);
      return {
        ...student,
        paymentStatus: getPaymentStatus(student, payment),
        paymentAmount: payment?.amount || 0,
        dueAmount: getDueAmount(student, payment),
        isPending: payment?.isPending || false,
        isAdvance: payment?.isAdvance || false,
        notes: payment?.notes || '',
      };
    });

  const handleExportReport = async () => {
    try {
      toast.info("Generating report...");
      
      // Generate or update the monthly report in the database
      await generateMonthlyReport(selectedMonth, selectedYear);
      
      setTimeout(() => {
        toast.success("Report exported and saved successfully!");
      }, 1500);
    } catch (error) {
      console.error("Error exporting report:", error);
      toast.error("Failed to export report");
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Monthly Reports</h1>
        <div className="flex items-center gap-2">
          <Select 
            value={selectedMonth} 
            onValueChange={(value: NepaliMonth) => setSelectedMonth(value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select month" />
            </SelectTrigger>
            <SelectContent>
              {nepaliMonths.map(month => (
                <SelectItem key={month} value={month}>{month}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select 
            value={selectedYear.toString()}
            onValueChange={(value) => setSelectedYear(parseInt(value))}
          >
            <SelectTrigger className="w-[120px]">
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
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="bg-green-50">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Collection</p>
                <p className="text-2xl font-bold mt-1">Rs. {totalCollection}</p>
                <p className="text-xs text-gray-500 mt-1">{studentsPaid} students paid fully</p>
              </div>
              <div className="p-2 rounded-full bg-green-100 text-green-600">
                <DollarSign className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-orange-50">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-600">Partial Payments</p>
                <p className="text-2xl font-bold mt-1">{studentsPartial}</p>
                <p className="text-xs text-gray-500 mt-1">students paid partially</p>
              </div>
              <div className="p-2 rounded-full bg-orange-100 text-orange-600">
                <ArrowDown className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-amber-50">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Payments</p>
                <p className="text-2xl font-bold mt-1">Rs. {totalPending}</p>
                <p className="text-xs text-gray-500 mt-1">{studentsPending} students pending</p>
              </div>
              <div className="p-2 rounded-full bg-amber-100 text-amber-600">
                <ArrowDown className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-red-50">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Due</p>
                <p className="text-2xl font-bold mt-1">Rs. {totalDue}</p>
                <p className="text-xs text-gray-500 mt-1">remaining to collect</p>
              </div>
              <div className="p-2 rounded-full bg-red-100 text-red-600">
                <ArrowDown className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-blue-50">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-600">Collection Rate</p>
                <p className="text-2xl font-bold mt-1">
                  {activeStudents ? `${Math.round((studentsPaid / activeStudents) * 100)}%` : '0%'}
                </p>
                <p className="text-xs text-gray-500 mt-1">of active students</p>
              </div>
              <div className="p-2 rounded-full bg-blue-100 text-blue-600">
                <DollarSign className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Student Payment Status */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Student Payment Status</CardTitle>
            <CardDescription>
              Status for {selectedMonth} {selectedYear}
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={handleExportReport}>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-4 py-3 font-medium">ID</th>
                  <th className="px-4 py-3 font-medium">Student Name</th>
                  <th className="px-4 py-3 font-medium">Grade</th>
                  <th className="px-4 py-3 font-medium">Regular Fee</th>
                  <th className="px-4 py-3 font-medium">Amount Paid</th>
                  <th className="px-4 py-3 font-medium">Due Amount</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Notes</th>
                </tr>
              </thead>
              <tbody>
                {studentsWithPaymentStatus.map((student, idx) => (
                  <tr key={student.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-4 py-3">{student.id.substring(0, 8)}</td>
                    <td className="px-4 py-3 font-medium">{student.name}</td>
                    <td className="px-4 py-3">{student.grade}</td>
                    <td className="px-4 py-3">Rs. {student.feeAmount}</td>
                    <td className="px-4 py-3">
                      {student.paymentStatus === 'Not Recorded' 
                        ? '-' 
                        : `Rs. ${student.paymentAmount}`}
                    </td>
                    <td className="px-4 py-3">
                      {student.dueAmount > 0 ? (
                        <span className="text-red-600 font-medium">Rs. {student.dueAmount}</span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        student.paymentStatus === 'Paid' 
                          ? 'bg-green-100 text-green-700' 
                          : student.paymentStatus === 'Partial'
                            ? 'bg-orange-100 text-orange-700'
                            : student.paymentStatus === 'Pending'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-gray-100 text-gray-700'
                      }`}>
                        {student.paymentStatus}
                        {student.isAdvance && ' (Advance)'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 max-w-[200px] truncate">
                      {student.notes || '-'}
                    </td>
                  </tr>
                ))}
                
                {studentsWithPaymentStatus.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                      No active students found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports;
