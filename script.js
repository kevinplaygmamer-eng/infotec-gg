const defaultProductsData = [
    {
        id: 1,
        name: "PC Gamer RTX 4070",
        category: "computadores",
        desc: "Processador de última geração, 32GB RAM DDR5, SSD 1TB NVMe.",
        price: 9999.00,
        installment: "12x de R$ 666,58",
        rating: 5.0,
        badge: "Mais Vendido",
        image: "https://http2.mlstatic.com/D_NQ_NP_2X_855780-MLB82309991799_022025-F.webp"
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
        image: "https://http2.mlstatic.com/D_NQ_NP_2X_705031-MLA92611852323_092025-F.webp"
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
        image: "https://m.media-amazon.com/images/I/617uDFLVAML._AC_SY300_SX300_QL70_ML2_.jpg"
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
        image: "https://m.media-amazon.com/images/I/71c5uuoM1bL._AC_SX522_.jpg"
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
        image: "https://images7.kabum.com.br/produtos/fotos/938497/processador-amd-ryzen-7-5700-3-7-ghz-4-6ghz-max-turbo-cache-20mb-8-nucleos-16-threads-am4-100-100000743sbx_1763061441_gg.jpg"
    },
    
];

let productsData = [];
let cart = [];

const defaultProductById = new Map(defaultProductsData.map(product => [Number(product.id), product]));

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
const checkoutNameInput = document.getElementById('checkout-name');
const checkoutEmailInput = document.getElementById('checkout-email');
const checkoutCpfInput = document.getElementById('checkout-cpf');
const checkoutPhoneInput = document.getElementById('checkout-phone');
const checkoutZipInput = document.getElementById('checkout-zip');
const checkoutStreetInput = document.getElementById('checkout-street');
const checkoutNumberInput = document.getElementById('checkout-number');
const checkoutNeighborhoodInput = document.getElementById('checkout-neighborhood');
const checkoutCityInput = document.getElementById('checkout-city');
const checkoutStateInput = document.getElementById('checkout-state');
const checkoutTotal = document.getElementById('checkout-total');
const confirmPaymentBtn = document.getElementById('confirm-payment-btn');
const cardBrickContainer = document.getElementById('card-payment-brick-container');
const paymentStatusPanel = document.getElementById('payment-status-panel');
const paymentStatusTitle = document.getElementById('payment-status-title');
const paymentStatusDetail = document.getElementById('payment-status-detail');
const pixResult = document.getElementById('pix-result');
const pixQrImage = document.getElementById('pix-qr-image');
const pixCopyCode = document.getElementById('pix-copy-code');
const copyPixBtn = document.getElementById('copy-pix-btn');
const boletoResult = document.getElementById('boleto-result');
const boletoBarcode = document.getElementById('boleto-barcode');
const boletoLink = document.getElementById('boleto-link');
let registeredUser = null;
let paymentConfig = { mercadoPagoPublicKey: '', mercadoPagoReady: false };
let mercadoPagoInstance = null;
let cardPaymentBrickController = null;
let currentCheckoutOrder = null;
let paymentStatusTimer = null;

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    loadStoredUser();
    setupEventListeners();
    loadPaymentConfig();
    loadProductsFromApi();
});

async function loadProductsFromApi() {
    try {
        const response = await fetch('/api/products');
        if (!response.ok) {
            throw new Error('Falha ao buscar produtos do servidor');
        }
        const apiProducts = await response.json();
        productsData = apiProducts.map(product => {
            const fallbackProduct = defaultProductById.get(Number(product.id));
            return {
                ...product,
                image: product.image || fallbackProduct?.image || ''
            };
        });
        renderProducts(productsData);
    } catch (error) {
        productsData = defaultProductsData;
        renderProducts(productsData);
        showToast('API inacessível. Usando produtos locais.');
    }
}

