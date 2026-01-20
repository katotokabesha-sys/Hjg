class WhatsAppEngine {
    constructor(app) {
        this.app = app;
        this.config = {
            laurent: {
                phone: "+243822937321",
                categories: ["electronics", "appliances", "auto"]
            },
            betty: {
                phone: "+243971455335",
                categories: ["clothing", "cosmetics", "pharmacy"]
            }
        };
        
        this.templates = {
            order: `🛒 *COMMANDE LB-K SMART*
Client: {{client_name}}
Téléphone: {{client_phone}}

📦 *PRODUITS COMMANDÉS*
{{products_list}}

💰 *TOTAL PRODUITS*: {{products_total}} $
🚚 *FRAIS LIVRAISON*: {{shipping_cost}} $
💵 *TOTAL GÉNÉRAL*: {{grand_total}} $

📋 *INFORMATIONS LIVRAISON*
Adresse: {{delivery_address}}
Mode: {{shipping_mode}} ({{delivery_days}})
Paiement: {{payment_method}}

✅ Merci pour votre commande !`,
            
            inquiry: `🔍 *DEMANDE D'INFORMATION*
Produit: {{product_name}}
Référence: {{product_id}}
Client: {{client_name}}
Question: {{client_message}}

📞 Contact rapide demandé.`
        };
    }

    sendOrder(cart, clientInfo) {
        // Déterminer la boutique principale
        const mainBoutique = this.determineMainBoutique(cart);
        const config = this.config[mainBoutique];
        
        // Générer le message
        const message = this.generateOrderMessage(cart, clientInfo, mainBoutique);
        
        // Ouvrir WhatsApp
        this.openWhatsApp(config.phone, message);
        
        // Enregistrer l'envoi
        this.logOrder(cart, clientInfo, mainBoutique);
    }

    determineMainBoutique(cart) {
        const counts = {
            laurent: cart.filter(item => this.config.laurent.categories.includes(item.category)).length,
            betty: cart.filter(item => this.config.betty.categories.includes(item.category)).length
        };
        
        return counts.laurent >= counts.betty ? 'laurent' : 'betty';
    }

    generateOrderMessage(cart, clientInfo, boutique) {
        let template = this.templates.order;
        
        // Formater les produits
        const productsList = cart.map(item => {
            return `• ${item.name} (x${item.quantity}) - ${item.price * item.quantity} $`;
        }).join('\n');
        
        // Calculer les totaux
        const productsTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const shippingCost = this.app.modules.logistics.calculateShipping(cart, clientInfo.shippingMode);
        const grandTotal = productsTotal + shippingCost;
        
        // Remplacer les variables
        template = template
            .replace('{{client_name}}', clientInfo.name)
            .replace('{{client_phone}}', clientInfo.phone)
            .replace('{{products_list}}', productsList)
            .replace('{{products_total}}', productsTotal)
            .replace('{{shipping_cost}}', shippingCost)
            .replace('{{grand_total}}', grandTotal)
            .replace('{{delivery_address}}', clientInfo.address)
            .replace('{{shipping_mode}}', this.getShippingModeText(clientInfo.shippingMode))
            .replace('{{delivery_days}}', this.getDeliveryDays(clientInfo.shippingMode))
            .replace('{{payment_method}}', clientInfo.paymentMethod);
        
        return encodeURIComponent(template);
    }

    openWhatsApp(phone, message) {
        const url = `https://wa.me/${phone}?text=${message}`;
        window.open(url, '_blank');
    }

    logOrder(cart, clientInfo, boutique) {
        const order = {
            id: Date.now(),
            date: new Date().toISOString(),
            boutique,
            cart: [...cart],
            client: clientInfo,
            total: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
            status: 'sent'
        };
        
        // Sauvegarder
        const orders = JSON.parse(localStorage.getItem('lbk_orders') || '[]');
        orders.push(order);
        localStorage.setItem('lbk_orders', JSON.stringify(orders));
        
        // Analytics
        this.app.trackEvent('whatsapp_order_sent', {
            order_id: order.id,
            boutique,
            product_count: cart.length,
            total: order.total
        });
    }

    getShippingModeText(mode) {
        const modes = {
            'air_express': '✈️ Aérien Express (+25,000 FCFA)',
            'air_normal': '✈️ Aérien Normal (+18,000 FCFA)',
            'boat': '⛵ Maritime (Calcul CBM)'
        };
        return modes[mode] || mode;
    }

    getDeliveryDays(mode) {
        const days = {
            'air_express': '15 jours',
            'air_normal': '21 jours',
            'boat': '30-45 jours'
        };
        return days[mode] || 'À préciser';
    }

    sendInquiry(product, clientMessage, clientName) {
        const boutique = product.boutique;
        const config = this.config[boutique];
        
        let template = this.templates.inquiry;
        template = template
            .replace('{{product_name}}', product.name)
            .replace('{{product_id}}', product.id)
            .replace('{{client_name}}', clientName)
            .replace('{{client_message}}', clientMessage);
        
        this.openWhatsApp(config.phone, encodeURIComponent(template));
    }
}
