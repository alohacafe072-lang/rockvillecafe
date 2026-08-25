// Verstuurt e-mail namens Rockville Café via Resend.
// Draait op Vercel — de API-sleutel staat in de omgevingsvariabelen,
// niet in de code en niet in de website.

const AFZENDER   = 'Rockville Café <reservations@rockvillecafe.nl>';
const ANTWOORD   = 'reservations@rockvillecafe.nl';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ fout: 'Alleen POST' });
  }

  const sleutel = process.env.RESEND_API_KEY;
  if (!sleutel) {
    return res.status(500).json({ fout: 'RESEND_API_KEY ontbreekt in Vercel' });
  }

  const { soort, naar, gegevens, eigenTekst } = req.body || {};

  if (!naar || !soort) {
    return res.status(400).json({ fout: 'Ontbrekende gegevens' });
  }

  let onderwerp, tekst;

  if (soort === 'bevestiging') {
    onderwerp = 'Je reservering bij Rockville Café is bevestigd';
    tekst =
`Hoi ${gegevens.naam},

Je tafel staat klaar. We zien je op ${gegevens.datum} om ${gegevens.tijd} met ${gegevens.aantal} personen.

Kun je onverhoopt niet? Laat het ons even weten, dan kunnen we de tafel aan iemand anders geven.

Tot dan!

met vriendelijke groet,

Rockville Café`;

  } else if (soort === 'annulering') {
    onderwerp = 'Over je reservering bij Rockville Café';
    tekst =
`Hoi ${gegevens.naam},

Helaas kunnen we je reservering voor ${gegevens.datum} om ${gegevens.tijd} niet bevestigen — het zit die avond vol.

Een ander moment? Laat het weten, we kijken graag mee.

Sorry voor het ongemak,

met vriendelijke groet,

Rockville Café`;

  } else if (soort === 'quiz-bevestiging') {
    onderwerp = 'Je team is ingeschreven — Rockville Café';
    tekst =
`Hoi ${gegevens.naam},

Team ${gegevens.team} staat ingeschreven voor ${gegevens.evenement}.

Kom op tijd, dan kunnen we op tijd beginnen. Kun je toch niet? Geef het even door.

Tot dan!

met vriendelijke groet,

Rockville Café`;

  } else if (soort === 'quiz-annulering') {
    onderwerp = 'Over je inschrijving — Rockville Café';
    tekst =
`Hoi ${gegevens.naam},

Helaas kunnen we team ${gegevens.team} niet inschrijven voor ${gegevens.evenement} — het zit vol.

Een volgende keer? Laat het weten, dan houden we een plek vrij.

Sorry voor het ongemak,

met vriendelijke groet,

Rockville Café`;

  } else if (soort === 'intern') {
    // Seintje naar de zaak zelf — niet naar de gast
    const isQuiz = eigenTekst === 'quiz';
    onderwerp = isQuiz
      ? `Nieuwe quiz-inschrijving: ${gegevens.teamnaam}`
      : `Nieuwe reservering: ${gegevens.naam} — ${gegevens.datum} ${(gegevens.tijdstip||'').slice(0,5)}`;

    tekst = isQuiz
? `Nieuwe quiz-inschrijving via de website.

Team:          ${gegevens.teamnaam}
Contactpersoon: ${gegevens.contactpersoon}
Deelnemers:    ${gegevens.aantal_deelnemers}
Evenement:     ${gegevens.evenement}
Telefoon:      ${gegevens.telefoon}
E-mail:        ${gegevens.email}

Bevestigen of annuleren doe je in het reserveringsscherm:
https://www.rockvillecafe.nl/admin.html`
: `Nieuwe reservering via de website.

Naam:      ${gegevens.naam}
Datum:     ${gegevens.datum}
Tijd:      ${(gegevens.tijdstip||'').slice(0,5)}
Personen:  ${gegevens.aantal}
Zin in:    ${gegevens.gelegenheid || '—'}
Telefoon:  ${gegevens.telefoon}
E-mail:    ${gegevens.email}

Opmerkingen:
${gegevens.opmerkingen || '—'}

Bevestigen of annuleren doe je in het reserveringsscherm:
https://www.rockvillecafe.nl/admin.html`;

    // ---- Zelfde bericht, maar met opmaak en klikbare knoppen ----
    const veilig = t => String(t ?? '—')
      .replace(/[<>&"]/g, c => ({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;'}[c]));

    const naamGast = isQuiz ? gegevens.contactpersoon : gegevens.naam;
    const antwoordTekst = `Hoi ${naamGast || ''},\n\n\n\nmet vriendelijke groet,\n\nRockville Café`;
    const antwoordLink =
      `mailto:${gegevens.email}` +
      `?subject=${encodeURIComponent(isQuiz ? 'Over je inschrijving bij Rockville Café' : 'Over je reservering bij Rockville Café')}` +
      `&body=${encodeURIComponent(antwoordTekst)}`;

    const regels = isQuiz
      ? [['Team', gegevens.teamnaam],
         ['Contactpersoon', gegevens.contactpersoon],
         ['Deelnemers', gegevens.aantal_deelnemers],
         ['Evenement', gegevens.evenement],
         ['Telefoon', gegevens.telefoon],
         ['E-mail', gegevens.email]]
      : [['Datum', gegevens.datum],
         ['Tijd', (gegevens.tijdstip||'').slice(0,5)],
         ['Personen', gegevens.aantal],
         ['Zin in', gegevens.gelegenheid],
         ['Telefoon', gegevens.telefoon],
         ['E-mail', gegevens.email],
         ['Opmerkingen', gegevens.opmerkingen]];

    const tabel = regels.map(([kop, waarde]) => `
      <tr>
        <td style="padding:7px 14px 7px 0;color:#6b7280;font-size:14px;vertical-align:top;white-space:nowrap;">${veilig(kop)}</td>
        <td style="padding:7px 0;color:#111827;font-size:15px;font-weight:600;">${veilig(waarde)}</td>
      </tr>`).join('');

    const knop = (link, label, hoofd) => `
      <a href="${link}" style="display:block;text-align:center;padding:15px 20px;margin-bottom:10px;
         font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;text-decoration:none;
         border-radius:6px;${hoofd
           ? 'background:#6b21d6;color:#ffffff;'
           : 'background:#ffffff;color:#6b21d6;border:2px solid #6b21d6;'}">${label}</a>`;

    const html = `
<div style="background:#f3f4f6;padding:24px 12px;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:8px;overflow:hidden;">
    <div style="background:#12122a;padding:18px 24px;">
      <div style="color:#a855f7;font-size:11px;letter-spacing:2px;text-transform:uppercase;">Rockville Café</div>
      <div style="color:#ffffff;font-size:19px;font-weight:bold;margin-top:3px;">
        ${isQuiz ? 'Nieuwe quiz-inschrijving' : 'Nieuwe reservering'}
      </div>
      <div style="color:#d1d5db;font-size:15px;margin-top:2px;">
        ${veilig(isQuiz ? gegevens.teamnaam : gegevens.naam)}
      </div>
    </div>
    <div style="padding:20px 24px 8px;">
      <table style="width:100%;border-collapse:collapse;">${tabel}</table>
    </div>
    <div style="padding:8px 24px 24px;">
      ${knop(antwoordLink, '✉️&nbsp; Direct antwoorden aan de gast', true)}
      ${knop('https://www.rockvillecafe.nl/admin.html', 'Bevestigen of annuleren', false)}
      <div style="color:#6b7280;font-size:12px;line-height:1.5;margin-top:12px;text-align:center;">
        Let op: antwoord je rechtstreeks, dan blijft de status in het<br>
        beheerscherm op &quot;nieuw&quot; staan.
      </div>
    </div>
  </div>
</div>`;

    // Interne mail krijgt geen adresvoettekst
    try {
      const antwoord = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${sleutel}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: AFZENDER,
          to: [naar],
          reply_to: gegevens.email,
          subject: onderwerp,
          text: tekst,
          html
        })
      });
      const uitkomst = await antwoord.json();
      if (!antwoord.ok) return res.status(502).json({ fout: uitkomst?.message });
      return res.status(200).json({ gelukt: true, id: uitkomst.id });
    } catch (err) {
      return res.status(500).json({ fout: 'Versturen mislukt' });
    }

  } else if (soort === 'reactie') {
    onderwerp = 'Bericht van Rockville Café';
    tekst =
`Hoi ${gegevens.naam},

${eigenTekst}

met vriendelijke groet,

Rockville Café`;

  } else {
    return res.status(400).json({ fout: 'Onbekend soort bericht' });
  }

  // Vaste voettekst
  tekst += `

Verdronkenoord 121, 1811 DB Alkmaar
rockvillecafe.nl`;

  try {
    const antwoord = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sleutel}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: AFZENDER,
        to: [naar],
        reply_to: ANTWOORD,
        subject: onderwerp,
        text: tekst
      })
    });

    const uitkomst = await antwoord.json();

    if (!antwoord.ok) {
      console.error('Resend weigerde:', uitkomst);
      return res.status(502).json({ fout: uitkomst?.message || 'Versturen mislukt' });
    }

    return res.status(200).json({ gelukt: true, id: uitkomst.id });

  } catch (err) {
    console.error('Fout bij versturen:', err);
    return res.status(500).json({ fout: 'Versturen mislukt' });
  }
}
