
import { supabase } from '@/integrations/supabase/client';
import { Student, FeePayment, NepaliMonth } from '@/types';
import { getCurrentNepaliMonth, getCurrentNepaliYear } from '@/lib/nepali-utils';
import { toast } from 'sonner';

// Students CRUD operations
export const fetchStudents = async () => {
  try {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .order('name');
      
    if (error) {
      console.error('Error fetching students:', error);
      throw error;
    }
    
    // Transform data to match our Student interface
    return (data || []).map(student => ({
      id: student.id,
      name: student.name,
      grade: student.grade,
      contact: student.contact,
      address: student.address || undefined,
      guardianName: student.guardian_name || undefined,
      guardianContact: student.guardian_contact || undefined,
      active: student.active || false,
      feeAmount: student.fee_amount,
      joiningDate: student.joining_date
    }));
  } catch (error) {
    console.error('Error in fetchStudents:', error);
    toast.error('Failed to load students data');
    return [];
  }
};

export const addNewStudent = async (student: Omit<Student, 'id'>) => {
  try {
    const { data, error } = await supabase
      .from('students')
      .insert({
        name: student.name,
        grade: student.grade,
        contact: student.contact,
        address: student.address || null,
        guardian_name: student.guardianName || null,
        guardian_contact: student.guardianContact || null,
        active: student.active,
        fee_amount: student.feeAmount,
        joining_date: student.joiningDate || new Date().toISOString()
      })
      .select()
      .single();
      
    if (error) {
      console.error('Error adding student:', error);
      throw error;
    }
    
    return {
      id: data.id,
      name: data.name,
      grade: data.grade,
      contact: data.contact,
      address: data.address,
      guardianName: data.guardian_name,
      guardianContact: data.guardian_contact,
      active: data.active,
      feeAmount: data.fee_amount,
      joiningDate: data.joining_date
    };
  } catch (error) {
    console.error('Error in addNewStudent:', error);
    toast.error('Failed to add student');
    throw error;
  }
};

export const updateExistingStudent = async (student: Student) => {
  try {
    const { error } = await supabase
      .from('students')
      .update({
        name: student.name,
        grade: student.grade,
        contact: student.contact,
        address: student.address || null,
        guardian_name: student.guardianName || null,
        guardian_contact: student.guardianContact || null,
        active: student.active,
        fee_amount: student.feeAmount,
        joining_date: student.joiningDate
      })
      .eq('id', student.id);
      
    if (error) {
      console.error('Error updating student:', error);
      throw error;
    }
    
    return student;
  } catch (error) {
    console.error('Error in updateExistingStudent:', error);
    toast.error('Failed to update student');
    throw error;
  }
};

// Fee Payments CRUD operations
export const fetchFeePayments = async () => {
  try {
    const { data, error } = await supabase
      .from('fee_payments')
      .select('*')
      .order('paid_date', { ascending: false });
      
    if (error) {
      console.error('Error fetching fee payments:', error);
      throw error;
    }
    
    // Transform the data to match our application's type structure
    return (data || []).map(payment => ({
      id: payment.id,
      studentId: payment.student_id,
      amount: payment.amount,
      month: payment.month as NepaliMonth,
      year: payment.year,
      paidDate: payment.paid_date,
      isAdvance: payment.is_advance || false,
      isPending: payment.is_pending || false,
      notes: payment.notes || ''
    }));
  } catch (error) {
    console.error('Error in fetchFeePayments:', error);
    toast.error('Failed to load fee payments data');
    return [];
  }
};

