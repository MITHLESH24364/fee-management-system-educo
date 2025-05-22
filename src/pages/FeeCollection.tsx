import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { DollarSign, Calendar, User, Search, Printer } from 'lucide-react';
import { Student, FeePayment, NepaliMonth } from '@/types';
import { getCurrentNepaliMonth, getCurrentNepaliYear, formatNepaliDate, nepaliMonths } from '@/lib/nepali-utils';
import { toast } from 'sonner';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { fetchStudents, fetchFeePayments, saveFeePayment, updateFeePayment, generateMonthlyReport } from '@/utils/supabaseUtils';

const FeeCollection = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [payments, setPayments] = useState<FeePayment[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<NepaliMonth>(getCurrentNepaliMonth());
  const [selectedYear, setSelectedYear] = useState<number>(getCurrentNepaliYear());
  const [amount, setAmount] = useState<number>(0);
  const [isAdvance, setIsAdvance] = useState<boolean>(false);
  const [isPending, setIsPending] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isAddPaymentDialogOpen, setIsAddPaymentDialogOpen] = useState<boolean>(false);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<FeePayment[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

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
      setFilteredStudents(loadedStudents.filter(s => s.active));
      setFilteredPayments(loadedPayments);
      
      // Check if there's a studentId in the URL params
      const studentIdParam = searchParams.get('studentId');
      if (studentIdParam) {
        setSelectedStudentId(studentIdParam);
        const student = loadedStudents.find(s => s.id === studentIdParam);
        if (student) {
          setAmount(student.feeAmount);
          // Check if there's already a payment for this month
          const existingPayment = loadedPayments.find(p => 
            p.studentId === studentIdParam && 
            p.month === getCurrentNepaliMonth() && 
            p.year === getCurrentNepaliYear()
          );
          
          if (existingPayment) {
            setAmount(existingPayment.amount);
            setIsAdvance(existingPayment.isAdvance);
            setIsPending(existingPayment.isPending);
            setNotes(existingPayment.notes || '');
          } else {
            setIsPending(false);
            setIsAdvance(false);
            setNotes('');
          }
          
          // Open the payment dialog automatically
          setIsAddPaymentDialogOpen(true);
        }
      }
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (searchTerm) {
      const searchTermLower = searchTerm.toLowerCase();
      const filtered = students.filter(student => 
        student.name.toLowerCase().includes(searchTermLower) || 
        student.id.toLowerCase().includes(searchTermLower)
      );
      setFilteredStudents(filtered.filter(s => s.active));

      const filteredPaymentsList = payments.filter(payment => {
        const student = students.find(s => s.id === payment.studentId);
        return student && student.name.toLowerCase().includes(searchTermLower);
      });
      setFilteredPayments(filteredPaymentsList);
    } else {
      setFilteredStudents(students.filter(s => s.active));
      setFilteredPayments(payments);
    }
  }, [searchTerm, students, payments]);

  const handleStudentSelect = (studentId: string) => {
    setSelectedStudentId(studentId);
    const student = students.find(s => s.id === studentId);
    if (student) {
      setAmount(student.feeAmount);
      // Check if there's already a payment for this month
      const existingPayment = payments.find(p => 
        p.studentId === studentId && 
        p.month === selectedMonth && 
        p.year === selectedYear
      );
      
      if (existingPayment) {
        setAmount(existingPayment.amount);
        setIsAdvance(existingPayment.isAdvance);
        setIsPending(existingPayment.isPending);
        setNotes(existingPayment.notes || '');
      } else {
        setIsPending(false);
        setIsAdvance(false);
        setNotes('');
      }
    }
  };

  const resetForm = () => {
    setSelectedStudentId('');
    setAmount(0);
    setIsAdvance(false);
    setIsPending(false);
    setNotes('');
  };

  const handleAddPayment = async () => {
    if (!selectedStudentId) {
      toast.error("Please select a student");
      return;
    }

    try {
      // Check if there's already a payment for this month/year/student
      const existingPayment = payments.find(p => 
        p.studentId === selectedStudentId && 
        p.month === selectedMonth && 
        p.year === selectedYear
      );

      let updatedPayment: FeePayment;
      
      if (existingPayment) {
        // Update existing payment
        updatedPayment = await updateFeePayment({
          ...existingPayment,
          amount,
          isAdvance,
          isPending,
          notes,
          paidDate: isPending ? '' : new Date().toISOString()
        });
        toast.success("Payment record updated successfully");
      } else {
        // Add new payment
        updatedPayment = await saveFeePayment({
          studentId: selectedStudentId,
          amount,
          month: selectedMonth,
          year: selectedYear,
          paidDate: isPending ? '' : new Date().toISOString(),
          isAdvance,
          isPending,
          notes
        });
        toast.success("Payment recorded successfully");
      }
      
      // Update the local payments array
      if (existingPayment) {
        setPayments(payments.map(p => 
          p.id === updatedPayment.id ? updatedPayment : p
        ));
      } else {
        setPayments([...payments, updatedPayment]);
      }
      
      // Generate monthly report for this month/year
      await generateMonthlyReport(selectedMonth, selectedYear);
      
      resetForm();
      setIsAddPaymentDialogOpen(false);
    } catch (error) {
      console.error("Error saving payment:", error);
      toast.error("Failed to save payment");
    }
  };

  const openAddPaymentDialog = () => {
    resetForm();
    setSelectedMonth(getCurrentNepaliMonth());
    setSelectedYear(getCurrentNepaliYear());
    setIsAddPaymentDialogOpen(true);
  };

  const currentYear = getCurrentNepaliYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  const handlePrintReceipt = (paymentId: string) => {
    navigate(`/print-receipt?paymentId=${paymentId}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Fee Collection</h1>
        <Button onClick={openAddPaymentDialog}>
          <DollarSign className="mr-2 h-4 w-4" /> Add Payment
        </Button>
      </div>

      <div className="flex justify-between items-center gap-4">
        <div className="relative flex-1">
          <Input
            placeholder="Search students or payments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Fee Collections */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Recent Fee Collections</CardTitle>
              <CardDescription>List of all fee payments</CardDescription>
            </CardHeader>
            <CardContent>
              {filteredPayments.length > 0 ? (
                <div className="space-y-4">
                  {[...filteredPayments]
                    .sort((a, b) => new Date(b.paidDate || '').getTime() - new Date(a.paidDate || '').getTime())
                    .map(payment => {
                      const student = students.find(s => s.id === payment.studentId);
                      return (
                        <div key={payment.id} className="bg-white rounded border p-4 flex justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-gray-500" />
                              <p className="font-medium">{student?.name}</p>
                            </div>
                            <div className="mt-1 flex items-center gap-2 text-sm">
                              <Calendar className="h-4 w-4 text-gray-500" />
                              <span>{payment.month}, {payment.year}</span>
                            </div>
                            {payment.notes && (
                              <p className="text-xs text-gray-500 mt-1 italic">"{payment.notes}"</p>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <DollarSign className="h-4 w-4 text-green-600" />
                              <p className="font-medium">Rs. {payment.amount}</p>
                            </div>
                            <div className="mt-1">
                              {payment.isPending ? (
                                <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full">
                                  Pending
                                </span>
                              ) : (
                                <span className="text-xs text-gray-500">
                                  Paid on {formatNepaliDate(payment.paidDate)}
                                </span>
                              )}
                            </div>
                            {payment.isAdvance && (
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full block mt-1">
                                Advance
                              </span>
                            )}
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handlePrintReceipt(payment.id)}
                              className="mt-2"
                            >
                              <Printer className="h-4 w-4 mr-1" /> Print Receipt
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No payments found.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Monthly Collection Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Monthly Collections</CardTitle>
              <CardDescription>Fee collection summary by month</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Array.from(
                  payments.reduce((acc, payment) => {
                    const key = `${payment.month}-${payment.year}`;
                    if (!acc.has(key)) {
                      acc.set(key, {
                        month: payment.month,
                        year: payment.year,
                        total: 0,
                        count: 0
                      });
                    }
                    
                    if (!payment.isPending) {
                      const record = acc.get(key)!;
                      record.total += payment.amount;
                      record.count += 1;
                      acc.set(key, record);
                    }
                    
                    return acc;
                  }, new Map())
                ).sort((a, b) => {
                  if (a[1].year !== b[1].year) return b[1].year - a[1].year;
                  return nepaliMonths.indexOf(b[1].month) - nepaliMonths.indexOf(a[1].month);
                }).map(([key, data]) => (
                  <div key={key} className="bg-white rounded border p-4">
                    <div className="flex justify-between">
                      <div>
                        <p className="font-medium">
                          {data.month} {data.year}
                        </p>
                        <p className="text-sm text-gray-500">
                          {data.count} students paid
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-green-600">
                          Rs. {data.total}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}

                {payments.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No collection data available.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Dialog open={isAddPaymentDialogOpen} onOpenChange={setIsAddPaymentDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Record Fee Payment</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="student">Student</Label>
              <Select 
                value={selectedStudentId} 
                onValueChange={handleStudentSelect}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a student" />
                </SelectTrigger>
                <SelectContent>
                  {filteredStudents.map(student => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.name} - {student.grade}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
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
            
            <div className="space-y-2">
              <Label htmlFor="amount">Fee Amount</Label>
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Switch 
                  id="pending" 
                  checked={isPending}
                  onCheckedChange={setIsPending}
                />
                <Label htmlFor="pending">Mark as pending</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch 
                  id="advance" 
                  checked={isAdvance}
                  onCheckedChange={setIsAdvance}
                  disabled={isPending}
                />
                <Label htmlFor="advance">Advance payment</Label>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Add any additional notes here..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddPaymentDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddPayment}>
              {isPending ? 'Record Pending Fee' : 'Record Payment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FeeCollection;