// Renderizar Cards de Produtos
function renderProducts(products) {
    if (!productsContainer) return;
    productsContainer.innerHTML = '';
    
    if(products.length === 0) {
        productsContainer.innerHTML = '<p class="empty-msg">Nenhum produto encontrado.</p>';
        return;
    }

    products.forEach(product => {
        const stars = '★'.repeat(Math.floor(product.rating)) + '☆'.repeat(5 - Math.floor(product.rating));
        const productImage = product.image
            ? `<img src="${product.image}" alt="${product.name}">`
            : `<div class="product-image-placeholder" aria-label="Imagem indisponivel"><i class="fa-solid fa-image"></i></div>`;
        
        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            ${product.badge ? `<span class="product-badge">${product.badge}</span>` : ''}
            <div class="product-image-container">
                ${productImage}
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
if (searchInput) {
    searchInput.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        const filtered = productsData.filter(product => 
            product.name.toLowerCase().includes(term) || 
            product.desc.toLowerCase().includes(term)
        );
        renderProducts(filtered);
    });
}

// Filtro por Categorias
function setupEventListeners() {
    // Menu Lateral do Carrinho Toggle
    const cartToggleBtn = document.querySelector('.cart-toggle-btn');
    const closeCartBtn = document.querySelector('.close-cart-btn');

    if (cartToggleBtn && cartSidebar) {
        cartToggleBtn.addEventListener('click', () => {
            cartSidebar.classList.add('open');
            if (cartOverlay) cartOverlay.classList.add('open');
        });
    }

    if (closeCartBtn && cartSidebar) {
        closeCartBtn.addEventListener('click', () => {
            cartSidebar.classList.remove('open');
            if (cartOverlay) cartOverlay.classList.remove('open');
        });
    }

    if (cartOverlay && cartSidebar) {
        cartOverlay.addEventListener('click', () => {
            cartSidebar.classList.remove('open');
            cartOverlay.classList.remove('open');
        });
    }

    // Mobile Menu Toggle
    if (mobileMenuToggle && navbar) {
        mobileMenuToggle.addEventListener('click', () => {
            navbar.classList.toggle('mobile-open');
        });
    }

    // Clique nas categorias
    const categoryCards = document.querySelectorAll('.category-card');
    if (categoryCards.length) {
        categoryCards.forEach(card => {
            card.addEventListener('click', () => {
                const category = card.getAttribute('data-category');
                const filtered = productsData.filter(p => p.category === category);
                renderProducts(filtered);
                const produtosSection = document.getElementById('produtos');
                if (produtosSection) {
                    produtosSection.scrollIntoView({ behavior: 'smooth' });
                }
            });
        });
    }

    const clearFiltersBtn = document.getElementById('clear-filters');
    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', () => {
            if (searchInput) searchInput.value = '';
            renderProducts(productsData);
        });
    }

    if (loginToggleBtn) {
        loginToggleBtn.addEventListener('click', () => openAccountModal('login'));
    }
    if (closeAccountBtn) {
        closeAccountBtn.addEventListener('click', closeAccountModal);
    }
    if (accountModal) {
        accountModal.addEventListener('click', (event) => {
            if (event.target === accountModal) {
                closeAccountModal();
            }
        });
    }

    accountTabs.forEach(tab => {
        tab.addEventListener('click', () => switchAccountTab(tab.dataset.tab));
    });

    if (loginForm) loginForm.addEventListener('submit', handleLoginSubmit);
    if (registerForm) registerForm.addEventListener('submit', handleRegisterSubmit);
    if (registerCpfInput) registerCpfInput.addEventListener('input', formatCpfInput);
    if (checkoutCpfInput) checkoutCpfInput.addEventListener('input', formatCpfInput);
    if (checkoutZipInput) checkoutZipInput.addEventListener('input', formatZipInput);
    if (checkoutBtn) checkoutBtn.addEventListener('click', openCheckoutModal);
    if (closeCheckoutBtn) closeCheckoutBtn.addEventListener('click', closeCheckoutModal);
    if (checkoutModal) {
        checkoutModal.addEventListener('click', (event) => {
            if (event.target === checkoutModal) closeCheckoutModal();
        });
    }
    if (paymentMethodRadios) {
        paymentMethodRadios.forEach(radio => {
            radio.addEventListener('change', updateSelectedPaymentMethod);
        });
    }
    if (confirmPaymentBtn) confirmPaymentBtn.addEventListener('click', handlePaymentSubmit);
    if (copyPixBtn) copyPixBtn.addEventListener('click', copyPixCode);

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

