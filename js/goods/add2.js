
class ProductOptionsManager2 {
    constructor() {
        this.storageKey = 'productOptions';
        this.currentProductId = this.getProductIdFromUrl();
    }

    getProductIdFromUrl() {
        const path = window.location.pathname;
        const parts = path.split('/');
        return parts[parts.length - 2];
    }

    saveOptions(options) {
        const allOptions = this.getAllOptions();
        allOptions[this.currentProductId] = options;
        localStorage.setItem(this.storageKey, JSON.stringify(allOptions));
    }

    getOptions() {
        const allOptions = this.getAllOptions();
        return allOptions[this.currentProductId] || null;
    }

    getAllOptions() {
        const data = localStorage.getItem(this.storageKey);
        return data ? JSON.parse(data) : {};
    }

    getSummary() {
        let sum = 120;

        const veget = document.getElementById("food_crit_2_veget");
        const vegan = document.getElementById("drink_crit_2_vegan");
        
        if (veget && veget.checked) sum += 90;
        if (vegan && vegan.checked) sum += 50;

        const massa200 = document.getElementById("food_crit_200");
        const massa300 = document.getElementById("food_crit_300");
        const massa400 = document.getElementById("food_crit_400");

        if (massa200 && massa200.checked) sum += 50;
        else if (massa300 && massa300.checked) sum += 80;
        else if (massa400 && massa400.checked) sum += 100;

        return sum;
    }

    initCheckboxes() {
        const form = document.querySelector('form');
        if (!form) return;

        this.setupCheckboxGroups();
        this.restoreOptions();
        this.updateButtonPrice();

        form.addEventListener('submit', (e) => this.handleFormSubmit(e));
    }

    setupCheckboxGroups() {
        document.querySelectorAll('.category .container').forEach(container => {
            const checkboxes = container.querySelectorAll('input[type="checkbox"]');
            checkboxes.forEach(checkbox => {
                checkbox.addEventListener('change', (e) => {
                    if (e.target.checked) {
                        checkboxes.forEach(cb => {
                            if (cb !== e.target) cb.checked = false;
                        });
                    }
                    this.saveCurrentOptions();
                    this.updateButtonPrice();
                });
            });
        });
    }

    updateButtonPrice() {
        const button = document.getElementById('addToCart');
        if (button) {
            const summary = this.getSummary();
            let summaryElement = button.querySelector('.summary');
            if (!summaryElement) {
                summaryElement = document.createElement('span');
                summaryElement.className = 'summary';
                button.appendChild(summaryElement);
            }
            summaryElement.textContent = ` ${summary} ₽`;
        }
    }

    saveCurrentOptions() {
        const options = {};
        document.querySelectorAll('.category').forEach(category => {
            const h5 = category.querySelector('h5');
            if (!h5) return;
            const categoryName = h5.textContent.trim();
            const selectedCheckbox = category.querySelector('input[type="checkbox"]:checked');
            if (selectedCheckbox && selectedCheckbox.nextElementSibling) {
                options[categoryName] = selectedCheckbox.nextElementSibling.textContent.trim();
            }
        });
        this.saveOptions(options);
    }

    restoreOptions() {
        const options = this.getOptions();
        if (!options) return;

        document.querySelectorAll('.category').forEach(category => {
            const h5 = category.querySelector('h5');
            if (!h5) return;
            const categoryName = h5.textContent.trim();
            const optionValue = options[categoryName];

            if (optionValue) {
                const checkboxes = category.querySelectorAll('input[type="checkbox"]');
                checkboxes.forEach(checkbox => {
                    if (checkbox.nextElementSibling && checkbox.nextElementSibling.textContent.trim() === optionValue) {
                        checkbox.checked = true;
                    }
                });
            }
        });
    }

    async handleFormSubmit(event) {
        event.preventDefault();

        const um = await getUserManager();
        const user = um.readCurrentUser();
        if (!user) {
            alert('Пожалуйста, войдите в систему, чтобы добавлять товары в корзину');
            window.location.href = '/log/authorization/';
            return;
        }

        this.saveCurrentOptions();

        const productData = {
            product_id: this.currentProductId,
            product_name: document.querySelector('.about_product h2').textContent,
            product_image: document.querySelector('.img_block .img').src,
            product_link: window.location.href,
            product_type: 'food',
            price: this.getSummary(),
            quantity: 1,
            options: this.getOptions() || {}
        };

        try {
            const res = await fetch('/api/cart', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(productData)
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Ошибка добавления');
            }

            alert('Товар добавлен в корзину!');
        } catch (err) {
            alert(err.message || 'Ошибка добавления в корзину');
        }
    }
}

if (document.querySelector('.additional') && typeof ProductOptionsManager === 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        const optionsManager = new ProductOptionsManager2();
        optionsManager.initCheckboxes();
    });
}
