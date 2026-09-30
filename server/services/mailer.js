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

const EQUIPMENT = { passenger: 'სამგზავრო ლიფტი', freight: 'სატვირთო ლიფტი', escalator: 'ესკალატორი', other: 'სხვა' };
const ISSUES = {
  stopped: 'ლიფტი გაჩერდა',
  stuck: 'ადამიანი გაიჭედა',
  doors: 'კარების პრობლემა',
  noise: 'ხმაური ან ვიბრაცია',
  maintenance: 'გეგმიური მომსახურება',
  modernization: 'მოდერნიზაცია',
  other: 'სხვა',
};

async function sendServiceRequestEmail(id, r) {
  const urgent = r.urgent ? '🔴 სასწრაფო — ' : '';
  await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to: process.env.OWNER_EMAIL,
    subject: `${urgent}სერვისის განაცხადი #${id} — ${ISSUES[r.issue] || r.issue}, ${r.address}`,
    html: `
      <h2>${r.urgent ? '<span style="color:#c0392b">სასწრაფო</span> ' : ''}სერვისის განაცხადი #${id}</h2>
      <p><b>სახელი:</b> ${escape(r.name)}<br>
         <b>ტელეფონი:</b> <a href="tel:${escape(r.phone)}">${escape(r.phone)}</a><br>
         <b>მისამართი:</b> ${escape(r.address)}</p>
      <p><b>მოწყობილობა:</b> ${escape(EQUIPMENT[r.equipment] || r.equipment)}<br>
         <b>პრობლემა:</b> ${escape(ISSUES[r.issue] || r.issue)}</p>
      <p><b>კომენტარი:</b><br>${escape(r.comment || '-').replace(/\n/g, '<br>')}</p>`,
  });
}

const PRODUCTS = {
  passenger: 'სამგზავრო ლიფტი',
  freight: 'სატვირთო ლიფტი',
  panoramic: 'პანორამული ლიფტი',
  home: 'საცხოვრებელი სახლის ლიფტი',
  escalator: 'ესკალატორი',
  other: 'სხვა',
};
const BUILDINGS = {
  residential: 'საცხოვრებელი კორპუსი',
  house: 'კერძო სახლი',
  office: 'ოფისი ან ბიზნეს ცენტრი',
  hotel: 'სასტუმრო',
  hospital: 'საავადმყოფო',
  mall: 'სავაჭრო ცენტრი',
  industrial: 'საწარმო ან საწყობი',
  other: 'სხვა',
};
const CAPACITIES = { 400: '400 კგ (5 კაცი)', 630: '630 კგ (8 კაცი)', 1000: '1000 კგ (13 კაცი)', 1600: '1600 კგ და მეტი', unsure: 'არ ვიცი' };

async function sendQuoteRequestEmail(id, q) {
  await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to: process.env.OWNER_EMAIL,
    replyTo: q.email || undefined,
    subject: `ფასის მოთხოვნა #${id} — ${PRODUCTS[q.product]}, ${q.name}`,
    html: `
      <h2>ფასის მოთხოვნა #${id}</h2>
      <p><b>სახელი:</b> ${escape(q.name)}<br>
         <b>ტელეფონი:</b> <a href="tel:${escape(q.phone)}">${escape(q.phone)}</a><br>
         <b>ელ-ფოსტა:</b> ${escape(q.email || '-')}<br>
         <b>კომპანია:</b> ${escape(q.company || '-')}<br>
         <b>ქალაქი:</b> ${escape(q.city || '-')}</p>
      <p><b>რა სჭირდება:</b> ${escape(PRODUCTS[q.product])}<br>
         <b>შენობა:</b> ${escape(BUILDINGS[q.building])}<br>
         <b>სართულები:</b> ${q.floors ?? '-'}<br>
         <b>ტვირთამწეობა:</b> ${escape(CAPACITIES[q.capacity])}</p>
      <p><b>კომენტარი:</b><br>${escape(q.comment || '-').replace(/\n/g, '<br>')}</p>`,
  });
}

module.exports = {
  sendOrderEmails,
  sendServiceRequestEmail,
  sendQuoteRequestEmail,
  EQUIPMENT,
  ISSUES,
  PRODUCTS,
  BUILDINGS,
  CAPACITIES,
};
