# Casa do Salgado — Sistema de Precificação e Fichas Técnicas

Projeto React (Vite) baseado no escopo `escopo_casa_do_salgado.html` e nas telas do Figma
(login, Cadastros de salgados / ingredientes / custos, com painel lateral de edição).

## Como rodar

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # gera a pasta dist/ (pode ser hospedada em qualquer servidor estático)
```

**Login de demonstração:** usuário `admin` · senha `salgado123`
(definido em `src/context/AppContext.jsx` → `DEMO_USER`; troque por uma API quando houver back-end).

Os dados ficam no `localStorage` do navegador. Em *Parâmetros* há o botão "Restaurar dados de exemplo".

## Módulos (mapeados do escopo)

| Escopo | Tela | Arquivo |
|---|---|---|
| 5.1 Cadastros | Cadastros (abas Salgados · Ingredientes · Custos fixos) | `pages/Cadastros.jsx`, `components/CadastroDrawers.jsx` |
| 5.2 Custos e precificação | Precificação (custo, markup, preço sugerido, alerta de margem mínima) | `pages/Precificacao.jsx` |
| 5.3 Ponto de equilíbrio / margem de contribuição | Gráfico receita × custo, MC por produto | `pages/Equilibrio.jsx` |
| 5.4 Atualização e simulação | Edição rápida do custo na lista + Simulação de cenários | `pages/Cadastros.jsx`, `pages/Simulacao.jsx` |
| 5.5 Relatórios | Custo por produto, margem por categoria, histórico (export CSV) | `pages/Relatorios.jsx` |
| 7. Parametrizável | Margem desejada, margem mínima, custo/hora da mão de obra | `pages/Parametros.jsx` |

## Regras de cálculo (`src/lib/calc.js`)

- **Custo de ingredientes/unidade** = Σ (quantidade usada × custo por g/ml/un do ingrediente) ÷ rendimento do lote.
  As unidades são convertidas (kg↔g, l↔ml); unidades incompatíveis são ignoradas.
- **Mão de obra/unidade** = (tempo de preparo em horas × custo/hora) ÷ rendimento.
- **Rateio dos custos fixos e variáveis em R$** = total do mês ÷ total de unidades vendidas por mês (critério simples, por unidade).
- **Variável em %** (ex.: taxa de cartão) incide sobre o preço de venda.
- **Preço sugerido** = (custo direto + rateios) ÷ (1 − % variável − margem desejada).
- **Margem de contribuição unitária** = preço − custo direto − variáveis (sem os fixos).
- **Ponto de equilíbrio** = custos fixos ÷ margem de contribuição média ponderada pelo mix; em faturamento = unidades × ticket médio.
- Atualizar o custo de um ingrediente recalcula automaticamente todas as receitas que o usam, e o histórico registra a variação.

## Estrutura

```
src/
  context/   estado global (useReducer + localStorage), seed e login
  lib/       calc.js (motor de cálculo), units.js, format.js
  components Shell (topo + botão voltar), Drawer, Field, Icons, CadastroDrawers
  pages/     Login, Home, Cadastros, Precificacao, Equilibrio, Simulacao, Relatorios, Parametros
  styles/    global.css (paleta e tipografia do Figma: Alegreya / Alegreya Sans)
```

## Próximos passos sugeridos

- Trocar o `localStorage` e o login de demonstração por uma API/banco de dados.
- Importar/exportar fichas técnicas em planilha (Excel), caso a equipe prefira manter o Office.
