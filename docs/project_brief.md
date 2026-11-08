# 🎄 Product Brief: 24 · Planificador de Calendários de Advento (PWA)

**Versão:** 1.2 · **Data:** 8 Nov 2026 · **Dono do produto:** Rodrigo Neves · **Estado:** Draft para equipa de desenvolvimento

---

## 1. Visão

Substituir a folha de Excel anual por uma aplicação web progressiva (PWA) **offline-first**, instalável no telefone, que permite planear um ou mais calendários de advento (24 dias, 24 pequenas prendas) por pessoa e por ano, com estados de progresso, etiquetas coloridas, e sugestões inteligentes baseadas no histórico de anos anteriores.

**O problema atual:** o planeamento é feito em folhas de cálculo partilhadas, com cores soltas como único sistema de estado, sem histórico pesquisável, sem sugestões, e sem funcionamento offline.

---

## 2. Utilizadores-alvo (v1)

- **Utilizador principal:** Rodrigo e família próxima. Não é um produto público; não há necessidade de onboarding de massas, mas a arquitetura deve permitir crescer para "amigos e família alargada" no futuro.
- **Dispositivos:** telemóvel (uso principal, muitas vezes em lojas com sinal fraco), desktop/tablet na web (planeamento sentado).

### Personas

| Persona | Contexto | Necessidade |
|---|---|---|
| **O Planeador (Rodrigo)** | Planeia 1-6 calendários por ano, em Outubro-Novembro | Ver tudo num ecrã, preencher rápido, não repetir prendas por acidente |
| **O Colaborador (família)** | Espreita e edita ocasionalmente | Acesso simples a um calendário partilhado |
| **O Embrulhador** | Faz o trabalho manual em Dezembro | Saber o que já está comprado e o que falta embrulhar |

---

## 3. Objetivos e métricas de sucesso

**Objetivo primário:** planear integralmente os calendários de 2026 na app, sem regressar ao Excel.

**Métricas (v1, qualitativas + simples):**

1. 100% dos calendários de 2026 planeados na app (zero regressões ao Excel).
2. Todos os anos históricos (2017-2025) migrados e consultáveis.
3. Funciona offline com fiabilidade: criar/editar dias sem rede e sincronizar sem conflitos percecionáveis.
4. Sugestões utilizadas em ≥ 30% dos dias preenchidos.

**Anti-objetivos (fora de âmbito v1):** monetização, app stores nativas, compras dentro da app, redes sociais, contas públicas.

---

## 4. Âmbito funcional (requisitos)

### 4.1 Calendários

- **Múltiplos calendários por ano**, em paralelo, cada um associado a uma pessoa (beneficiário).
- Campos do calendário: ano, nome da pessoa, nome do calendário (opcional), data de início (por defeito 1 Dec), número de dias (por defeito 24).
- Vista "grelha de advento": 24 portinhas/cartões visuais, numeradas 1-24.
- Vista "lista" alternativa para edição rápida.
- Arquivamento automático de anos passados; histórico sempre navegável.

### 4.2 Dias e prendas

Cada dia contém:

- **Descrição da prenda** (texto livre, ex.: "Moka de natal + choco").
- **Estado:** `planeado` → `comprado` → `embrulhado` (fluxo sequencial; permitir retroceder).
- **Etiquetas coloridas** (tags), substituindo as cores do Excel:
  - Sistema de etiquetas com cor + nome, editável pelo utilizador (ex.: amarelo = "doces", cinza = "roupa", azul = "deco").
  - Várias etiquetas por dia permitidas.
- Notas opcionais (ex.: "comprar no Lidl", "tamanho M").
- Foto opcional da prenda (Firebase Storage).

### 4.3 Estados e progresso

- Barra de progresso por calendário: % planeado / comprado / embrulhado.
- Filtros rápidos: "faltam X por comprar", "faltam Y por embrulhar".
- Modo "lista de compras" agregado: todas as prendas `planeado` de todos os calendários do ano, pronto para levar ao telefone (funciona offline).

### 4.4 Sugestões baseadas no histórico

Comportamento: **mistura de tradições + novidades, com controlo do utilizador.**

- Ao abrir um dia vazio, a app sugere 3-5 prendas:
  1. **Tradições:** prendas recorrentes dessa pessoa.
  2. **Não repetir o recente:** prendas usadas nos últimos 2 anos são penalizadas; prendas antigas/nunca usadas são promovidas.
  3. **Novidades:** catálogo interno de ideias por categoria.
- Regras configuráveis por calendário: toggle "permitir repetições", slider "tradicional ↔ original".
- Registo de feedback implícito.
- v1: motor de sugestões **determinístico e local** (scoring no cliente sobre o histórico).

### 4.5 Contas, partilha e sincronização

- **Firebase:** Authentication (link mágico ou Google), Firestore, Storage.
- Espaço familiar comum (workspace). Convidar familiares por email.
- **Offline-first:** Firestore local persistence + IndexDB; sincronização automática ao recuperar rede.

### 4.6 Migração de dados

- Script manual único para importar os Excel 2017-2025.
- Mapeamento de colunas e cores do Excel para etiquetas da app.

### 4.7 Internacionalização

