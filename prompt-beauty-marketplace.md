# PROMPT COMPLETO — CLAUDE CODE
## Projeto: Plataforma Marketplace de Beleza & Estética (Brasil + Espanha)

---

Você é um engenheiro full-stack sênior e designer de produto. Vou te descrever um projeto completo. Quero que você construa TUDO: backend, painel admin web e aplicativos mobile. Leia todo o briefing antes de começar a codar.

---

## 🎯 VISÃO DO PRODUTO

Criar uma plataforma marketplace de beleza e estética com operação em **Brasil e Espanha** — um "iFood da beleza" internacional. O app conecta consumidoras a clínicas de estética, salões de beleza, cabeleireiros, barbearias, nail designers, lash designers e profissionais autônomos.

**Mercados de lançamento:**
- 🇧🇷 **Brasil** — mercado primário, maior mercado de beleza da América Latina
- 🇪🇸 **Espanha** — segundo mercado, porta de entrada para Europa

**Público-alvo principal:** Mulheres, 20-45 anos, que hoje agendam serviços de beleza por WhatsApp e Instagram e não têm uma forma fácil de descobrir, comparar e agendar profissionais.

**Proposta de valor:**
- Para a CONSUMIDORA: descobrir profissionais por perto, ver portfólio real (fotos antes/depois), comparar preços por procedimento, ler avaliações verificadas, e agendar + pagar tudo pelo app
- Para o PROFISSIONAL/CLÍNICA: receber agendamentos automáticos, reduzir faltas com lembretes, ter vitrine online bonita, e gerenciar agenda + financeiro num só lugar

---

## 🏗️ ARQUITETURA & STACK TECNOLÓGICO

### Backend (API)
- **Runtime:** Node.js com TypeScript
- **Framework:** Fastify (mais performático que Express)
- **ORM:** Prisma
- **Banco de dados:** PostgreSQL
- **Cache:** Redis
- **Autenticação:** JWT + refresh tokens
- **Upload de imagens:** S3-compatible (AWS S3 ou MinIO para dev local)
- **Notificações push:** Firebase Cloud Messaging (FCM)
- **Pagamentos:** multi-gateway por país:
  - 🇧🇷 Brasil: Mercado Pago (Pix + cartão + boleto)
  - 🇪🇸 Espanha: Stripe (cartão + SEPA/Bizum)
  - Usar padrão Strategy para trocar gateway por país sem alterar lógica de negócio
- **Internacionalização:** i18n no backend (mensagens de erro, emails, notificações push localizadas por país/idioma do usuário)
- **Busca geolocalizada:** PostGIS extension no PostgreSQL
- **API docs:** Swagger/OpenAPI auto-generated
- **Estrutura:** Clean Architecture com camadas separadas (controllers, services, repositories, entities)
- **Validação:** Zod schemas
- **Monorepo:** Turborepo para organizar backend + apps + shared packages

### Painel Admin (Web)
- **Framework:** Next.js 15+ (App Router)
- **UI Library:** shadcn/ui + Tailwind CSS 4
- **Charts/Dashboards:** Recharts
- **State management:** TanStack Query (React Query) para server state
- **Formulários:** React Hook Form + Zod
- **Tabelas:** TanStack Table
- **Auth:** NextAuth.js ou middleware custom com JWT
- **Deploy target:** Vercel

### Aplicativos Mobile (iOS + Android)
- **Framework:** React Native com Expo SDK 54+
- **Navegação:** Expo Router (file-based routing)
- **UI Components:** construir design system custom (NÃO usar libs prontas como NativeBase)
- **Estilização:** Nativewind (Tailwind para React Native) ou StyleSheet otimizado
- **State:** Zustand para client state + TanStack Query para server state
- **Animações:** React Native Reanimated 3 + Moti
- **Mapas:** react-native-maps
- **Pagamentos in-app:** Stripe React Native SDK
- **Notificações:** expo-notifications + FCM
- **Imagens:** expo-image (melhor performance que Image padrão)
- **Formulários:** React Hook Form + Zod

