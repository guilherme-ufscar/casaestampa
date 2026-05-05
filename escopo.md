# ESCOPO DO PROJETO — Sistema de Orçamento de Cortinas

**Cliente:** Casa Estampa Interiores
**Desenvolvedor:** Coder Master Desenvolvimento de Sistemas e Websites Ltda
**Data:** Maio de 2026
**Versão:** 1.0 (MVP)

---

## 1. VISÃO GERAL

Sistema web responsivo para otimização do processo de orçamento de cortinas sob medida, utilizado por vendedores em campo e administradores. O sistema automatiza os cálculos de tecido, custos, margens e comissões, e gera orçamentos em PDF com identidade visual da empresa.

---

## 2. PERFIS DE USUÁRIO

| Perfil | Acesso |
|---|---|
| **Vendedor** | Novo orçamento, clientes, orçamentos em andamento/aprovados, pedidos em produção, instalações agendadas, tabelas de preço |
| **Administrador** | Tudo do vendedor + custos, margens, comissões, usuários, relatórios |

---

## 3. FLUXO DE TELAS

### Tela 1 — Login
- Email
- Senha
- Autenticação com redirecionamento por perfil (vendedor → dashboard vendedor / admin → dashboard admin)

---

### Tela 2 — Dashboard (Home)

**Vendedor vê:**
- Botão "Novo Orçamento"
- Lista de Clientes
- Orçamentos em Andamento
- Orçamentos Aprovados
- Pedidos em Produção
- Instalações Agendadas
- Tabelas de Preço

**Administrador vê (adicionalmente):**
- Custos globais
- Margens
- Comissões
- Usuários
- Relatórios

---

### Tela 3 — Novo Orçamento

#### 3A — Cadastro de Cliente *(com opção de pular)*
- Nome
- Endereço
- Telefone
- Email
- Arquiteto / RT responsável
- Orçamentos anteriores do cliente (histórico)

#### 3B — Seleção de Produto
O vendedor escolhe o tipo de produto a orçar:
- ★ **Papel de Parede**
- ★ **Cortina** *(foco principal do MVP)*
- ★ **Persiana**

---

### Tela 3C — Orçamento de Cortina *(coração do negócio)*

> Campos de entrada para cada ambiente orçado:

| Campo | Tipo |
|---|---|
| Ambiente | Texto livre |
| Trilho Suíço ou Varão | Seleção (dropdown) |
| Largura | Numérico (metros) |
| Altura | Numérico (metros) |
| Modelo da cortina | Seleção (ver opções abaixo) |
| Tecido principal | Seleção via tabela de tecidos |
| Forro ou Blackout | Seleção via tabela / Sim ou Não |
| Trilho/acessórios | Campo numérico manual ou via tabela |
| Instalação | Sim ou Não |
| Observações | Texto livre |
| Bainha desejada | Numérico (metros) |
| Outros | Valor manual em R$ (campo livre para custos extras) |

**Modelos de cortina disponíveis:**
- Prega Macho
- Prega Fêmea
- Prega Americana
- Prega Franzida
- Prega Reta / Blackout
- Wave
- Soft Wave
- Varão

> O vendedor pode adicionar múltiplos ambientes no mesmo orçamento.

---

### Tela 4 — Cálculo Automático

> Após preencher os campos, o sistema calcula automaticamente:

#### 4.1 — Cálculo de Quantidade de Tecido

**Regra base:**
```
largura_com_consumo = largura_final × fator_da_prega

Fatores por modelo:
- Prega Macho:     × 3
- Prega Fêmea:     × 2,5
- Prega Americana: × 2,5
- Prega Franzida:  × 3
- Reta/Blackout:   × 1
- Wave:            × 2
- Soft Wave:       × 2
- Varão:           × configurável na tabela
```

**Arredondamento (sempre para cima, de 0,50 em 0,50):**
```
9,78 → 10,00
8,35 → 8,50
9,10 → 9,50
9,51 → 10,00
```

**Regra de altura vs. largura do tecido:**
```
largura_útil_real = largura_do_tecido - 0,10 (desconto da cabeça)

Exemplos:
  Tecido 2,80m → 2,70m úteis
  Tecido 3,00m → 2,90m úteis
  Tecido 3,30m → 3,20m úteis

Verificação:
  sobra_para_bainha = largura_útil_real - altura_cortina

  Exemplo: tecido 3,00 → útil 2,90; altura 2,58 → sobra = 0,32m

  Se bainha for dupla:
    cada_dobra = sobra / 2
    → 0,32 / 2 = 0,16m por dobra ✓ (cabe)

  Se bainha_desejada ≤ sobra_disponível → calcula normalmente
  Se bainha_desejada > sobra_disponível → adicionar tecido extra (ver regra abaixo)
```

