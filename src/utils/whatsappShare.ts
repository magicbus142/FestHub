import { Donation } from '@/lib/database';

export interface WhatsAppShareData {
  donation: Donation;
  organizationName?: string;
  festivalName?: string;
  festivalYear?: number | string;
}

export function generateWhatsAppMessage({
  donation,
  organizationName = 'Festival Manager',
  festivalName = 'Festival',
  festivalYear = ''
}: WhatsAppShareData): string {
  const fullFestival = festivalYear ? `${festivalName} ${festivalYear}` : festivalName;
  
  // Format donor name (English preferred, fallback to Telugu)
  const englishName = donation.name_english?.trim() || '';
  const teluguName = donation.name?.trim() || '';
  const nameDisplay = englishName || teluguName || 'Valued Donor';

  // Format category & type
  const isSponsorship = donation.category === 'sponsorship';
  const categoryLabel = isSponsorship ? 'Sponsorship' : 'Chanda';
  const typeDetail = donation.type && donation.type !== 'చందా' ? ` (${donation.type})` : '';

  // Format amount
  const amountStr = donation.amount > 0 
    ? `₹${donation.amount.toLocaleString('en-IN')}`
    : 'Sponsored';

  // Payment mode & status
  const isCash = !donation.donation_mode || donation.donation_mode === 'cash';
  const paymentMethodStr = isCash 
    ? (donation.payment_method === 'upi' ? 'UPI' : 'Cash')
    : (donation.donation_mode === 'goods' ? 'Goods' : 'Service');

  const received = donation.received_amount ?? donation.amount;
  let statusStr = '';
  if (donation.amount > 0 && isCash) {
    if (received >= donation.amount) {
      statusStr = 'Received';
    } else if (received > 0) {
      const due = donation.amount - received;
      statusStr = `Partial (Received: ₹${received.toLocaleString('en-IN')}, Due: ₹${due.toLocaleString('en-IN')})`;
    } else {
      statusStr = `Pending (Due: ₹${donation.amount.toLocaleString('en-IN')})`;
    }
  }

  // Build clean English WhatsApp message text with minimal emojis
  let msg = `*${organizationName.trim().toUpperCase()}*\n`;
  msg += `*${fullFestival.trim()}*\n\n`;
  msg += `*DONATION RECEIPT*\n`;
  msg += `----------------------------------------\n`;
  msg += `*Donor Name:* ${nameDisplay}\n`;
  if (donation.flat_no) {
    msg += `*Flat No:* ${donation.flat_no}\n`;
  }
  msg += `*Category:* ${categoryLabel}${typeDetail}\n`;
  msg += `*Amount:* ${amountStr}\n`;
  msg += `*Payment Mode:* ${paymentMethodStr}\n`;
  if (statusStr) {
    msg += `*Status:* ${statusStr}\n`;
  }
  msg += `----------------------------------------\n\n`;
  msg += `Thank you very much for your generous contribution! May God bless you and your family. 🙏`;

  return msg;
}

export function shareOnWhatsApp(data: WhatsAppShareData) {
  const text = generateWhatsAppMessage(data);
  const encodedText = encodeURIComponent(text);
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodedText}`;
  window.open(whatsappUrl, '_blank');
}
