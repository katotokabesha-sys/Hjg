// LB-K SMART 2026 - Moteur Principal
class LBKApp {
    constructor() {
        this.version = '2026.1.0';
        this.state = {
            mode: 'desktop',
            theme: 'futuristic',
            cart: [],
            user: null,
            admin: false,
            aiActive: true,
            adsActive: true,
            visitors: [],
            settings: {}
        };
        
        this.modules = {};
        this.initTime = Date.now();
    }

    async init() {
        console.log(`🚀 LB-K SMART ${this.version} - Initialisation`);
        
        // Charger les données
        await this.loadData();
        
        // Initialiser les modules
        this.initModules();
        
        // Mettre à jour l'interface
        this.updateUI();
        
        // Démarrer les services
        this.startServices();
        
        // Analytics
        this.trackEvent('app_started');
        
        console.log('✅ Application prête');
    }

    async loadData() {
        try {
            // Charger depuis localStorage ou API
            const savedCart = localStorage.getItem('lbk_cart');
            const savedSettings = localStorage.getItem('lbk_settings');
            
            if (savedCart) this.state.cart = JSON.parse(savedCart);
            if (savedSettings) this.state.settings = JSON.parse(savedSettings);
            
            // Charger les produits
            const products = await this.fetchProducts();
            this.state.products = products;
            
            // Séparer catalogue/stock
            this.separateProducts();
            
        } catch (error) {
            console.error('Erreur chargement données:', error);
            this.loadDefaultData();
        }
    }

    async fetchProducts() {
        // Priorité: API > localStorage > données par défaut
        try {
            const response = await fetch('/data/products-database.json');
            if (response.ok) return await response.json();
        } catch {
            // Fallback localStorage
            const localData = localStorage.getItem('lbk_products');
            if (localData) return JSON.parse(localData);
        }
        
        // Données par défaut
        return this.getDefaultProducts();
    }

    separateProducts() {
        this.state.catalogProducts = this.state.products.filter(p => p.availability === 'order');
        this.state.stockProducts = this.state.products.filter(p => p.availability === 'stock');
        
        console.log(`📦 Catalogue: ${this.state.catalogProducts.length} produits`);
        console.log(`🏪 Stock: ${this.state.stockProducts.length} produits`);
    }

    initModules() {
        // Initialiser tous les modules
        this.modules = {
            cart: new CartEngine(this),
            whatsapp: new WhatsAppEngine(this),
            admin: new AdminPanel(this),
            ai: new AIAssistant(this),
            logistics: new LogisticsCalculator(this),
            ads: new AdManager(this),
            visitors: new VisitorTracker(this),
            newsletter: new NewsletterManager(this)
        };
    }

    updateUI() {
        // Appliquer le thème
        document.documentElement.setAttribute('data-theme', this.state.theme);
        document.documentElement.setAttribute('data-mode', this.state.mode);
        
        // Mettre à jour le compteur panier
        this.updateCartCount();
        
        // Rendre les produits
        this.renderProducts();
        
        // Mettre à jour les visiteurs
        this.updateVisitorCount();
    }

    renderProducts() {
        // Rendre les produits catalogue
        const catalogGrid = document.getElementById('catalogGrid');
        catalogGrid.innerHTML = '';
        
        this.state.catalogProducts.forEach(product => {
            catalogGrid.appendChild(this.createProductCard(product, 'catalog'));
        });
        
        // Rendre les produits stock
        const stockGrid = document.getElementById('stockGrid');
        stockGrid.innerHTML = '';
        
        this.state.stockProducts.forEach(product => {
            stockGrid.appendChild(this.createProductCard(product, 'stock'));
        });
    }

