const nodemailer = require('nodemailer');

const {
  EMAIL_SERVER_HOST,
  EMAIL_SERVER_PORT,
  EMAIL_ADMIN_USER,
  EMAIL_PASSWORD,
} = require('../config');

const sendEmail = async (options) => {
  const transporter = nodemailer.createTransport({
    host: EMAIL_SERVER_HOST,
    port: EMAIL_SERVER_PORT,
    secure: false, // true for port 465, false for other ports
    auth: {
      user: EMAIL_ADMIN_USER,
      pass: EMAIL_PASSWORD,
    },
  });

  const mailOptions = {
    from: '"Brighton " <register-students@bebrighton.net>',
    to: 'richardgarcia2499@gmail.com',
    // to: 'info@bebrighton.net, recepcionbrighton@gmail.com',
    subject: options.subject,
    text: options.text,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