---

## 📱 DOIS APLICATIVOS MOBILE SEPARADOS

### App 1 — App da Consumidora ("GlamApp" ou nome a definir)
Funcionalidades core:
1. **Onboarding:** cadastro via Google, Apple ou telefone+SMS. Perguntar localização, tipo de serviço que mais usa, e preferências
2. **Home/Descoberta:** feed visual tipo Instagram com fotos de trabalhos (antes/depois), profissionais em destaque, categorias (cabelo, unha, estética facial, corporal, sobrancelha, etc.), filtros por proximidade e preço
3. **Busca avançada:** por procedimento específico (ex: "botox", "progressiva", "design de sobrancelha"), por bairro/cidade, por faixa de preço, por avaliação mínima
4. **Perfil do profissional/clínica:** portfólio de fotos (grid tipo Instagram), lista de serviços com preços, avaliações de clientes, localização no mapa, horários de funcionamento, botão de agendamento
5. **Agendamento:** calendário com slots disponíveis em tempo real, seleção de profissional + serviço + horário, confirmação com pagamento (Pix, cartão) ou reserva sem pagamento antecipado
6. **Meus agendamentos:** próximos, passados, cancelados. Lembrete push 24h e 1h antes
7. **Avaliações:** após o atendimento, pedir avaliação com nota (1-5 estrelas) + foto do resultado + comentário. Avaliações verificadas (só quem agendou pelo app pode avaliar)
8. **Favoritos:** salvar profissionais e clínicas favoritas
9. **Chat:** mensagem direta com o profissional (limitada a assuntos do agendamento)
10. **Perfil da usuária:** dados pessoais, histórico, métodos de pagamento salvos, preferências

### App 2 — App do Profissional ("GlamPro" ou nome a definir)
Funcionalidades core:
1. **Onboarding:** cadastro com dados do profissional, CPF/CNPJ, fotos do espaço, serviços oferecidos com preços, horários de funcionamento
2. **Dashboard:** resumo do dia (agendamentos, faturamento, faltas), gráfico semanal/mensal
3. **Agenda:** visualização diária/semanal, bloqueio de horários, gestão de slots
4. **Agendamentos:** aceitar/recusar, reagendar, marcar como concluído, registrar no-show
5. **Portfólio:** upload de fotos antes/depois, organizar por categoria de serviço
6. **Financeiro:** extrato de recebimentos, comissões, saques para conta bancária
7. **Avaliações recebidas:** ver e responder avaliações
8. **Perfil público:** editar informações, serviços, preços, fotos do espaço
9. **Notificações:** novos agendamentos, cancelamentos, mensagens, avaliações
10. **Relatórios:** clientes recorrentes, serviços mais agendados, taxa de ocupação

---

## 🖥️ PAINEL ADMIN WEB

Dashboard administrativo para a equipe da plataforma:

1. **Dashboard geral:** KPIs (GMV, agendamentos, novos usuários, novos profissionais, taxa de cancelamento, NPS), gráficos temporais
2. **Gestão de profissionais/clínicas:** lista com filtros, aprovação de novos cadastros, verificação de documentos, suspensão/banimento, edição de dados
3. **Gestão de consumidoras:** lista, histórico, bloqueio
4. **Agendamentos:** visão geral, filtros por status/data/profissional, resolução de disputas
5. **Financeiro:** transações, comissões, repasses, extrato geral, inadimplência
6. **Categorias e serviços:** CRUD de categorias (cabelo, estética, unhas, etc.) e tipos de serviço
7. **Avaliações:** moderação de reviews, denúncias, remoção de conteúdo impróprio
8. **Banners/Promoções:** gerenciar banners da home do app, promoções de destaque
9. **Relatórios:** exportação CSV/PDF, métricas de crescimento, cohort analysis
10. **Configurações:** taxas da plataforma, regras de cancelamento, termos de uso

---

## 🎨 DESIGN & IDENTIDADE VISUAL

### Direção estética: "Soft Luxury Feminina"