**Regra de tecido adicional para bainha/emenda:**
```
Se bainha_desejada > (largura_útil_real - altura_cortina):
  → Precisa adicionar tecido

  Se abertura INTEIRA:
    tecido_adicional = quantidade_total calculada
    consumo_final = quantidade_calculada × 2

  Se abertura CENTRAL:
    tecido_adicional = quantidade_total / 2
    consumo_final = quantidade_calculada × 1,5
```

> O sistema deve **alertar** quando a altura + bainha não couberem na largura útil do tecido.

#### 4.2 — Cálculo do Blackout (mesma lógica do tecido principal)

```
largura_blackout_com_consumo = largura_final × fator_blackout
Verificar altura + bainha dentro da largura útil real do blackout
custo_blackout = quantidade_blackout × valor_metro_blackout
```

#### 4.3 — Custo Total do Ambiente
```
custo_tecido     = quantidade_final_tecido × valor_metro_tecido
custo_blackout   = quantidade_final_blackout × valor_metro_blackout  (se houver)
custo_material   = custo_tecido + custo_blackout + custo_trilho
custo_confecção  = (valor configurável por metro/peça na tabela)
custo_instalação = (valor fixo configurável — apenas se Instalação = Sim)
outros           = valor manual digitado pelo vendedor (campo livre)

custo_total = custo_material + custo_confecção + custo_instalação + outros
```

**Formação do preço de venda (cascata):**
```
1. preço_com_markup   = custo_total / (1 - % markup)
   → Exemplo: custo R$1.000, markup 40% → preço_com_markup = 1.000 / 0,60 = R$1.666,67

2. valor_RT           = preço_com_markup × % RT/arquiteto
   → RT é adicionado por cima do preço com markup

3. valor_comissão     = preço_com_markup × % comissão_vendedor
   → Comissão é calculada sobre o preço com markup

4. preço_final_venda  = preço_com_markup + valor_RT + valor_comissão

Observação: todos os percentuais (markup, RT, comissão) são configuráveis
pelo admin na tabela de configurações e editáveis por orçamento.
```

---

### Tela 5 — Resultado do Orçamento

Exibe por ambiente e total geral:

- Valor total
- Resumo técnico (quantidade de tecido, blackout, trilho)
- Comissão do vendedor
- Margem de lucro *(visível apenas para Admin)*
- Custos *(visível apenas para Admin)*

**Ações disponíveis:**
- 📄 Botão **"Gerar PDF"** — PDF com identidade visual da empresa
- 💬 Botão **"Enviar por WhatsApp"** — link com resumo do orçamento
- ➕ Botão **"Adicionar outro ambiente"** — volta para Tela 3C para novo item
- ✅ Botão **"Finalizar e salvar orçamento"**

---

### Tela 6 — Painel de Pedidos

Kanban ou lista com status do pedido:

| Status |
|---|
| Orçamento enviado |
| Aguardando aprovação |
| Aprovado |
| Em produção |
| Pronto |
| Instalado |
| Finalizado |

- Vendedor pode mover o status manualmente
- Admin pode mover e editar qualquer pedido
- Filtros por vendedor, período e status

---

## 4. TABELAS DE CONFIGURAÇÃO (Admin)

Gerenciadas pelo administrador:

| Tabela | Campos |
|---|---|
| **Tecidos** | Nome, largura máxima (2,80 / 3,00 / 3,30...), valor R$/metro, tipo (tecido / blackout), ativo/inativo |
| **Blackouts** | Nome, largura máxima, valor R$/metro |
| **Trilhos e varões** | Nome, valor unitário ou R$/metro |
| **Fatores de prega** | Modelo da cortina → fator multiplicador |
| **Confecção** | Valor por metro ou por peça |
| **Instalação** | Valor fixo ou por ambiente |
| **Markup** | % padrão (editável por orçamento) |
| **Comissão vendedor** | % padrão por vendedor |
| **RT / Arquiteto** | % padrão |

---

## 5. MÓDULO DE CLIENTES

- Cadastro completo (nome, endereço, telefone, email, arquiteto)
- Histórico de todos os orçamentos
- Busca por nome, telefone ou email
- Edição do cadastro

---

## 6. RELATÓRIOS (Admin)

- Total de orçamentos por período
- Orçamentos aprovados vs. perdidos
- Faturamento por vendedor
- Comissões por vendedor
- Margem média por período
- Exportação em PDF ou Excel

---

## 7. GERAÇÃO DE PDF

