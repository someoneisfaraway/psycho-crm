import type { Session } from '../api/sessions';

interface FinancialPeriod {
  from: string; // date string in YYYY-MM-DD format
  to: string; // date string in YYYY-MM-DD format
}

/**
 * Calculate the total revenue from paid sessions within a specific period
 */
export const calculateTotalRevenue = (sessions: Session[], period: FinancialPeriod): number => {
  const filteredSessions = sessions.filter(session => {
    const sessionDate = new Date(session.scheduled_at);
    const fromDate = new Date(period.from);
    const toDate = new Date(period.to);
    return sessionDate >= fromDate && sessionDate <= toDate && session.paid === true;
  });

  return filteredSessions.reduce((total, session) => {
    return total + (session.price || 0);
  }, 0);
};

/**
 * Calculate the total amount still owed by clients for a specific period
 */
export const calculateOutstandingAmount = (sessions: Session[], period: FinancialPeriod): number => {
  const filteredSessions = sessions.filter(session => {
    const sessionDate = new Date(session.scheduled_at);
    const fromDate = new Date(period.from);
    const toDate = new Date(period.to);
    return sessionDate >= fromDate && sessionDate <= toDate && session.paid === false;
  });

  return filteredSessions.reduce((total, session) => {
    return total + (session.price || 0);
  }, 0);
};

/**
 * Calculate the percentage of sessions that have been paid within a period
 */
export const calculatePaymentRate = (sessions: Session[], period: FinancialPeriod): number => {
  const allFilteredSessions = sessions.filter(session => {
    const sessionDate = new Date(session.scheduled_at);
    const fromDate = new Date(period.from);
    const toDate = new Date(period.to);
    return sessionDate >= fromDate && sessionDate <= toDate && session.status !== 'cancelled';
  });

  if (allFilteredSessions.length === 0) {
    return 0;
  }

 const paidSessions = allFilteredSessions.filter(session => session.paid === true);
  return (paidSessions.length / allFilteredSessions.length) * 100;
};

/**
 * Break down revenue by payment type (cash, card, transfer)
 */
export const getRevenueByPaymentType = (sessions: Session[], period: FinancialPeriod) => {
  const filteredSessions = sessions.filter(session => {
    const sessionDate = new Date(session.scheduled_at);
    const fromDate = new Date(period.from);
    const toDate = new Date(period.to);
    return sessionDate >= fromDate && sessionDate <= toDate && 
           session.paid === true && session.payment_method;
  });

  const breakdown: Record<string, number> = {};

  filteredSessions.forEach(session => {
    const type = session.payment_method || 'unknown';
    const amount = session.price || 0;
    breakdown[type] = (breakdown[type] || 0) + amount;
  });

  return breakdown;
};

/**
 * Get a list of clients with outstanding payments
 */
export const getDebtorsList = (sessions: Session[], period: FinancialPeriod) => {
  const filteredSessions = sessions.filter(session => {
    const sessionDate = new Date(session.scheduled_at);
    const fromDate = new Date(period.from);
    const toDate = new Date(period.to);
    return sessionDate >= fromDate && sessionDate <= toDate && 
           session.paid === false && session.price;
  });

  // Group by client_id and sum up the amounts
  const debtors: Record<string, { clientId: string, totalAmount: number, sessionsCount: number }> = {};

  filteredSessions.forEach(session => {
    const clientId = session.client_id;
    const amount = session.price || 0;
    
    if (!debtors[clientId]) {
      debtors[clientId] = {
        clientId,
        totalAmount: 0,
        sessionsCount: 0
      };
    }
    
    debtors[clientId].totalAmount += amount;
    debtors[clientId].sessionsCount += 1;
  });

  return Object.values(debtors);
};

/**
 * Calculate the average fee per session for a period
 */
export const calculateAverageSessionFee = (sessions: Session[], period: FinancialPeriod): number => {
  const paidSessions = sessions.filter(session => {
    const sessionDate = new Date(session.scheduled_at);
    const fromDate = new Date(period.from);
    const toDate = new Date(period.to);
    return sessionDate >= fromDate && sessionDate <= toDate && 
           session.paid === true && session.price;
  });

 if (paidSessions.length === 0) {
    return 0;
  }

  const totalAmount = paidSessions.reduce((sum, session) => {
    return sum + (session.price || 0);
  }, 0);

  return totalAmount / paidSessions.length;
};

/**
 * Get revenue data for multiple months to show trends
 */
export const getMonthlyRevenueTrend = (sessions: Session[], months: number) => {
  const result = [];
  const currentDate = new Date();
  
  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
    const year = date.getFullYear();
    const month = date.getMonth() + 1; // getMonth() returns 0-11, so add 1
    
    // Get the last day of the month
    const lastDay = new Date(year, month, 0).getDate();
    const period: FinancialPeriod = {
      from: `${year}-${month.toString().padStart(2, '0')}-01`,
      to: `${year}-${month.toString().padStart(2, '0')}-${lastDay.toString().padStart(2, '0')}`
    };
    
    const revenue = calculateTotalRevenue(sessions, period);
    
    result.push({
      month: date.toLocaleString('default', { month: 'short' }),
      year,
      revenue
    });
  }
  
  return result;
};