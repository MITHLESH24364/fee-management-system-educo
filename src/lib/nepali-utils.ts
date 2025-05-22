
// import { NepaliMonth } from "@/types";

// // Array of Nepali months in order
// export const nepaliMonths: NepaliMonth[] = [
//   "Baisakh", "Jestha", "Ashad", "Shrawan", "Bhadra", "Ashoj",
//   "Kartik", "Mangsir", "Poush", "Magh", "Falgun", "Chaitra"
// ];

// // Map English months to equivalent Nepali months (simplified mapping)
// const englishToNepaliMonthMap: Record<number, NepaliMonth> = {
//   0: "Magh",      // January
//   1: "Falgun",    // February
//   2: "Chaitra",   // March
//   3: "Baisakh",   // April
//   4: "Jestha",    // May
//   5: "Ashad",     // June
//   6: "Shrawan",   // July
//   7: "Bhadra",    // August
//   8: "Ashoj",     // September
//   9: "Kartik",    // October
//   10: "Mangsir",  // November
//   11: "Poush"     // December
// };

// // Calculate rough Nepali year - English year + 56/57 (simplified)
// const calculateNepaliYear = (date: Date): number => {
//   const englishYear = date.getFullYear();
//   const englishMonth = date.getMonth();
  
//   // If it's April or later, add 57, otherwise add 56
//   // This is a simplified conversion and may not be accurate for all dates
//   return englishYear + (englishMonth >= 3 ? 57 : 56);
// };

// // Function to get the current Nepali month based on English date
// export function getCurrentNepaliMonth(): NepaliMonth {
//   const currentDate = new Date();
//   const currentMonth = currentDate.getMonth();
//   return englishToNepaliMonthMap[currentMonth];
// }

// // Function to get current Nepali year based on English date
// export function getCurrentNepaliYear(): number {
//   return calculateNepaliYear(new Date());
// }

// // Function to format English date to Nepali date string in DD Month, YYYY format
// export function formatNepaliDate(dateString: string): string {
//   try {
//     const date = new Date(dateString);
//     if (isNaN(date.getTime())) {
//       return "Invalid Date";
//     }
    
//     const day = date.getDate();
//     const nepaliMonth = englishToNepaliMonthMap[date.getMonth()];
//     const nepaliYear = calculateNepaliYear(date);
    
//     // Add correct suffix to day number (1st, 2nd, 3rd, etc.)
//     const dayWithSuffix = addDaySuffix(day);
    
//     return `${dayWithSuffix} ${nepaliMonth}, ${nepaliYear}`;
//   } catch (error) {
//     console.error("Error formatting date:", error);
//     return "Error in date";
//   }
// }

// // Helper function to add correct suffix to day number
// function addDaySuffix(day: number): string {
//   if (day > 3 && day < 21) return day + 'th';
  
//   switch (day % 10) {
//     case 1: return day + 'st';
//     case 2: return day + 'nd';
//     case 3: return day + 'rd';
//     default: return day + 'th';
//   }
// }

// // Function to get next Nepali month
// export function getNextNepaliMonth(month: NepaliMonth): NepaliMonth {
//   const currentIndex = nepaliMonths.indexOf(month);
//   const nextIndex = (currentIndex + 1) % 12;
//   return nepaliMonths[nextIndex];
// }

// // Function to get previous Nepali month
// export function getPreviousNepaliMonth(month: NepaliMonth): NepaliMonth {
//   const currentIndex = nepaliMonths.indexOf(month);
//   const prevIndex = currentIndex === 0 ? 11 : currentIndex - 1;
//   return nepaliMonths[prevIndex];
// }

// // Enhanced function to convert Nepali month to number for accurate comparisons
// export function nepaliMonthToNumber(month: string): number {
//   const months = [
//     'Baisakh', 'Jestha', 'Ashad', 'Shrawan', 
//     'Bhadra', 'Ashoj', 'Kartik', 'Mangsir', 
//     'Poush', 'Magh', 'Falgun', 'Chaitra'
//   ];
//   const index = months.indexOf(month);
//   return index !== -1 ? index : 0; // Return 0 if month not found to prevent errors
// }

// // Function to determine if a payment is from a previous period
// export function isPreviousPeriod(paymentMonth: string, paymentYear: number, currentMonth: string, currentYear: number): boolean {
//   if (paymentYear < currentYear) {
//     return true;
//   }
//   if (paymentYear === currentYear && nepaliMonthToNumber(paymentMonth) < nepaliMonthToNumber(currentMonth)) {
//     return true;
//   }
//   return false;
// }

// // Calculate total pending amounts from a collection of fee payments
// // Modified to avoid counting the same pending payment multiple times
// export function calculateTotalPendingAmount(payments: Array<{amount: number, isPending: boolean}>): number {
//   return payments
//     .filter(payment => payment.isPending)
//     .reduce((total, payment) => total + payment.amount, 0);
// }

// // New function to filter out duplicate pending fees by month and year
// // This ensures we don't double count the same pending fee
// // FIXED: Now preserves the full FeePayment type structure
// export function getUniquePendingPayments<T extends {month: string, year: number}>(payments: T[]): T[] {
//   const uniqueMap = new Map<string, T>();
  
//   payments.forEach(payment => {
//     const key = `${payment.month}-${payment.year}`;
//     if (!uniqueMap.has(key)) {
//       uniqueMap.set(key, payment);
//     }
//   });
  
