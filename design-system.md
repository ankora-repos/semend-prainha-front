# 🎨 Flup Design System

> **Versão:** 1.0.0
> **Projeto:** Protocolo Front-end
> **Framework Base:** TailwindCSS + Vanilla CSS (Variáveis CSS)

O **Flup Design System** é a base visual e comportamental para a aplicação. Ele foi desenhado para transmitir uma estética "Premium & Clean" (Limpa e Sofisticada), priorizando consistência, legibilidade, interações suaves (inspiradas no ecossistema Apple) e alta clareza nas informações e hierarquias da interface.

---

## 1. 🌈 Paleta de Cores (Color System)

As cores são divididas em escalas de `50` a `900` para permitir máxima flexibilidade (desde fundos super claros até textos escuros de alto contraste). 

### 🔷 Cor Primária (Indigo / Violeta Rico)
A cor primária é utilizada nas ações principais, botões, estados de _focus_ e destaques na UI. É uma cor que passa confiança, inovação e modernidade.

| Variável CSS | Hexadecimal | Uso sugerido |
| :--- | :--- | :--- |
| `--color-primary-50` | `#eef2ff` | Fundos de cards selecionados, hover states muito sutis |
| `--color-primary-100` | `#e0e7ff` | Fundos alternativos para destaque leve |
| `--color-primary-200` | `#c7d2fe` | Bordas de inputs em foco ativo |
| `--color-primary-300` | `#a5b4fc` | Estados desabilitados ou bordas |
| `--color-primary-400` | `#818cf8` | Hover de botões primários escuros |
| **`--color-primary-500`** | **`#6366f1`** | **Cor base de marca (Botões principais, outlines de focus)** |
| `--color-primary-600` | `#4f46e5` | Hover para botões de ação principal |
| `--color-primary-700` | `#4338ca` | Active states para botões primários |
| `--color-primary-800` | `#3730a3` | Textos de alto contraste sobre fundos primários claros |
| `--color-primary-900` | `#312e81` | Títulos principais em áreas com background primário |

### 🪨 Superfícies e Neutros (Slate)
Substitui o "cinza padrão" por tons mais frios e modernos (Slate), trazendo uma cara mais sofisticada e _clean_ para fundos, bordas e textos comuns.

| Variável CSS | Hexadecimal | Uso sugerido |
| :--- | :--- | :--- |
| **`--color-surface-50`** | **`#f8fafc`** | **Background global da aplicação** |
| `--color-surface-100` | `#f1f5f9` | Fundos de modais, sidebars e painéis secundários |
| `--color-surface-200` | `#e2e8f0` | Divisórias sutis, bordas de cards e inputs |
| `--color-surface-300` | `#cbd5e1` | Bordas mais evidentes, scrollbar thumb inativo |
| `--color-surface-400` | `#94a3b8` | Ícones de navegação desabilitados |
| `--color-surface-500` | `#64748b` | Textos secundários (labels, descrições, placeholders) |
| `--color-surface-600` | `#475569` | Textos de corpo secundários, ícones ativos |
| `--color-surface-700` | `#334155` | Textos de corpo normais, links normais |
| `--color-surface-800` | `#1e293b` | Títulos secundários |
| **`--color-surface-900`** | **`#0f172a`** | **Textos e títulos principais (Alto contraste)** |

### 🚦 Cores Semânticas (Feedback e Estados)
Cores focadas em trazer significado imediato ao usuário (Sucesso, Atenção, Erro e Informação).

#### ✅ Sucesso (Emerald)
Usado para indicações positivas, como finalização de processos, cadastros com sucesso, métricas de crescimento.
*   `--color-success-50`: `#ecfdf5` (Fundo claro para badges ou toasts de sucesso)
*   **`--color-success-500`**: `#10b981` (Cor base)
*   `--color-success-600`: `#059669` (Hover)
*   `--color-success-700`: `#047857` (Texto sobre fundo claro)