O PDF de orçamento deve conter:
- Logo e identidade visual da empresa
- Dados do cliente
- Tabela por ambiente (produto, dimensões, tecido, observações)
- Valores por item e total geral
- Condições comerciais (texto configurável)
- Campo de assinatura de aprovação
- **Não exibe** custos, margens ou comissões — apenas o preço final de venda ao cliente

---

## 8. ENVIO POR WHATSAPP

- Botão que abre `wa.me/` com mensagem pré-formatada contendo:
  - Nome do cliente
  - Resumo dos ambientes
  - Valor total
  - Link para visualizar/baixar o PDF

---

## 9. STACK TÉCNICA RECOMENDADA

| Camada | Tecnologia |
|---|---|
| Frontend | Next.js 14 (App Router) + TypeScript |
| Estilização | Tailwind CSS |
| Backend/API | Next.js API Routes |
| Banco de dados | PostgreSQL + Prisma ORM |
| Autenticação | NextAuth.js |
| PDF | Puppeteer ou React-PDF |
| Deploy | Docker + Coolify (VPS Hetzner) |
| Storage (logos/PDF) | S3 compatível (ex: Cloudflare R2) |

---

## 10. DESIGN SYSTEM — IDENTIDADE VISUAL & DIRETRIZES DE LAYOUT

### 10.1 — Identidade da Marca

A **Casa Estampa Interiores** posiciona-se como uma empresa de decoração premium: luxo acessível, elegância refinada e atendimento personalizado. O sistema interno deve refletir essa mesma personalidade — não pode parecer um ERP genérico, precisa parecer uma ferramenta que a própria marca usaria com orgulho.

**Logo:** Ornamental, caligrafia dourada com elementos barrocos (filigrana, coroa, "C" elaborado). Fundo transparente — usar sempre sobre fundos escuros ou creme.

**Tom visual:** Luxo contemporâneo. Não é pesado nem antiquado — é sofisticado e limpo. Pense em referências como Airbnb Luxe, Net-a-Porter, ou Linear com um toque de editorial de interiores.

---

### 10.2 — Paleta de Cores

Extraída da logo + site + boas práticas para sistemas B2B de alto padrão:

#### Cores Primárias
| Token | Hex | Uso |
|---|---|---|
| `--gold-primary` | `#C9A84C` | Cor principal da marca (extraída da logo). Botões CTA, destaques, ícones ativos |
| `--gold-light` | `#E8C97A` | Hover states, badges, gradiente do gold |
| `--gold-dark` | `#8B6914` | Texto dourado sobre fundos claros, estados pressionados |

#### Cores de Fundo (Base do Sistema)
| Token | Hex | Uso |
|---|---|---|
| `--bg-primary` | `#0F0F0F` | Sidebar, header, áreas de navegação |
| `--bg-surface` | `#1A1A1A` | Cards, painéis, modais |
| `--bg-elevated` | `#242424` | Hover de cards, dropdowns, tooltips |
| `--bg-light` | `#F7F4EF` | Alternativa clara para telas com muito formulário (modo claro) |
| `--bg-cream` | `#FAF8F3` | Background geral em modo claro — creme suave, não branco puro |

#### Cores de Texto
| Token | Hex | Uso |
|---|---|---|
| `--text-primary` | `#FFFFFF` | Textos principais sobre fundo escuro |
| `--text-secondary` | `#A0A0A0` | Labels, placeholders, metadados |
| `--text-dark` | `#1C1C1C` | Textos sobre fundos claros |
| `--text-muted` | `#6B6B6B` | Textos de apoio sobre fundos claros |

#### Cores de Suporte (Semânticas)
| Token | Hex | Uso |
|---|---|---|
| `--success` | `#22C55E` | Orçamento aprovado, status positivo |
| `--warning` | `#F59E0B` | Aguardando aprovação, atenção |
| `--error` | `#EF4444` | Erros, alertas críticos |
| `--info` | `#3B82F6` | Informativos, links |
| `--neutral` | `#6B7280` | Status neutros, bordas sutis |

#### Gradientes da Marca
```css
--gradient-gold: linear-gradient(135deg, #C9A84C 0%, #E8C97A 50%, #8B6914 100%);
--gradient-dark: linear-gradient(180deg, #1A1A1A 0%, #0F0F0F 100%);
--gradient-surface: linear-gradient(135deg, #1A1A1A 0%, #242424 100%);
```

---

### 10.3 — Tipografia

**Decisão:** **Poppins** como fonte principal do sistema.

Razões: Poppins tem personalidade geométrica e premium que combina com o posicionamento da marca, excelente legibilidade em telas mobile (fundamental para vendedores em campo), e pares bem com elementos dourados ornamentais sem competir com a logo.

