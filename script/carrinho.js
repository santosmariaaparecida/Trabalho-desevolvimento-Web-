// Carrinho compartilhado entre páginas da mesma origem (use Live Server).
// O modal é criado uma única vez em cada página por este script.
const CHAVE_CARRINHO = 'viagemDosSonhosCarrinho';
let carrinho = carregarCarrinho();

// O HTML do modal é compartilhado por todas as páginas, sem duplicação.
document.body.insertAdjacentHTML('beforeend', `
    <p id="mensagem-carrinho" class="mensagem-carrinho" role="status"></p>
    <dialog id="modal-carrinho" aria-labelledby="titulo-carrinho">
        <div class="cabecalho-carrinho">
            <h2 id="titulo-carrinho">Meu carrinho</h2>
            <button type="button" id="fechar-carrinho" aria-label="Fechar carrinho">×</button>
        </div>
        <p>Confira os destinos e pacotes que você selecionou.</p>
        <p id="aviso-armazenamento" role="status" hidden></p>
        <section id="itens-carrinho" aria-label="Itens do carrinho"></section>
        <section class="resumo-carrinho">
            <h2>Total: <span id="total-carrinho">R$ 0,00</span></h2>
            <div class="acoes-carrinho">
                <button type="button" id="continuar-escolhendo">Continuar escolhendo</button>
                <button type="button" id="limpar-carrinho">Limpar carrinho</button>
            </div>
        </section>
    </dialog>
`);

const modal = document.getElementById('modal-carrinho');
const aviso = document.getElementById('aviso-armazenamento');
const botaoAbrir = document.getElementById('abrir-carrinho');

if (location.protocol === 'file:') {
    aviso.hidden = false;
    aviso.textContent = 'Abra o projeto com Live Server ou localhost para manter o carrinho ao trocar de página.';
}

botaoAbrir.addEventListener('click', () => {
    exibirCarrinho();
    modal.showModal();
});
document.getElementById('fechar-carrinho').addEventListener('click', () => modal.close());
document.getElementById('continuar-escolhendo').addEventListener('click', () => modal.close());
modal.addEventListener('close', () => botaoAbrir.focus());
// Fechar também ao clicar fora da caixa (Escape funciona nativamente).
modal.addEventListener('click', evento => {
    if (evento.target !== modal) return;
    const caixa = modal.getBoundingClientRect();
    if (evento.clientX < caixa.left || evento.clientX > caixa.right ||
        evento.clientY < caixa.top || evento.clientY > caixa.bottom) modal.close();
});

function carregarCarrinho() {
    try {
        const dados = JSON.parse(localStorage.getItem(CHAVE_CARRINHO));
        return Array.isArray(dados) ? dados : [];
    } catch (erro) {
        return [];
    }
}

function salvarCarrinho() {
    try {
        localStorage.setItem(CHAVE_CARRINHO, JSON.stringify(carrinho));
        atualizarContador();
        exibirCarrinho();
        return true;
    } catch (erro) {
        atualizarContador();
        exibirCarrinho();
        aviso.hidden = false;
        aviso.textContent = 'Não foi possível salvar no navegador. As alterações são temporárias.';
        mostrarMensagem(aviso.textContent);
        return false;
    }
}

// Os preços são guardados em centavos para evitar erros de arredondamento.
function formatarPreco(centavos) {
    return (centavos / 100).toLocaleString('pt-BR', {
        style: 'currency', currency: 'BRL'
    });
}

function atualizarContador() {
    const contador = document.getElementById('contador-carrinho');
    contador.textContent = carrinho.reduce((soma, item) => soma + item.quantidade, 0);
}

let temporizadorMensagem;
function mostrarMensagem(texto) {
    const mensagem = document.getElementById('mensagem-carrinho');
    if (mensagem) {
        mensagem.textContent = texto;
        clearTimeout(temporizadorMensagem);
        temporizadorMensagem = setTimeout(() => mensagem.textContent = '', 3000);
    }
}

