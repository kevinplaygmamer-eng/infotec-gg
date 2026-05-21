const defaultProductsData = [
    {
        id: 1,
        name: "PC Gamer RTX 4070",
        category: "computadores",
        desc: "Processador de última geração, 32GB RAM DDR5, SSD 1TB NVMe.",
        price: 7999.00,
        installment: "12x de R$ 666,58",
        rating: 5.0,
        badge: "Mais Vendido",
        image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80"
    },
    {
        id: 2,
        name: "Notebook Dell Inspiron i5",
        category: "notebooks",
        desc: "Perfeito para produtividade e estudos, tela Full HD, SSD rápido.",
        price: 3499.00,
        installment: "10x de R$ 349,90",
        rating: 5.0,
        badge: "Oferta",
        image: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80"
    },
    {
        id: 3,
        name: "Placa de Vídeo RTX 4060",
        category: "placas-video",
        desc: "Ray Tracing e DLSS 3 para rodar todos os games atuais com fluidez.",
        price: 2299.00,
        installment: "10x de R$ 229,90",
        rating: 4.0,
        badge: "Popular",
        image: "https://images.unsplash.com/photo-1587829191301-1ec42907352a?auto=format&fit=crop&w=800&q=80"
    },
    {
        id: 4,
        name: "SSD NVMe 1TB Kingston",
        category: "ssds",
        desc: "Velocidades de leitura extremas para carregar o sistema em segundos.",
        price: 449.00,
        installment: "6x de R$ 74,83",
        rating: 5.0,
        badge: "Lançamento",
        image: "https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?auto=format&fit=crop&w=800&q=80"
    },
    {
        id: 5,
        name: "Processador Ryzen 7 5700X",
        category: "processadores",
        desc: "8 núcleos e 16 threads ideais para renderização e streaming.",
        price: 1249.00,
        installment: "12x de R$ 104,08",
        rating: 5.0,
        badge: "Mais Vendido",
        image: "https://images.unsplash.com/photo-1555663499-e0e32b89b61b?auto=format&fit=crop&w=800&q=80"
    },
    {
        id: 6,
        name: "Water Cooler RGB 240mm",
        category: "memorias",
        desc: "Refrigeração líquida eficiente com iluminação ARGB customizável.",
        price: 399.00,
        installment: "4x de R$ 99,75",
        rating: 4.5,
        badge: "Oferta",
        image: "https://images.unsplash.com/photo-1592078615290-033ee584e267?auto=format&fit=crop&w=800&q=80"
    }
];

let productsData = [];

// Estado da Aplicação
let cart = [];

// Elementos do DOM
const productsContainer = document.getElementById('products-container');
const searchInput = document.getElementById('search-input');
const cartCount = document.getElementById('cart-count');
const cartSidebar = document.getElementById('cart-sidebar');
const cartOverlay = document.getElementById('cart-overlay');
const cartItemsContainer = document.getElementById('cart-items');
const cartTotalValue = document.getElementById('cart-total-value');
const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
const navbar = document.querySelector('.navbar');
const loginToggleBtn = document.querySelector('.login-toggle-btn');
const profileLink = document.querySelector('.profile-link');
const logoutBtn = document.querySelector('.logout-btn');
const accountModal = document.getElementById('account-modal');
const closeAccountBtn = document.querySelector('.close-account-btn');
const accountTabs = document.querySelectorAll('.account-tab');
const accountTabContents = document.querySelectorAll('.account-tab-content');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const registerCpfInput = document.getElementById('register-cpf');
const checkoutBtn = document.getElementById('checkout-btn');
const checkoutModal = document.getElementById('checkout-modal');
const closeCheckoutBtn = document.querySelector('.close-checkout-btn');
const paymentMethodRadios = document.querySelectorAll('input[name="payment-method"]');
const cardInfoSection = document.getElementById('card-info-section');
const checkoutAddressInput = document.getElementById('checkout-address');
const checkoutTotal = document.getElementById('checkout-total');
const confirmPaymentBtn = document.getElementById('confirm-payment-btn');
let registeredUser = null;

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    loadStoredUser();
    setupEventListeners();
    loadProductsFromApi();
});

async function loadProductsFromApi() {
    try {
        const response = await fetch('/api/products');
        if (!response.ok) {
            throw new Error('Falha ao buscar produtos do servidor');
        }
        productsData = await response.json();
        renderProducts(productsData);
    } catch (error) {
        productsData = defaultProductsData;
        renderProducts(productsData);
        showToast('API inacessível. Usando produtos locais.');
    }
}

