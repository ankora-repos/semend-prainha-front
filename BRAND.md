# Guia de Identidade Visual — Protocolla

> Fonte: `MANUAL_PROTOCOLLA.pdf` (Lusion Studio × Cloud 7, Copyright © 2026)
> Este arquivo é a referência obrigatória para toda decisão de design e identidade visual do sistema.

---

## 1. Conceito da Marca

A identidade visual do **Protocolla** foi desenvolvida para representar uma nova geração de plataformas de transformação digital voltadas para gestão pública. Mais do que um sistema de protocolo, o Protocolla nasce como uma infraestrutura inteligente para tramitação, organização documental, automação operacional e modernização institucional.

### Pilares Visuais

| Pilar | Significado |
|---|---|
| Robustez institucional | Seriedade e confiança para uso governamental |
| Clareza operacional | Interface limpa, sem ruído visual |
| Inteligência tecnológica | Design moderno, referência em tech |
| Escalabilidade digital | Sistema visualmente coerente em qualquer escala |
| Minimalismo moderno | Menos é mais — formas limpas e diretas |
| Confiabilidade pública | Identidade que transmite segurança ao cidadão |

---

## 2. Paleta de Cores

### Cores Primárias

| Nome | Hex | Uso |
|---|---|---|
| **Azul Protocolla** | `#0F4CFF` | Cor principal da marca, CTAs, ícones ativos, destaques |
| **Escuro Institucional** | `#111827` | Textos principais, fundos escuros, tipografia de peso |
| **Branco Operacional** | `#F5F7FB` | Fundos, áreas de conteúdo, backgrounds de card |

### Aplicações de Cor

- **Fundo primário de interface:** `#F5F7FB`
- **Texto principal:** `#111827`
- **Ação/destaque:** `#0F4CFF`
- **Texto sobre azul:** `#FFFFFF`
- **Texto sobre escuro:** `#FFFFFF`
- **Superfícies de card:** `#FFFFFF` com borda sutil

### No Tailwind (mapeamento atual → marca)

```
primary-600  →  #0F4CFF  (azul Protocolla)
surface-900  →  #111827  (escuro institucional)
surface-50   →  #F5F7FB  (branco operacional)
```

---

## 3. Logo e Ícone

### Ícone

- Símbolo: letra **"P" estilizada** com traço duplo e cantos arredondados
- Forma do container: **quadrado com bordas bem arredondadas** (border-radius elevado)
- Proporção: o ícone é quadrado — nunca deve ser esticado

### Variações do Ícone

| Variação | Ícone | Fundo |
|---|---|---|
| Principal | P branco | `#0F4CFF` azul |
| Escura | P branco | `#111827` quase preto |
| Outline claro | P preto | Transparente/branco |
| Outline escuro | P escuro | Transparente |

### Logotipo Completo

- Composição: **ícone à esquerda + wordmark "Protocolla" à direita**
- Wordmark: tipografia **bold, sem serifa, peso pesado** — letras com espaçamento natural
- Variações:
  - Escuro sobre claro (padrão)
  - Azul sobre branco
  - Branco sobre escuro
  - Branco sobre azul

### Variação Alternativa

Existe uma versão onde o "P" do ícone **integra visualmente** com a palavra "rotocolla" — formando "**P**rotocolla" como uma única unidade gráfica. Usar apenas em aplicações editoriais/impressas.

---

## 4. Tipografia

Com base no estilo visual do manual:

- **Wordmark:** Sans-serif geométrica, peso 700–900 (Extra Bold / Black)
- **Interface:** Fonte limpa, sem serifa, alta legibilidade — compatível com **Inter** (já em uso no projeto)
- **Hierarquia:**
  - Títulos: bold, tamanho grande, cor `#111827`
  - Subtítulos: semibold, cor `#111827` com opacidade
  - Corpo: regular/medium, cor intermediária
  - Labels/caps: uppercase, tracking wide, peso bold, cor muted