```css
/* Importar no projeto */
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');

/* Escala tipográfica */
--font-family: 'Poppins', sans-serif;

--text-xs:   0.75rem;   /* 12px — labels, badges */
--text-sm:   0.875rem;  /* 14px — corpo secundário, tabelas */
--text-base: 1rem;      /* 16px — corpo principal */
--text-lg:   1.125rem;  /* 18px — subtítulos */
--text-xl:   1.25rem;   /* 20px — títulos de card */
--text-2xl:  1.5rem;    /* 24px — títulos de seção */
--text-3xl:  1.875rem;  /* 30px — títulos de página */

/* Pesos */
--font-light:    300;   /* textos de apoio longos */
--font-regular:  400;   /* corpo */
--font-medium:   500;   /* labels, botões secundários */
--font-semibold: 600;   /* títulos de card, botões */
--font-bold:     700;   /* títulos de página, destaques */
```

---

### 10.4 — Diretrizes de Layout

#### Abordagem Geral: Dark Luxury + Light Forms

O sistema usa **modo escuro** como base (sidebar, header, dashboard), com **painéis claros (creme)** para áreas de formulário intenso — especialmente o orçamento. Isso reduz fadiga visual do vendedor em campo e dá contraste visual claro entre navegação e conteúdo de trabalho.

#### Estrutura de Layout
```
┌─────────────────────────────────────────────────┐
│  HEADER (dark, logo à esquerda, user à direita) │
├──────────┬──────────────────────────────────────┤
│          │                                      │
│ SIDEBAR  │         CONTENT AREA                 │
│ (dark)   │    (dark com cards elevated          │
│          │     ou cream para formulários)       │
│          │                                      │
│ 240px    │         flex-1                       │
│          │                                      │
└──────────┴──────────────────────────────────────┘
```

#### Componentes Visuais Chave

**Cards:**
- Border-radius: `12px`
- Background: `var(--bg-surface)` com `1px solid rgba(201,168,76,0.15)`
- Hover: borda gold sutil `rgba(201,168,76,0.40)` + `box-shadow: 0 8px 32px rgba(0,0,0,0.3)`
- Sem sombras pesadas — preferir bordas sutis douradas

**Botões:**
```
CTA Principal  → background gold gradient + texto escuro + font-semibold
Secundário     → border 1px gold + texto gold + background transparente
Destrutivo     → border 1px red + texto red
Ghost          → sem borda + texto secondary + hover: bg-elevated
```

**Inputs / Formulários:**
- Background: `#F7F4EF` (creme) ou `#FFFFFF` em modo claro
- Border: `1px solid #E5E0D8`
- Focus: `border-color: #C9A84C` + `box-shadow: 0 0 0 3px rgba(201,168,76,0.15)`
- Label: Poppins 12px, font-medium, uppercase com letter-spacing
- Border-radius: `8px`

**Status Badges (Painel de Pedidos):**
- Pill shape com `border-radius: 999px`
- Cor de fundo com 15% opacidade da cor semântica + texto 100%
- Exemplo: Aprovado → `background: rgba(34,197,94,0.15)` + texto `#22C55E`

**Tabelas:**
- Header: dark com texto secondary uppercase
- Rows alternadas: transparente / `rgba(255,255,255,0.02)`
- Row hover: `rgba(201,168,76,0.05)` — toque dourado sutil

**Sidebar:**
- Item ativo: fundo `rgba(201,168,76,0.12)` + borda esquerda `3px solid #C9A84C` + texto gold
- Item inativo: texto secondary, hover muda para texto branco
- Ícones: stroke-based (Lucide Icons), 20px

#### Micro-interações & Motion
- Transições: `transition: all 0.2s ease`
- Cards aparecem com `fade-in + translateY(8px)` ao carregar página
- Skeleton loading em vez de spinners para tabelas e cards
- Toast notifications (sucesso/erro) entram pelo canto superior direito
- Nenhuma animação acima de 300ms — o sistema é ferramenta de trabalho

#### Iconografia
- Biblioteca: **Lucide Icons** (stroke, clean, consistente com Poppins)
- Tamanho padrão: 18px em sidebar, 16px em tabelas, 20px em cards
- Cor: herda `currentColor` — funciona em todos os estados

#### Espaçamento (escala 4px)
```
--space-1:  4px
--space-2:  8px
--space-3:  12px
--space-4:  16px
--space-5:  20px
--space-6:  24px
--space-8:  32px
--space-10: 40px
--space-12: 48px
--space-16: 64px
```

