# Klassespill - Implementasjonsplan

**URL:** game.ak-kreativ.no
**Formål:** Samleside for interaktive klassespill hvor elever deltar fra egne enheter

## Oversikt

En React-app med Socket.io som samler flere interaktive klassespill. Læreren (host) oppretter et rom og velger spill, elevene blir med via romkode. Samme side for både lærer og elev.

## Arkitektur

```
game/
├── src/
│   ├── main.jsx              # Entry point
│   ├── App.jsx               # Hovedkomponent med routing
│   ├── App.css               # (slettet, bruker index.css)
│   ├── index.css             # Global styling
│   ├── components/           # Felles komponenter
│   │   ├── Home.jsx          # Startside (lærer/elev valg)
│   │   ├── HostSetup.jsx     # Spillvalg for lærer
│   │   ├── PlayerJoin.jsx    # Bli med-skjema for elever
│   │   ├── Lobby.jsx         # Ventelobby
│   │   └── GameRouter.jsx    # Router til riktig spillkomponent
│   ├── contexts/
│   │   └── GameContext.jsx   # Global state og socket-håndtering
│   ├── games/                # Spillspesifikke komponenter
│   │   ├── gjett-bildet/
│   │   ├── slange/
│   │   ├── tallkamp/
│   │   ├── quiz/
│   │   ├── tidslinje/
│   │   └── ja-eller-nei/
│   ├── data/                 # Spørsmål og data
│   └── utils/                # Hjelpefunksjoner
├── server/                   # Backend (separat repo på Render)
│   ├── index.js
│   └── gameState.js
└── PLAN.md
```

## Server

Serveren må deployes separat på Render (som for Slange). Den håndterer:
- Rom-opprettelse og -administrasjon
- Spillerregistrering
- Spillspesifikk logikk
- Sanntidskommunikasjon via Socket.io

**Server-events (felles):**
- `host:create-room` - Opprett rom med valgt spill
- `host:start-game` - Start spillet
- `host:end-game` - Avslutt spillet
- `host:kick-player` - Fjern spiller
- `host:game-action` - Spillspesifikke handlinger
- `player:join-room` - Bli med i rom
- `player:game-action` - Spillerspesifikke handlinger

---

## Spill

### 1. Gjett Bildet (Game Show-versjon)
**Kilde:** Kopi fra `gjett-bildet` app (game show modus)

**Flyt:**
1. Lærer laster opp eller velger bilder
2. Bildet vises med rutenett som skjuler det
3. Elever buzzer inn
4. Lærer velger hvem som skal svare
5. Eleven skriver svaret på sin enhet
6. Lærer godkjenner/avslår
7. Poeng tildeles, neste rute avdekkes

**Host-visning:**
- Bildet med rutenett
- Buzzerkø
- Pending svar fra valgt elev
- Godkjenn/Avslå-knapper
- Spillerliste med poeng

**Elev-visning:**
- Buzz-knapp (når ingen svarer)
- Input-felt (når det er din tur)
- Venter-melding (ellers)
- Din poengsum

**Poeng:**
- Riktig svar tidlig: Flere poeng (basert på hvor mange ruter som er avdekket)
- Feil svar: -5 poeng

---

### 2. Ordslangen
**Kilde:** Kopi fra `slange` app (samarbeid og konkurranse)

**Allerede implementert i Slange-appen. Kan kopiere logikken eller lenke til eksisterende.**

**Modi:**
- Samarbeid: Klassen jobber sammen
- Konkurranse: Individuelle poeng

**Flyt:**
- Som i eksisterende Slange-app

---

### 3. Tallkamp
**Kilde:** Tilpasset fra `brainbreak` app

**Flyt:**
1. Lærer starter runde
2. System genererer:
   - Måltall (25-99)
   - 5-6 tilgjengelige tall
3. Elever har 90 sekunder
4. Elever sender inn sitt regnestykke og resultat
5. Når tiden er ute, vises alle svar
6. Nærmest måltallet vinner runden

**Host-visning:**
- Måltall (stort)
- Tilgjengelige tall
- Nedtelling
- Liste over innsendte svar (skjult til tiden er ute)
- Resultatvisning

**Elev-visning:**
- Måltall og tilgjengelige tall
- Input for regnestykke
- Kalkulator-hjelp (valgfritt)
- Send inn-knapp
- Nedtelling

**Poeng:**
- Eksakt treff: 10 poeng
- Nærmest: 5 poeng
- Andre plasseringer: 3, 2, 1 poeng

---

### 4. Quiz
**Kilde:** Tilpasset fra `brainbreak` app

**Flyt:**
1. Lærer starter quiz
2. Spørsmål vises for alle
3. Elever velger svar (A, B, C, D) på egen enhet
4. Nedtelling (10-30 sek)
5. Svar låses når tiden er ute
6. Riktig svar vises
7. Poeng oppdateres

**Host-visning:**
- Spørsmål
- Svaralternativer
- Nedtelling
- Antall som har svart
- Resultatfordeling (søylediagram)
- Leaderboard

**Elev-visning:**
- Spørsmål
- Fire knapper (A, B, C, D)
- Bekreftelse når svart
- Riktig/Galt feedback
- Din poengsum

**Poeng:**
- Riktig svar: 10 poeng
- Bonus for rask besvarelse (valgfritt)

**Data:**
- Kopier spørsmålsbank fra brainbreak
- Utvid til flervalg-format

---

### 5. Tidslinje
**Kilde:** Tilpasset fra `brainbreak` app

**Flyt:**
1. Lærer velger antall hendelser (3-5)
2. Hendelser vises i tilfeldig rekkefølge
3. Elever sorterer på egen enhet (drag-drop eller klikk)
4. Send inn når ferdig
5. Vis riktig rekkefølge
6. Poeng basert på nøyaktighet

