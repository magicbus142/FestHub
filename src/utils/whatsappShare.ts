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
  
  // Format donor name
  const teluguName = donation.name?.trim() || '';
  const englishName = donation.name_english?.trim() || '';
  let nameDisplay = teluguName;
  if (englishName && englishName.toLowerCase() !== teluguName.toLowerCase()) {
    nameDisplay = teluguName ? `${teluguName} (${englishName})` : englishName;
  }
  if (!nameDisplay) nameDisplay = 'భక్తులు / Donor';

  // Format category & type
  const isSponsorship = donation.category === 'sponsorship';
  const categoryLabel = isSponsorship ? 'స్పాన్సర్‌షిప్ (Sponsorship)' : 'చందా (Chanda)';
  const typeDetail = donation.type && donation.type !== 'చందా' ? ` [${donation.type}]` : '';

  // Format amount
  const amountStr = donation.amount > 0 
    ? `₹${donation.amount.toLocaleString('en-IN')}`
    : 'స్పాన్సర్ (Sponsored)';

  // Payment mode & status
  const isCash = !donation.donation_mode || donation.donation_mode === 'cash';
  const paymentMethodStr = isCash 
    ? (donation.payment_method === 'upi' ? 'UPI' : 'నగదు (Cash)')
    : (donation.donation_mode === 'goods' ? 'వస్తువులు (Goods)' : 'సేవ (Service)');

  const received = donation.received_amount ?? donation.amount;
  let statusStr = '';
  if (donation.amount > 0 && isCash) {
    if (received >= donation.amount) {
      statusStr = 'నమోదైంది (Received)';
    } else if (received > 0) {
      const due = donation.amount - received;
      statusStr = `పాక్షికం (Received: ₹${received.toLocaleString('en-IN')}, Due: ₹${due.toLocaleString('en-IN')})`;
    } else {
      statusStr = `బాకీ (Pending: ₹${donation.amount.toLocaleString('en-IN')})`;
    }
  }

  // Build formatted WhatsApp message text
  let msg = `🚩 *${organizationName.trim()}* 🚩\n`;
  msg += `🎉 *${fullFestival.trim()}* 🎉\n\n`;
  msg += `💐 *విరాళ రశీదు / Donation Receipt* 💐\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `👤 *దాత పేరు / Donor:* ${nameDisplay}\n`;
  if (donation.flat_no) {
    msg += `🏢 *ఫ్లాట్ నెం / Flat No:* ${donation.flat_no}\n`;
  }
  msg += `🏷️ *విభాగం / Category:* ${categoryLabel}${typeDetail}\n`;
  msg += `💰 *మొత్తం / Amount:* ${amountStr}\n`;
  msg += `💳 *చెల్లింపు రూపం / Payment:* ${paymentMethodStr}\n`;
  if (statusStr) {
    msg += `📌 *స్థితి / Status:* ${statusStr}\n`;
  }
  msg += `━━━━━━━━━━━━━━━━━━━━\n\n`;
  msg += `🙏 *మీ సహాయం మరియు విరాళానికి మనస్ఫూర్తిగా ధన్యవాదాలు!*\n`;
  msg += `*మీ కుటుంబానికి శ్రీ స్వామివారి దివ్య ఆశీస్సులు ఎల్లప్పుడూ ఉండాలని ఆకాంక్షిస్తున్నాము.* 🙏\n\n`;
  msg += `_Thank you for your generous contribution!_`;

  return msg;
}

export function shareOnWhatsApp(data: WhatsAppShareData) {
  const text = generateWhatsAppMessage(data);
  const encodedText = encodeURIComponent(text);
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodedText}`;
  window.open(whatsappUrl, '_blank');
}