export const saveFeePayment = async (payment: Omit<FeePayment, 'id'>) => {
  try {
    const { data, error } = await supabase
      .from('fee_payments')
      .insert({
        student_id: payment.studentId,
        amount: payment.amount,
        month: payment.month,
        year: payment.year,
        paid_date: payment.paidDate || new Date().toISOString(),
        is_advance: payment.isAdvance || false,
        is_pending: payment.isPending || false,
        notes: payment.notes || null
      })
      .select()
      .single();
      
    if (error) {
      console.error('Error adding fee payment:', error);
      throw error;
    }
    
    return {
      id: data.id,
      studentId: data.student_id,
      amount: data.amount,
      month: data.month as NepaliMonth,
      year: data.year,
      paidDate: data.paid_date,
      isAdvance: data.is_advance || false,
      isPending: data.is_pending || false,
      notes: data.notes || ''
    };
  } catch (error) {
    console.error('Error in saveFeePayment:', error);
    toast.error('Failed to save fee payment');
    throw error;
  }
};

export const updateFeePayment = async (payment: FeePayment) => {
  try {
    const { error } = await supabase
      .from('fee_payments')
      .update({
        student_id: payment.studentId,
        amount: payment.amount,
        month: payment.month,
        year: payment.year,
        paid_date: payment.paidDate || new Date().toISOString(),
        is_advance: payment.isAdvance || false,
        is_pending: payment.isPending || false,
        notes: payment.notes || null
      })
      .eq('id', payment.id);
      
    if (error) {
      console.error('Error updating fee payment:', error);
      throw error;
    }
    
    return payment;
  } catch (error) {
    console.error('Error in updateFeePayment:', error);
    toast.error('Failed to update fee payment');
    throw error;
  }
};

// Monthly Reports
export const generateMonthlyReport = async (month: NepaliMonth, year: number) => {
  try {
    // Fetch all payments for the specified month and year
    const { data: payments, error: paymentsError } = await supabase
      .from('fee_payments')
      .select('*')
      .eq('month', month)
      .eq('year', year);
      
    if (paymentsError) {
      console.error('Error fetching payments for report:', paymentsError);
      throw paymentsError;
    }
    
    // Fetch all students to calculate correct due amounts
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('*');
      
    if (studentsError) {
      console.error('Error fetching students for report:', studentsError);
      throw studentsError;
    }
    
    // Calculate report data
    const totalCollection = payments
      .filter(p => !p.is_pending)
      .reduce((sum, p) => sum + p.amount, 0);
      
    // Calculate total due (including partial payments)
    const totalDue = payments.reduce((sum, p) => {
      const student = students.find(s => s.id === p.student_id);
      if (!student) return sum;
      
      if (p.is_pending) {
        // Pending payment means full amount is due
        return sum + student.fee_amount;
      } else {
        // For paid but partial payments, add the difference
        return sum + (p.amount < student.fee_amount ? student.fee_amount - p.amount : 0);
      }
    }, 0);
    
    const totalPending = payments
      .filter(p => p.is_pending)
      .reduce((sum, p) => {
        const student = students.find(s => s.id === p.student_id);
        return sum + (student?.fee_amount || 0);
      }, 0);
    
    const totalAdvance = payments
      .filter(p => p.is_advance)
      .reduce((sum, p) => {
        const student = students.find(s => s.id === p.student_id);
        const regularFee = student?.fee_amount || 0;
        const advanceAmount = p.amount > regularFee ? p.amount - regularFee : 0;
        return sum + advanceAmount;
      }, 0);
      
    const studentsPaid = new Set(
      payments
        .filter(p => !p.is_pending && p.amount >= (students.find(s => s.id === p.student_id)?.fee_amount || 0))
        .map(p => p.student_id)
    ).size;
    
    const studentsPartial = new Set(
      payments
        .filter(p => !p.is_pending && p.amount < (students.find(s => s.id === p.student_id)?.fee_amount || 0))
        .map(p => p.student_id)
    ).size;
    
    const studentsPending = new Set(
      payments.filter(p => p.is_pending).map(p => p.student_id)
    ).size;
    
    // Insert or update the monthly report
    const { data: existingReport, error: fetchError } = await supabase
      .from('monthly_reports')
      .select('*')
      .eq('month', month)
      .eq('year', year)
      .maybeSingle();
    
    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error checking for existing report:', fetchError);
      throw fetchError;
    }
    
    if (existingReport) {
      // Update existing report
      const { error: updateError } = await supabase
        .from('monthly_reports')
        .update({
          total_collection: totalCollection,
          total_pending: totalPending,
          total_advance: totalAdvance,
          students_paid: studentsPaid,
          students_pending: studentsPending,
          total_due: totalDue,
          students_partial: studentsPartial,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingReport.id);
        
      if (updateError) {
        console.error('Error updating report:', updateError);
        throw updateError;
      }
      
      return {
        id: existingReport.id,
        month,
        year,
        totalCollection,
        totalPending,
        totalDue,
        totalAdvance,
        studentsPaid,
        studentsPartial,
        studentsPending
      };
    } else {
      // Create new report
      const { data: newReport, error: insertError } = await supabase
        .from('monthly_reports')
        .insert({
          month,
          year,
          total_collection: totalCollection,
          total_pending: totalPending,
          total_advance: totalAdvance,
          students_paid: studentsPaid,
          students_pending: studentsPending,
          total_due: totalDue,
          students_partial: studentsPartial
        })
        .select()
        .single();
        
      if (insertError) {
        console.error('Error creating report:', insertError);
        throw insertError;
      }
      
      return {
        id: newReport.id,
        month,
        year,
        totalCollection: newReport.total_collection,
        totalPending: newReport.total_pending,
        totalDue: newReport.total_due,
        totalAdvance: newReport.total_advance,
        studentsPaid: newReport.students_paid,
        studentsPartial: newReport.students_partial,
        studentsPending: newReport.students_pending
      };
    }
  } catch (error) {
    console.error('Error generating monthly report:', error);
    toast.error('Failed to generate monthly report');
    throw error;
  }
};