#### ⚠️ Aviso (Amber)
Usado para alertas, ações que requerem atenção antes de prosseguir, ou status pendentes.
*   `--color-warning-50`: `#fffbeb` (Fundo claro para avisos)
*   **`--color-warning-500`**: `#f59e0b` (Cor base)
*   `--color-warning-600`: `#d97706` (Textos escuros de aviso ou hover)

#### 🔴 Perigo / Erro (Red)
Usado para botões destrutivos (deletar), mensagens de erro e falhas.
*   `--color-danger-50`: `#fef2f2` (Fundo para mensagens de erro)
*   **`--color-danger-500`**: `#ef4444` (Cor base - Botão de excluir, bordas de erro)
*   `--color-danger-600`: `#dc2626` (Hover de ações destrutivas)

#### ℹ️ Informação (Blue)
Usado para dicas e mensagens gerais do sistema que não são de alerta, mas informativas.
*   `--color-info-50`: `#eff6ff` (Fundo claro)
*   **`--color-info-500`**: `#3b82f6` (Cor base)
*   `--color-info-600`: `#2563eb` (Texto de informação e links informativos)

---

## 2. 🔤 Tipografia (Typography)

A fonte oficial do sistema é a **Inter**. Ela foi escolhida por sua excelente legibilidade em interfaces de usuário complexas (dashboards) e seu aspecto limpo.

*   **Font Family Primária:** `var(--font-sans)` -> `'Inter', system-ui, -apple-system, sans-serif`
*   **Base Size:** 16px (`1rem` global na tag `html`)
*   **Line-height Global:** 1.6 (Para garantir uma leitura não massante em parágrafos mais longos).
*   **Renderização:** Configurada globalmente com `-webkit-font-smoothing: antialiased` e `-moz-osx-font-smoothing: grayscale` para um visual cristalino nas telas.

---

## 3. 📐 Espaçamento e Bordas (Border Radius)

O Flup Design prioriza bordas levemente mais arredondadas que o padrão (`md` ao invés de `sm`) para trazer uma amigabilidade extra ao sistema.

| Variável | Valor | Aplicação Sugerida |
| :--- | :--- | :--- |
| `--radius-sm` | `0.375rem` (6px) | Checkboxes, badges pequenos e pequenas tags |
| **`--radius-md`** | **`0.5rem` (8px)** | **Inputs, Botões padrão, selects** |
| `--radius-lg` | `0.75rem` (12px) | Cards internos, dropdowns, modais pequenos |
| `--radius-xl` | `1rem` (16px) | Cards principais do dashboard, modais de tamanho médio |
| `--radius-2xl` | `1.5rem` (24px) | Elementos de grande destaque, containers flutuantes |

---

## 4. ☁️ Sombras e Elevação (Shadows)

Inspirado nos ecossistemas da Apple, as sombras do projeto usam múltiplas camadas (`rgb(0 0 0 / 0.X)`) para simular profundidade real em vez de apenas uma mancha cinza.

| Elevação | Variável CSS | Descrição e Uso Sugerido |
| :--- | :--- | :--- |
| **Nível 1 (xs)** | `--shadow-xs` | Menus sutis ou divisórias muito próximas ao fundo. |
| **Nível 2 (sm)** | `--shadow-sm` | Botões em estado normal, inputs focados sutilmente, sub-cards. |
| **Nível 3 (md)** | `--shadow-md` | **Cards principais no dashboard, header (se flutuante).** |
| **Nível 4 (lg)** | `--shadow-lg` | Modais padrão, dropdowns abertos. |
| **Nível 5 (xl)** | `--shadow-xl` | Diálogos de alerta críticos ou _sheets_ que se sobrepõem à tela toda. |

---

## 5. ⚡ Comportamentos Globais e Acessibilidade (Globals & UX)

A folha de estilo `index.css` na camada `@layer base` garante comportamentos altamente polidos que aplicam-se a todo o projeto:

### 🎯 Foco (Focus States)
Para não interferir na beleza da interface original de botões e inputs, foi desativada a borda azul feia padrão do navegador (`outline: none` internamente). Em substituição, utilizamos o `:focus-visible`:
*   **Outline Global:** Cria uma borda forte (`2px solid var(--color-primary-500)`)
*   **Outline Offset:** Tem uma distância de `2px` (`outline-offset: 2px`) para garantir que o focus contorne o elemento sem esmagar o visual dele. Fica incrivelmente acessível e esteticamente agradável.

