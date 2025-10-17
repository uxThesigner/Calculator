// ====================================================================
// MAPA DE TAXAS POR CATEGORIA - DEFINIDO PELO USUÁRIO
// ====================================================================
const MAPA_DE_TAXAS = {
    'rural': 17.5,
    'imoveis': 20.5,
    'carro_moto': 20,
    'caminhoes': 17.5,
    'maquinas': 17.5,
    'servicos': 20.5,
    'capital_giro': 20.5,
    'default': 20.5 // Taxa padrão de segurança
};

// ====================================================================
// FUNÇÕES DE FORMATAÇÃO E AUXILIARES
// ====================================================================

/**
 * Formata o input (type="text") para o formato monetário brasileiro (R$, . para milhar, , para decimal)
 * em tempo real enquanto o usuário digita.
 * @param {HTMLInputElement} input - O elemento de input a ser formatado.
 */
function formatarInput(input) {
    let valor = input.value;
    
    // Remove tudo que não seja número (exceto vírgula e ponto para ser seguro, mas a lógica só quer números)
    valor = valor.replace(/\D/g, ''); 
    
    // Converte para um número (divido por 100 para centavos)
    let numero = valor ? parseInt(valor) / 100 : 0;

    // Formata o número para moeda brasileira
    input.value = numero.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/**
 * Converte a string formatada em moeda (R$ 1.000,00) para um número (1000.00) para o cálculo.
 * @param {string} valorString - O valor lido do input.
 * @returns {number} O valor numérico limpo.
 */
function parseMonetary(valorString) {
    // 1. Remove os pontos de milhar
    let valorLimpo = valorString.replace(/\./g, '');
    // 2. Troca a vírgula decimal por ponto decimal
    valorLimpo = valorLimpo.replace(/,/g, '.');
    // 3. Converte para float, ou 0 se for inválido
    return parseFloat(valorLimpo) || 0;
}

/**
 * Formata um número para o formato monetário BRL (R$ X.XXX,XX).
 * @param {number} valor - O número a ser formatado.
 * @returns {string} O valor formatado como moeda.
 */
const formatarMoeda = (valor) => {
    if (typeof valor !== 'number' || isNaN(valor)) return 'R$ 0,00';
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

/**
 * Obtém a taxa percentual e decimal baseada na categoria escolhida.
 * @param {string} categoria - O valor (value) da categoria selecionada.
 * @returns {{percentual: number, decimal: number}} O objeto com a taxa.
 */
function obterTaxa(categoria) {
    // Usa o valor do mapa, ou o default se a categoria não for encontrada
    const taxaPerc = MAPA_DE_TAXAS[categoria] || MAPA_DE_TAXAS['default'];
    return {
        percentual: taxaPerc,
        decimal: taxaPerc / 100
    };
}

// ====================================================================
// FUNÇÕES DE AÇÃO PRINCIPAIS
// ====================================================================

function limparResultados() {
    const TAXA_PADRAO_PERC = MAPA_DE_TAXAS['default'];
    
    document.getElementById('mensagemErro').textContent = '';
    document.getElementById('resultsBox').style.display = 'none';

    document.getElementById('resultadoCategoria').textContent = 'Não selecionado'; // Limpeza da Categoria
    document.getElementById('resultadoCredito').textContent = formatarMoeda(0);
    document.getElementById('resultadoVlrEntrada').textContent = formatarMoeda(0);
    document.getElementById('resultadoPercEntrada').textContent = `0%`;
    document.getElementById('resultadoParcela').textContent = formatarMoeda(0);
    document.getElementById('resultadoPrazo').textContent = '0 meses';
    
    document.getElementById('resultadoVlrTaxa').textContent = formatarMoeda(0);
    document.getElementById('resultadoTaxaPerc').textContent = `${TAXA_PADRAO_PERC}%`;
    
    document.getElementById('resultadoDividaBruta').textContent = formatarMoeda(0);
    document.getElementById('resultadoSaldoDevedor').textContent = formatarMoeda(0);
}

function exibirErro(mensagem) {
    limparResultados();
    document.getElementById('mensagemErro').textContent = mensagem;
}

function calcularProposta() {
    // 1. Coleta de dados de entrada
    const SELECT_CATEGORIA = document.getElementById('categoria');
    const CATEGORIA_VALUE = SELECT_CATEGORIA.value;
    const CATEGORIA_TEXTO = SELECT_CATEGORIA.options[SELECT_CATEGORIA.selectedIndex].text; 
    
    const V_CREDITO = parseMonetary(document.getElementById('vlrCredito').value);
    const V_ENTRADA = parseMonetary(document.getElementById('vlrEntrada').value);
    const V_PARCELA = parseMonetary(document.getElementById('vlrParcela').value);
    
    const TAXA_INFO = obterTaxa(CATEGORIA_VALUE);
    const TAXA_ADMINISTRATIVA_PERC = TAXA_INFO.percentual;
    const TAXA_ADMINISTRATIVA = TAXA_INFO.decimal;
    
    document.getElementById('mensagemErro').textContent = '';

    // 2. Validação Mínima
    if (V_CREDITO <= 0 || V_PARCELA <= 0) {
        exibirErro("Por favor, preencha o Valor do Crédito e o Valor da Parcela.");
        return;
    }
    
    // --- 3. VALIDAÇÃO DE REGRA DE ENTRADA (15% a 30%) ---
    const MIN_ENTRADA_PERC = 0.10;
    const MAX_ENTRADA_PERC = 0.30;
    
    const V_ENTRADA_MIN = V_CREDITO * MIN_ENTRADA_PERC;
    const V_ENTRADA_MAX = V_CREDITO * MAX_ENTRADA_PERC;

    // a) Entrada menor que o mínimo (15%)
    if (V_ENTRADA < V_ENTRADA_MIN && V_ENTRADA > 0) {
        exibirErro(`A entrada mínima é de ${formatarMoeda(V_ENTRADA_MIN)} (${MIN_ENTRADA_PERC * 100}% do crédito).`);
        return;
    } 
    
    // b) Entrada maior que o máximo (30%)
    if (V_ENTRADA > V_ENTRADA_MAX) {
        exibirErro(`A entrada máxima permitida é de ${formatarMoeda(V_ENTRADA_MAX)} (${MAX_ENTRADA_PERC * 100}% do crédito).`);
        return;
    }

    document.getElementById('mensagemErro').textContent = '';

    // --- 4. CÁLCULOS PRINCIPAIS ---
    
    // Cálculo da Porcentagem da Entrada
    let PERC_ENTRADA = (V_CREDITO > 0) ? (V_ENTRADA / V_CREDITO) * 100 : 0;
    
    // Dívida Total Bruta
    const V_TA_TOTAL = V_CREDITO * TAXA_ADMINISTRATIVA;
    const V_DIVIDA_BRUTA = V_CREDITO + V_TA_TOTAL;
    
    // Saldo Devedor Final
    const V_SALDO_DEVEDOR = V_DIVIDA_BRUTA - V_ENTRADA;
    
    // Cálculo do Prazo
    let N_MESES = (V_PARCELA > 0) ? Math.ceil(V_SALDO_DEVEDOR / V_PARCELA) : 0;
    
    // 5. Exibe a caixa de resultados
    document.getElementById('resultsBox').style.display = 'block';

    // --- 6. Exibição dos Resultados ---
    
    document.getElementById('resultadoCategoria').textContent = CATEGORIA_TEXTO; // Exibição da Categoria

    document.getElementById('resultadoCredito').textContent = formatarMoeda(V_CREDITO);
    
    document.getElementById('resultadoVlrEntrada').textContent = formatarMoeda(V_ENTRADA);
    document.getElementById('resultadoPercEntrada').textContent = `${PERC_ENTRADA.toFixed(2)}%`; 

    document.getElementById('resultadoParcela').textContent = formatarMoeda(V_PARCELA);
    document.getElementById('resultadoVlrTaxa').textContent = formatarMoeda(V_TA_TOTAL);
    document.getElementById('resultadoTaxaPerc').textContent = `${TAXA_ADMINISTRATIVA_PERC.toFixed(1)}%`; 

    document.getElementById('resultadoPrazo').textContent = `${N_MESES} meses`;
    
    document.getElementById('resultadoDividaBruta').textContent = formatarMoeda(V_DIVIDA_BRUTA);
    document.getElementById('resultadoSaldoDevedor').textContent = formatarMoeda(V_SALDO_DEVEDOR);
}