// Renderizar Cards de Produtos
function renderProducts(products) {
    productsContainer.innerHTML = '';
    
    if(products.length === 0) {
        productsContainer.innerHTML = '<p class="empty-msg">Nenhum produto encontrado.</p>';
        return;
    }

    products.forEach(product => {
        const stars = '★'.repeat(Math.floor(product.rating)) + '☆'.repeat(5 - Math.floor(product.rating));
        
        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            ${product.badge ? `<span class="product-badge">${product.badge}</span>` : ''}
            <div class="product-image-container">
                <img src="${product.image}" alt="${product.name}">
            </div>
            <div class="product-info">
                <h3 class="product-name">${product.name}</h3>
                <p class="product-desc">${product.desc}</p>
                <div class="product-rating">
                    ${stars} <span>(${product.rating.toFixed(1)})</span>
                </div>
                <div class="product-price-wrapper">
                    <div class="product-price">R$ ${product.price.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</div>
                    <div class="product-installment">${product.installment}</div>
                </div>
                <button class="add-to-cart-btn" onclick="addToCart(${product.id})">
                    <i class="fa-solid fa-cart-plus"></i> Adicionar ao Carrinho
                </button>
            </div>
        `;
        productsContainer.appendChild(card);
    });
}

// Lógica do Carrinho
window.addToCart = function(id) {
    const product = productsData.find(p => p.id === id);
    if (product) {
        cart.push(product);
        updateCart();
        showToast(`${product.name} adicionado ao carrinho!`);
    }
}

function updateCart() {
    // Contador
    cartCount.textContent = cart.length;
    
    // Lista de Itens
    cartItemsContainer.innerHTML = '';
    if(cart.length === 0) {
        cartItemsContainer.innerHTML = '<p class="empty-cart-msg">Seu carrinho está vazio.</p>';
        cartTotalValue.textContent = 'R$ 0,00';
        return;
    }

    let total = 0;
    cart.forEach((item, index) => {
        total += item.price;
        const itemRow = document.createElement('div');
        itemRow.className = 'cart-item';
        itemRow.innerHTML = `
            <img src="${item.image}" alt="${item.name}" class="cart-item-img">
            <div class="cart-item-info">
                <h4 class="cart-item-title">${item.name}</h4>
                <div class="cart-item-price">R$ ${item.price.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</div>
                <button class="remove-item-btn" onclick="removeFromCart(${index})">Remover</button>
            </div>
        `;
        cartItemsContainer.appendChild(itemRow);
    });

    cartTotalValue.textContent = `R$ ${total.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`;
}

window.removeFromCart = function(index) {
    cart.splice(index, 1);
    updateCart();
}

// Sistema de Busca em Tempo Real
searchInput.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    const filtered = productsData.filter(product => 
        product.name.toLowerCase().includes(term) || 
        product.desc.toLowerCase().includes(term)
    );
    renderProducts(filtered);
});

// Filtro por Categorias
function setupEventListeners() {
    // Menu Lateral do Carrinho Toggle
    document.querySelector('.cart-toggle-btn').addEventListener('click', () => {
        cartSidebar.classList.add('open');
        cartOverlay.classList.add('open');
    });

    document.querySelector('.close-cart-btn').addEventListener('click', () => {
        cartSidebar.classList.remove('open');
        cartOverlay.classList.remove('open');
    });

    cartOverlay.addEventListener('click', () => {
        cartSidebar.classList.remove('open');
        cartOverlay.classList.remove('open');
    });

    // Mobile Menu Toggle
    mobileMenuToggle.addEventListener('click', () => {
        navbar.classList.toggle('mobile-open');
    });

    // Clique nas categorias
    document.querySelectorAll('.category-card').forEach(card => {
        card.addEventListener('click', () => {
            const category = card.getAttribute('data-category');
            const filtered = productsData.filter(p => p.category === category);
            renderProducts(filtered);
            document.getElementById('produtos').scrollIntoView({ behavior: 'smooth' });
        });
    });

    document.getElementById('clear-filters').addEventListener('click', () => {
        searchInput.value = '';
        renderProducts(productsData);
    });

    loginToggleBtn.addEventListener('click', () => openAccountModal('login'));
    closeAccountBtn.addEventListener('click', closeAccountModal);
    accountModal.addEventListener('click', (event) => {
        if (event.target === accountModal) {
            closeAccountModal();
        }
    });

    accountTabs.forEach(tab => {
        tab.addEventListener('click', () => switchAccountTab(tab.dataset.tab));
    });

    if (loginForm) loginForm.addEventListener('submit', handleLoginSubmit);
    if (registerForm) registerForm.addEventListener('submit', handleRegisterSubmit);
    if (registerCpfInput) registerCpfInput.addEventListener('input', formatCpfInput);
    if (checkoutBtn) checkoutBtn.addEventListener('click', openCheckoutModal);
    if (closeCheckoutBtn) closeCheckoutBtn.addEventListener('click', closeCheckoutModal);
    if (checkoutModal) {
        checkoutModal.addEventListener('click', (event) => {
            if (event.target === checkoutModal) closeCheckoutModal();
        });
    }
    if (paymentMethodRadios) {
        paymentMethodRadios.forEach(radio => {
            radio.addEventListener('change', toggleCardFields);
        });
    }
    if (confirmPaymentBtn) confirmPaymentBtn.addEventListener('click', handlePaymentSubmit);

    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            sessionStorage.removeItem('userLoggedIn');
            updateAccountButtons(false);
            showToast('Você saiu da conta.');
        });
    }
}

function loadStoredUser() {
    const stored = localStorage.getItem('registeredUser');
    const loggedIn = sessionStorage.getItem('userLoggedIn') === 'true';

    if (stored) {
        registeredUser = JSON.parse(stored);
        if (loginForm) {
            document.getElementById('login-email').value = registeredUser.email;
        }
        if (registerForm) {
            document.getElementById('register-name').value = registeredUser.name || '';
            document.getElementById('register-email').value = registeredUser.email || '';
            document.getElementById('register-phone').value = registeredUser.phone || '';
            document.getElementById('register-cpf').value = registeredUser.cpf || '';
            document.getElementById('register-address').value = registeredUser.address || '';
        }
    }

    updateAccountButtons(loggedIn);
}

function updateAccountButtons(isLoggedIn) {
    if (isLoggedIn) {
        if (loginToggleBtn) loginToggleBtn.style.display = 'none';
        if (profileLink) profileLink.style.display = 'inline-flex';
        if (logoutBtn) logoutBtn.style.display = 'inline-flex';
    } else {
        if (loginToggleBtn) loginToggleBtn.style.display = 'inline-flex';
        if (profileLink) profileLink.style.display = 'none';
        if (logoutBtn) logoutBtn.style.display = 'none';
    }
}

function formatCpfInput(event) {
    let cpf = event.target.value.replace(/\D/g, '');
    if (cpf.length > 11) cpf = cpf.slice(0, 11);
    cpf = cpf.replace(/(\d{3})(\d)/, '$1.$2');
    cpf = cpf.replace(/(\d{3})(\d)/, '$1.$2');
    cpf = cpf.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    event.target.value = cpf;
}

function formatCpfDigits(cpf) {
    return cpf.replace(/\D/g, '');
}

function validateCPF(cpf) {
    if (!cpf) return false;
    cpf = formatCpfDigits(cpf);
    if (cpf.length !== 11 || /^([0-9])\1{10}$/.test(cpf)) return false;

    const calcCheckDigit = (cpfSlice) => {
        let sum = 0;
        for (let i = 0; i < cpfSlice.length; i++) {
            sum += Number(cpfSlice[i]) * ((cpfSlice.length + 1) - i);
        }
        const result = (sum * 10) % 11;
        return result === 10 ? 0 : result;
    };

    const firstDigit = calcCheckDigit(cpf.slice(0, 9));
    const secondDigit = calcCheckDigit(cpf.slice(0, 10));
    return firstDigit === Number(cpf[9]) && secondDigit === Number(cpf[10]);
}

async function handleLoginSubmit(event) {
    event.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;

    if (!email || !password) {
        showToast('Preencha email e senha para entrar.');
        return;
    }

    try {
        const user = await apiLogin({ email, password });
        saveUserSession(user);
        closeAccountModal();
        showToast(`Bem-vindo de volta, ${user.name}!`);
    } catch (error) {
        if (registeredUser && email === registeredUser.email && password === registeredUser.password) {
            saveUserSession(registeredUser);
            closeAccountModal();
            showToast(`Bem-vindo de volta, ${registeredUser.name}! (Offline)`);
            return;
        }
        showToast(error.message || 'Não foi possível fazer login.');
    }
}

async function handleRegisterSubmit(event) {
    event.preventDefault();
    const name = document.getElementById('register-name').value.trim();
    const email = document.getElementById('register-email').value.trim();
    const phone = document.getElementById('register-phone').value.trim();
    const cpf = document.getElementById('register-cpf').value.trim();
    const address = document.getElementById('register-address').value.trim();
    const password = document.getElementById('register-password').value;

    if (!name || !email || !phone || !cpf || !address || !password) {
        showToast('Preencha todos os campos para criar sua conta.');
        return;
    }

    if (!validateEmail(email)) {
        showToast('Digite um email válido.');
        return;
    }

    if (!validateCPF(cpf)) {
        showToast('CPF inválido.');
        return;
    }

    const newUser = { name, email, phone, cpf, address, password };

    try {
        const user = await apiRegister(newUser);
        saveUserSession(user);
        closeAccountModal();
        loginForm.reset();
        registerForm.reset();
        showToast('Cadastro concluído com sucesso! Você já está logado.');
    } catch (error) {
        if (error.message.includes('Falha de rede') || error.message.includes('API inacessível')) {
            saveUserSession(newUser);
            closeAccountModal();
            loginForm.reset();
            registerForm.reset();
            showToast('Servidor indisponível. Cadastro local concluído.');
            return;
        }
        showToast(error.message || 'Não foi possível cadastrar.');
    }
}

async function apiLogin(credentials) {
    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials)
        });
        const json = await response.json();
        if (!response.ok) {
            throw new Error(json.error || 'Erro no login');
        }
        return json;
    } catch (err) {
        if (err.name === 'TypeError') {
            throw new Error('Falha de rede: API inacessível');
        }
        throw err;
    }
}

async function apiRegister(userData) {
    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });
        const json = await response.json();
        if (!response.ok) {
            throw new Error(json.error || 'Erro no cadastro');
        }
        return json;
    } catch (err) {
        if (err.name === 'TypeError') {
            throw new Error('Falha de rede: API inacessível');
        }
        throw err;
    }
}

function saveUserSession(user) {
    registeredUser = user;
    localStorage.setItem('registeredUser', JSON.stringify(user));
    sessionStorage.setItem('userLoggedIn', 'true');
    updateAccountButtons(true);
}

function showToast(message) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 300);
}

function openCheckoutModal() {
    if (cart.length === 0) {
        showToast('Seu carrinho está vazio. Adicione um produto antes de finalizar.');
        return;
    }
    checkoutTotal.textContent = `Total: ${cartTotalValue.textContent}`;
    checkoutModal.classList.add('open');
    toggleCardFields();
}

function closeCheckoutModal() {
    checkoutModal.classList.remove('open');
}

function toggleCardFields() {
    const selected = document.querySelector('input[name="payment-method"]:checked');
    if (selected && selected.value === 'card') {
        cardInfoSection.style.display = 'grid';
    } else {
        cardInfoSection.style.display = 'none';
    }
}

function handlePaymentSubmit() {
    const selected = document.querySelector('input[name="payment-method"]:checked');
    if (!selected) {
        showToast('Escolha uma forma de pagamento.');
        return;
    }

    if (!checkoutAddressInput.value.trim()) {
        showToast('Informe o endereço para entrega.');
        return;
    }

    if (selected.value === 'card') {
        const cardName = document.getElementById('card-name').value.trim();
        const cardNumber = document.getElementById('card-number').value.trim();
        const cardExp = document.getElementById('card-exp').value.trim();
        const cardCvv = document.getElementById('card-cvv').value.trim();

        if (!cardName || !cardNumber || !cardExp || !cardCvv) {
            showToast('Preencha todos os dados do cartão para continuar.');
            return;
        }
    }

    const paymentLabel = selected.value === 'pix' ? 'PIX' : selected.value === 'boleto' ? 'Boleto' : 'Cartão';
    showToast(`Pagamento com ${paymentLabel} confirmado! Obrigado pela compra.`);
    cart = [];
    updateCart();
    closeCheckoutModal();
}

function openAccountModal(tab = 'login') {
    accountModal.classList.add('open');
    switchAccountTab(tab);
}

function closeAccountModal() {
    accountModal.classList.remove('open');
}

function switchAccountTab(tabName) {
    accountTabs.forEach(tab => {
        tab.classList.toggle('active', tab.dataset.tab === tabName);
    });
    accountTabContents.forEach(content => {
        content.classList.toggle('active', content.id === `account-${tabName}`);
    });
}

function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