function adicionarAoCarrinho(nome, tipo, preco) {
    const item = carrinho.find(item => item.nome === nome && item.tipo === tipo);
    if (item) {
        item.quantidade++;
    } else {
        carrinho.push({ nome, tipo, preco, quantidade: 1 });
    }
    if (salvarCarrinho()) mostrarMensagem(nome + ' adicionado ao carrinho!');
}

function alterarQuantidade(indice, valor) {
    carrinho[indice].quantidade += valor;
    if (carrinho[indice].quantidade <= 0) carrinho.splice(indice, 1);
    if (salvarCarrinho()) mostrarMensagem('Carrinho atualizado.');
}

function removerItem(indice) {
    carrinho.splice(indice, 1);
    if (salvarCarrinho()) mostrarMensagem('Item removido.');
}

function criarBotao(texto, acao, rotulo) {
    const botao = document.createElement('button');
    botao.type = 'button';
    botao.textContent = texto;
    botao.setAttribute('aria-label', rotulo);
    botao.addEventListener('click', acao);
    return botao;
}

// Monta os itens do carrinho e calcula o total no modal.
function exibirCarrinho() {
    const lista = document.getElementById('itens-carrinho');
    if (!lista) return;
    lista.replaceChildren();
    let total = 0;
    carrinho.forEach((item, indice) => {
        const subtotal = item.preco * item.quantidade;
        total += subtotal;

        const linha = document.createElement('article');
        linha.className = 'item-carrinho';
        const detalhes = document.createElement('div');
        const titulo = document.createElement('h2');
        titulo.textContent = item.nome;
        const descricao = document.createElement('p');
        descricao.textContent = item.tipo + ' • ' + formatarPreco(item.preco) + ' por unidade';
        detalhes.append(titulo, descricao);

        const controles = document.createElement('div');
        controles.className = 'quantidade-carrinho';
        const quantidade = document.createElement('span');
        quantidade.textContent = item.quantidade;
        controles.append(
            criarBotao('−', () => alterarQuantidade(indice, -1), 'Diminuir quantidade de ' + item.nome),
            quantidade,
            criarBotao('+', () => alterarQuantidade(indice, 1), 'Aumentar quantidade de ' + item.nome)
        );

        const valor = document.createElement('strong');
        valor.textContent = formatarPreco(subtotal);
        const remover = criarBotao('Remover', () => removerItem(indice), 'Remover ' + item.nome);
        remover.className = 'remover-carrinho';
        linha.append(detalhes, controles, valor, remover);
        lista.append(linha);
    });
    if (carrinho.length === 0) {
        lista.textContent = 'Seu carrinho está vazio.';
    }
    document.getElementById('total-carrinho').textContent = formatarPreco(total);
    document.getElementById('limpar-carrinho').disabled = carrinho.length === 0;
}

// Conecta os botões das páginas Destinos e Pacotes ao carrinho.
document.querySelectorAll('.adicionar-carrinho').forEach(botao => {
    botao.addEventListener('click', () => {
        const nome = botao.closest('.card').querySelector('p').textContent;
        adicionarAoCarrinho(nome, botao.dataset.tipo, Number(botao.dataset.preco));
        const textoOriginal = 'Adicionar ao carrinho';
        botao.textContent = 'Adicionado!';
        setTimeout(() => botao.textContent = textoOriginal, 1000);
    });
});

const botaoLimpar = document.getElementById('limpar-carrinho');
if (botaoLimpar) {
    botaoLimpar.addEventListener('click', () => {
        carrinho = [];
        if (salvarCarrinho()) mostrarMensagem('Carrinho esvaziado.');
    });
}

atualizarContador();
exibirCarrinho();

// Ao voltar pelo histórico, a página pode estar em cache: leia o armazenamento novamente.
window.addEventListener('pageshow', evento => {
    if (evento.persisted) {
        carrinho = carregarCarrinho();
        atualizarContador();
        exibirCarrinho();
    }
});

// Mantém o contador atualizado se o carrinho for alterado em outra aba.
window.addEventListener('storage', evento => {
    if (evento.key === CHAVE_CARRINHO || evento.key === null) {
        carrinho = carregarCarrinho();
        atualizarContador();
        exibirCarrinho();
    }
});
