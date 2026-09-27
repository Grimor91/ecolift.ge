const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 465,
  secure: process.env.SMTP_SECURE !== 'false',
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
});

const escape = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function orderHtml(orderId, customer, items) {
  const rows = items
    .map((i) => `<tr><td>${escape(i.code)}</td><td>${escape(i.name)}</td><td align="center">${i.quantity}</td></tr>`)
    .join('');
  return `
    <h2>ახალი შეკვეთა #${orderId}</h2>
    <p><b>სახელი:</b> ${escape(customer.name)}<br>
       <b>ტელეფონი:</b> ${escape(customer.phone)}<br>
       <b>ელ-ფოსტა:</b> ${escape(customer.email || '-')}<br>
       <b>კომპანია:</b> ${escape(customer.company || '-')}</p>
    <p><b>კომენტარი:</b><br>${escape(customer.comment || '-').replace(/\n/g, '<br>')}</p>
    <table border="1" cellpadding="6" cellspacing="0">
      <tr><th>კოდი</th><th>დასახელება</th><th>რაოდენობა</th></tr>${rows}
    </table>`;
}

async function sendOrderEmails(orderId, customer, items) {
  const html = orderHtml(orderId, customer, items);
  await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to: process.env.OWNER_EMAIL,
    replyTo: customer.email || undefined,
    subject: `ახალი შეკვეთა #${orderId} — ${customer.name}`,
    html,
  });
  if (customer.email) {
    await transporter
      .sendMail({
        from: process.env.MAIL_FROM,
        to: customer.email,
        subject: `Ecolift — შეკვეთა #${orderId} მიღებულია`,
        html: `<p>გმადლობთ, თქვენი შეკვეთა მიღებულია. მალე დაგიკავშირდებით.</p>${html}`,
      })
      .catch((err) => console.error('Customer confirmation email failed:', err.message));
  }
}

module.exports = { sendOrderEmails };