---

## 5. Estilo Visual da Interface

Baseado nos mockups e filosofia da marca:

### Cards e Superfícies
- Fundo branco `#FFFFFF` ou `#F5F7FB`
- Bordas sutis: `1px solid` em cinza muito claro
- Border-radius: **arredondado generoso** — `12px` a `16px` mínimo
- Sombra: leve, difusa — nunca sombra dura

### Botões
- Primário: `bg #0F4CFF`, texto branco, border-radius arredondado
- Hover: levemente mais escuro (`#0A3FD6`) ou com leve elevação
- Sem bordas desnecessárias no estado padrão

### Ícones
- Estilo: outline clean ou filled mínimo
- Tamanho consistente com o texto adjacente
- Cor: herda do contexto (`#111827` em contexto neutro, `#0F4CFF` em contexto ativo)

### Espaçamento
- Generoso — a marca valoriza o espaço negativo ("Minimalismo moderno")
- Padding interno de cards: mínimo `20px`
- Gap entre elementos: `16px–24px`

### Gradientes e Fundos Especiais
- Padrão de fundo da marca: repetição do ícone "P" em opacity muito baixa (watermark pattern) — pode ser usado em banners, headers de página, telas de auth

---

## 6. Tom e Voz Visual

- **Institucional mas moderno** — não é formal demais, não é casual demais
- **Azul como protagonista** — o azul `#0F4CFF` deve aparecer nos elementos de ação e destaque
- **Branco e cinza claro** como base — nunca um fundo cinza escuro ou colorido
- **Tipografia preta sobre fundo claro** como regra para conteúdo
- **Sem degradês coloridos no conteúdo** — apenas em elementos de brand (banners, splash)

---

## 7. Aplicações de Referência (do manual)

- Papelaria institucional: contratos, documentos, relatórios — header com logotipo azul sobre branco
- Uniformes: polo preta ou azul escuro com logotipo bordado em branco
- Crachás: fundo branco, dados em `#111827`, acento em `#0F4CFF`
- Fachadas/sinalização: logo azul sobre fundos neutros (branco, preto, vidro)
- Outdoor/digital: versão branca sobre fundo azul `#0F4CFF`

---

## 8. O que NÃO fazer

- Não usar o logo sobre fundos coloridos que não sejam azul `#0F4CFF` ou preto `#111827`
- Não distorcer, esticar ou rotacionar o ícone
- Não usar variações de cor diferentes das três da paleta primária
- Não usar tipografias serifadas na interface
- Não criar interfaces com fundo cinza escuro ou escala de cinza dominante
- Não usar sombras duras ou efeitos visuais excessivos
- Não usar o azul como cor de fundo de grandes áreas de conteúdo (apenas em hero/banner/CTA)

---

## 9. Aplicação no Código (Tailwind)

```css
/* Cor principal — azul Protocolla #0F4CFF */
primary: usar nos botões CTA, links ativos, badges de status principal, ícones de ação

/* Escuro — #111827 */
surface-900: textos principais, headings, texto de cards

/* Background — #F5F7FB */
surface-50: fundo da página, fundo de cards secundários

/* Branco — #FFFFFF */
bg-white: superfície de cards, modais, inputs
```

### Tailwind config sugerido para alinhar com a marca

```js
// tailwind.config
colors: {
  primary: {
    DEFAULT: '#0F4CFF',
    50:  '#EEF2FF',
    100: '#E0E8FF',
    200: '#C7D4FF',
    500: '#3B6FFF',
    600: '#0F4CFF',  // ← cor oficial da marca
    700: '#0A3FD6',
    900: '#071FA8',
  }
}
```

---

*Fonte: MANUAL_PROTOCOLLA.pdf — Lusion Studio × Cloud 7 © 2026. Todas as decisões de design deste projeto devem ser validadas contra este guia.*