**Host-visning:**
- Hendelsene (tilfeldig rekkefølge)
- Antall som har sendt inn
- Nedtelling
- Fasit med årstall og fakta
- Leaderboard

**Elev-visning:**
- Liste over hendelser
- Drag-drop eller klikk for å sortere
- Send inn-knapp
- Resultat etter innsending

**Poeng:**
- Helt riktig: 10 poeng
- Delvis riktig: 1-9 poeng basert på antall riktige plasseringer

---

### 6. Ja eller Nei (Eliminasjon)
**Kilde:** Tilpasset fra `Ja eller nei` app

**Flyt:**
1. Lærer starter spill
2. Alle elever er "inne" i starten
3. Spørsmål vises
4. Elever trykker JA eller NEI på egen enhet
5. Nedtelling (5-10 sek)
6. Riktig svar avsløres
7. De som svarte feil er UTE
8. Gjenta til én (eller ingen) står igjen
9. Hvis flere igjen etter siste spørsmål, fortsett med nye

**Host-visning:**
- Spørsmål
- Antall som har svart
- Fordeling JA/NEI (skjult til avsløring)
- Liste over spillere (inne/ute)
- Riktig svar med forklaring
- Vinner-annonsering

**Elev-visning:**
- Stor JA-knapp (grønn)
- Stor NEI-knapp (rød)
- Status: Inne / Ute
- Resultat-feedback

**Spillogikk:**
- Hvis ingen står igjen: Alle som gikk ut i siste runde er tilbake
- Fortsett til én vinner
- Minst 5 spørsmål før potensielt spill slutt

---

## Implementasjonsrekkefølge

### Fase 1: Grunnleggende infrastruktur ✅
- [x] Opprette React-app med Vite
- [x] Sette opp mappestruktur
- [x] Installere avhengigheter (socket.io-client, react-router-dom)
- [x] Opprette GameContext med socket-tilkobling
- [x] Lage grunnleggende komponenter (Home, HostSetup, PlayerJoin, Lobby)
- [x] Grunnleggende styling

### Fase 2: Server
- [ ] Opprette server-mappe med Express og Socket.io
- [ ] Implementere rom-håndtering
- [ ] Generisk spilltilstand-håndtering
- [ ] Deploy til Render

### Fase 3: Ja eller Nei (enklest å starte med)
- [ ] Kopiere spørsmålsdata fra original app
- [ ] Implementere server-logikk for eliminasjon
- [ ] HostGame-komponent
- [ ] PlayerGame-komponent (JA/NEI-knapper)
- [ ] Testing

### Fase 4: Quiz
- [ ] Kopiere/tilpasse spørsmålsdata
- [ ] Utvide til flervalg-format
- [ ] Server-logikk
- [ ] Host og Player komponenter
- [ ] Resultatvisning

### Fase 5: Gjett Bildet
- [ ] Kopiere bildehåndtering fra original
- [ ] Rutenett-logikk
- [ ] Buzzer-system
- [ ] Host og Player komponenter

### Fase 6: Tallkamp
- [ ] Tilpasse generatorlogikk
- [ ] Server-logikk for svarinnsending
- [ ] Host og Player komponenter
- [ ] Resultatsammenligning

### Fase 7: Tidslinje
- [ ] Kopiere hendelsesdata
- [ ] Drag-drop eller klikk-sortering
- [ ] Server-logikk
- [ ] Host og Player komponenter

### Fase 8: Slange (valgfritt)
- [ ] Vurdere om det skal kopieres eller lenkes til eksisterende app
- [ ] Eventuelt implementere på nytt i dette systemet

---

## Tekniske notater

### Socket-events per spill

**Ja eller Nei:**
```
host:show-question     → game:question-shown
host:reveal-answer     → game:answer-revealed
player:answer          → game:player-answered
                       → game:player-eliminated
                       → game:winner
```

**Quiz:**
```
host:show-question     → game:question-shown
host:end-round         → game:round-ended
player:submit-answer   → game:answer-submitted
```

**Gjett Bildet:**
```
host:reveal-tile       → game:tile-revealed
host:select-player     → game:player-selected
player:buzz            → game:buzzer-updated
player:submit-guess    → game:guess-submitted
host:approve           → game:guess-approved
host:reject            → game:guess-rejected
```

**Tallkamp:**
```
host:start-round       → game:round-started
host:end-round         → game:round-ended
player:submit-solution → game:solution-submitted
```

**Tidslinje:**
```
host:start-round       → game:round-started
host:end-round         → game:round-ended
player:submit-order    → game:order-submitted
```

### Delt state-struktur

```javascript
room = {
  code: "ABC123",
  hostId: "socket-id",
  game: "ja-eller-nei",
  gameState: "LOBBY" | "PLAYING" | "GAME_OVER",
  players: [
    { id, name, score, isConnected, isEliminated? }
  ],
  gameData: {
    // Spillspesifikk data
  }
}
```

---

## Miljøvariabler

**Frontend (.env.local):**
```
VITE_SOCKET_SERVER_URL=https://game-server.onrender.com
```

**Server:**
```
PORT=3003
CLIENT_ORIGIN=https://game.ak-kreativ.no
```

---

## Deployment

1. **Frontend:** Netlify/Vercel med custom domain `game.ak-kreativ.no`
2. **Server:** Render med auto-deploy fra GitHub

---

## Notater

- **VIKTIG:** Ikke endre originalappene (gjett-bildet, slange, brainbreak, ja-eller-nei)
- Kopier kun det som trengs
- Hold spillene enkle - fokus på klasseromsfunksjonalitet
- Alle spill skal fungere på mobil (touch-vennlig UI)
