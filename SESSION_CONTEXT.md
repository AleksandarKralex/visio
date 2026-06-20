# SESSION CONTEXT — 2026-06-20
Proiect: DiagramFlow — Visual Diagramming App
GitHub:  https://github.com/AleksandarKralex/visio
Server:  root@79.108.161.55 · /var/www/voxkralex/visio

## Ce s-a făcut azi
- Pornire aplicație local (npm run dev) pentru verificare vizuală
- Adăugat `__pycache__/` și `*.pyc` în `.gitignore`
- Comis `certbot_setup.py` (script setup SSL Certbot)
- Build producție + deploy static pe server via scp
- Nginx reloaded pe server

## Stare curentă
Funcționează:
- Aplicație accesibilă la http://79.108.161.55/visio/
- Sidebar cu forme (Basic, Flowchart, Network Devices)
- Canvas cu grid, zoom, toolbar
- Panel Properties

În lucru / TODO:
- SSL/HTTPS via Certbot (certbot_setup.py existent, neexecutat pe server)
- DNS voxkralex.ro/visio (pending)

## Următorul task
- Execută `certbot_setup.py` pe server pentru activare HTTPS
- Sau continuă dezvoltarea funcționalităților DiagramFlow

## Fișiere cheie
- `src/` — cod sursă React/TypeScript
- `vite.config.ts` — configurare Vite (base: /visio/)
- `certbot_setup.py` — script automat SSL Certbot
- `dist/` — build producție (ignorat în git, copiaz via scp)

## Deploy flow
1. `npm run build` local
2. `scp -r dist/* root@79.108.161.55:/var/www/voxkralex/visio/`
3. `ssh root@79.108.161.55 "nginx -t && systemctl reload nginx"`

## Probleme cunoscute
- `rsync` nu e disponibil în Git Bash pe Windows — se folosește `scp`
- Deploy path pe server: `/var/www/voxkralex/visio/` (nu `/var/www/visio/`)
- Serverul NU are git repo — deploy se face prin copiere directă a build-ului
