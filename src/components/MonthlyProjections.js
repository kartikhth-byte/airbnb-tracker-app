import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../firebase/config';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import useDebounce from '../hooks/useDebounce';
import { financialYearMonths, baseProjection, projectionExpenseFields } from '../constants';
import { formatCurrency } from '../utils/helpers';

function MonthlyProjections({ user, unitId, data }) {
    const [editMonth, setEditMonth] = useState(financialYearMonths[0]);
    const [projections, setProjections] = useState({});

    useEffect(() => {
        const initialProjections = {};
        financialYearMonths.forEach(month => {
            const existingData = data.find(d => d.month === month);
            initialProjections[month] = existingData ? { ...baseProjection, ...existingData } : { ...baseProjection, month, unitId };
        });
        setProjections(initialProjections);
    }, [data, unitId]);

    const handleProjectionChange = (e) => {
        const { name, value } = e.target;
        setProjections(prev => ({
            ...prev,
            [editMonth]: {
                ...prev[editMonth],
                [name]: Number(value)
            }
        }));
    };

    const debouncedProjection = useDebounce(projections[editMonth], 1000);

    useEffect(() => {
        if (debouncedProjection && debouncedProjection.unitId) {
            const saveData = async () => {
                const docId = `${unitId}_${editMonth}`;
                const docRef = doc(db, 'monthlyProjections', docId);
                try {
                    await setDoc(docRef, { ...debouncedProjection, userId: user.uid, lastUpdated: serverTimestamp() }, { merge: true });
                } catch (error) {
                    console.error("Error saving projection:", error);
                }
            };
            saveData();
        }
    }, [debouncedProjection, unitId, editMonth, user.uid]);

    const currentEditProjection = projections[editMonth] || baseProjection;

    const projectionsWithTotals = useMemo(() => {
        const tableData = financialYearMonths.map(month => {
            const p = projections[month] || baseProjection;
            const totalProjectedExpenses = projectionExpenseFields.reduce((sum, field) => sum + (p[field.key] || 0), 0);
            const projectedNetProfitLoss = (p.projectedIncome || 0) - totalProjectedExpenses;
            return { ...p, month, totalProjectedExpenses, projectedNetProfitLoss };
        });

        const yearTotal = tableData.reduce((acc, p) => {
            acc.projectedIncome += p.projectedIncome || 0;
            acc.totalProjectedExpenses += p.totalProjectedExpenses || 0;
            acc.projectedNetProfitLoss += p.projectedNetProfitLoss || 0;
            return acc;
        }, { projectedIncome: 0, totalProjectedExpenses: 0, projectedNetProfitLoss: 0 });

        return { tableData, yearTotal };
    }, [projections]);

    return (
        <div>
            <h2 className="text-xl font-bold mb-4">Monthly Projections</h2>

            <div className="p-4 border rounded-lg bg-gray-50 mb-6">
                <h3 className="text-lg font-semibold mb-2">Edit Projections for:</h3>
                <select value={editMonth} onChange={e => setEditMonth(e.target.value)} className="p-2 border rounded mb-3">
                    {financialYearMonths.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Projected Income</label>
                        <input name="projectedIncome" type="number" value={currentEditProjection.projectedIncome || ''} onChange={handleProjectionChange} className="p-2 border rounded w-full" />
                    </div>
                    {projectionExpenseFields.map(field => (
                        <div key={field.key}>
                            <label className="block text-sm font-medium text-gray-700">{field.label}</label>
                            <input name={field.key} type="number" value={currentEditProjection[field.key] || ''} onChange={handleProjectionChange} className="p-2 border rounded w-full" />
                        </div>
                    ))}
                </div>
                 <p className="text-xs text-gray-500 mt-3">Changes are saved automatically after you stop typing.</p>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full bg-white border">
                    <thead className="bg-gray-200">
                        <tr>
                            <th className="py-2 px-4 border-b">Month</th>
                            <th className="py-2 px-4 border-b">Projected Income</th>
                            <th className="py-2 px-4 border-b">Total Projected Expenses</th>
                            <th className="py-2 px-4 border-b">Projected Net Profit/Loss</th>
                        </tr>
                    </thead>
                    <tbody>
                        {projectionsWithTotals.tableData.map(p => (
                             <tr key={p.month} className="text-center hover:bg-gray-50">
                                <td className="py-2 px-4 border-b">{p.month}</td>
                                <td className="py-2 px-4 border-b text-green-600">{formatCurrency(p.projectedIncome)}</td>
                                <td className="py-2 px-4 border-b text-red-600">{formatCurrency(p.totalProjectedExpenses)}</td>
                                <td className={`py-2 px-4 border-b font-semibold ${p.projectedNetProfitLoss >= 0 ? 'text-green-700' : 'text-red-700'}`}>{formatCurrency(p.projectedNetProfitLoss)}</td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr className="bg-gray-800 text-white font-bold text-center">
                            <td className="py-3 px-4 border-b">YEAR TOTAL</td>
                            <td className="py-3 px-4 border-b">{formatCurrency(projectionsWithTotals.yearTotal.projectedIncome)}</td>
                            <td className="py-3 px-4 border-b">{formatCurrency(projectionsWithTotals.yearTotal.totalProjectedExpenses)}</td>
                            <td className={`py-3 px-4 border-b ${projectionsWithTotals.yearTotal.projectedNetProfitLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>{formatCurrency(projectionsWithTotals.yearTotal.projectedNetProfitLoss)}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
}

export default MonthlyProjections;