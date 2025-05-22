
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { User, DollarSign, Calendar, ArrowUp, ArrowDown } from 'lucide-react';
import { Student, FeePayment, MonthlyReport } from '@/types';
import { getCurrentNepaliMonth, getCurrentNepaliYear, formatNepaliDate } from '@/lib/nepali-utils';
import { fetchStudents, fetchFeePayments, fetchMonthlyReports, generateAllMonthlyReports } from '@/utils/supabaseUtils';

const Dashboard = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [feePayments, setFeePayments] = useState<FeePayment[]>([]);
  const [reports, setReports] = useState<MonthlyReport[]>([]);
  const [currentMonthReport, setCurrentMonthReport] = useState<MonthlyReport | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [loadedStudents, loadedPayments, loadedReports] = await Promise.all([
        fetchStudents(),
        fetchFeePayments(),
        fetchMonthlyReports()
      ]);
      
      setStudents(loadedStudents);
      setFeePayments(loadedPayments);
      
      // If no reports exist, generate them
      if (loadedReports.length === 0) {
        const generatedReports = await generateAllMonthlyReports();
        setReports(generatedReports);
      } else {
        setReports(loadedReports);
      }
      
      // Find current month's report
      const currentMonth = getCurrentNepaliMonth();
      const currentYear = getCurrentNepaliYear();
      
      const report = loadedReports.find(r => 
        r.month === currentMonth && r.year === currentYear
      ) || null;
      
      setCurrentMonthReport(report);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Get recent payments (last 5)
  const recentPayments = [...feePayments]
    .filter(payment => !payment.isPending)
    .sort((a, b) => new Date(b.paidDate || '').getTime() - new Date(a.paidDate || '').getTime())
    .slice(0, 5);
  
  // Get pending payments
  const pendingPayments = feePayments.filter(payment => payment.isPending);

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
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <div className="text-sm text-gray-600">
          Current Month: <span className="font-medium">{getCurrentNepaliMonth()} {getCurrentNepaliYear()}</span>
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total Students" 
          value={students.filter(s => s.active).length.toString()}
          description="Active students"
          icon={<User className="h-5 w-5" />}
          className="bg-blue-50"
          iconColor="text-blue-600"
        />
        <StatCard 
          title="Total Collection" 
          value={`Rs. ${currentMonthReport?.totalCollection || 0}`}
          description={`${getCurrentNepaliMonth()} ${getCurrentNepaliYear()}`}
          icon={<DollarSign className="h-5 w-5" />}
          className="bg-green-50"
          iconColor="text-green-600"
        />
        <StatCard 
          title="Pending Fees" 
          value={`Rs. ${currentMonthReport?.totalPending || 0}`}
          description={`${pendingPayments.length} students`}
          icon={<ArrowDown className="h-5 w-5" />}
          className="bg-amber-50"
          iconColor="text-amber-600"
        />
        <StatCard 
          title="Advance Payments" 
          value={`Rs. ${currentMonthReport?.totalAdvance || 0}`}
          description="For upcoming months"
          icon={<ArrowUp className="h-5 w-5" />}
          className="bg-purple-50"
          iconColor="text-purple-600"
        />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Payments */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Recent Payments</CardTitle>
            <CardDescription>Last 5 fee payments received</CardDescription>
          </CardHeader>
          <CardContent>
            {recentPayments.length > 0 ? (
              <div className="space-y-4">
                {recentPayments.map(payment => {
                  const student = students.find(s => s.id === payment.studentId);
                  return (
                    <div key={payment.id} className="flex justify-between items-center border-b pb-3">
                      <div>
                        <p className="font-medium">{student?.name || 'Unknown Student'}</p>
                        <p className="text-sm text-gray-500">{payment.month} - Rs. {payment.amount}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-green-600">Paid</p>
                        <p className="text-xs text-gray-500">{formatNepaliDate(payment.paidDate)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-500 py-4">No recent payments found.</p>
            )}
          </CardContent>
        </Card>
        
        {/* Pending Payments */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Pending Payments</CardTitle>
            <CardDescription>Students with pending fees</CardDescription>
          </CardHeader>
          <CardContent>
            {pendingPayments.length > 0 ? (
              <div className="space-y-4">
                {pendingPayments.map(payment => {
                  const student = students.find(s => s.id === payment.studentId);
                  return (
                    <div key={payment.id} className="flex justify-between items-center border-b pb-3">
                      <div>
                        <p className="font-medium">{student?.name || 'Unknown Student'}</p>
                        <p className="text-sm text-gray-500">{payment.month} - Rs. {student?.feeAmount || 0}</p>
                      </div>
                      <div>
                        {payment.notes ? (
                          <p className="text-xs text-gray-500 italic">{payment.notes}</p>
                        ) : (
                          <p className="text-xs text-amber-600 font-medium">Payment Due</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-500 py-4">No pending payments.</p>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Monthly Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Monthly Summary</CardTitle>
          <CardDescription>Fee collection by month</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 font-medium">Month</th>
                  <th className="px-4 py-3 font-medium">Total Collection</th>
                  <th className="px-4 py-3 font-medium">Students Paid</th>
                  <th className="px-4 py-3 font-medium">Pending Amount</th>
                  <th className="px-4 py-3 font-medium">Advance Payments</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {reports.map((report, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-4 py-3 font-medium">{report.month} {report.year}</td>
                    <td className="px-4 py-3">Rs. {report.totalCollection}</td>
                    <td className="px-4 py-3">{report.studentsPaid} students</td>
                    <td className="px-4 py-3">Rs. {report.totalPending}</td>
                    <td className="px-4 py-3">Rs. {report.totalAdvance}</td>
                  </tr>
                ))}
                {reports.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-3 text-center text-gray-500">
                      No reports available yet.
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

interface StatCardProps {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
  className?: string;
  iconColor?: string;
}

const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  description, 
  icon, 
  className = "",
  iconColor = "text-gray-600"
}) => {
  return (
    <Card className={className}>
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            <p className="text-xs text-gray-500 mt-1">{description}</p>
          </div>
          <div className={`p-2 rounded-full ${className} ${iconColor}`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default Dashboard;
