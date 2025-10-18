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

// *****************************************************************
// IMPORTANTE: NOVO NÚMERO DE WHATSAPP
// *****************************************************************
const WHATSAPP_NUMBER = "5541985162191"; // +55 41 9 8516 2191
// *****************************************************************

// ====================================================================
// FUNÇÕES DE FORMATAÇÃO E AUXILIARES
// ====================================================================

function formatarInput(input) {
    let valor = input.value;
    valor = valor.replace(/\D/g, ''); 
    let numero = valor ? parseInt(valor) / 100 : 0;
    input.value = numero.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function parseMonetary(valorString) {
    let valorLimpo = valorString.replace(/\./g, '');
    valorLimpo = valorLimpo.replace(/,/g, '.');
    return parseFloat(valorLimpo) || 0;
}

const formatarMoeda = (valor) => {
    if (typeof valor !== 'number' || isNaN(valor)) return 'R$ 0,00';
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

function obterTaxa(categoria) {
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

    document.getElementById('resultadoCategoria').textContent = 'Não selecionado';
    document.getElementById('resultadoCredito').textContent = formatarMoeda(0);
    document.getElementById('resultadoVlrEntrada').textContent = formatarMoeda(0);
    document.getElementById('resultadoPercEntrada').textContent = `0%`;
    document.getElementById('resultadoParcela').textContent = formatarMoeda(0);
    document.getElementById('resultadoPrazo').textContent = '0 meses';
    
    document.getElementById('resultadoVlrTaxa').textContent = formatarMoeda(0);
    document.getElementById('resultadoTaxaPerc').textContent = `${TAXA_PADRAO_PERC}%`;
    
    document.getElementById('resultadoDividaBruta').textContent = formatarMoeda(0);
    document.getElementById('resultadoSaldoDevedor').textContent = formatarMoeda(0);
    
    // Limpa o link do botão de ação
    document.getElementById('actionButton').href = '#';
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

    // 2. Validações de Regra de Entrada (15% a 30%)
    if (V_CREDITO <= 0 || V_PARCELA <= 0) {
        exibirErro("Por favor, preencha o Valor do Crédito e o Valor da Parcela.");
        return;
    }
    
    const MIN_ENTRADA_PERC = 0.10;
    const MAX_ENTRADA_PERC = 0.30;
    const V_ENTRADA_MIN = V_CREDITO * MIN_ENTRADA_PERC;
    const V_ENTRADA_MAX = V_CREDITO * MAX_ENTRADA_PERC;

    if ((V_ENTRADA < V_ENTRADA_MIN && V_ENTRADA > 0) || V_ENTRADA > V_ENTRADA_MAX) {
        let msg = (V_ENTRADA < V_ENTRADA_MIN) ? 
            `A entrada mínima é de ${formatarMoeda(V_ENTRADA_MIN)} (${(MIN_ENTRADA_PERC * 100)}% do crédito).` : 
            `A entrada máxima permitida é de ${formatarMoeda(V_ENTRADA_MAX)} (${(MAX_ENTRADA_PERC * 100)}% do crédito).`;
        exibirErro(msg);
        return;
    }

    document.getElementById('mensagemErro').textContent = '';

    // --- CÁLCULOS PRINCIPAIS ---
    let PERC_ENTRADA = (V_CREDITO > 0) ? (V_ENTRADA / V_CREDITO) * 100 : 0;
    const V_TA_TOTAL = V_CREDITO * TAXA_ADMINISTRATIVA;
    const V_DIVIDA_BRUTA = V_CREDITO + V_TA_TOTAL;
    const V_SALDO_DEVEDOR = V_DIVIDA_BRUTA - V_ENTRADA;
    let N_MESES = (V_PARCELA > 0) ? Math.ceil(V_SALDO_DEVEDOR / V_PARCELA) : 0;
    
    document.getElementById('resultsBox').style.display = 'block';

    // --- 3. Exibição dos Resultados ---
    document.getElementById('resultadoCategoria').textContent = CATEGORIA_TEXTO;
    document.getElementById('resultadoCredito').textContent = formatarMoeda(V_CREDITO);
    document.getElementById('resultadoVlrEntrada').textContent = formatarMoeda(V_ENTRADA);
    document.getElementById('resultadoPercEntrada').textContent = `${PERC_ENTRADA.toFixed(2)}%`; 
    document.getElementById('resultadoParcela').textContent = formatarMoeda(V_PARCELA);
    document.getElementById('resultadoVlrTaxa').textContent = formatarMoeda(V_TA_TOTAL);
    document.getElementById('resultadoTaxaPerc').textContent = `${TAXA_ADMINISTRATIVA_PERC.toFixed(1)}%`; 
    document.getElementById('resultadoPrazo').textContent = `${N_MESES} meses`;
    document.getElementById('resultadoDividaBruta').textContent = formatarMoeda(V_DIVIDA_BRUTA);
    document.getElementById('resultadoSaldoDevedor').textContent = formatarMoeda(V_SALDO_DEVEDOR);


    // --- 4. GERAR O LINK DO WHATSAPP (FORMATADO) ---
    const linkButton = document.getElementById('actionButton');
    
    // Constrói a mensagem com formatação bonita (negrito * e quebras de linha)
    const mensagemWhatsApp = `
*PROPOSTA DE CRÉDITO SIMULADA*

Olá consultor Paulo! Gostaria de formalizar a seguinte proposta de crédito:

*Detalhes da Proposta:*
-------------------------------------
*1. Categoria:* ${CATEGORIA_TEXTO}
*2. Crédito Solicitado:* ${formatarMoeda(V_CREDITO)}
*3. Entrada:* ${formatarMoeda(V_ENTRADA)} (${PERC_ENTRADA.toFixed(2)}%)
*4. Parcela Mensal:* ${formatarMoeda(V_PARCELA)}

*Resultados da Simulação:*
-------------------------------------
*Prazo Sugerido:* ${N_MESES} meses
*Saldo Devedor:* ${formatarMoeda(V_SALDO_DEVEDOR)}
*Taxa Adm. (TA):* ${TAXA_ADMINISTRATIVA_PERC.toFixed(1)}%

Por favor, podemos dar o próximo passo para a formalização!
    `.trim(); 

    // Codifica a mensagem para URL e monta o link
    const linkWhatsApp = `https://api.whatsapp.com/send?phone=${WHATSAPP_NUMBER}&text=${encodeURIComponent(mensagemWhatsApp)}`;

    // Aplica o link ao botão
    linkButton.href = linkWhatsApp;
}
