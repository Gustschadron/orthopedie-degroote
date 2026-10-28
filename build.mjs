// Bouwt dist/ uit content/site.json. Geen dependencies nodig (behalve decap-cms voor /admin).
import { readFileSync, writeFileSync, mkdirSync, cpSync, rmSync } from 'node:fs';

const d = JSON.parse(readFileSync('content/site.json', 'utf8'));
const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
const paras = a => (a || []).map(t => `<p>${esc(t)}</p>`).join('');

const c = d.contact;
const tel = 'tel:+32' + c.phone.replace(/\D/g, '').replace(/^0/, '');
const mail = 'mailto:' + c.email;
const maps = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(`${c.street} ${c.city}`);
const photo = /^\/uploads\/[\w./-]+$/.test(d.about.photo || '') ? d.about.photo : '';

const html = `<!DOCTYPE html>
<html lang="nl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(d.site.title)}</title>
<meta name="description" content="${esc(d.site.description)}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/style.css">
</head>
<body>

<header>
  <div class="wrap bar">
    <a class="brand" href="#top">${esc(c.name)}</a>
    <nav aria-label="Hoofdmenu">
      <a href="#over">Over mij</a>
      <a href="#diensten">Diensten</a>
      <a href="#terugbetaling">Terugbetaling</a>
      <a href="#contact">Contact</a>
    </nav>
    <a class="btn" href="${esc(tel)}">${esc(c.phone)}</a>
  </div>
</header>
<div class="strip"><div class="wrap"><span>${esc(c.street)}, ${esc(c.city)}</span><span>${esc(d.topbar.note)}</span></div></div>

<main id="top">
  <div class="hero">
    <div class="wrap">
      <div>
        <h1>${esc(d.hero.title)}</h1>
        <p class="lead">${esc(d.hero.lead)}</p>
        <div class="actions">
          <a class="btn" href="${esc(tel)}">${esc(d.hero.callLabel)}</a>
          <a class="btn ghost" href="${esc(mail)}">${esc(d.hero.mailLabel)}</a>
        </div>
      </div>
      <div class="panel" role="img" aria-label="Decoratieve afbeelding met vloeiende lijnen">
        <svg viewBox="0 0 400 500" preserveAspectRatio="xMidYMid slice" fill="none" stroke="currentColor" stroke-width="2"><path d="M-20 420C80 360 120 260 220 250s150 70 220-40"/><path d="M-20 380C80 320 120 220 220 210s150 70 220-40"/><path d="M-20 340C80 280 120 180 220 170s150 70 220-40"/><path d="M-20 300C80 240 120 140 220 130s150 70 220-40"/><path d="M-20 260C80 200 120 100 220 90s150 70 220-40"/></svg>
        <p><b>${esc(d.hero.badgeTitle)}</b>${esc(d.hero.badgeText)}</p>
      </div>
    </div>
  </div>

  <section id="over" class="soft">
    <div class="wrap about">
      ${photo
        ? `<div class="portrait"><img src="${esc(photo)}" alt="${esc(d.about.name)}" loading="lazy"></div>`
        : `<div class="portrait" aria-hidden="true">${esc(d.about.initials)}</div>`}
      <div>
        <p class="role">${esc(d.about.role)}</p>
        <h2>${esc(d.about.name)}</h2>
        ${paras(d.about.paragraphs)}
      </div>
    </div>
  </section>

  <section id="diensten">
    <div class="wrap">
      <h2>${esc(d.services.title)}</h2>
      <p class="intro">${esc(d.services.intro)}</p>
      <ul class="services">
        ${d.services.items.map(i => `<li><h3>${esc(i.title)}</h3><p>${esc(i.text)}</p></li>`).join('\n        ')}
      </ul>
    </div>
  </section>

  <section id="terugbetaling" class="soft">
    <div class="wrap">
      <h2>${esc(d.refund.title)}</h2>
      <p class="intro">${esc(d.refund.intro)}</p>
      <div class="faq">
        ${d.refund.items.map(i => `<details>
          <summary>${esc(i.title)}</summary>
          <div>${paras(i.paragraphs)}</div>
        </details>`).join('\n        ')}
      </div>
    </div>
  </section>

  <section id="contact">
    <div class="wrap contact">
      <div>
        <h2>Contact &amp; adres</h2>
        <dl>
          <dt>Naam</dt><dd>${esc(c.name)}</dd>
          <dt>Adres</dt><dd>${esc(c.street)}<br>${esc(c.city)}</dd>
          <dt>Telefoon</dt><dd><a href="${esc(tel)}">${esc(c.phone)}</a></dd>
          <dt>E-mail</dt><dd><a href="${esc(mail)}">${esc(c.email)}</a></dd>
        </dl>
        <p class="mt"><a class="btn" href="${esc(maps)}" target="_blank" rel="noopener">Open in Google Maps</a></p>
      </div>
      <div>
        <h2>${esc(d.appointment.title)}</h2>
        <ol>
          ${d.appointment.items.map(t => `<li>${esc(t)}</li>`).join('\n          ')}
        </ol>
      </div>
    </div>
  </section>
</main>

<footer>
  <div class="wrap">© ${esc(c.name)} — ${esc(c.street)}, ${esc(c.city)} — ${esc(c.phone)}${d.footer.note ? ' — ' + esc(d.footer.note) : ''}</div>
</footer>

</body>
</html>
`;

rmSync('dist', { recursive: true, force: true });
mkdirSync('dist/admin', { recursive: true });
writeFileSync('dist/index.html', html);
cpSync('style.css', 'dist/style.css');
cpSync('robots.txt', 'dist/robots.txt');
cpSync('_headers', 'dist/_headers');
cpSync('static', 'dist', { recursive: true });
cpSync('admin/index.html', 'dist/admin/index.html');
cpSync('admin/config.yml', 'dist/admin/config.yml');
// Decap zelf hosten i.p.v. via CDN: geen externe scripts in /admin
cpSync('node_modules/decap-cms/dist/decap-cms.js', 'dist/admin/decap-cms.js');
console.log('Build klaar → dist/');
