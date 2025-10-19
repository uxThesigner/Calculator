// ====================================================================
// MAPA DE TAXAS E WHATSAPP DEFAULT
// ====================================================================
const MAPA_DE_TAXAS = {
    'rural': 17.5,
    'imoveis': 20.5,
    'carro_moto': 20,
    'caminhoes': 17.5,
    'maquinas': 17.5,
    'servicos': 20.5,
    'capital_giro': 20.5,
    'default': 20.5 
};
// NÚMERO PADRÃO: Altere este número para o contato principal (DDD + Número)
const WHATSAPP_NUMBER_DEFAULT = "5541985162191"; 

// ====================================================================
// FUNÇÕES DE NAVEGAÇÃO E UTILS
// ====================================================================

// Obtém o número do WhatsApp da URL (?wpp=) ou usa o default
function getWhatsAppNumberFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    let wpp = urlParams.get('wpp');
    return (wpp) ? wpp.replace(/\D/g, '') : WHATSAPP_NUMBER_DEFAULT;
}

// Garante que apenas o passo atual esteja visível
function showNextStep(nextStepId) {
    // 1. Limpa erros e resultados imediatamente para evitar o delay visual/flicker
    document.getElementById('mensagemErro').textContent = ''; 
    document.getElementById('resultsBox').style.display = 'none';

    // 2. Oculta todos os passos.
    document.querySelectorAll('.input-step').forEach(step => {
        step.style.display = 'none';
    });
    
    // 3. Exibe o próximo passo
    const nextStep = document.getElementById(nextStepId);
    if (nextStep) {
        nextStep.style.display = 'block';
    }
}

function resetSimulation() {
    // Limpa inputs
    document.getElementById('nomeCliente').value = '';
    document.getElementById('localizacao').value = '';
    document.getElementById('categoria').value = ''; 
    document.getElementById('vlrCredito').value = '';
    document.getElementById('vlrEntrada').value = '';
    document.getElementById('vlrParcela').value = '';

    // Reseta título e volta ao passo 1
    document.getElementById('welcomeTitle').textContent = 'Olá, bem-vindo(a)!';
    showNextStep('step1');
}

function exibirErro(mensagem) {
    // Garante que a caixa de resultados não apareça com erro
    document.getElementById('resultsBox').style.display = 'none';
    document.getElementById('mensagemErro').textContent = mensagem;
}

