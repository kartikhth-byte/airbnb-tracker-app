export const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(amount || 0);
};

export const formatDateForInput = (date) => {
    if (!date) return '';
    // Assumes date is a Date object or a string Firestore can parse
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) return '';
    return d.toISOString().split('T')[0];
};

export const getMonthYear = (date) => {
    if (!date) return '';
    const d = date instanceof Date ? date : new Date(date);
     if (isNaN(d.getTime())) return '';
    return d.toLocaleString('default', { month: 'long', year: 'numeric' });
};