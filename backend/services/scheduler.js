const cron = require('node-cron');
const User = require('../models/User');
const Event = require('../models/Event');
const { sendMail } = require('./emailService');

const startScheduler = () => {
  // Run every 30 minutes
  cron.schedule('*/30 * * * *', async () => {
    console.log('⏰ Running Reminder Scheduler...');
    try {
      const now = new Date();
      // Remind if event starts within next 12 hours
      const thresholdHours = 12;
      const thresholdDate = new Date(now.getTime() + thresholdHours * 60 * 60 * 1000);

      // Find users with reminders
      const users = await User.find({ reminders: { $exists: true, $not: { $size: 0 } } }).populate('reminders');

      for (const user of users) {
        let updated = false;
        for (const event of user.reminders) {
          // Skip if already sent
          if (user.sentReminders.some(id => id.equals(event._id))) continue;

          const eventDate = new Date(`${event.date}T${event.time}:00+05:30`);
          
          // If event is upcoming and within threshold
          if (eventDate > now && eventDate <= thresholdDate) {
            console.log(`📧 Sending reminder to ${user.email} for ${event.prasanga}`);
            
            await sendMail({
              to: user.email,
              subject: `🔔 Reminder: ${event.prasanga} is starting soon!`,
              html: `
                <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:24px;background:#f9f9f9;border-radius:12px;color:#333;border:1px solid #ddd">
                  <div style="text-align:center;margin-bottom:20px">
                    <span style="font-size:40px">🎭</span>
                    <h2 style="color:#E8751A;margin:10px 0">Event Reminder</h2>
                  </div>
                  <p>Hi <strong>${user.displayName}</strong>,</p>
                  <p>This is a friendly reminder that the Yakshagana event you saved is starting soon!</p>
                  <div style="background:#fff;padding:20px;border-radius:8px;border-left:4px solid #E8751A;margin:20px 0;box-shadow:0 2px 4px rgba(0,0,0,0.05)">
                    <h3 style="margin-top:0;color:#1a1a2e">${event.prasanga}</h3>
                    <p style="margin:8px 0"><strong>🎪 Troupe:</strong> ${event.troupe || 'N/A'}</p>
                    <p style="margin:8px 0"><strong>📅 Date:</strong> ${event.date}</p>
                    <p style="margin:8px 0"><strong>🕒 Time:</strong> ${event.time}</p>
                    <p style="margin:8px 0"><strong>📍 Location:</strong> ${event.location}</p>
                  </div>
                  <p>Enjoy the performance!</p>
                  <hr style="border:none;border-top:1px solid #eee;margin:24px 0">
                  <p style="font-size:12px;color:#888;text-align:center">You received this because you set a reminder on YakshaNidhi.</p>
                </div>
              `
            });

            // Mark as sent
            user.sentReminders.push(event._id);
            updated = true;
          }
        }
        if (updated) {
          await user.save();
        }
      }
    } catch (err) {
      console.error('❌ Scheduler Error:', err);
    }
  });
  
  console.log('✅ Background Scheduler Initialized (30m interval)');
};

module.exports = { startScheduler };
