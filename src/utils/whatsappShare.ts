import { Donation } from '@/lib/database';

export interface WhatsAppMessageConfig {
  style?: 'clean' | 'decorative' | 'compact';
  language?: 'english' | 'bilingual' | 'telugu';
  include_emojis?: boolean;
  thankyou_note?: string;
  show_flat?: boolean;
}

export interface WhatsAppShareData {
  donation: Donation;
  organizationName?: string;
  festivalName?: string;
  festivalYear?: number | string;
  config?: WhatsAppMessageConfig;
}

export function generateWhatsAppMessage({
  donation,
  organizationName = 'Festival Manager',
  festivalName = 'Festival',
  festivalYear = '',
  config = {}
}: WhatsAppShareData): string {
  const fullFestival = festivalYear ? `${festivalName} ${festivalYear}` : festivalName;
  
  const style = config.style || 'clean';
  const language = config.language || 'english';
  const includeEmojis = config.include_emojis ?? (style === 'decorative');
  const customThankYou = config.thankyou_note?.trim() || '';

  // Donor Name
  const teluguName = donation.name?.trim() || '';
  const englishName = donation.name_english?.trim() || '';
  let nameDisplay = '';
  if (language === 'english') {
    nameDisplay = englishName || teluguName || 'Valued Donor';
  } else if (language === 'telugu') {
    nameDisplay = teluguName || englishName || 'భక్తులు';
  } else {
    nameDisplay = (teluguName && englishName && teluguName.toLowerCase() !== englishName.toLowerCase())
      ? `${teluguName} (${englishName})`
      : (teluguName || englishName || 'భక్తులు / Donor');
  }

  // Category & Type
  const isSponsorship = donation.category === 'sponsorship';
  let categoryLabel = '';
  if (language === 'english') {
    categoryLabel = isSponsorship ? 'Sponsorship' : 'Chanda';
  } else if (language === 'telugu') {
    categoryLabel = isSponsorship ? 'స్పాన్సర్‌షిప్' : 'చందా';
  } else {
    categoryLabel = isSponsorship ? 'స్పాన్సర్‌షిప్ (Sponsorship)' : 'చందా (Chanda)';
  }
  const typeDetail = donation.type && donation.type !== 'చందా' ? ` (${donation.type})` : '';

  // Amount
  const amountStr = donation.amount > 0 
    ? `₹${donation.amount.toLocaleString('en-IN')}`
    : (language === 'telugu' ? 'స్పాన్సర్' : 'Sponsored');

  // Payment Mode
  const isCash = !donation.donation_mode || donation.donation_mode === 'cash';
  let paymentMethodStr = '';
  if (language === 'english') {
    paymentMethodStr = isCash 
      ? (donation.payment_method === 'upi' ? 'UPI' : 'Cash')
      : (donation.donation_mode === 'goods' ? 'Goods' : 'Service');
  } else if (language === 'telugu') {
    paymentMethodStr = isCash 
      ? (donation.payment_method === 'upi' ? 'UPI' : 'నగదు')
      : (donation.donation_mode === 'goods' ? 'వస్తువులు' : 'సేవ');
  } else {
    paymentMethodStr = isCash 
      ? (donation.payment_method === 'upi' ? 'UPI' : 'నగదు (Cash)')
      : (donation.donation_mode === 'goods' ? 'వస్తువులు (Goods)' : 'సేవ (Service)');
  }

  // Status
  const received = donation.received_amount ?? donation.amount;
  let statusStr = '';
  if (donation.amount > 0 && isCash) {
    if (received >= donation.amount) {
      statusStr = language === 'telugu' ? 'నమోదైంది' : (language === 'english' ? 'Received' : 'నమోదైంది (Received)');
    } else if (received > 0) {
      const due = donation.amount - received;
      statusStr = `Received: ₹${received.toLocaleString('en-IN')}, Due: ₹${due.toLocaleString('en-IN')}`;
    } else {
      statusStr = `Pending (Due: ₹${donation.amount.toLocaleString('en-IN')})`;
    }
  }

  // Thank You Message
  let thankYouMsg = customThankYou;
  if (!thankYouMsg) {
    if (language === 'english') {
      thankYouMsg = 'Thank you very much for your generous contribution! May God bless you and your family.';
    } else if (language === 'telugu') {
      thankYouMsg = 'మీ సాయానికి మరియు విరాళానికి మనస్ఫూర్తిగా ధన్యవాదాలు! భగవంతుని ఆశీస్సులు మీకు ఎల్లప్పుడూ ఉండాలని ఆశిస్తున్నాము.';
    } else {
      thankYouMsg = 'మీ సాయానికి మనస్ఫూర్తిగా ధన్యవాదాలు! Thank you very much for your generous contribution!';
    }
  }

  // BUILD MESSAGE TEXT BASED ON STYLE
  let msg = '';

  if (style === 'compact') {
    const iconHeader = includeEmojis ? '🚩 ' : '';
    msg = `${iconHeader}*${organizationName.trim()}* (${fullFestival.trim()})\n`;
    msg += `Receipt: ${nameDisplay} | ${categoryLabel}${typeDetail} | ${amountStr} (${paymentMethodStr})\n`;
    msg += `${thankYouMsg}${includeEmojis ? ' 🙏' : ''}`;
    return msg;
  }

  if (style === 'decorative') {
    const flagIcon = includeEmojis ? '🚩 ' : '';
    const partyIcon = includeEmojis ? '🎉 ' : '';
    const flowerIcon = includeEmojis ? '💐 ' : '';
    const userIcon = includeEmojis ? '👤 ' : '';
    const flatIcon = includeEmojis ? '🏢 ' : '';
    const tagIcon = includeEmojis ? '🏷️ ' : '';
    const moneyIcon = includeEmojis ? '💰 ' : '';
    const cardIcon = includeEmojis ? '💳 ' : '';
    const pinIcon = includeEmojis ? '📌 ' : '';
    const prayIcon = includeEmojis ? ' 🙏' : '';

    msg = `${flagIcon}*${organizationName.trim().toUpperCase()}* ${flagIcon}\n`;
    msg += `${partyIcon}*${fullFestival.trim()}* ${partyIcon}\n\n`;
    msg += `${flowerIcon}*DONATION RECEIPT* ${flowerIcon}\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `${userIcon}*Donor Name:* ${nameDisplay}\n`;
    if (donation.flat_no && config.show_flat !== false) {
      msg += `${flatIcon}*Flat No:* ${donation.flat_no}\n`;
    }
    msg += `${tagIcon}*Category:* ${categoryLabel}${typeDetail}\n`;
    msg += `${moneyIcon}*Amount:* ${amountStr}\n`;
    msg += `${cardIcon}*Payment Mode:* ${paymentMethodStr}\n`;
    if (statusStr) {
      msg += `${pinIcon}*Status:* ${statusStr}\n`;
    }
    msg += `━━━━━━━━━━━━━━━━━━━━\n\n`;
    msg += `${thankYouMsg}${prayIcon}`;
    return msg;
  }

  // Default / Clean Style
  const prayIcon = includeEmojis ? ' 🙏' : '';
  msg = `*${organizationName.trim().toUpperCase()}*\n`;
  msg += `*${fullFestival.trim()}*\n\n`;
  msg += `*DONATION RECEIPT*\n`;
  msg += `----------------------------------------\n`;
  msg += `*Donor Name:* ${nameDisplay}\n`;
  if (donation.flat_no && config.show_flat !== false) {
    msg += `*Flat No:* ${donation.flat_no}\n`;
  }
  msg += `*Category:* ${categoryLabel}${typeDetail}\n`;
  msg += `*Amount:* ${amountStr}\n`;
  msg += `*Payment Mode:* ${paymentMethodStr}\n`;
  if (statusStr) {
    msg += `*Status:* ${statusStr}\n`;
  }
  msg += `----------------------------------------\n\n`;
  msg += `${thankYouMsg}${prayIcon}`;

  return msg;
}

export function shareOnWhatsApp(data: WhatsAppShareData) {
  const text = generateWhatsAppMessage(data);
  const encodedText = encodeURIComponent(text);
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodedText}`;
  window.open(whatsappUrl, '_blank');
}