function formatZipInput(event) {
    let zip = event.target.value.replace(/\D/g, '');
    if (zip.length > 8) zip = zip.slice(0, 8);
    zip = zip.replace(/(\d{5})(\d)/, '$1-$2');
    event.target.value = zip;
}

function formatCpfDigits(cpf) {
    return cpf.replace(/\D/g, '');
}

function normalizeEmail(email) {
    return email.trim().toLowerCase();
}

function validateCPF(cpf) {
    return formatCpfDigits(cpf).length === 11;
}

async function handleLoginSubmit(event) {
    event.preventDefault();
    const email = normalizeEmail(document.getElementById('login-email').value);
    const password = document.getElementById('login-password').value;

    if (!email || !password) {
        showToast('Preencha email e senha para entrar.');
        return;
    }

    try {
        const user = await apiLogin({ email, password });
        saveUserSession(user, password);
        closeAccountModal();
        showToast(`Bem-vindo de volta, ${user.name}!`);
        setTimeout(() => {
            window.location.href = 'profile.html';
        }, 600);
    } catch (error) {
        if (registeredUser && email === normalizeEmail(registeredUser.email || '') && password === registeredUser.password) {
            saveUserSession(registeredUser);
            closeAccountModal();
            showToast(`Bem-vindo de volta, ${registeredUser.name}! (Offline)`);
            setTimeout(() => {
                window.location.href = 'profile.html';
            }, 600);
            return;
        }
        showToast(error.message || 'Não foi possível fazer login.');
    }
}

async function handleRegisterSubmit(event) {
    event.preventDefault();
    const name = document.getElementById('register-name').value.trim();
    const email = normalizeEmail(document.getElementById('register-email').value);
    const phone = document.getElementById('register-phone').value.trim();
    const cpf = formatCpfDigits(document.getElementById('register-cpf').value);
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
        showToast('Informe um CPF com 11 digitos.');
        return;
    }

    const newUser = { name, email, phone, cpf, address, password };

    try {
        const user = await apiRegister(newUser);
        saveUserSession(user, newUser.password);
        closeAccountModal();
        loginForm.reset();
        registerForm.reset();
        showToast('Cadastro concluído com sucesso! Você já está logado.');
        setTimeout(() => {
            window.location.href = 'profile.html';
        }, 600);
    } catch (error) {
        if (error.message.includes('Falha de rede') || error.message.includes('API inacessível')) {
            saveUserSession(newUser);
            closeAccountModal();
            loginForm.reset();
            registerForm.reset();
            showToast('Servidor indisponível. Cadastro local concluído.');
            setTimeout(() => {
                window.location.href = 'profile.html';
            }, 600);
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
        return await parseApiResponse(response, 'Erro no login');
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
        return await parseApiResponse(response, 'Erro no cadastro');
    } catch (err) {
        if (err.name === 'TypeError') {
            throw new Error('Falha de rede: API inacessível');
        }
        throw err;
    }
}

async function loadPaymentConfig() {
    try {
        const response = await fetch('/api/config');
        if (!response.ok) return;
        paymentConfig = await response.json();
    } catch (error) {
        paymentConfig = { mercadoPagoPublicKey: '', mercadoPagoReady: false };
    }
}

async function parseApiResponse(response, fallbackMessage) {
    const text = await response.text();
    let json = {};

    if (text) {
        try {
            json = JSON.parse(text);
        } catch (error) {
            throw new Error('Resposta inválida do servidor');
        }
    }

    if (!response.ok) {
        throw new Error(json.error || fallbackMessage);
    }

    return json;
}

