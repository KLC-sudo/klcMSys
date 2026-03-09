import React from 'react';
import { Student, Payment, Currency } from '../../types';
import { formatCurrency } from '../../utils/currency';
import DataTable from '../shared/DataTable';
import TableActionMenu from '../shared/TableActionMenu';

const CLASS_LEVELS = [
    'A1.1', 'A1.2', 'A2.1', 'A2.2',
    'B1.1', 'B1.2', 'B2.1', 'B2.2',
    'C1.1', 'C1.2', 'C2.1', 'C2.2'
];

interface StudentsTableProps {
    students: Student[];
    payments: Payment[];
    onEdit: (student: Student) => void;
    onEnroll: (student: Student) => void;
    onDelete: (student: Student) => void;
    onAdvance: (student: Student) => void;
}

const StudentsTable: React.FC<StudentsTableProps> = ({
    students,
    payments,
    onEdit,
    onEnroll,
    onDelete,
    onAdvance,
}) => {
    const columns = [
        {
            header: 'Client/Student ID',
            accessor: 'studentId' as keyof Student,
            sortable: true,
            width: '12%',
            render: (value: string) => (
                <span className="font-mono text-xs font-semibold text-brand-primary">{value}</span>
            ),
        },
        {
            header: 'Name',
            accessor: 'name' as keyof Student,
            sortable: true,
            width: '18%',
            render: (value: string, row: Student) => {
                const isActualStudent = row.studentId.startsWith('STU-');
                const hasLog = isActualStudent && Array.isArray(row.advancementLog) && row.advancementLog.length > 0;
                return (
                    <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-900">{value}</span>
                        {hasLog && (
                            <span
                                title={`${row.advancementLog!.length} advancement(s) — currently ${row.currentLevel}`}
                                className="inline-flex items-center justify-center h-4 w-4 rounded-full bg-sky-100 text-sky-700 text-[10px] font-bold cursor-default"
                            >
                                ↑{row.advancementLog!.length}
                            </span>
                        )}
                    </div>
                );
            },
        },
        {
            header: 'Level',
            accessor: 'currentLevel' as keyof Student,
            sortable: true,
            width: '8%',
            render: (value: string, row: Student) => {
                const isActualStudent = row.studentId.startsWith('STU-');
                if (!isActualStudent) return <span className="text-slate-400 text-xs">—</span>;
                return value ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800">
                        {value}
                    </span>
                ) : (
                    <span className="text-slate-400 text-xs">Not set</span>
                );
            },
        },
        {
            header: 'Contact',
            accessor: (row: Student) => row.email || row.phone,
            render: (_: any, row: Student) => (
                <div className="text-xs space-y-1">
                    {row.email && (
                        <div className="flex items-center space-x-1">
                            <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            <span>{row.email}</span>
                        </div>
                    )}
                    {row.phone && (
                        <div className="flex items-center space-x-1">
                            <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            <span>{row.phone}</span>
                        </div>
                    )}
                </div>
            ),
            width: '18%',
        },
        {
            header: 'Registration Date',
            accessor: 'registrationDate' as keyof Student,
            render: (value: string) => new Date(value).toLocaleDateString(),
            sortable: true,
            width: '11%',
        },
        {
            header: 'Payment Status',
            accessor: 'fees' as keyof Student,
            render: (_: any, row: Student) => {
                const studentPayments = payments.filter(p => p.clientId === row.id);
                const totalPaid = studentPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
                const totalFees = Number(row.fees) || 0;
                const balance = totalFees - totalPaid;
                const percentPaid = totalFees > 0 ? (totalPaid / totalFees) * 100 : 0;
                const currency = studentPayments.length > 0 ? studentPayments[0].currency : Currency.UGX;

                return (
                    <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                            <span className={`font-semibold ${balance <= 0 ? 'text-green-600' : percentPaid >= 50 ? 'text-orange-600' : 'text-red-600'}`}>
                                {formatCurrency(totalPaid, currency)}
                            </span>
                            <span className="text-xs text-slate-500">/ {formatCurrency(totalFees, currency)}</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-1.5">
                            <div
                                className={`h-1.5 rounded-full ${balance <= 0 ? 'bg-green-600' : percentPaid >= 50 ? 'bg-orange-500' : 'bg-red-500'}`}
                                style={{ width: `${Math.min(percentPaid, 100)}%` }}
                            />
                        </div>
                        {balance > 0 && (
                            <div className="text-xs text-red-600 font-medium">
                                Balance: {formatCurrency(balance, currency)}
                            </div>
                        )}
                    </div>
                );
            },
            sortable: true,
            width: '18%',
        },
        {
            header: 'Created By',
            accessor: 'createdByUsername' as keyof Student,
            render: (_: any, row: Student) => (
                <div className="text-sm">
                    {row.createdByUsername ? (
                        <span className="font-medium text-slate-700">{row.createdByUsername}</span>
                    ) : (
                        <span className="text-slate-400 italic text-xs">—</span>
                    )}
                </div>
            ),
            width: '12%',
        },
    ];

    const renderExpandedRow = (student: Student) => {
        const isActualStudent = student.studentId.startsWith('STU-');
        const log = isActualStudent && Array.isArray(student.advancementLog) ? student.advancementLog : [];

        return (
            <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 rounded-lg ${isActualStudent ? 'bg-slate-50' : 'bg-blue-50 border-l-4 border-blue-500'}`}>
                {isActualStudent ? (
                    <>
                        <div>
                            <h4 className="font-semibold text-sm text-slate-700 mb-2">Personal Information</h4>
                            <div className="space-y-1 text-xs text-slate-600">
                                <div><span className="font-medium">Language of Study:</span> <span className="text-blue-700 font-semibold">{student.languageOfStudy || 'Not specified'}</span></div>
                                <div><span className="font-medium">Current Level:</span> <span className="text-indigo-700 font-semibold">{student.currentLevel || 'Not set'}</span></div>
                                <div><span className="font-medium">Date of Birth:</span> {student.dateOfBirth}</div>
                                <div><span className="font-medium">Nationality:</span> {student.nationality}</div>
                                <div><span className="font-medium">Occupation:</span> {student.occupation}</div>
                                <div><span className="font-medium">Mother Tongue:</span> {student.motherTongue}</div>
                            </div>
                        </div>

                        <div>
                            <h4 className="font-semibold text-sm text-slate-700 mb-2">Contact & Address</h4>
                            <div className="space-y-1 text-xs text-slate-600">
                                <div><span className="font-medium">Address:</span> {student.address}</div>
                                {student.email && <div><span className="font-medium">Email:</span> {student.email}</div>}
                                {student.phone && <div><span className="font-medium">Phone:</span> {student.phone}</div>}
                            </div>
                        </div>

                        <div>
                            <h4 className="font-semibold text-sm text-slate-700 mb-2">Additional Information</h4>
                            <div className="space-y-1 text-xs text-slate-600">
                                <div><span className="font-medium">How They Heard:</span> {student.howHeardAboutUs || 'Not specified'}</div>
                                {student.howHeardAboutUsOther && (
                                    <div><span className="font-medium">Details:</span> {student.howHeardAboutUsOther}</div>
                                )}
                            </div>
                        </div>

                        {/* Advancement Log */}
                        {log.length > 0 && (
                            <div className="md:col-span-2 lg:col-span-3">
                                <h4 className="font-semibold text-sm text-slate-700 mb-2 flex items-center gap-2">
                                    <span className="h-4 w-4 bg-sky-100 text-sky-700 rounded-full text-[10px] font-bold flex items-center justify-center">↑</span>
                                    Advancement History
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    {log.map((entry, i) => (
                                        <div key={i} className="flex items-center gap-1 text-xs bg-white border border-indigo-200 rounded-full px-3 py-1 shadow-sm">
                                            <span className="text-slate-500 font-mono">{entry.from}</span>
                                            <span className="text-indigo-400">→</span>
                                            <span className="text-indigo-700 font-semibold font-mono">{entry.to}</span>
                                            <span className="text-slate-400 ml-1">· {new Date(entry.advancedAt).toLocaleDateString()} by {entry.advancedBy}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <>
                        <div>
                            <h4 className="font-semibold text-sm text-slate-700 mb-2">Client Information</h4>
                            <div className="space-y-1 text-xs text-slate-600">
                                <div><span className="font-medium">Client ID:</span> <span className="font-mono text-blue-700">{student.studentId}</span></div>
                                <div><span className="font-medium">Name:</span> {student.name}</div>
                                {student.email && <div><span className="font-medium">Email:</span> {student.email}</div>}
                                {student.phone && <div><span className="font-medium">Phone:</span> {student.phone}</div>}
                            </div>
                        </div>
                        <div>
                            <h4 className="font-semibold text-sm text-slate-700 mb-2">Service Details</h4>
                            <div className="space-y-1 text-xs text-slate-600">
                                <div><span className="font-medium">Service Type:</span> {student.serviceInterestedIn || 'N/A'}</div>
                                <div><span className="font-medium">Total Fee:</span> {formatCurrency(student.fees, Currency.UGX)}</div>
                                <div><span className="font-medium">Registration Date:</span> {new Date(student.registrationDate).toLocaleDateString()}</div>
                            </div>
                        </div>
                    </>
                )}

                {/* Record Info */}
                <div className="md:col-span-2 lg:col-span-3">
                    <h4 className="font-semibold text-sm text-slate-700 mb-2">Record Info</h4>
                    <div className="space-y-1 text-xs text-slate-600">
                        <div><span className="font-medium">Created:</span> {new Date(student.createdAt).toLocaleString()} by {student.createdByUsername}</div>
                        {student.modifiedAt && (
                            <div><span className="font-medium">Modified:</span> {new Date(student.modifiedAt).toLocaleString()} by {student.modifiedByUsername}</div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <DataTable
            data={students}
            columns={columns}
            keyExtractor={(row) => row.id}
            renderExpandedRow={renderExpandedRow}
            actions={(row) => {
                const isActualStudent = row.studentId.startsWith('STU-');
                const isAtMaxLevel = row.currentLevel === 'C2.2';
                const actions: { label: string; onClick: () => void; icon: React.ReactNode; danger?: boolean; disabled?: boolean }[] = [
                    {
                        label: 'Edit',
                        onClick: () => onEdit(row),
                        icon: (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                        ),
                    },
                ];

                if (isActualStudent) {
                    actions.push({
                        label: isAtMaxLevel ? 'At Max Level (C2.2)' : 'Advance to Next Level',
                        onClick: () => { if (!isAtMaxLevel) onAdvance(row); },
                        disabled: isAtMaxLevel,
                        icon: (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                            </svg>
                        ),
                    });
                }

                actions.push({
                    label: 'Delete',
                    onClick: () => onDelete(row),
                    danger: true,
                    icon: (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    ),
                });

                return <TableActionMenu actions={actions} />;
            }}
            emptyMessage="No students found."
            defaultSortColumn="Registration Date"
            defaultSortDirection="desc"
        />
    );
};

export default StudentsTable;
