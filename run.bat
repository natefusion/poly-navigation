@echo off

docker compose up
npm run dev
.\venv\bin\python3 app.py

REM (Optional) Uncomment the following line if you want the window to wait for a key press after npm run dev exits.
REM pause
