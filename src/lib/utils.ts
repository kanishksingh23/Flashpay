import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

export function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(dateString));
}

export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
  if (match) return `(${match[1]}) ${match[2]}-${match[3]}`;
  return phone;
}

export function generateInvoiceNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `FP-${timestamp}-${random}`;
}

export function calculateSavingsVsCard(amount: number): number {
  const cardFeeRate = 0.026; // Square standard 2.6%
  const bankFeeRate = 0.008; // FlashPay ACH 0.8%
  return amount * (cardFeeRate - bankFeeRate);
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    paid: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
    pending: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
    overdue: 'text-red-400 bg-red-400/10 border-red-400/20',
    cancelled: 'text-zinc-400 bg-zinc-400/10 border-zinc-400/20',
  };
  return colors[status] || colors.pending;
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    paid: 'Paid',
    pending: 'Pending',
    overdue: 'Overdue',
    cancelled: 'Cancelled',
  };
  return labels[status] || 'Unknown';
}