O design deve transmitir: **sofisticação acessível, confiança, e cuidado**. Não é um app "fofinho" infantil, nem um app corporativo frio. É elegante, limpo, e acolhedor — como uma clínica de estética premium, mas que qualquer mulher se sinta convidada a usar.

### Paleta de cores:
- **Primária:** Rose Gold / Rosé (#C4918E ou similar) — elegante e feminino sem ser infantil
- **Secundária:** Off-white cremoso (#FAF7F5) — fundo principal
- **Accent:** Dourado suave (#D4A574) — detalhes, ícones, badges
- **Texto principal:** Marrom escuro (#3D2C29) — mais suave que preto puro
- **Texto secundário:** Cinza quente (#8C7E7A)
- **Sucesso:** Verde sage (#7D9B76)
- **Erro:** Rosa terroso (#C75B5B)
- **Cards/Superfícies:** Branco puro (#FFFFFF) com sombra suave
- **Modo escuro:** opcional mas se fizer, usar tons de marrom escuro (#1A1412) em vez de cinza

### Tipografia:
- **Display/Títulos:** Playfair Display ou DM Serif Display (serifada elegante)
- **Corpo/UI:** DM Sans ou Outfit (sans-serif moderna e legível)
- **Evitar:** Inter, Roboto, Arial — são genéricos demais

### Princípios de UI:
- **Cards com bordas arredondadas** (border-radius: 16-20px)
- **Sombras suaves e difusas** (nunca box-shadow pesada)
- **Espaçamento generoso** — respiro visual é fundamental
- **Fotos em destaque** — o app é visual-first, as fotos dos trabalhos são o herói
- **Microinterações elegantes:** transições suaves (300ms ease), haptic feedback nos botões, skeleton loading ao carregar conteúdo
- **Ícones:** Lucide ou Phosphor Icons (outline, stroke fino)
- **Sem gradientes chamativos** — preferir cores sólidas e overlays sutis
- **Bottom navigation** no app mobile com 4-5 itens max
- **Pull-to-refresh** com animação customizada
- **Imagens com aspect-ratio consistente** no feed (4:5 como Instagram)
- **Empty states** bonitos com ilustrações (não só texto)

### Painel Admin:
- Usar shadcn/ui como base mas customizar cores para a paleta da marca
- Layout com sidebar à esquerda, conteúdo principal expandido
- Dark mode toggle
- Tabelas clean, cards de KPI no topo, gráficos com Recharts
- Fonte do admin pode ser mais neutra (DM Sans)

---

## 📁 ESTRUTURA DO MONOREPO

```
beauty-marketplace/
├── apps/
│   ├── api/                    # Backend Fastify + Prisma
│   │   ├── src/
│   │   │   ├── modules/        # Módulos por domínio (user, booking, professional, review, payment, chat)
│   │   │   │   ├── user/
│   │   │   │   │   ├── user.controller.ts
│   │   │   │   │   ├── user.service.ts
│   │   │   │   │   ├── user.repository.ts
│   │   │   │   │   ├── user.schema.ts     # Zod validation
│   │   │   │   │   └── user.routes.ts
│   │   │   │   ├── booking/
│   │   │   │   ├── professional/
│   │   │   │   ├── review/
│   │   │   │   ├── payment/
│   │   │   │   └── chat/
│   │   │   ├── shared/         # Middlewares, utils, errors
│   │   │   ├── config/         # Env, database, redis
│   │   │   └── server.ts
│   │   ├── prisma/
│   │   │   └── schema.prisma
│   │   └── package.json
│   │
│   ├── admin/                  # Next.js Admin Panel
│   │   ├── app/                # App Router
│   │   │   ├── (auth)/         # Login
│   │   │   ├── (dashboard)/    # Layout com sidebar
│   │   │   │   ├── page.tsx              # Dashboard principal
│   │   │   │   ├── professionals/
│   │   │   │   ├── customers/
│   │   │   │   ├── bookings/
│   │   │   │   ├── finances/
│   │   │   │   ├── reviews/
│   │   │   │   ├── categories/
│   │   │   │   ├── promotions/
│   │   │   │   └── settings/
│   │   │   └── layout.tsx
│   │   ├── components/
│   │   └── package.json
│   │
│   ├── mobile-client/          # Expo app - consumidora
│   │   ├── app/                # Expo Router (file-based)
│   │   │   ├── (tabs)/         # Tab navigation
│   │   │   │   ├── index.tsx             # Home/Descoberta
│   │   │   │   ├── search.tsx            # Busca
│   │   │   │   ├── bookings.tsx          # Meus agendamentos
│   │   │   │   ├── favorites.tsx         # Favoritos
│   │   │   │   └── profile.tsx           # Perfil
│   │   │   ├── professional/[id].tsx     # Perfil do profissional
│   │   │   ├── booking/[id].tsx          # Tela de agendamento
│   │   │   ├── review/[bookingId].tsx    # Avaliar serviço
│   │   │   ├── chat/[id].tsx             # Chat
│   │   │   ├── (auth)/                   # Login/Cadastro
│   │   │   └── _layout.tsx
│   │   ├── components/
│   │   │   ├── ui/             # Design system (Button, Card, Input, Badge, Avatar, etc.)
│   │   │   ├── booking/
│   │   │   ├── professional/
│   │   │   └── shared/
│   │   ├── hooks/
│   │   ├── services/           # API calls
│   │   ├── stores/             # Zustand stores
│   │   ├── theme/              # Cores, tipografia, spacing tokens
│   │   └── package.json
│   │
│   └── mobile-pro/             # Expo app - profissional
│       ├── app/                # Expo Router
│       │   ├── (tabs)/
│       │   │   ├── index.tsx             # Dashboard
│       │   │   ├── agenda.tsx            # Agenda
│       │   │   ├── portfolio.tsx         # Portfólio
│       │   │   ├── finances.tsx          # Financeiro
│       │   │   └── profile.tsx           # Perfil
│       │   ├── booking/[id].tsx
│       │   ├── (auth)/
│       │   └── _layout.tsx
│       ├── components/
│       ├── hooks/
│       ├── services/
│       ├── stores/
│       ├── theme/
│       └── package.json
│
├── packages/
│   ├── shared-types/           # TypeScript types compartilhados
│   ├── shared-utils/           # Funções utilitárias compartilhadas
│   ├── shared-validators/      # Zod schemas compartilhados
│   └── api-client/             # Cliente HTTP tipado (usado pelos apps)
│
├── turbo.json
├── package.json
└── README.md
```

---

## 🌍 INTERNACIONALIZAÇÃO & MULTI-PAÍS

### Estratégia: um app, múltiplos países

O app é **UM SÓ binário** publicado nas stores (App Store + Google Play) para todos os países. NÃO criar apps separados por país. A diferenciação por país acontece de 3 formas:

### 1. Detecção automática de país
- No **primeiro acesso**, o app detecta o país via localização GPS do dispositivo
- Se o GPS não estiver disponível, usar o **locale do dispositivo** (pt-BR → Brasil, es-ES → Espanha)
- A usuária também pode trocar manualmente o país nas configurações
- O país selecionado é salvo no perfil e define: idioma, moeda, gateway de pagamento, e filtro de profissionais

### 2. Idiomas suportados
- 🇧🇷 **Português brasileiro (pt-BR)** — idioma padrão
- 🇪🇸 **Espanhol (es-ES)** — segundo idioma
- 🇺🇸 **Inglês (en)** — terceiro idioma (para estrangeiros residentes)
- O idioma segue o locale do dispositivo por padrão, mas pode ser trocado manualmente

### 3. Implementação técnica de i18n

**Mobile (Expo):**
- Usar **expo-localization** para detectar idioma do dispositivo
- Usar **i18next + react-i18next** para tradução de strings
- Organizar traduções em arquivos JSON por idioma:
  ```
  locales/
  ├── pt-BR.json
  ├── es-ES.json
  └── en.json
  ```
- Todas as strings de UI devem usar chaves de tradução, NUNCA strings hardcoded:
  ```tsx
  // ❌ ERRADO
  <Text>Agendar horário</Text>
  
  // ✅ CORRETO
  <Text>{t('booking.scheduleButton')}</Text>
  ```
- Formatar datas com **date-fns/locale** (pt-BR: "25 de março", es-ES: "25 de marzo")
- Formatar moedas com **Intl.NumberFormat**:
  - Brasil: R$ 150,00 (BRL)
  - Espanha: 150,00 € (EUR)

**Admin (Next.js):**
- Usar **next-intl** para i18n no painel admin
- Admin padrão em português, com toggle para espanhol/inglês
- Rotas com prefixo de locale: `/pt/dashboard`, `/es/dashboard`

**Backend (API):**
- Receber header `Accept-Language` em todas as requests
- Retornar mensagens de erro localizadas
- Enviar notificações push e emails no idioma do usuário (campo `locale` no User)
- Templates de email por idioma (handlebars ou similar)

### 4. Adaptações por país

| Aspecto | 🇧🇷 Brasil | 🇪🇸 Espanha |
|---|---|---|
| **Moeda** | BRL (R$) | EUR (€) |
| **Pagamento** | Pix, cartão, boleto (Mercado Pago) | Cartão, SEPA, Bizum (Stripe) |
| **Documento profissional** | CPF/CNPJ | NIF/NIE/CIF |
| **Telefone** | +55 com máscara (XX) XXXXX-XXXX | +34 com máscara XXX XXX XXX |
| **Formato de endereço** | Rua, número, bairro, cidade-UF, CEP | Calle, número, piso, CP, ciudad, provincia |
| **Categorias populares** | Design de sobrancelha, progressiva, limpeza de pele, unhas | Manicura, tratamiento facial, depilación láser, mechas |
| **Termos de uso / LGPD** | Conformidade LGPD | Conformidade GDPR |
| **Formato de data** | DD/MM/AAAA | DD/MM/AAAA |
| **Fuso horário** | America/Sao_Paulo (e variações) | Europe/Madrid |

### 5. App Store & Google Play — Publicação multi-país

- **Publicar UM app global** com suporte a múltiplos idiomas via metadata localizado nas stores
- Na App Store: usar **App Store Localizations** — título, subtítulo, descrição e screenshots em pt-BR e es-ES
- Na Google Play: usar **Store Listing Translations** — mesma lógica
- **Disponibilidade:** marcar o app como disponível no Brasil e Espanha (e potencialmente todos os países, para não limitar)
- **Screenshots:** gerar sets separados de screenshots para cada idioma mostrando o app no respectivo idioma
- **Keyword optimization:** termos de busca diferentes por idioma:
  - pt-BR: "salão de beleza", "agendar cabeleireiro", "clínica estética perto de mim"
  - es-ES: "salón de belleza", "reservar peluquería", "clínica estética cerca de mí"

### 6. Estrutura de traduções — organização dos JSON

```json
// locales/pt-BR.json
{
  "common": {
    "loading": "Carregando...",
    "error": "Algo deu errado",
    "save": "Salvar",
    "cancel": "Cancelar",
    "search": "Buscar",
    "seeAll": "Ver todos",
    "back": "Voltar",
    "continue": "Continuar",
    "confirm": "Confirmar"
  },
  "auth": {
    "login": "Entrar",
    "signup": "Criar conta",
    "loginTitle": "Bem-vinda de volta",
    "signupTitle": "Crie sua conta",
    "emailPlaceholder": "Seu e-mail",
    "phonePlaceholder": "Seu telefone",
    "forgotPassword": "Esqueceu a senha?"
  },
  "home": {
    "greeting": "Olá, {{name}}",
    "nearYou": "Perto de você",
    "popular": "Mais populares",
    "categories": "Categorias",
    "featured": "Em destaque"
  },
  "booking": {
    "scheduleButton": "Agendar horário",
    "selectDate": "Escolha a data",
    "selectTime": "Escolha o horário",
    "confirmBooking": "Confirmar agendamento",
    "bookingConfirmed": "Agendamento confirmado!",
    "price": "Valor",
    "duration": "Duração",
    "minutes": "{{count}} min"
  },
  "professional": {
    "portfolio": "Portfólio",
    "services": "Serviços",
    "reviews": "Avaliações",
    "about": "Sobre",
    "openNow": "Aberto agora",
    "closedNow": "Fechado",
    "verified": "Verificado"
  },
  "review": {
    "leaveReview": "Avaliar atendimento",
    "ratingLabel": "Como foi sua experiência?",
    "commentPlaceholder": "Conte como foi...",
    "addPhoto": "Adicionar foto do resultado",
    "submit": "Enviar avaliação"
  },
  "profile": {
    "myBookings": "Meus agendamentos",
    "favorites": "Favoritos",
    "settings": "Configurações",
    "language": "Idioma",
    "country": "País",
    "logout": "Sair"
  },
  "tabs": {
    "home": "Início",
    "search": "Buscar",
    "bookings": "Agenda",
    "favorites": "Favoritos",
    "profile": "Perfil"
  }
}
```

```json
// locales/es-ES.json
{
  "common": {
    "loading": "Cargando...",
    "error": "Algo salió mal",
    "save": "Guardar",
    "cancel": "Cancelar",
    "search": "Buscar",
    "seeAll": "Ver todos",
    "back": "Volver",
    "continue": "Continuar",
    "confirm": "Confirmar"
  },
  "auth": {
    "login": "Iniciar sesión",
    "signup": "Crear cuenta",
    "loginTitle": "Bienvenida de nuevo",
    "signupTitle": "Crea tu cuenta",
    "emailPlaceholder": "Tu correo electrónico",
    "phonePlaceholder": "Tu teléfono",
    "forgotPassword": "¿Olvidaste tu contraseña?"
  },
  "home": {
    "greeting": "Hola, {{name}}",
    "nearYou": "Cerca de ti",
    "popular": "Más populares",
    "categories": "Categorías",
    "featured": "Destacados"
  },
  "booking": {
    "scheduleButton": "Reservar cita",
    "selectDate": "Elige la fecha",
    "selectTime": "Elige la hora",
    "confirmBooking": "Confirmar reserva",
    "bookingConfirmed": "¡Reserva confirmada!",
    "price": "Precio",
    "duration": "Duración",
    "minutes": "{{count}} min"
  },
  "professional": {
    "portfolio": "Portfolio",
    "services": "Servicios",
    "reviews": "Reseñas",
    "about": "Acerca de",
    "openNow": "Abierto ahora",
    "closedNow": "Cerrado",
    "verified": "Verificado"
  },
  "review": {
    "leaveReview": "Dejar una reseña",
    "ratingLabel": "¿Cómo fue tu experiencia?",
    "commentPlaceholder": "Cuéntanos cómo fue...",
    "addPhoto": "Añadir foto del resultado",
    "submit": "Enviar reseña"
  },
  "profile": {
    "myBookings": "Mis reservas",
    "favorites": "Favoritos",
    "settings": "Ajustes",
    "language": "Idioma",
    "country": "País",
    "logout": "Cerrar sesión"
  },
  "tabs": {
    "home": "Inicio",
    "search": "Buscar",
    "bookings": "Citas",
    "favorites": "Favoritos",
    "profile": "Perfil"
  }
}
```

### 7. Adição na estrutura do monorepo

Adicionar no monorepo:
```
packages/
├── shared-i18n/              # Pacote compartilhado de traduções
│   ├── locales/
│   │   ├── pt-BR.json
│   │   ├── es-ES.json
│   │   └── en.json
│   ├── index.ts              # Export helper functions
│   └── package.json
```

Tanto o mobile-client, mobile-pro, admin e api importam deste pacote para manter traduções sincronizadas.

---

## 🗃️ MODELO DE DADOS (Prisma Schema) — Principais entidades

- **Country**: id, code (BR/ES), name, currency (BRL/EUR), currencySymbol (R$/€), timezone, locale, phonePrefix (+55/+34), active
- **User** (consumidora): id, name, email, phone, avatar, location (lat/lng), **countryId**, locale (pt-BR/es-ES/en), createdAt
- **Professional**: id, userId (owner), businessName, description, address, lat, lng, coverPhoto, avatarPhoto, rating (avg), totalReviews, verified, active, **countryId**, taxId (CPF-CNPJ ou NIF-CIF dependendo do país), createdAt
- **Category**: id, slug, icon, order — **CategoryTranslation**: id, categoryId, locale, name (permite "Cabelo" em pt-BR e "Cabello" em es-ES)
- **Service**: id, professionalId, categoryId, name, description, price, **currency** (BRL/EUR), duration (min), active
- **PortfolioItem**: id, professionalId, serviceId, beforePhoto, afterPhoto, description, createdAt
- **WorkingHours**: id, professionalId, dayOfWeek, startTime, endTime, isOff
- **TimeSlot**: (gerado dinamicamente baseado em WorkingHours + bookings existentes)
- **Booking**: id, userId, professionalId, serviceId, date, startTime, endTime, status (pending/confirmed/completed/cancelled/no_show), totalPrice, **currency**, paymentStatus, createdAt
- **Review**: id, bookingId, userId, professionalId, rating (1-5), comment, photoUrl, createdAt
- **Payment**: id, bookingId, amount, **currency**, method (pix/card/sepa/bizum/boleto), status, **gateway** (mercadopago/stripe), externalId, createdAt
- **ChatMessage**: id, bookingId, senderId, receiverIds, message, readAt, createdAt
- **Favorite**: id, userId, professionalId
- **AdminUser**: id, name, email, password, role (superadmin/admin/moderator), **countryId** (null = acesso global)
- **Banner**: id, imageUrl, targetUrl, active, order, startDate, endDate, **countryId** (segmentado por país)
- **PlatformConfig**: key, value, **countryId** (taxas e regras por país)

---

## ⚡ INSTRUÇÕES DE EXECUÇÃO

1. Comece pelo **schema do Prisma** com todas as entidades e relações (incluindo Country e CategoryTranslation)
2. Depois construa a **API** módulo por módulo (country → user → professional → service → booking → review → payment)
3. Então o **painel admin** com dashboard + CRUDs (com filtro por país)
4. Por fim os **apps mobile** — primeiro o da consumidora, depois o do profissional
5. Em cada etapa, gere código completo e funcional, não stubs ou placeholders
6. **NUNCA hardcode strings de UI** — usar sempre chaves i18n com t('key'). Criar os arquivos pt-BR.json e es-ES.json desde o início
7. Siga estritamente a identidade visual descrita acima
8. Todo componente mobile deve ter animações suaves e microinterações
9. Trate errors gracefully com toasts/alerts bonitos
10. Implemente loading states com skeleton screens, nunca spinners genéricos
11. Todo dado que varia por país (moeda, documento, telefone, gateway) deve ser dinâmico baseado no Country do usuário, nunca hardcoded

---

## 🚀 MVP — PRIORIDADE DE IMPLEMENTAÇÃO

Para o MVP, foque nesta ordem:
1. Auth (cadastro + login) para consumidora e profissional
2. Cadastro de profissional com serviços e preços
3. Busca e descoberta de profissionais por localização
4. Perfil do profissional com portfólio
5. Agendamento com seleção de horário
6. Confirmação e gestão de agendamentos (ambos os lados)
7. Avaliações após atendimento
8. Painel admin com dashboard e gestão básica

Pagamentos e chat ficam para a segunda fase.

---

Comece agora. Primeiro crie toda a estrutura do monorepo e o schema do Prisma. Depois vá construindo módulo por módulo. Me mostre o progresso e pergunte se tiver dúvidas de negócio.
