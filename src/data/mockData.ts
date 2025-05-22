import { Student, FeePayment, MonthlyReport, NepaliMonth } from "@/types";
import { getCurrentNepaliMonth, getCurrentNepaliYear, nepaliMonths } from "@/lib/nepali-utils";

// Generate some random students
export const mockStudents: Student[] = [
  {
    id: "S001",
    name: "Aarav Sharma",
    grade: "Grade 10",
    contact: "9841234567",
    address: "Kathmandu, Nepal",
    guardianName: "Raj Sharma",
    guardianContact: "9841234568",
    joiningDate: "2023-01-15",
    active: true,
    feeAmount: 2500
  },
  {
    id: "S002",
    name: "Priya Tamang",
    grade: "Grade 9",
    contact: "9867654321",
    address: "Bhaktapur, Nepal",
    guardianName: "Sita Tamang",
    guardianContact: "9867654322",
    joiningDate: "2023-02-10",
    active: true,
    feeAmount: 2200
  },
  {
    id: "S003",
    name: "Bimal K.C.",
    grade: "Grade 11",
    contact: "9812345678",
    address: "Lalitpur, Nepal",
    guardianName: "Krishna K.C.",
    guardianContact: "9812345679",
    joiningDate: "2022-11-05",
    active: true,
    feeAmount: 3000
  },
  {
    id: "S004",
    name: "Sarita Gurung",
    grade: "Grade 8",
    contact: "9854321098",
    address: "Pokhara, Nepal",
    guardianName: "Raju Gurung",
    guardianContact: "9854321099",
    joiningDate: "2023-03-20",
    active: true,
    feeAmount: 2000
  },
  {
    id: "S005",
    name: "Deepak Thapa",
    grade: "Grade 12",
    contact: "9898765432",
    address: "Chitwan, Nepal",
    guardianName: "Hari Thapa",
    guardianContact: "9898765433",
    joiningDate: "2022-07-12",
    active: false,
    feeAmount: 3500
  }
];

// Generate mock fee payments
const currentMonth = getCurrentNepaliMonth();
const currentYear = getCurrentNepaliYear();

export const mockFeePayments: FeePayment[] = [
  // Current month payments
  {
    id: "F001",
    studentId: "S001",
    amount: 2500,
    month: currentMonth,
    year: currentYear,
    paidDate: new Date().toISOString(),
    isAdvance: false,
    isPending: false,
    notes: ""
  },
  {
    id: "F002",
    studentId: "S002",
    amount: 2200,
    month: currentMonth,
    year: currentYear,
    paidDate: new Date().toISOString(),
    isAdvance: false,
    isPending: false,
    notes: ""
  },
  {
    id: "F003",
    studentId: "S003",
    amount: 3500,
    month: currentMonth,
    year: currentYear,
    paidDate: new Date().toISOString(),
    isAdvance: true,
    isPending: false,
    notes: "Paid extra 500 for next month"
  },
  {
    id: "F004",
    studentId: "S004",
    amount: 0,
    month: currentMonth,
    year: currentYear,
    paidDate: "",
    isAdvance: false,
    isPending: true,
    notes: "Student on leave this month"
  },
  
  // Previous month payments
  {
    id: "F005",
    studentId: "S001",
    amount: 2500,
    month: nepaliMonths[(nepaliMonths.indexOf(currentMonth) + 11) % 12],
    year: currentMonth === "Baisakh" ? currentYear - 1 : currentYear,
    paidDate: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString(),
    isAdvance: false,
    isPending: false,
    notes: ""
  },
  {
    id: "F006",
    studentId: "S002",
    amount: 2200,
    month: nepaliMonths[(nepaliMonths.indexOf(currentMonth) + 11) % 12],
    year: currentMonth === "Baisakh" ? currentYear - 1 : currentYear,
    paidDate: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString(),
    isAdvance: false,
    isPending: false,
    notes: ""
  }
];

// Generate mock monthly reports
export const mockMonthlyReports: MonthlyReport[] = [
  {
    month: currentMonth,
    year: currentYear,
    totalCollection: 8200,
    totalPending: 2000,
    totalAdvance: 500,
    studentsPaid: 3,
    studentsPending: 1
  },
  {
    month: nepaliMonths[(nepaliMonths.indexOf(currentMonth) + 11) % 12],
    year: currentMonth === "Baisakh" ? currentYear - 1 : currentYear,
    totalCollection: 4700,
    totalPending: 3000,
    totalAdvance: 0,
    studentsPaid: 2,
    studentsPending: 1
  }
];

// Local storage utils for mock data persistence
export const saveStudents = (students: Student[]) => {
  localStorage.setItem('students', JSON.stringify(students));
};

export const getStudents = (): Student[] => {
  const storedStudents = localStorage.getItem('students');
  return storedStudents ? JSON.parse(storedStudents) : mockStudents;
};

export const saveFeePayments = (payments: FeePayment[]) => {
  localStorage.setItem('feePayments', JSON.stringify(payments));
};

export const getFeePayments = (): FeePayment[] => {
  const storedPayments = localStorage.getItem('feePayments');
  return storedPayments ? JSON.parse(storedPayments) : mockFeePayments;
};

export const generateMonthlyReports = (payments: FeePayment[]): MonthlyReport[] => {
  const reportsMap = new Map<string, MonthlyReport>();
  
  // Group payments by month and year
  payments.forEach(payment => {
    const key = `${payment.month}-${payment.year}`;
    
    if (!reportsMap.has(key)) {
      reportsMap.set(key, {
        month: payment.month,
        year: payment.year,
        totalCollection: 0,
        totalPending: 0,
        totalAdvance: 0,
        studentsPaid: 0,
        studentsPending: 0
      });
    }
    
    const report = reportsMap.get(key)!;
    
    if (payment.isPending) {
      report.totalPending += payment.amount;
      report.studentsPending += 1;
    } else {
      report.totalCollection += payment.amount;
      report.studentsPaid += 1;
      
      if (payment.isAdvance) {
        // Assuming the advance amount is the extra above the regular fee
        const student = mockStudents.find(s => s.id === payment.studentId);
        const regularFee = student ? student.feeAmount : 0;
        const advanceAmount = payment.amount > regularFee ? payment.amount - regularFee : 0;
        report.totalAdvance += advanceAmount;
      }
    }
  });
  
  return Array.from(reportsMap.values());
};

// Add the missing functions that Students.tsx is trying to import
export const addStudent = (student: Student) => {
  const students = getStudents();
  const newStudents = [...students, student];
  saveStudents(newStudents);
  return newStudents;
};

export const updateStudent = (updatedStudent: Student) => {
  const students = getStudents();
  const newStudents = students.map(student => 
    student.id === updatedStudent.id ? updatedStudent : student
  );
  saveStudents(newStudents);
  return newStudents;
};
