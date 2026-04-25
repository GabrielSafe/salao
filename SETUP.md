# Setup do Sistema

## Pré-requisitos
- Node.js 18+
- PostgreSQL 14+

## Backend

```bash
cd backend
npm install

# Configure o banco
cp .env.example .env
# Edite o .env com sua DATABASE_URL

# Crie as tabelas
npx prisma migrate dev --name init

# Popule com dados iniciais
node prisma/seed.js

# Inicie o servidor
npm run dev
```

## Frontend

```bash
cd frontend
npm install
npm run dev
```

## URLs

| Tela | URL |
|---|---|
| Cliente (público) | `http://localhost:5173/salao-demo` |
| Acompanhar comanda | `http://localhost:5173/salao-demo/comanda/1` |
| Login (admin/funcionária) | `http://localhost:5173/login` |
| Admin | `http://localhost:5173/admin` |
| Funcionária | `http://localhost:5173/funcionaria` |
| Super Admin | `http://localhost:5173/superadmin` |

## Credenciais do seed

| Usuário | Email | Senha |
|---|---|---|
| Super Admin | super@salao.com | admin123 |
| Admin do salão demo | admin@salaodemo.com | admin123 |

## Deploy na VPS Oracle

```bash
# Backend
cd backend
npm install --production
npx prisma migrate deploy
npm start

# Frontend (build)
cd frontend
npm run build
# Sirva o dist/ com nginx
```