### ✨ Animações de Interação Suave (Transitions)
**Todos os elementos clicáveis e de input da aplicação são animados por padrão.**
*   Elementos aplicados: `button`, `a`, `input`, `select`, `textarea`
*   Transição global: `transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);`
*   **Por que importa?** Qualquer estado de `hover` ou `focus` nessas propriedades terá entrada gradual, eliminando a "secada visual" (quando uma cor muda violentamente num clique). O uso de curva `cubic-bezier` garante a aceleração inicial suave da animação de UI.

### 📜 Scrollbars Personalizadas
Para manter o aspecto premium, a barra de rolagem dos navegadores (WebKit) foi re-estilizada e reduzida para ser super minimalista.
*   **Tamanho:** 6x6px (bem mais fina que o normal).
*   **Track (Fundo):** Transparente.
*   **Thumb (Barra móvel):** Cinza suave (`--color-surface-300`), e escurece com o hover do mouse (`--color-surface-400`). Bordas arredondadas (`6px`).

---

## 6. 🧩 Padrões Arquiteturais para a UI

Ao desenvolver no "Flup", as seguintes diretrizes arquiteturais devem ser mantidas sempre em consideração:

1.  **Fundos da Aplicação**: Todas as páginas obrigatoriamente herdam a cor `--color-surface-50` do `body`. Evite forçar backgrounds em tags principais sem necessidade.
2.  **Cor de Textos Base**: Todos os textos normais iniciam com a cor de alto contraste `--color-surface-900`. 
3.  **Contraste em Inputs**: Os `inputs` devem, idealmente, ter fundos brancos (ou `surface-50` caso inseridos sobre cards brancos) com bordas `surface-200`. Em hover, devem ter sua borda realçada, e no focus devem brilhar e ganhar a borda primária (usando ring no Tailwind ou a própria outline que já está codificada na raiz).
4.  **Cores no Tailwind**: O sistema pode ser consumido pelas classes tailwind equivalentes (ex. `bg-primary-500`, `text-surface-700`, etc) se mapeadas devidamente nas configurações do framework, permitindo velocidade aliada à solidez do tema.

---

## 7. 📊 Padrões de Interface do Dashboard

O Dashboard é a tela principal de tomada de decisões, portanto seu design foi pensado para exibir dados de maneira **altamente escaneável, limpa e responsiva**, reduzindo o peso cognitivo do usuário.

### 📈 Estrutura e Cabeçalho
*   **Animação de Entrada:** Toda a tela usa um efeito sutil de entrada (`animate-in fade-in duration-500`) para suavizar o carregamento.
*   **Título Principal:** Apresenta alto contraste e peso (`text-3xl font-bold text-surface-900 tracking-tight`).
*   **Subtítulo:** Informa do que se trata a página com peso menor (`text-sm font-medium text-surface-500`).

### 🃏 Cards de Resumo (Kpis / Metrics)
São os blocos do topo que mostram métricas essenciais. O seu design é baseado em um princípio lúdico mas profissional:
*   **Forma e Contorno:** Extremamente arredondados (`rounded-2xl`), com preenchimento em branco absoluto e borda super sutil (`border-surface-200/60`).
*   **Tipografia do Rótulo:** Caixa alta e espaçado para evitar poluição visual (`text-[13px] font-bold uppercase tracking-wider text-surface-500`).
*   **Tipografia do Valor:** Enorme e pesada para bater o olho e ler (`text-3xl font-black text-surface-900`).
*   **Ícones e "Glow" (Brilho):** O ícone possui o fundo sólido da cor semântica (ex: `bg-primary-500`, `bg-info-500`), texto branco, com as bordas arredondadas (`rounded-xl`) e **projeta um brilho elegante (shadow glow) da sua própria cor** no contorno (ex: `shadow-primary-500/20`).
*   **Interatividade (Hover):** Ao passar o mouse, o card todo levanta sutilmente e ganha sombra maior (`hover:-translate-y-1 hover:shadow-md transition-all duration-300`).
*   **Highlight Crítico (Destaque):** Cards que mostram números alarmantes (como "Atrasados > 0") recebem um ring visual intenso para chamar a atenção imediatamente (`ring-4 ring-danger-50 shadow-danger-100 border-danger-300`).

