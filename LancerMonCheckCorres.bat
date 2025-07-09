@echo off
echo Lancement du serveur de votre application...

:: Se place dans le bon dossier
cd "C:\Users\Utilisateur\Desktop\mon-check-corres"

:: Lance le serveur dans une nouvelle fenetre de commande
start "Serveur App" npm run dev

:: Attend 5 secondes que le serveur ait le temps de demarrer
timeout /t 5

:: Ouvre l'application dans votre navigateur par defaut
start http://localhost:5173/

echo Script termine. Votre app est lancee !