    createProductCard(product, type) {
        const card = document.createElement('div');
        card.className = `product-card ${type}`;
        card.dataset.id = product.id;
        card.dataset.category = product.category;
        card.dataset.boutique = product.boutique;
        
        // Badge selon le type
        const badge = type === 'catalog' 
            ? '<span class="badge yellow">Commande (15-21j)</span>'
            : '<span class="badge green">Stock disponible</span>';
        
        // Template selon la catégorie
        const template = this.getProductTemplate(product);
        
        card.innerHTML = `
            <div class="product-image">
                <img src="${product.image}" alt="${product.name}" loading="lazy">
                ${badge}
            </div>
            <div class="product-info">
                <h3>${product.name}</h3>
                ${template}
                <div class="product-price">
                    <strong>${product.price} $</strong>
                    ${product.oldPrice ? `<del>${product.oldPrice} $</del>` : ''}
                </div>
                <div class="product-actions">
                    <button class="btn add-to-cart" data-id="${product.id}">
                        <i class="fas fa-cart-plus"></i> Ajouter
                    </button>
                    <button class="btn btn-outline details-btn" data-id="${product.id}">
                        <i class="fas fa-info-circle"></i>
                    </button>
                </div>
            </div>
        `;
        
        return card;
    }

    getProductTemplate(product) {
        const templates = {
            pharmacy: `
                <div class="product-specs">
                    <p><i class="fas fa-pills"></i> DCI: ${product.dci || 'N/A'}</p>
                    <p><i class="fas fa-weight"></i> Dosage: ${product.dosage}</p>
                    <p><i class="fas fa-calendar"></i> Validité: ${product.expiry}</p>
                </div>
            `,
            clothing: `
                <div class="product-specs">
                    <p><i class="fas fa-ruler"></i> Taille: ${product.size}</p>
                    <p><i class="fas fa-palette"></i> Couleur: ${product.color}</p>
                    <p><i class="fas fa-tshirt"></i> Matière: ${product.material}</p>
                </div>
            `,
            electronics: `
                <div class="product-specs">
                    <p><i class="fas fa-microchip"></i> ${product.model}</p>
                    <p><i class="fas fa-memory"></i> ${product.specs}</p>
                    <p><i class="fas fa-shield-alt"></i> Garantie: ${product.warranty}</p>
                </div>
            `
        };
        
        return templates[product.category] || `
            <p class="product-description">${product.description}</p>
        `;
    }

    updateCartCount() {
        const count = this.state.cart.reduce((total, item) => total + item.quantity, 0);
        document.querySelector('.cart-count').textContent = count;
    }

    updateVisitorCount() {
        document.getElementById('visitorCount').textContent = this.state.visitors.length;
    }

    startServices() {
        // Démarrer le tracking des visiteurs
        this.modules.visitors.start();
        
        // Démarrer les publicités
        if (this.state.adsActive) {
            this.modules.ads.start();
        }
        
        // Synchroniser périodiquement
        setInterval(() => this.syncData(), 30000);
    }

    async syncData() {
        // Synchroniser les données
        localStorage.setItem('lbk_cart', JSON.stringify(this.state.cart));
        localStorage.setItem('lbk_settings', JSON.stringify(this.state.settings));
        
        // Mettre à jour les visiteurs
        await this.modules.visitors.update();
        
        // Vérifier les mises à jour
        this.checkForUpdates();
    }

    checkForUpdates() {
        // Vérifier les mises à jour de l'application
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.ready.then(reg => {
                reg.update();
            });
        }
    }

    trackEvent(event, data = {}) {
        // Envoyer les analytics
        const analyticsData = {
            event,
            timestamp: Date.now(),
            session: this.sessionId,
            ...data
        };
        
        // Enregistrer localement
        this.saveAnalytics(analyticsData);
        
        // Envoyer à l'API si disponible
        if (this.state.settings.analyticsEnabled) {
            this.sendAnalytics(analyticsData);
        }
    }

    saveAnalytics(data) {
        const analytics = JSON.parse(localStorage.getItem('lbk_analytics') || '[]');
        analytics.push(data);
        localStorage.setItem('lbk_analytics', JSON.stringify(analytics.slice(-1000)));
    }

    getDefaultProducts() {
        return [
            {
                id: 1,
                name: "iPhone 15 Pro Max",
                category: "electronics",
                boutique: "laurent",
                availability: "order",
                price: 1200,
                image: "/assets/images/products/iphone15.jpg",
                model: "A2848",
                specs: "256GB, 6.7\", iOS 17",
                warranty: "1 an"
            },
            {
                id: 2,
                name: "Robe de soirée",
                category: "clothing",
                boutique: "betty",
                availability: "stock",
                price: 85,
                image: "/assets/images/products/dress.jpg",
                size: "M",
                color: "Noir",
                material: "Soie"
            }
        ];
    }
}

// Initialiser l'application
const LBK = new LBKApp();
