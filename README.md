# Klassespill

Interaktive klasseromsspill der elever deltar fra egne enheter.

**URL:** https://game.ak-kreativ.no

## Spill

- **Ja eller Nei** - Eliminasjonsspill med trivia-spørsmål
- **Quiz** - Klassisk quiz med poeng
- **Gjett Bildet** - Bilde-gjetting med buzzer
- **Tallkamp** - Matematikk-utfordring
- **Tidslinje** - Sorter historiske hendelser
- **Slange** - Ordkjede-spill

## Lokal utvikling

```bash
# Frontend
npm install
npm run dev

# Server (i eget terminalvindu)
cd server
npm install
npm start
```

Frontend kjører på http://localhost:5173
Server kjører på http://localhost:3003

## Deploy

### Server (Render.com)

1. Gå til [Render.com](https://render.com)
2. New > Web Service
3. Koble til GitHub-repo
4. Velg `server` som Root Directory
5. Build: `npm install`, Start: `npm start`
6. Legg til env: `CLIENT_ORIGIN=https://game.ak-kreativ.no`

Server-URL blir: `https://klassespill-server.onrender.com`

### Frontend (Netlify)

1. Gå til [Netlify](https://netlify.com)
2. Add new site > Import from Git
3. Koble til GitHub-repo
4. Build: `npm run build`, Publish: `dist`
5. Legg til env: `VITE_SOCKET_SERVER_URL=https://klassespill-server.onrender.com`
6. Sett opp custom domain: `game.ak-kreativ.no`

## Teknologi

- React 19 + Vite
- Socket.io for sanntid
- Express.js server