function saveUserSession(user, password = null) {
    const currentPassword = registeredUser && normalizeEmail(registeredUser.email || '') === normalizeEmail(user.email || '')
        ? registeredUser.password
        : null;
    registeredUser = { ...user };
    if (password) {
        registeredUser.password = password;
    } else if (!registeredUser.password && currentPassword) {
        registeredUser.password = currentPassword;
    }
    localStorage.setItem('registeredUser', JSON.stringify(registeredUser));
    sessionStorage.setItem('userLoggedIn', 'true');
    updateAccountButtons(true);
}

function showToast(message) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function openCheckoutModal() {
    if (cart.length === 0) {
        showToast('Seu carrinho está vazio. Adicione um produto antes de finalizar.');
        return;
    }
    checkoutTotal.textContent = `Total: ${cartTotalValue.textContent}`;
    resetPaymentResult();
    fillCheckoutDefaults();
    checkoutModal.classList.add('open');
    updateSelectedPaymentMethod();
}

function closeCheckoutModal() {
    checkoutModal.classList.remove('open');
    stopPaymentPolling();
}

function updateSelectedPaymentMethod() {
    const selected = document.querySelector('input[name="payment-method"]:checked');
    document.querySelectorAll('.payment-option').forEach(option => {
        const input = option.querySelector('input[name="payment-method"]');
        option.classList.toggle('active', input && selected && input.value === selected.value);
    });

    if (selected && selected.value === 'card') {
        cardInfoSection.style.display = 'grid';
        confirmPaymentBtn.style.display = 'none';
        renderCardPaymentBrick();
    } else {
        cardInfoSection.style.display = 'none';
        confirmPaymentBtn.style.display = 'inline-flex';
    }
}

function fillCheckoutDefaults() {
    if (!registeredUser) return;

    checkoutNameInput.value = registeredUser.name || '';
    checkoutEmailInput.value = registeredUser.email || '';
    checkoutCpfInput.value = registeredUser.cpf || '';
    checkoutPhoneInput.value = registeredUser.phone || '';

    if (!checkoutStreetInput.value && registeredUser.address) {
        checkoutStreetInput.value = registeredUser.address;
    }
}

function getCartItemsForOrder() {
    const grouped = cart.reduce((acc, product) => {
        const id = Number(product.id);
        acc[id] = acc[id] || { id, quantity: 0 };
        acc[id].quantity += 1;
        return acc;
    }, {});

    return Object.values(grouped);
}

function getCheckoutPayload() {
    const payer = {
        name: checkoutNameInput.value.trim(),
        email: normalizeEmail(checkoutEmailInput.value),
        cpf: formatCpfDigits(checkoutCpfInput.value),
        phone: checkoutPhoneInput.value.trim(),
        address: checkoutStreetInput.value.trim()
    };

    const address = {
        zipCode: checkoutZipInput.value.replace(/\D/g, ''),
        streetName: checkoutStreetInput.value.trim(),
        streetNumber: checkoutNumberInput.value.trim(),
        neighborhood: checkoutNeighborhoodInput.value.trim(),
        city: checkoutCityInput.value.trim(),
        state: checkoutStateInput.value.trim().toUpperCase()
    };

    return {
        items: getCartItemsForOrder(),
        payer,
        address
    };
}

function validateCheckoutForm() {
    const payload = getCheckoutPayload();
    const requiredPayer = payload.payer.name && payload.payer.email && payload.payer.cpf && payload.payer.phone;
    const requiredAddress = payload.address.zipCode && payload.address.streetName && payload.address.streetNumber &&
        payload.address.neighborhood && payload.address.city && payload.address.state;

    if (!requiredPayer || !requiredAddress) {
        showToast('Preencha os dados do comprador e endereÃ§o.');
        return false;
    }

    if (!validateEmail(payload.payer.email)) {
        showToast('Digite um email vÃ¡lido.');
        return false;
    }

    if (!validateCPF(payload.payer.cpf)) {
        showToast('Informe um CPF com 11 digitos.');
        return false;
    }

    if (payload.address.zipCode.length !== 8 || payload.address.state.length !== 2) {
        showToast('Confira o CEP e a UF do endereÃ§o.');
        return false;
    }

    return true;
}

