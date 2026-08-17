#!/usr/bin/env bash
# Square Cloud BRS — clone-and-run setup
# Prerequisites: Node 22+, pnpm, PHP 8.3+, composer, and a running MySQL.
set -euo pipefail

echo "== Frontend dependencies =="
pnpm install

echo "== Backend dependencies =="
cd backend
composer install --no-interaction

if [ ! -f .env ]; then
  echo "== Creating backend/.env from .env.example =="
  cp .env.example .env
  php artisan key:generate
fi

echo "== Database =="
echo "If the database/user do not exist yet, create them first, e.g.:"
echo "  mysql -u root < database/mysql-init.sql"
echo "(then make sure MySQL is running with the credentials in backend/.env)"

echo "== Migrate + seed =="
php artisan migrate --force
php artisan db:seed --force

cd ..
echo
echo "Setup complete. Start the app with two terminals:"
echo "  Terminal 1 (API):    cd backend && php artisan serve --host 0.0.0.0 --port 8000"
echo "  Terminal 2 (SPA):    VITE_API_URL=/api pnpm dev"
echo
echo "Then open http://localhost:8443/  (login: admin / Admin@2025)"
