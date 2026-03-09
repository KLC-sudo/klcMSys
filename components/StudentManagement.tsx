import React, { useState, useEffect, useCallback } from 'react';
import { Student, Payment, ProspectDataStore, StudentDataStore, PaymentDataStore, ServiceType } from '../types';
import StudentList from './StudentList';
import TimeFilter from './shared/TimeFilter';
import Modal from './shared/Modal';
import { filterDataByTime, TimeFilterType, CustomDateRange } from '../utils/dateFilters';

interface StudentManagementProps {
  dataStore: ProspectDataStore & StudentDataStore & PaymentDataStore;
  onEditStudent: (student: Student) => void;
  onEnrollStudent: (student: Student) => void;
  onDeleteStudent: (student: Student) => void;
  onAdvanceStudent: (student: Student) => void;
  dataVersion?: number;
}

const StudentManagement: React.FC<StudentManagementProps> = ({
  dataStore,
  onEditStudent,
  onEnrollStudent,
  onDeleteStudent,
  onAdvanceStudent,
  dataVersion = 0
}) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeFilter, setTimeFilter] = useState<TimeFilterType>('all');
  const [customDateRange, setCustomDateRange] = useState<CustomDateRange | undefined>();
  const [advancingStudent, setAdvancingStudent] = useState<Student | null>(null);
  const [isAdvancing, setIsAdvancing] = useState(false);

  const fetchStudentsAndPayments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [studentData, completedJobs, paymentData] = await Promise.all([
        dataStore.getStudents(),
        dataStore.getCompletedJobs(),
        dataStore.getAllPayments()
      ]);

      const nonStudentClients = completedJobs.filter(
        job => job.serviceInterestedIn !== ServiceType.LanguageTraining
      );

      const clientsFromJobs: Student[] = nonStudentClients.map(job => ({
        id: job.id,
        studentId: `C-${job.id.substring(0, 6)}`,
        name: job.prospectName,
        email: job.email,
        phone: job.phone,
        registrationDate: job.createdAt.split('T')[0],
        dateOfBirth: '',
        nationality: '',
        occupation: '',
        address: '',
        motherTongue: '',
        howHeardAboutUs: (job as any).howHeardAboutUs,
        howHeardAboutUsOther: (job as any).howHeardAboutUsOther,
        fees: job.translationTotalFee || job.interpretationTotalFee || 0,
        serviceInterestedIn: job.serviceInterestedIn,
        createdBy: job.createdBy,
        createdByUsername: job.createdByUsername,
        modifiedBy: job.modifiedBy,
        modifiedByUsername: job.modifiedByUsername,
        createdAt: job.createdAt,
        modifiedAt: job.modifiedAt,
      }));

      const allClients = [...studentData, ...clientsFromJobs].sort((a, b) =>
        a.name.localeCompare(b.name)
      );

      setStudents(allClients);
      setPayments(paymentData);
    } catch (err) {
      console.error("Failed to fetch student data:", err);
      setError("Could not load student data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [dataStore]);

  useEffect(() => {
    fetchStudentsAndPayments();
  }, [fetchStudentsAndPayments, dataVersion]);

  const filteredStudents = React.useMemo(() => {
    return filterDataByTime(students, 'createdAt', timeFilter);
  }, [students, timeFilter]);

  const handleAdvanceRequest = (student: Student) => {
    setAdvancingStudent(student);
  };

  const handleConfirmAdvance = async () => {
    if (!advancingStudent) return;
    setIsAdvancing(true);
    try {
      await onAdvanceStudent(advancingStudent);
      setAdvancingStudent(null);
      await fetchStudentsAndPayments();
    } catch (err: any) {
      setError(err.message || 'Failed to advance student');
    } finally {
      setIsAdvancing(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-8">
        <h2 className="text-2xl font-bold text-brand-dark mb-2">Client Management</h2>
        <p className="text-brand-secondary mb-4">
          All converted clients. Students can be advanced through levels; fees reset to the configured level fee.
        </p>
        <div className="flex-1 max-w-md">
          <TimeFilter
            currentFilter={timeFilter}
            onFilterChange={(filter, range) => {
              setTimeFilter(filter);
              if (range) setCustomDateRange(range);
            }}
            customRange={customDateRange}
          />
        </div>
      </div>

      {error && (
        <div className="mt-8 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md" role="alert">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      )}

      <div className="mt-8">
        {isLoading ? (
          <div className="text-center py-16 px-6 bg-white rounded-xl shadow-sm border border-slate-200">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary mx-auto"></div>
            <h3 className="mt-4 text-lg font-medium text-brand-dark">Loading Clients...</h3>
          </div>
        ) : (
          <StudentList
            students={filteredStudents}
            payments={payments}
            onEdit={onEditStudent}
            onEnroll={onEnrollStudent}
            onDelete={onDeleteStudent}
            onAdvance={handleAdvanceRequest}
          />
        )}
      </div>

      {/* Advance Confirmation Modal */}
      {advancingStudent && (
        <Modal isOpen={true} onClose={() => setAdvancingStudent(null)} title="Advance to Next Level">
          <div className="text-center p-4">
            <div className="mx-auto flex items-center justify-center h-14 w-14 rounded-full bg-sky-100 mb-4">
              <svg className="h-7 w-7 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
            </div>
            <p className="text-sm text-slate-600 mb-1">
              Advance <strong className="text-slate-900">{advancingStudent.name}</strong>?
            </p>
            <p className="text-xs text-slate-500 mb-6">
              Current level: <strong>{advancingStudent.currentLevel || 'Not set'}</strong>.<br />
              Their fees will be reset to the configured fee for the next level.
            </p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => setAdvancingStudent(null)}
                className="font-semibold text-slate-600 hover:text-slate-800 px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-100"
                disabled={isAdvancing}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAdvance}
                disabled={isAdvancing}
                className="bg-sky-600 text-white font-bold py-2 px-6 rounded-lg shadow-md hover:bg-sky-700 disabled:opacity-60"
              >
                {isAdvancing ? 'Advancing...' : 'Advance'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default StudentManagement;