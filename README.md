# 📺 Show da Revisão - TV Quiz Interativo (Show do Milhão + Kahoot)

Aplicação completa desenvolvida para revisões interativas exibidas em **TVs, projetores ou auditórios**, onde **os alunos/participantes respondem falando em voz alta**, sem necessidade de escanear QR Codes ou entrar com celular!

---

## 🚀 Arquitetura do Projeto

### 1. **Banco de Dados & Docker** (`docker-compose.yml`)
- **Engine**: **PostgreSQL 16** via Docker container (`revisao-postgres`)
- **Porta**: `5433:5432` *(mapeada na 5433 para evitar conflitos com outros containers existentes)*
- **Database**: `revisao_db`
- **Volume persistente**: `revisao_postgres_data`

### 2. **API Backend** (`/api`)
- **Runtime & Linguagem**: Node.js com TypeScript
- **Framework Web**: Express.js
- **Banco de Dados**: PostgreSQL com **Prisma ORM**
- **Padrão Arquitetural**: **Controller - Service - Repository**
  - `src/controllers/`: Recebimento de requisições HTTP e envio de respostas
  - `src/services/`: Regras de negócio, validações de pontuação e alternativas
  - `src/repositories/`: Camada de persistência e consultas via Prisma
  - `src/middlewares/`: Autenticação JWT e tratamento global de erros
  - `src/lib/`: Instância singleton do Prisma Client

### 2. **Frontend** (`/frontend`)
- **Framework**: Next.js 15+ (App Router)
- **Estilização**: Tailwind CSS + Shadcn UI
- **Ícones**: Lucide React
- **Animações & Celebração**: CSS3 Keyframes (pulsar vermelho de urgência, glow dourado) + `canvas-confetti`
- **Áudio Procedural**: Sintetizador de áudio nativo Web Audio API com trilha de tensão (Show do Milhão), batimentos cardíacos, relógio acelerado, buzina de tempo esgotado e fanfarra triunfal de acerto.

---

## 🎯 Principais Funcionalidades

- **Modo TV em Tela Cheia**:
  - Layout otimizado para TVs 1080p e 4K, com tipografia gigante de alto contraste.
  - **Grid 2x2 estilo Kahoot**:
    - **A (Vermelho / ▲ Triângulo)**
    - **B (Azul / ◆ Losango)**
    - **C (Amarelo / ● Círculo)**
    - **D (Verde / ■ Quadrado)**
- **Cronômetro Interativo com Alerta Visual e Sonoro**:
  - Tempo configurável por questão (ex: 20s, 30s, 60s).
  - Alerta de urgência nos últimos segundos: a tela e o cronômetro pulsam em **vermelho neon**, acompanhados de som de **batimentos cardíacos** que aceleram.
- **Ajuda do Apresentador (Show do Milhão)**:
  - Botão **🃏 50:50 Cartas**: elimina duas alternativas incorretas instantaneamente.
  - Botão **Pausar / Retomar Cronômetro** (ou barra de espaço).
- **Revelação com Chuva de Confetes & Curiosidades**:
  - Ao revelar a resposta, as opções erradas escurecem, a alternativa correta explode em verde brilhante com fanfarra sonora e **chuva de confetes** na tela.
  - Exibição de **Explicação Pedagógica / Curiosidade** para enriquecer a discussão em sala.
- **Painel Administrativo**:
  - Cadastro de revisões com matérias/categorias.
  - Cadastro e ordenação de perguntas (com imagem ilustrativa, pontuação e 4 opções).
  - Configuração de trilha sonora (Show do Milhão, Kahoot, Épico, Tic-tac ou Silêncio).
  - Duplicação e exclusão de revisões em um clique.

---

## 🔑 Acesso do Apresentador (Admin)

- **E-mail**: `admin@revisao.com`
- **Senha**: `admin123`
*(No modal de login há também um botão rápido "Preencher" para teste instantâneo)*

---

## ⌨️ Atalhos de Teclado no Modo TV

| Tecla | Ação |
| :--- | :--- |
| **Espaço** | Pausar / Continuar o cronômetro |
| **R** ou **Enter** | Revelar a resposta correta e disparar os confetes |
| **N** ou **Seta Direita (→)** | Avançar para a próxima pergunta |
| **Seta Esquerda (←)** | Voltar para a pergunta anterior |
| **H** | Ativar a ajuda 50:50 (eliminar 2 opções) |
| **F** | Alternar Modo Tela Cheia (Fullscreen) |

---

## 🛠️ Como Executar o Projeto

### Pré-requisitos
- Node.js (v18+) e npm instalados.
- Docker e Docker Compose instalados.

### 1. Iniciar o Banco PostgreSQL via Docker:
```bash
docker compose up -d
```
> O container `revisao-postgres` iniciará e estará com status saudável na porta `5433`.

### 2. Iniciar a API:
```bash
cd api
npm install
npx prisma db push
npm run dev
```
> A API iniciará em `http://localhost:4000` conectada ao PostgreSQL.

### 3. Iniciar o Frontend:
```bash
cd frontend
npm install
npm run dev
```
> O Frontend estará acessível em `http://localhost:3000`