async function ensureCheckoutOrder() {
    if (currentCheckoutOrder) return currentCheckoutOrder;

    const order = await apiCreateOrder(getCheckoutPayload());
    currentCheckoutOrder = order;
    return order;
}

async function handlePaymentSubmit() {
    const selected = document.querySelector('input[name="payment-method"]:checked');
    if (!selected) {
        showToast('Escolha uma forma de pagamento.');
        return;
    }

    if (!validateCheckoutForm()) {
        return;
    }

    if (selected.value === 'card') {
        showToast('Use o formulário seguro do cartão para concluir.');
        return;
    }

    try {
        setPaymentLoading(true);
        const order = await ensureCheckoutOrder();
        const response = await apiCreatePayment(order.id, { method: selected.value });
        handlePaymentResponse(response);
    } catch (error) {
        showToast(error.message || 'Não foi possível gerar o pagamento.');
    } finally {
        setPaymentLoading(false);
    }
}

function setPaymentLoading(isLoading) {
    confirmPaymentBtn.disabled = isLoading;
    confirmPaymentBtn.innerHTML = isLoading
        ? '<i class="fa-solid fa-spinner fa-spin"></i> Processando...'
        : '<i class="fa-solid fa-lock"></i> Gerar pagamento';
}

function getCartTotalAmount() {
    return Number(cart.reduce((sum, item) => sum + Number(item.price || 0), 0).toFixed(2));
}

async function renderCardPaymentBrick() {
    if (!cardBrickContainer) return;

    if (!paymentConfig.mercadoPagoPublicKey) {
        await loadPaymentConfig();
    }

    if (!paymentConfig.mercadoPagoPublicKey) {
        cardBrickContainer.innerHTML = '<p class="account-help">Configure MERCADO_PAGO_PUBLIC_KEY no .env para habilitar cartão.</p>';
        return;
    }

    if (!window.MercadoPago) {
        cardBrickContainer.innerHTML = '<p class="account-help">SDK do Mercado Pago não carregou. Recarregue a página.</p>';
        return;
    }

    if (cardPaymentBrickController) return;

    mercadoPagoInstance = mercadoPagoInstance || new window.MercadoPago(paymentConfig.mercadoPagoPublicKey, {
        locale: 'pt-BR'
    });

    const bricksBuilder = mercadoPagoInstance.bricks();
    cardPaymentBrickController = await bricksBuilder.create('cardPayment', 'card-payment-brick-container', {
        initialization: {
            amount: getCartTotalAmount(),
            payer: {
                email: checkoutEmailInput.value || registeredUser?.email || ''
            }
        },
        customization: {
            visual: {
                style: {
                    theme: 'dark'
                }
            },
            paymentMethods: {
                maxInstallments: 12
            }
        },
        callbacks: {
            onSubmit: (cardFormData) => processCardPayment(cardFormData),
            onError: (error) => {
                showToast(error?.message || 'Erro no formulário do cartão.');
            }
        }
    });
}

async function processCardPayment(cardFormData) {
    if (!validateCheckoutForm()) return Promise.reject();

    try {
        const order = await ensureCheckoutOrder();
        const response = await apiCreatePayment(order.id, {
            method: 'card',
            token: cardFormData.token,
            issuer_id: cardFormData.issuer_id,
            payment_method_id: cardFormData.payment_method_id,
            installments: cardFormData.installments,
            payer: cardFormData.payer
        });
        handlePaymentResponse(response);
        return Promise.resolve();
    } catch (error) {
        showToast(error.message || 'Não foi possível pagar com cartão.');
        return Promise.reject(error);
    }
}

