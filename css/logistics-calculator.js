class LogisticsCalculator {
    constructor(app) {
        this.app = app;
        this.rates = {
            air: {
                express: {
                    base: 25000, // FCFA
                    per_kg: 30, // $
                    phones: 30, // $ par téléphone
                    laptops: 50 // $ par ordinateur
                },
                normal: {
                    base: 18000,
                    per_kg: 28,
                    phones: 30,
                    laptops: 50
                }
            },
            boat: {
                per_cbm: 500, // $ par m3
                per_ton: 600 // $ par tonne
            }
        };
    }

    calculateShipping(cart, mode) {
        let total = 0;
        
        // Vérifier si batterie présente (obligation maritime)
        const hasBattery = cart.some(item => 
            item.category === 'electronics' || 
            item.category === 'appliances'
        );
        
        if (hasBattery && mode !== 'boat') {
            // Auto-convertir en maritime si batterie
            mode = 'boat';
        }
        
        switch(mode) {
            case 'air_express':
                total = this.calculateAirShipping(cart, 'express');
                break;
            case 'air_normal':
                total = this.calculateAirShipping(cart, 'normal');
                break;
            case 'boat':
                total = this.calculateBoatShipping(cart);
                break;
        }
        
        return total;
    }

    calculateAirShipping(cart, type) {
        let total = 0;
        const rate = this.rates.air[type];
        
        // Conversion FCFA -> $
        const baseUSD = rate.base / 600; // Taux approximatif
        
        total += baseUSD;
        
        cart.forEach(item => {
            if (item.category === 'phones') {
                total += rate.phones * item.quantity;
            } else if (item.category === 'laptops') {
                total += rate.laptops * item.quantity;
            } else {
                // Par défaut: estimation poids
                const weight = this.estimateWeight(item);
                total += (weight * rate.per_kg * item.quantity);
            }
        });
        
        return Math.ceil(total);
    }

    calculateBoatShipping(cart) {
        let total = 0;
        
        // Calculer volume total
        let totalVolume = 0; // en m3
        let totalWeight = 0; // en tonnes
        
        cart.forEach(item => {
            const volume = this.estimateVolume(item);
            const weight = this.estimateWeight(item);
            
            totalVolume += volume * item.quantity;
            totalWeight += weight * item.quantity;
        });
        
        // Convertir en tonnes
        totalWeight = totalWeight / 1000;
        
        // Prendre le plus grand
        if (totalVolume > totalWeight) {
            total = Math.ceil(totalVolume * this.rates.boat.per_cbm);
        } else {
            total = Math.ceil(totalWeight * this.rates.boat.per_ton);
        }
        
        return total;
    }

    estimateWeight(product) {
        const weights = {
            phones: 0.2, // kg
            laptops: 1.5,
            clothing: 0.5,
            pharmacy: 0.1,
            cosmetics: 0.3,
            appliances: 10,
            auto: 5
        };
        
        return weights[product.category] || 1;
    }

    estimateVolume(product) {
        const volumes = {
            phones: 0.0001, // m3
            laptops: 0.001,
            clothing: 0.002,
            pharmacy: 0.0005,
            cosmetics: 0.0003,
            appliances: 0.5,
            auto: 0.3
        };
        
        return volumes[product.category] || 0.01;
    }

    getShippingOptions(cart) {
        const options = [];
        
        // Vérifier si batterie
        const hasBattery = cart.some(item => 
            item.category === 'electronics' || 
            item.category === 'appliances'
        );
        
        if (!hasBattery) {
            options.push({
                id: 'air_express',
                name: '✈️ Aérien Express',
                description: 'Livraison en 15 jours',
                cost: this.calculateShipping(cart, 'air_express'),
                icon: 'fa-plane'
            });
            
            options.push({
                id: 'air_normal',
                name: '✈️ Aérien Normal',
                description: 'Livraison en 21 jours',
                cost: this.calculateShipping(cart, 'air_normal'),
                icon: 'fa-plane-departure'
            });
        }
        
        options.push({
            id: 'boat',
            name: '⛵ Maritime',
            description: 'Livraison en 30-45 jours',
            cost: this.calculateShipping(cart, 'boat'),
            icon: 'fa-ship'
        });
        
        return options;
    }

    calculateDeliveryDays(mode) {
        const days = {
            'air_express': 15,
            'air_normal': 21,
            'boat': 35
        };
        
        return days[mode] || 0;
    }
}
