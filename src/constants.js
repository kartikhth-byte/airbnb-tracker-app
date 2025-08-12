export const incomeCategories = [
  "Guest Payment",
  "Cleaning Fees",
  "Other",
];

export const expenseCategories = [
  "Rent/Mortgage",
  "Cleaning",
  "Utilities",
  "Supplies",
  "Maintenance/Repairs",
  "Property Costs (Taxes, Insurance)",
  "Platform Fees (Airbnb, Vrbo)",
  "Marketing/Advertising",
  "Guest Amenities",
  "Travel/Transportation",
  "Professional Services",
  "Miscellaneous",
];

// Generate months for the financial year (e.g., Sep 2025 to Aug 2026)
const generateFinancialYearMonths = () => {
    const months = [];
    const startDate = new Date('2025-09-01');
    for (let i = 0; i < 12; i++) {
        const date = new Date(startDate);
        date.setMonth(startDate.getMonth() + i);
        months.push(date.toLocaleString('default', { month: 'long', year: 'numeric' }));
    }
    return months;
};

export const financialYearMonths = generateFinancialYearMonths();

export const baseProjection = {
    projectedIncome: 0,
    projectedRent: 0,
    projectedCleaning: 0,
    projectedUtilities: 0,
    projectedSupplies: 0,
    projectedMaintenanceRepairs: 0,
    projectedPropertyCosts: 0,
    projectedPlatformFees: 0,
    projectedMarketingAdvertising: 0,
    projectedGuestAmenities: 0,
    projectedTravelTransportation: 0,
    projectedProfessionalServices: 0,
    projectedMiscellaneousExpenses: 0,
};

export const projectionExpenseFields = [
    { key: "projectedRent", label: "Rent/Mortgage" },
    { key: "projectedCleaning", label: "Cleaning" },
    { key: "projectedUtilities", label: "Utilities" },
    { key: "projectedSupplies", label: "Supplies" },
    { key: "projectedMaintenanceRepairs", label: "Maintenance/Repairs" },
    { key: "projectedPropertyCosts", label: "Property Costs" },
    { key: "projectedPlatformFees", label: "Platform Fees" },
    { key: "projectedMarketingAdvertising", label: "Marketing/Advertising" },
    { key: "projectedGuestAmenities", label: "Guest Amenities" },
    { key: "projectedTravelTransportation", label: "Travel/Transportation" },
    { key: "projectedProfessionalServices", label: "Professional Services" },
    { key: "projectedMiscellaneousExpenses", label: "Miscellaneous" },
];