function resetPaymentResult() {
    currentCheckoutOrder = null;
    paymentStatusPanel.hidden = true;
    pixResult.hidden = true;
    boletoResult.hidden = true;
    pixQrImage.removeAttribute('src');
    pixCopyCode.value = '';
    boletoBarcode.value = '';
    boletoLink.removeAttribute('href');
    stopPaymentPolling();

    if (cardPaymentBrickController) {
        try {
            cardPaymentBrickController.unmount();
        } catch (error) {
            cardBrickContainer.innerHTML = '';
        }
        cardPaymentBrickController = null;
    }
}

function handlePaymentResponse(response) {
    const { order, payment } = response;
    currentCheckoutOrder = order;
    paymentStatusPanel.hidden = false;
    updatePaymentStatus(order);

    pixResult.hidden = true;
    boletoResult.hidden = true;

    if (payment.qr_code || payment.qr_code_base64) {
        pixResult.hidden = false;
        pixCopyCode.value = payment.qr_code || '';
        if (payment.qr_code_base64) {
            pixQrImage.src = `data:image/png;base64,${payment.qr_code_base64}`;
        }
    }

    if (payment.ticket_url || payment.barcode) {
        boletoResult.hidden = false;
        boletoBarcode.value = payment.barcode || '';
        if (payment.ticket_url) {
            boletoLink.href = payment.ticket_url;
        }
    }

    if (order.payment_status === 'approved') {
        finishPaidOrder();
    } else {
        startPaymentPolling(order.id);
    }
}

function updatePaymentStatus(order) {
    const status = order.payment_status || 'pending';
    const statusMap = {
        approved: ['Pagamento aprovado', 'Pedido confirmado e pronto para separação.'],
        pending: ['Aguardando pagamento', 'Assim que o Mercado Pago confirmar, o pedido será atualizado.'],
        in_process: ['Pagamento em análise', 'O Mercado Pago está analisando a transação.'],
        rejected: ['Pagamento recusado', 'Tente novamente ou escolha outra forma de pagamento.'],
        cancelled: ['Pagamento cancelado', 'O pedido não foi pago.']
    };
    const [title, detail] = statusMap[status] || statusMap.pending;

    paymentStatusTitle.textContent = title;
    paymentStatusDetail.textContent = detail;
}

function finishPaidOrder() {
    cart = [];
    updateCart();
    stopPaymentPolling();
    showToast('Pagamento aprovado! Pedido salvo com sucesso.');
}

function startPaymentPolling(orderId) {
    stopPaymentPolling();
    paymentStatusTimer = setInterval(async () => {
        try {
            const order = await apiGetOrderStatus(orderId);
            currentCheckoutOrder = order;
            updatePaymentStatus(order);
            if (order.payment_status === 'approved') {
                finishPaidOrder();
            }
            if (['approved', 'rejected', 'cancelled'].includes(order.payment_status)) {
                stopPaymentPolling();
            }
        } catch (error) {
            stopPaymentPolling();
        }
    }, 5000);
}

function stopPaymentPolling() {
    if (paymentStatusTimer) {
        clearInterval(paymentStatusTimer);
        paymentStatusTimer = null;
    }
}

async function copyPixCode() {
    if (!pixCopyCode.value) return;
    await navigator.clipboard.writeText(pixCopyCode.value);
    showToast('Código PIX copiado.');
}

async function apiCreateOrder(payload) {
    const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    return await parseApiResponse(response, 'Erro ao criar pedido');
}

async function apiCreatePayment(orderId, payload) {
    const response = await fetch(`/api/orders/${orderId}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    return await parseApiResponse(response, 'Erro ao criar pagamento');
}

async function apiGetOrderStatus(orderId) {
    const response = await fetch(`/api/orders/${orderId}/status`);
    return await parseApiResponse(response, 'Erro ao consultar pedido');
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