- **PT-PT e EN** no arranque (`react-i18next`).
- Datas e formatos por locale. Conteúdo do utilizador não é traduzido.
- **Marca universal:** O nome e ícone central usam apenas o numeral **24**, eliminando a necessidade de traduzir a identidade visual.

### 4.8 Notificações e lembretes

- PWA push (Firebase Cloud Messaging) opcional / opt-in.

---

## 5. Requisitos não-funcionais

| Área | Requisito |
|---|---|
| **PWA** | Installable (manifest + service worker), ícone próprio, splash screen, standalone display |
| **Offline** | Ler e escrever todos os dados do calendário atual offline; sincronizar ao reconectar |
| **Performance** | Interação < 100ms no cache local; Lighthouse PWA ≥ 90 |
| **Plataformas** | iOS Safari (PWA) e Android Chrome prioritários + desktop |
| **Privacidade** | Dados pessoais mínimos (email). Sem analytics de terceiros em v1 |
| **Custos** | Firebase Spark/Blaze com orçamento reduzido |

---

## 6. Arquitetura técnica sugerida

- **Frontend:** React + TypeScript + Vite; Tailwind CSS; Workbox.
- **Backend:** Firebase (Auth, Firestore, Storage, FCM).

---

## 7. 🎁 Look & Feel e Branding

### Marca & Naming
- **Nome da App:** **24** (Universal, funcional e limpo para qualquer idioma).
- **Taglines de Apoio:**
  - *PT:* 24 · O caos organizado de Dezembro
  - *EN:* 24 · December's organized chaos

### Conceito & Identidade Visual
- **Direção Artística:** **Ilustração 2D moderna e acolhedora** com texturas suaves de papel e juta. Totalmente afastado do realismo 3D, fotografia ou clipart dos anos 2000.
- **Metáfora Central:** O **saco de juta cheio**. Representa o planeamento concluído e a expetativa do Natal. O saco está visivelmente estufado e volumoso no corpo, mas atado de forma limpa com um laço no topo, sem prendas a transbordar ou a espreitar para fora.
- **Símbolo / Logótipo:** Ilustração vetorial do saco de juta com o numeral **24** gravado na frente em tipografia creme com contorno vermelho profundo, atado com um laço dourado sobre um fundo creme quente (`#FAF6EF`). **Regra estrita de assets:** Sem textos ou nomes adicionais no ícone.

### Paleta de Cores
- **Primário (Verde Abeto):** `#1D6B4F`
- **Secundário (Vermelho Baga):** `#C8353F`
- **Fundo (Creme Inverno):** `#FAF6EF`
- **Texto (Carvão Doce):** `#2E2A26`
- **Acentos (Dourado Warm):** `#E3A82B`
- **Modo Escuro (Noite de Consoada):** `#1E2A44`

### Guia Visual (Moodboard & Componentes UI)
- **Tipografia:** Headings expressivos e redondos (display festivo), texto corrido super limpo (Sans-Serif de elevada legibilidade).
- **Cartões dos Dias (1-24):**
  - `Planeado`: Borda tracejada creme/carvão, fundo de juta/papel claro, ícone de rascunho.
  - `Comprado`: Preenchimento suave na cor da tag principal, selo de check discreto.
  - `Embrulhado`: Cor sólida festiva, laço dourado em selo de cera ou fita recortada.
- **Etiquetas Coloridas:** Etiquetas estilo cartão vintage com perfuração e fita, mantendo as cores do Excel histórico.
- **Ilustrações de Estado Vazio & Progresso:**
  - *Empty State:* Elfo ilustrado com lupa procurando ideias ou caneca de cacau a fumegar.
  - *100% Embrulhado:* Selo circular em dourado "Approved by Santa's Workshop" com animação de confete.

---

## 8. Épicos e roadmap sugerido

| Épico | Conteúdo | Definição de feito |
|---|---|---|
| **E1. Fundação** | Setup React+Vite+Firebase, Auth, i18n, PWA manifest, Ícone "24" | App instalável, login funciona, PT/EN troca ao vivo |
| **E2. Calendário CRUD** | Calendários, grelha 24 dias, editar prendas, estados | CRUD completo offline |
| **E3. Etiquetas & listas** | Sistema de tags, filtros, lista de compras agregada | Cores do Excel reproduzíveis |
| **E4. Histórico & migração** | Script de importação, vista de anos passados, pesquisa | 2017-2025 migrados e navegáveis |
| **E5. Sugestões** | Motor de scoring, UI de sugestões, regras por calendário | Sugestões aparecem em dias vazios |
| **E6. Polimento & branding** | Design system ilustrado, microcopy festivo, fotos, lembretes | Look & feel aprovado; Lighthouse ≥ 90 |

---

## 9. Critérios de aceitação globais (v1)

1. Criar 2 calendários para 2 pessoas em 2026 e preencher os 24 dias de cada, offline num telemóvel em modo avião.
2. Marcar dias como comprado/embrulhado e ver o progresso refletir.
3. Aplicar etiquetas coloridas e filtrar por etiqueta.
4. Ver sugestões num dia vazio respeitando o histórico e regras.
5. Consultar o histórico de 2024 e pesquisar prendas passadas.
6. Reinstalar a app (PWA) e recuperar todos os dados via login.
7. Alternar PT ↔ EN na interface sem recarregar dados.