//   return Array.from(uniqueMap.values());
// }




import { NepaliMonth } from "@/types";
import NepaliDate from "nepali-date";
import { ad2bs } from "nepali-dayjs-date-converter";

// Array of Nepali months in order
export const nepaliMonths: NepaliMonth[] = [
  "Baisakh", "Jestha", "Ashad", "Shrawan", "Bhadra", "Ashoj",
  "Kartik", "Mangsir", "Poush", "Magh", "Falgun", "Chaitra"
];

// Map English months to equivalent Nepali months (simplified mapping)
const englishToNepaliMonthMap: Record<number, NepaliMonth> = {
  0: "Magh",      // January
  1: "Falgun",    // February
  2: "Chaitra",   // March
  3: "Baisakh",   // April
  4: "Jestha",    // May
  5: "Ashad",     // June
  6: "Shrawan",   // July
  7: "Bhadra",    // August
  8: "Ashoj",     // September
  9: "Kartik",    // October
  10: "Mangsir",  // November
  11: "Poush"     // December
};

// Calculate rough Nepali year - English year + 56/57 (simplified)
const calculateNepaliYear = (date: Date): number => {
  const englishYear = date.getFullYear();
  const englishMonth = date.getMonth();

  // If it's April or later, add 57, otherwise add 56
  // This is a simplified conversion and may not be accurate for all dates
  return englishYear + (englishMonth >= 3 ? 57 : 56);
};

// Function to get the current Nepali month based on English date
export function getCurrentNepaliMonth(): NepaliMonth {
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  return englishToNepaliMonthMap[currentMonth];
}

// Function to get current Nepali year based on English date
export function getCurrentNepaliYear(): number {
  return calculateNepaliYear(new Date());
}

// Function to format English date to Nepali date string in DD Month, YYYY format
export function formatNepaliDate(dateString: string): string {
  try {
    // const date = new Date(dateString);
    // if (isNaN(date.getTime())) {
    //   return "Invalid Date";
    // }

    // const day = date.getDate();
    // const nepaliMonth = englishToNepaliMonthMap[date.getMonth()];
    // const nepaliYear = calculateNepaliYear(date);

    // // Add correct suffix to day number (1st, 2nd, 3rd, etc.)
    // const dayWithSuffix = addDaySuffix(day);

    // return `${dayWithSuffix} ${nepaliMonth}, ${nepaliYear}`;

    const convertedNepaliDate = ad2bs(dateString); // 2081-02-32
    // const convertedNepaliDate = ad2bs(dayjs.utc().local().format("YYYY-MM-D")); // 2081-02-32
    const formatedDate = new NepaliDate(convertedNepaliDate).format(
      "D MMMM, YYYY"
    );

    return formatedDate

  } catch (error) {
    console.error("Error formatting date:", error);
    return "Error in date";
  }
}

// Helper function to add correct suffix to day number
function addDaySuffix(day: number): string {
  if (day > 3 && day < 21) return day + 'th';

  switch (day % 10) {
    case 1: return day + 'st';
    case 2: return day + 'nd';
    case 3: return day + 'rd';
    default: return day + 'th';
  }
}

// Function to get next Nepali month
export function getNextNepaliMonth(month: NepaliMonth): NepaliMonth {
  const currentIndex = nepaliMonths.indexOf(month);
  const nextIndex = (currentIndex + 1) % 12;
  return nepaliMonths[nextIndex];
}

// Function to get previous Nepali month
export function getPreviousNepaliMonth(month: NepaliMonth): NepaliMonth {
  const currentIndex = nepaliMonths.indexOf(month);
  const prevIndex = currentIndex === 0 ? 11 : currentIndex - 1;
  return nepaliMonths[prevIndex];
}

// Enhanced function to convert Nepali month to number for accurate comparisons
export function nepaliMonthToNumber(month: string): number {
  const months = [
    'Baisakh', 'Jestha', 'Ashad', 'Shrawan',
    'Bhadra', 'Ashoj', 'Kartik', 'Mangsir',
    'Poush', 'Magh', 'Falgun', 'Chaitra'
  ];
  const index = months.indexOf(month);
  return index !== -1 ? index : 0; // Return 0 if month not found to prevent errors
}

// Function to determine if a payment is from a previous period
export function isPreviousPeriod(paymentMonth: string, paymentYear: number, currentMonth: string, currentYear: number): boolean {
  if (paymentYear < currentYear) {
    return true;
  }
  if (paymentYear === currentYear && nepaliMonthToNumber(paymentMonth) < nepaliMonthToNumber(currentMonth)) {
    return true;
  }
  return false;
}

// Calculate total pending amounts from a collection of fee payments
// Modified to avoid counting the same pending payment multiple times
export function calculateTotalPendingAmount(payments: Array<{ amount: number, isPending: boolean }>): number {
  return payments
    .filter(payment => payment.isPending)
    .reduce((total, payment) => total + payment.amount, 0);
}

// New function to filter out duplicate pending fees by month and year
// This ensures we don't double count the same pending fee
// FIXED: Now preserves the full FeePayment type structure
export function getUniquePendingPayments<T extends { month: string, year: number }>(payments: T[]): T[] {
  const uniqueMap = new Map<string, T>();

  payments.forEach(payment => {
    const key = `${payment.month}-${payment.year}`;
    if (!uniqueMap.has(key)) {
      uniqueMap.set(key, payment);
    }
  });

    return Array.from(uniqueMap.values());
  }