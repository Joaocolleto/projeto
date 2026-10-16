const daysAgo = (n) => new Date(Date.now() - n * 86400000).toISOString();

export function seedData() {
  return {
    params: { margemDesejada: 40, margemMinima: 30, custoHoraMdo: 15 },

    ingredientes: [
      { id: 'ing-farinha', nome: 'Farinha de trigo', unidade: 'kg', quantidade: 3, custo: 50.99, fornecedor: 'Empório Pedro', atualizadoEm: daysAgo(3) },
      { id: 'ing-carne', nome: 'Carne moída', unidade: 'kg', quantidade: 5, custo: 150.99, fornecedor: 'Açougue do Guga', atualizadoEm: daysAgo(35) },
      { id: 'ing-oleo', nome: 'Óleo de soja', unidade: 'l', quantidade: 2, custo: 7.36, fornecedor: 'Varejo do Gui', atualizadoEm: daysAgo(63) },
      { id: 'ing-fermento', nome: 'Fermento', unidade: 'g', quantidade: 10, custo: 7.36, fornecedor: 'Mercado', atualizadoEm: daysAgo(63) },
      { id: 'ing-frango', nome: 'Peito de frango', unidade: 'kg', quantidade: 5, custo: 42.5, fornecedor: 'Açougue do Guga', atualizadoEm: daysAgo(12) },
      { id: 'ing-salsicha', nome: 'Salsicha', unidade: 'kg', quantidade: 3, custo: 27.9, fornecedor: 'Empório Pedro', atualizadoEm: daysAgo(20) },
      { id: 'ing-doce', nome: 'Doce de leite', unidade: 'g', quantidade: 400, custo: 9.9, fornecedor: 'Mercado', atualizadoEm: daysAgo(8) },
      { id: 'ing-acucar', nome: 'Açúcar', unidade: 'kg', quantidade: 1, custo: 5.2, fornecedor: 'Mercado', atualizadoEm: daysAgo(8) },
    ],

    salgados: [
      {
        id: 'sal-coxinha', nome: 'Coxinha de Frango', categoria: 'Frito', rendimento: 10, preco: 8.5,
        volumeMensal: 800, tempoPreparo: 60,
        ficha: [
          { ingredienteId: 'ing-farinha', quantidade: 300, unidade: 'g' },
          { ingredienteId: 'ing-frango', quantidade: 400, unidade: 'g' },
          { ingredienteId: 'ing-oleo', quantidade: 300, unidade: 'ml' },
          { ingredienteId: 'ing-fermento', quantidade: 3, unidade: 'g' },
        ],
      },
      {
        id: 'sal-fogassa', nome: 'Fogassa de carne', categoria: 'Frito', rendimento: 10, preco: 9.5,
        volumeMensal: 500, tempoPreparo: 90,
        ficha: [
          { ingredienteId: 'ing-farinha', quantidade: 400, unidade: 'g' },
          { ingredienteId: 'ing-carne', quantidade: 500, unidade: 'g' },
          { ingredienteId: 'ing-oleo', quantidade: 300, unidade: 'ml' },
          { ingredienteId: 'ing-fermento', quantidade: 4, unidade: 'g' },
        ],
      },
      {
        id: 'sal-enrolad', nome: 'Enroladinho', categoria: 'Assado', rendimento: 10, preco: 9.5,
        volumeMensal: 400, tempoPreparo: 60,
        ficha: [
          { ingredienteId: 'ing-farinha', quantidade: 300, unidade: 'g' },
          { ingredienteId: 'ing-salsicha', quantidade: 400, unidade: 'g' },
          { ingredienteId: 'ing-fermento', quantidade: 5, unidade: 'g' },
        ],
      },
      {
        id: 'sal-esfiha', nome: 'Esfiha doce', categoria: 'Doce', rendimento: 10, preco: 12.5,
        volumeMensal: 300, tempoPreparo: 60,
        ficha: [
          { ingredienteId: 'ing-farinha', quantidade: 350, unidade: 'g' },
          { ingredienteId: 'ing-doce', quantidade: 400, unidade: 'g' },
          { ingredienteId: 'ing-acucar', quantidade: 50, unidade: 'g' },
          { ingredienteId: 'ing-fermento', quantidade: 4, unidade: 'g' },
        ],
      },
    ],

    custos: [
      { id: 'cus-aluguel', tipo: 'Aluguel', natureza: 'fixo', modoValor: 'valor', valor: 1000, diaVencimento: 5 },
      { id: 'cus-energia', tipo: 'Energia', natureza: 'variavel', modoValor: 'valor', valor: 1000, diaVencimento: 10 },
      { id: 'cus-agua', tipo: 'Água', natureza: 'variavel', modoValor: 'valor', valor: 1000, diaVencimento: 12 },
      { id: 'cus-salario', tipo: 'Salário funcionários', natureza: 'fixo', modoValor: 'valor', valor: 1000, diaVencimento: 5 },
      { id: 'cus-cartao', tipo: 'Taxa de cartão', natureza: 'variavel', modoValor: 'percentual', valor: 3, diaVencimento: 1 },
    ],

    historico: [
      { id: 'h1', data: daysAgo(35), tipo: 'ingrediente', nome: 'Carne moída', de: 139.9, para: 150.99 },
      { id: 'h2', data: daysAgo(63), tipo: 'ingrediente', nome: 'Óleo de soja', de: 6.8, para: 7.36 },
      { id: 'h3', data: daysAgo(40), tipo: 'preco', nome: 'Coxinha de Frango', de: 7.5, para: 8.5 },
    ],
  };
}
