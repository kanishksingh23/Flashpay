import webpush from 'web-push';

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

interface PaymentPushPayload {
  amount: number;
  customerName?: string | null;
  invoiceId: string;
}

export async function sendPaymentPush(
  subscription: PushSubscriptionJSON,
  payload: PaymentPushPayload
) {
  const { amount, customerName, invoiceId } = payload;

  const amountFormatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);

  const title = `💰 Payment received — ${amountFormatted}`;
  const body = customerName
    ? `${customerName} just paid ${amountFormatted}`
    : `${amountFormatted} payment received`;

  const pushPayload = JSON.stringify({
    title,
    body,
    icon: '/icon-192.png',
    badge: '/badge-72.png',
    data: {
      invoiceId,
      amount,
      customerName,
      url: `/dashboard`,
      type: 'payment_received',
    },
    actions: [
      { action: 'view', title: 'View invoice' },
    ],
    tag: `payment-${invoiceId}`,
    requireInteraction: false,
    silent: false,
  });

  await webpush.sendNotification(subscription as any, pushPayload);
}
