import React, { useState, useEffect } from 'react';

const ALL_LEVELS = [
    'A1.1', 'A1.2', 'A2.1', 'A2.2',
    'B1.1', 'B1.2', 'B2.1', 'B2.2',
    'C1.1', 'C1.2', 'C2.1', 'C2.2'
];

interface LevelFeesSettingsProps {
    dataStore: any;
}

const LevelFeesSettings: React.FC<LevelFeesSettingsProps> = ({ dataStore }) => {
    const [fees, setFees] = useState<Record<string, string>>(
        Object.fromEntries(ALL_LEVELS.map(l => [l, '0']))
    );
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        const load = async () => {
            setIsLoading(true);
            try {
                const token = localStorage.getItem('authToken');
                const res = await fetch('/api/level-fees', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                    const data: { level: string; fee: number }[] = await res.json();
                    const map: Record<string, string> = Object.fromEntries(ALL_LEVELS.map(l => [l, '0']));
                    data.forEach(item => { map[item.level] = String(item.fee); });
                    setFees(map);
                }
            } catch { /* silent */ } finally {
                setIsLoading(false);
            }
        };
        load();
    }, []);

    const handleSave = async () => {
        setIsSaving(true);
        setMessage(null);
        try {
            const token = localStorage.getItem('authToken');
            const payload = ALL_LEVELS.map(level => ({ level, fee: parseFloat(fees[level]) || 0 }));
            const res = await fetch('/api/level-fees', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ fees: payload })
            });
            if (res.ok) {
                setMessage({ type: 'success', text: 'Level fees saved successfully!' });
            } else {
                setMessage({ type: 'error', text: 'Failed to save level fees.' });
            }
        } catch {
            setMessage({ type: 'error', text: 'Network error while saving fees.' });
        } finally {
            setIsSaving(false);
        }
    };

    const levelGroups = [
        { group: 'A1', levels: ['A1.1', 'A1.2'] },
        { group: 'A2', levels: ['A2.1', 'A2.2'] },
        { group: 'B1', levels: ['B1.1', 'B1.2'] },
        { group: 'B2', levels: ['B2.1', 'B2.2'] },
        { group: 'C1', levels: ['C1.1', 'C1.2'] },
        { group: 'C2', levels: ['C2.1', 'C2.2'] },
    ];

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-1">
                <h2 className="text-xl font-semibold text-brand-dark">Level Fees</h2>
                <button
                    onClick={handleSave}
                    disabled={isSaving || isLoading}
                    className="bg-brand-primary text-white font-semibold py-2 px-5 rounded-lg shadow-sm hover:bg-sky-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                    {isSaving ? 'Saving...' : 'Save Fees'}
                </button>
            </div>
            <p className="text-sm text-slate-500 mb-5">
                Set the fee (UGX) charged when a student is registered at or advanced to each level.
            </p>

            {message && (
                <div className={`mb-4 p-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
                    {message.text}
                </div>
            )}

            {isLoading ? (
                <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary" />
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {levelGroups.map(({ group, levels }) => (
                        <div key={group} className="space-y-3">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{group}</p>
                            {levels.map(level => (
                                <div key={level} className="flex items-center gap-2">
                                    <span className="inline-flex items-center justify-center w-14 h-8 rounded-full bg-indigo-100 text-indigo-800 text-xs font-bold shrink-0">
                                        {level}
                                    </span>
                                    <input
                                        type="number"
                                        min="0"
                                        step="1000"
                                        value={fees[level]}
                                        onChange={e => setFees(prev => ({ ...prev, [level]: e.target.value }))}
                                        className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                                        placeholder="0"
                                    />
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default LevelFeesSettings;