#### Responsividade
- **Mobile (< 768px):** Sidebar colapsa em bottom navigation ou hamburger. Formulários em coluna única. Tabelas viram cards empilhados.
- **Tablet (768px–1024px):** Sidebar icônica (só ícones, 64px). Grid de 2 colunas.
- **Desktop (> 1024px):** Layout completo com sidebar expandida (240px).

---

### 10.5 — Referências Visuais de Inspiração

Sistemas com a estética desejada (dark luxury + formas limpas):
- **Linear** — sidebar escura, cards com bordas sutis, tipografia precisa
- **Vercel Dashboard** — dark mode sofisticado, hierarquia clara
- **Stripe Dashboard** — formulários impecáveis, status badges elegantes
- **Loom** — onboarding premium, micro-interações suaves

Referência de paleta dourada em sistemas SaaS:
- Notion AI (gradiente dourado nos CTAs)
- Framer (bordas com glow sutil)

---

### 10.6 — Workflow Google Stitch

> **Obrigatório:** Antes de qualquer código de UI, gerar os designs no Google Stitch (Gemini 2.5 Flash) via MCP no Claude Code CLI, usando as diretrizes acima como base do prompt.

**Telas a gerar no Stitch (nesta ordem):**

| # | Tela | Prioridade |
|---|---|---|
| 1 | Login | MVP |
| 2 | Dashboard Vendedor | MVP |
| 3 | Dashboard Admin | MVP |
| 4 | Novo Orçamento — Cadastro de Cliente | MVP |
| 5 | Novo Orçamento — Seleção de Produto | MVP |
| 6 | Orçamento Cortina — Formulário completo | MVP |
| 7 | Tela Cálculo / Revisão antes de confirmar | MVP |
| 8 | Resultado do Orçamento | MVP |
| 9 | Painel de Pedidos (lista com status) | MVP |
| 10 | Tabelas de Configuração — Admin | MVP |
| 11 | Módulo de Clientes | MVP |
| 12 | Relatórios | Fase 5 |

**Instrução base para todos os prompts Stitch:**
> "Sistema interno para empresa de decoração de alto padrão chamada Casa Estampa Interiores. Dark luxury aesthetic. Sidebar escura (#0F0F0F), cards com fundo (#1A1A1A) e borda dourada sutil. Fonte Poppins. Acentos dourados (#C9A84C). Formulários em fundo creme (#FAF8F3). Mobile-first. Estilo: Linear + Stripe + editorial de interiores premium. [descrição específica da tela]"

---

## 11. FASES DE DESENVOLVIMENTO

### Fase 1 — Fundação
- Setup do projeto (Next.js + Prisma + PostgreSQL + Docker)
- Autenticação e perfis (vendedor / admin)
- CRUD de usuários
- Tabelas de configuração (tecidos, fatores, preços)

### Fase 2 — Orçamento Core
- Cadastro de clientes
- Formulário de novo orçamento (cortina)
- Engine de cálculo automático (quantidade de tecido + custo total)
- Resultado do orçamento

### Fase 3 — PDF e WhatsApp
- Geração de PDF com identidade visual
- Botão de envio por WhatsApp

### Fase 4 — Painel de Pedidos
- CRUD de pedidos com status
- Kanban ou lista com filtros

### Fase 5 — Admin e Relatórios
- Dashboard admin com custos e margens
- Módulo de relatórios
- Exportação

### Fase 6 — Expansão *(pós-MVP)*
- Módulo de Persiana
- Módulo de Papel de Parede
- Instalações agendadas (agenda)
- App mobile (PWA ou Capacitor)

---

## 12. REGRAS DE NEGÓCIO CRÍTICAS

1. **Vendedor nunca vê** custo, margem ou comissão — apenas o preço final de venda.
2. **O PDF** enviado ao cliente nunca exibe custos.
3. **Arredondamento de tecido** sempre para cima, de 0,50 em 0,50.
4. **Cabeça da cortina** sempre desconta 0,10m da largura útil do tecido.
5. **Alerta obrigatório** quando altura + bainha não couberem na largura útil do tecido.
6. **Tecido adicional** calculado conforme abertura (inteira ou central).
7. **Múltiplos ambientes** podem compor um único orçamento.
8. **GitHub obrigatório** — todo commit sobe para o repositório antes de qualquer avanço de fase.

---

## 13. OBSERVAÇÕES FINAIS

- O sistema deve ser 100% responsivo (mobile-first para vendedores em campo).
- Papel de Parede e Persiana são módulos futuros — a arquitetura deve ser extensível.
- Os fatores de prega e preços de tabela devem ser editáveis pelo admin sem código.
- Toda alteração de orçamento deve ser registrada em log de histórico.