### 📊 Cards de Gráficos e Seções (Data Visualization)
Containers que envelopam gráficos complexos ou listagens como os gráficos de barra (BarChart) ou rosca (PieChart).
*   **Layout base:** Borda `rounded-2xl`, fundo branco e um preenchimento generoso (`p-5 sm:p-7`).
*   **Cabeçalho da Seção:** Tem um ícone temático e o Título em `text-base font-bold text-surface-900`.
*   **Efeito Artístico de Fundo:** Possuem uma "mancha" sutil (blob arredondado) no canto superior direito para dar um tom mais moderno (ex: `absolute top-0 right-0 w-32 h-32 bg-primary-50 rounded-bl-[100px] opacity-50`).
*   **Tooltips Customizados:** Quando o usuário sobrevoa um gráfico, o Tooltip aparece moderno, fugindo do padrão do Recharts: Borda arredondada suave `borderRadius: 12px`, contorno da cor `surface-200` e sombra customizada, preservando a imersão na interface.
*   **Legendas:** Em vez das legendas padrão e confusas, usamos listas grid. O "ponto de cor" (Dot) ganha uma leve sombra interna (`shadow-inner`) para parecer um botão táctil, e o hover sobre o item realça sua linha com `bg-surface-50`.

### 👻 Estados Vazios (Empty States)
Quando não existem dados a exibir nos gráficos:
*   **Container Amigável:** Fundo levemente sombreado e claro (`bg-surface-50/50`) com bordas tracejadas (`border-dashed border-surface-200`) e cantos redondos (`rounded-xl`).
*   **Ícone Base:** Ícone centralizado num círculo leve (`bg-surface-100`) para não deixar a tela vazia parecendo quebrada.
*   **Mensagem:** Texto centralizado e de baixo contraste (`text-surface-500 font-medium text-sm`), instruindo "Nenhum dado disponível" de forma suave.

---

## 8. 📦 Ecossistema de Bibliotecas de UI (Tech Stack)

Para garantir não só a beleza do código, mas também a sua manutenibilidade e performance, o Design System é construído utilizando ferramentas de ponta da comunidade React. O ecossistema é suportado por:

### ⚙️ Core de Estilização
*   **[TailwindCSS (v4)](https://tailwindcss.com/)**: Motor principal de estilos e fundação de todas as nossas variáveis dinâmicas de CSS. Permite que as regras de cor e layout sejam reutilizáveis por utilitários.
*   **[Tailwind-merge](https://github.com/dcastil/tailwind-merge) & [clsx](https://github.com/lukeed/clsx)**: Utilizados na função `cn()` global para garantir que os componentes sejam flexíveis sem ocorrer conflito de estilos (ex: passar uma prop extra apagando o background padrão de um botão corretamente).
*   **[Class Variance Authority (CVA)](https://cva.style/docs)**: Estrutura utilizada para construir nossos botões, badges e inputs escaláveis, definindo "variantes" formais e bem estruturadas na base de código.

### 🧩 Visual e Interação
*   **[Lucide React](https://lucide.dev/)**: Nossa biblioteca oficial de iconografia. Escolhida especificamente por ter o mesmo traçado "clean", vetores leves e consistência visual, casando muito bem com a fonte Inter.
*   **[Sonner](https://sonner.emilkowal.ski/)**: Ferramenta premium adotada para exibir os _Toasts / Notificações_ flutuantes, altamente acessíveis e fluidas (com empilhamento natural).
*   **[Recharts](https://recharts.org/)**: A espinha dorsal do dashboard visual, entregando total flexibilidade para re-estilizar gráficos com o DNA da marca através do suporte e composição de SVGs no React.
