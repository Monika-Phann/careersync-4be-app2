const axios = require('axios');

/**
 * Telegram Service
 * Sends notifications to Telegram bot/channel
 */

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

/**
 * Send Telegram Notification
 * @param {Object} userData - User data to send
 * @param {String} creatorName - Name of the creator (admin/system)
 */
const sendTelegramNotification = async (userData, creatorName = 'System') => {
  // If Telegram credentials are not configured, skip silently
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.log('Telegram notification skipped: Bot token or chat ID not configured');
    return;
  }

  try {
    const {
      first_name = 'N/A',
      last_name = 'N/A',
      email = 'N/A',
      phone = 'N/A',
      gender = 'N/A',
      role_name = 'N/A',
      types_user = 'N/A',
      institution_name = 'N/A',
      company_name = 'N/A',
      job_title = 'N/A',
      expertise_areas = 'N/A',
      status = 'N/A'
    } = userData;

    // Format message based on role
    let message = `🔔 *New User Registration*\n\n`;
    message += `👤 *Name:* ${first_name} ${last_name}\n`;
    message += `📧 *Email:* ${email}\n`;
    message += `📱 *Phone:* ${phone}\n`;
    message += `⚧ *Gender:* ${gender}\n`;
    message += `🎭 *Role:* ${role_name.toUpperCase()}\n`;
    message += `📊 *Status:* ${status}\n`;
    
    if (role_name === 'acc_user') {
      message += `👨‍🎓 *User Type:* ${types_user}\n`;
      message += `🏫 *Institution:* ${institution_name}\n`;
    } else if (role_name === 'mentor') {
      message += `🏢 *Company:* ${company_name}\n`;
      message += `💼 *Job Title:* ${job_title}\n`;
      message += `🎯 *Expertise:* ${expertise_areas}\n`;
    }
    
    message += `\n✍️ *Created By:* ${creatorName}`;
    message += `\n⏰ *Time:* ${new Date().toLocaleString()}`;

    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    
    await axios.post(url, {
      chat_id: TELEGRAM_CHAT_ID,
      text: message,
      parse_mode: 'Markdown'
    });

    console.log('✅ Telegram notification sent successfully');
  } catch (error) {
    console.error('❌ Telegram notification failed:', error.message);
    // Don't throw error - telegram failures shouldn't block user creation
  }
};

module.exports = {
  sendTelegramNotification
};
