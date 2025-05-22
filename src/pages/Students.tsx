
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { User, UserPlus, Search, FilePlus, Printer, History } from 'lucide-react';
import { Student, FeePayment, NepaliMonth } from '@/types';
import { getCurrentNepaliMonth, getCurrentNepaliYear, nepaliMonths } from '@/lib/nepali-utils';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import BulkReceiptGenerator from '@/components/BulkReceiptGenerator';
import StudentPaymentHistory from '@/components/StudentPaymentHistory';
import { fetchStudents, addNewStudent, updateExistingStudent } from '@/utils/supabaseUtils';

const Students = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState<boolean>(false);
  const [isBulkReceiptDialogOpen, setIsBulkReceiptDialogOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // New student form state
  const [studentName, setStudentName] = useState<string>('');
  const [studentGrade, setStudentGrade] = useState<string>('');
  const [studentContact, setStudentContact] = useState<string>('');
  const [studentAddress, setStudentAddress] = useState<string>('');
  const [guardianName, setGuardianName] = useState<string>('');
  const [guardianContact, setGuardianContact] = useState<string>('');
  const [feeAmount, setFeeAmount] = useState<number>(0);
  const [isActive, setIsActive] = useState<boolean>(true);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [currentStudentId, setCurrentStudentId] = useState<string>('');
  
  const navigate = useNavigate();

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    setIsLoading(true);
    try {
      const loadedStudents = await fetchStudents();
      setStudents(loadedStudents);
      setFilteredStudents(loadedStudents);
    } catch (error) {
      console.error("Error loading students:", error);
      toast.error("Failed to load students");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (searchTerm) {
      const searchTermLower = searchTerm.toLowerCase();
      const filtered = students.filter(student => 
        student.name.toLowerCase().includes(searchTermLower) || 
        student.id.toLowerCase().includes(searchTermLower) ||
        student.grade.toLowerCase().includes(searchTermLower) ||
        (student.guardianName && student.guardianName.toLowerCase().includes(searchTermLower))
      );
      setFilteredStudents(filtered);
    } else {
      setFilteredStudents(students);
    }
  }, [searchTerm, students]);

  const resetForm = () => {
    setStudentName('');
    setStudentGrade('');
    setStudentContact('');
    setStudentAddress('');
    setGuardianName('');
    setGuardianContact('');
    setFeeAmount(0);
    setIsActive(true);
    setIsEditMode(false);
    setCurrentStudentId('');
  };

  const handleAddStudent = async () => {
    if (!studentName || !studentGrade) {
      toast.error("Student name and grade are required");
      return;
    }

    if (feeAmount <= 0) {
      toast.error("Fee amount must be greater than zero");
      return;
    }

    try {
      if (isEditMode) {
        const updatedStudent = await updateExistingStudent({
          id: currentStudentId,
          name: studentName,
          grade: studentGrade,
          contact: studentContact,
          address: studentAddress,
          guardianName: guardianName,
          guardianContact: guardianContact,
          joiningDate: students.find(s => s.id === currentStudentId)?.joiningDate || new Date().toISOString(),
          active: isActive,
          feeAmount: feeAmount
        });
        
        toast.success("Student updated successfully");
        
        // Update local state
        setStudents(students.map(student => 
          student.id === currentStudentId ? updatedStudent : student
        ));
      } else {
        const newStudent = await addNewStudent({
          name: studentName,
          grade: studentGrade,
          contact: studentContact,
          address: studentAddress,
          guardianName: guardianName,
          guardianContact: guardianContact,
          joiningDate: new Date().toISOString(),
          active: isActive,
          feeAmount: feeAmount
        });
        
        toast.success("Student added successfully");
        
        // Update local state
        setStudents([...students, newStudent]);
      }
    } catch (error) {
      console.error("Error saving student:", error);
      toast.error(isEditMode ? "Failed to update student" : "Failed to add student");
      return;
    }
    
    resetForm();
    setIsAddDialogOpen(false);
  };

  const handleEditStudent = (student: Student) => {
    setStudentName(student.name);
    setStudentGrade(student.grade);
    setStudentContact(student.contact);
    setStudentAddress(student.address || '');
    setGuardianName(student.guardianName || '');
    setGuardianContact(student.guardianContact || '');
    setFeeAmount(student.feeAmount);
    setIsActive(student.active);
    setIsEditMode(true);
    setCurrentStudentId(student.id);
    setIsAddDialogOpen(true);
  };

  const openAddStudentDialog = () => {
    resetForm();
    setIsAddDialogOpen(true);
  };

  const handleNavigateToFees = (studentId: string) => {
    navigate(`/fee-collection?studentId=${studentId}`);
  };

  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isPaymentHistoryOpen, setIsPaymentHistoryOpen] = useState<boolean>(false);

  const handleViewPaymentHistory = (student: Student) => {
    setSelectedStudent(student);
    setIsPaymentHistoryOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Students</h1>
        <div className="flex gap-2">
          <Button onClick={() => setIsBulkReceiptDialogOpen(true)} variant="outline">
            <FilePlus className="mr-2 h-4 w-4" /> Generate Bulk Bills
          </Button>
          <Button onClick={openAddStudentDialog}>
            <UserPlus className="mr-2 h-4 w-4" /> Add Student
          </Button>
        </div>
      </div>

      <div className="flex justify-between items-center gap-4">
        <div className="relative flex-1">
          <Input
            placeholder="Search students..."
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
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Grade</TableHead>
              <TableHead>Guardian</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Fee Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredStudents.length > 0 ? (
              filteredStudents.map((student) => (
                <TableRow key={student.id}>
                  <TableCell>{student.id.substring(0, 8)}</TableCell>
                  <TableCell>{student.name}</TableCell>
                  <TableCell>{student.grade}</TableCell>
                  <TableCell>{student.guardianName || '-'}</TableCell>
                  <TableCell>{student.contact || student.guardianContact || '-'}</TableCell>
                  <TableCell>Rs. {student.feeAmount}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${student.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {student.active ? 'Active' : 'Inactive'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEditStudent(student)}>
                        Edit
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleNavigateToFees(student.id)}>
                        Fees
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleViewPaymentHistory(student)}>
                        <History className="h-4 w-4 mr-1" />History
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-4">
                  No students found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}

      {/* Add/Edit Student Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{isEditMode ? 'Edit Student' : 'Add New Student'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="studentName">Full Name</Label>
                <Input
                  id="studentName"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="studentGrade">Grade/Class</Label>
                <Input
                  id="studentGrade"
                  value={studentGrade}
                  onChange={(e) => setStudentGrade(e.target.value)}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="studentContact">Contact Number</Label>
                <Input
                  id="studentContact"
                  value={studentContact}
                  onChange={(e) => setStudentContact(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="feeAmount">Monthly Fee Amount</Label>
                <Input
                  id="feeAmount"
                  type="number"
                  value={feeAmount}
                  onChange={(e) => setFeeAmount(Number(e.target.value))}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="studentAddress">Address</Label>
              <Input
                id="studentAddress"
                value={studentAddress}
                onChange={(e) => setStudentAddress(e.target.value)}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="guardianName">Guardian Name</Label>
                <Input
                  id="guardianName"
                  value={guardianName}
                  onChange={(e) => setGuardianName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="guardianContact">Guardian Contact</Label>
                <Input
                  id="guardianContact"
                  value={guardianContact}
                  onChange={(e) => setGuardianContact(e.target.value)}
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch 
                id="isActive" 
                checked={isActive}
                onCheckedChange={setIsActive}
              />
              <Label htmlFor="isActive">Active Student</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddStudent}>
              {isEditMode ? 'Update Student' : 'Add Student'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Receipt Generator Dialog */}
      <BulkReceiptGenerator 
        open={isBulkReceiptDialogOpen} 
        onOpenChange={setIsBulkReceiptDialogOpen} 
        students={students.filter(student => student.active)}
      />
      
      {/* Payment History Dialog */}
      {selectedStudent && (
        <StudentPaymentHistory 
          student={selectedStudent}
          open={isPaymentHistoryOpen}
          onOpenChange={setIsPaymentHistoryOpen}
        />
      )}
    </div>
  );
};

export default Students;
