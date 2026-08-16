# Backend Selene

Este backend é a API principal do sistema Selene. Ele recebe requisições do app mobile, processa dados de estufas, plantas, sensores, usuários e alertas, e se conecta ao MongoDB para armazenar as informações.

## Como funciona

- A API é construída em Node.js com Express.
- O banco de dados usado é MongoDB, acessado via Mongoose.
- A aplicação expõe rotas em /api/v1.
- A autenticação é feita com JWT (Bearer token) e valida usuários e administradores.
- Há também rotas para dashboard, chats, alertas, dispositivos e leitura de sensores.

## Estrutura principal

- `server.js`: inicializa o servidor Express e conecta ao MongoDB.
- `routes/`: define todas as rotas da API.
- `controllers-mongodb/`: contém a lógica de cada funcionalidade.
- `models-mongodb/`: modelos do MongoDB.
- `middleware/`: autenticação, validação e tratamento de erros.
- `config/`: configurações de conexão com MongoDB e serviços externos.
- `services/`: integrações e serviços auxiliares.

## Rotas principais

A API é montada em `/api/v1` e inclui rotas como:

- `/api/v1/auth` — login e autenticação
- `/api/v1/users` — usuários
- `/api/v1/dispositivos` — dispositivos IoT
- `/api/v1/leituras` — leituras dos sensores
- `/api/v1/plantas` — plantas
- `/api/v1/alertas` — alertas e condições
- `/api/v1/estufas` — estufas
- `/api/v1/dashboard` — dados do painel
- `/api/v1/chats` — mensagens e chat
- `/api/v1/admin` — rotas administrativas

Também existem endpoints úteis:

- `/api/v1/health` — verifica se a API está funcionando
- `/api/v1/test-db` — verifica a conexão com MongoDB

## Autenticação

As rotas protegidas exigem um token no header:

```http
Authorization: Bearer <token>
```

O token é validado no middleware de autenticação e identifica o usuário ou admin autenticado.

## Variáveis de ambiente

O backend espera as seguintes variáveis no arquivo `.env`:

```env
PORT=3000
MONGODB_URI=mongodb+srv://... 
JWT_SECRET=sua_chave_secreta
API_PREFIX=/api/v1
```

## Como rodar localmente

```bash
cd backend
npm install
npm run dev
```

O servidor sobe em:

```text
http://localhost:3000
```

E a API fica em:

```text
http://localhost:3000/api/v1
```

## Hospedagem no Render

Este backend está hospedado no Render.

No Render, normalmente a configuração é:

- Build Command: `npm install`
- Start Command: `npm start`
- Ambiente: variáveis de ambiente definidas no painel do serviço

O Render executa o Node.js em produção e a API fica disponível em uma URL pública fornecida pelo serviço, com acesso ao MongoDB e às variáveis configuradas no ambiente.

## Observações importantes

- O backend depende de uma conexão ativa com o MongoDB.
- Em produção, o CORS deve permitir somente os domínios autorizados.
- Arquivos de imagem de plantas e perfil são servidos em `/fotos` e `/fotos_perfil`.
- Para produção, o código usa `npm start` e não o modo de desenvolvimento.