function formatarInput(input) {
    let valor = input.value.replace(/\D/g, ''); 
    let numero = valor ? parseInt(valor) / 100 : 0;
    input.value = numero.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function parseMonetary(valorString) {
    let valorLimpo = valorString.replace(/\./g, '').replace(/,/g, '.');
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
// VALIDAÇÕES DE CADA PASSO
// ====================================================================

function validateStep1() {
    const nomeInput = document.getElementById('nomeCliente');
    const nome = nomeInput.value.trim();

    if (nome.length < 3) {
        exibirErro("Por favor, digite seu nome completo para prosseguir.");
        nomeInput.focus();
        return;
    }
    
    const primeiroNome = nome.split(' ')[0];
    document.getElementById('welcomeTitle').textContent = `Muito prazer, ${primeiroNome}!`; 

    showNextStep('step2');
}

function validateStep2() {
    const localInput = document.getElementById('localizacao');
    const local = localInput.value.trim();

    if (local.length < 3) {
        exibirErro("Por favor, informe sua Cidade/Estado para prosseguir.");
        localInput.focus();
        return;
    }
    
    document.getElementById('welcomeTitle').textContent = 'Simulador de Proposta';

    showNextStep('step3'); 
}

function validateStep4() {
    const vlrCreditoInput = document.getElementById('vlrCredito');
    const vlrCredito = parseMonetary(vlrCreditoInput.value);

    if (vlrCredito <= 0) {
        exibirErro("O valor do crédito deve ser maior que R$ 0,00 para continuar.");
        vlrCreditoInput.focus();
        return;
    }
    showNextStep('step5');
}

function validateStep5() {
    const V_CREDITO = parseMonetary(document.getElementById('vlrCredito').value);
    const V_ENTRADA = parseMonetary(document.getElementById('vlrEntrada').value); 

    // Limpa qualquer erro anterior (ajuda a prevenir flicker)
    document.getElementById('mensagemErro').textContent = ''; 

    if (V_CREDITO <= 0) {
        exibirErro("Erro: O valor do crédito não foi definido. Volte ao passo 4.");
        return; 
    }
    
    const MIN_ENTRADA_PERC = 0.10; // 10%
    const MAX_ENTRADA_PERC = 0.30;
    const V_ENTRADA_MIN = V_CREDITO * MIN_ENTRADA_PERC;
    const V_ENTRADA_MAX = V_CREDITO * MAX_ENTRADA_PERC;

    if (V_ENTRADA > 0) {
        if (V_ENTRADA < V_ENTRADA_MIN || V_ENTRADA > V_ENTRADA_MAX) {
            let msg = (V_ENTRADA < V_ENTRADA_MIN) ? 
                `A entrada mínima é de ${formatarMoeda(V_ENTRADA_MIN)} (${(MIN_ENTRADA_PERC * 100)}% do crédito).` : 
                `A entrada máxima permitida é de ${formatarMoeda(V_ENTRADA_MAX)} (${(MAX_ENTRADA_PERC * 100)}% do crédito).`;
            exibirErro(msg);
            document.getElementById('vlrEntrada').focus();
            return;
        }
    } 

    showNextStep('step6');
}

// ====================================================================
// FUNÇÃO DE CÁLCULO PRINCIPAL E ENVIO
// ====================================================================

function calcularProposta() {
    // 1. Coleta de dados
    const NOME_CLIENTE = document.getElementById('nomeCliente').value.trim();
    const LOCALIZACAO = document.getElementById('localizacao').value.trim();
    const SELECT_CATEGORIA = document.getElementById('categoria');
    const CATEGORIA_TEXTO = SELECT_CATEGORIA.options[SELECT_CATEGORIA.selectedIndex].text; 
    const V_CREDITO = parseMonetary(document.getElementById('vlrCredito').value);
    const V_ENTRADA = parseMonetary(document.getElementById('vlrEntrada').value);
    const V_PARCELA = parseMonetary(document.getElementById('vlrParcela').value);
    const TAXA_INFO = obterTaxa(SELECT_CATEGORIA.value);
    const TAXA_ADMINISTRATIVA_PERC = TAXA_INFO.percentual;
    
    // 2. Validação final 
    if (V_CREDITO <= 0 || V_PARCELA <= 0) {
        exibirErro("O valor do crédito e da parcela devem ser maiores que R$ 0,00 para calcular.");
        return;
    }
    
    // --- CÁLCULOS ---
    let PERC_ENTRADA = (V_CREDITO > 0) ? (V_ENTRADA / V_CREDITO) * 100 : 0;
    const V_TA_TOTAL = V_CREDITO * TAXA_INFO.decimal;
    const V_DIVIDA_BRUTA = V_CREDITO + V_TA_TOTAL;
    const V_SALDO_DEVEDOR = V_DIVIDA_BRUTA - V_ENTRADA;
    let N_MESES = (V_PARCELA > 0) ? Math.ceil(V_SALDO_DEVEDOR / V_PARCELA) : 0;
    
    // --- INÍCIO DO SUCESSO ---
    
    // Limpa o erro explicitamente ANTES de mostrar o resultado.
    document.getElementById('mensagemErro').textContent = ''; 
    
    // Oculta o passo atual e exibe os resultados
    document.getElementById('step6').style.display = 'none';
    document.getElementById('resultsBox').style.display = 'block';
    document.getElementById('welcomeTitle').textContent = 'Resultado da Proposta';
    
    // 3. Exibição dos Resultados na Tela 
    document.getElementById('resultadoNomeCliente').textContent = NOME_CLIENTE;
    document.getElementById('resultadoLocalizacao').textContent = LOCALIZACAO;
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


    // 4. GERAR O LINK DO WHATSAPP (FORMATO FINAL COM NEGRITOS)
    const linkButton = document.getElementById('actionButton');
    const TARGET_WHATSAPP_NUMBER = getWhatsAppNumberFromUrl(); 
    
    const mensagemWhatsApp = `
*PROPOSTA DE CRÉDITO SIMULADA*
    
Olá! Sou *${NOME_CLIENTE}* e gostaria de formalizar a seguinte proposta de crédito:

*Detalhes da Proposta:*
-------------------------------------
*1. Categoria:* ${CATEGORIA_TEXTO}
*2. Crédito Solicitado:* ${formatarMoeda(V_CREDITO)}
*3. Entrada:* ${formatarMoeda(V_ENTRADA)} (${PERC_ENTRADA.toFixed(2)}%)
*4. Parcela Mensal:* ${formatarMoeda(V_PARCELA)}
*5. Prazo:* ${N_MESES} meses

*Localização:* ${LOCALIZACAO}

Por favor, podemos dar o próximo passo para a formalização!
    `.trim(); 

    const linkWhatsApp = `https://api.whatsapp.com/send?phone=${TARGET_WHATSAPP_NUMBER}&text=${encodeURIComponent(mensagemWhatsApp)}`;

    linkButton.href = linkWhatsApp;
}


// ====================================================================
// INICIALIZAÇÃO
// ====================================================================
document.addEventListener('DOMContentLoaded', () => {
    showNextStep('step1'); 
    document.getElementById('categoria').value = '';
});