export const fetchMonthlyReports = async () => {
  try {
    const { data, error } = await supabase
      .from('monthly_reports')
      .select('*')
      .order('year', { ascending: false })
      .order('month');
      
    if (error) {
      console.error('Error fetching monthly reports:', error);
      throw error;
    }
    
    return (data || []).map(report => ({
      id: report.id,
      month: report.month as NepaliMonth,
      year: report.year,
      totalCollection: report.total_collection,
      totalPending: report.total_pending,
      totalDue: report.total_due || 0,
      totalAdvance: report.total_advance,
      studentsPaid: report.students_paid,
      studentsPartial: report.students_partial || 0,
      studentsPending: report.students_pending
    }));
  } catch (error) {
    console.error('Error in fetchMonthlyReports:', error);
    toast.error('Failed to load monthly reports');
    return [];
  }
};

// Utility to generate monthly reports for all months with payments
export const generateAllMonthlyReports = async () => {
  try {
    // Get unique month-year combinations from payments
    const { data: uniquePeriods, error: periodsError } = await supabase
      .from('fee_payments')
      .select('month, year')
      .order('year')
      .order('month');
      
    if (periodsError) {
      console.error('Error fetching payment periods:', periodsError);
      throw periodsError;
    }
    
    // Create a set of unique month-year combinations
    const uniqueMonthYears = new Set();
    const periods = [];
    
    for (const period of uniquePeriods) {
      const key = `${period.month}-${period.year}`;
      if (!uniqueMonthYears.has(key)) {
        uniqueMonthYears.add(key);
        periods.push({
          month: period.month as NepaliMonth,
          year: period.year
        });
      }
    }
    
    // Generate reports for each period
    const reports = [];
    for (const period of periods) {
      const report = await generateMonthlyReport(period.month, period.year);
      reports.push(report);
    }
    
    return reports;
  } catch (error) {
    console.error('Error generating all monthly reports:', error);
    toast.error('Failed to generate reports');
    return [];
  }
};

// Add a database function to add columns if they don't exist
export const createAddColumnsFunction = async () => {
  try {
    const { error } = await supabase.rpc('add_columns_if_not_exist');
    if (error) {
      console.error('Error calling add_columns_if_not_exist function:', error);
      throw error;
    }
    return true;
  } catch (error) {
    console.error('Error:', error);
    return false;
  }
};
