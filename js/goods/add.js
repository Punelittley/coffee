
class ProductOptionsManager {
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
        let sum = 0;
        const basePrice = 150;

        sum += basePrice;

        const coconutMilk = document.querySelector('input[type="checkbox"][id="drink_crit_1"]:checked');
        if (coconutMilk) {
            sum += 80;
        }

        const cinnamon = document.querySelector('input[type="checkbox"][id="drink_crit_2"]:checked');
        if (cinnamon) {
            sum += 50;
        }

        const volumeS = document.getElementById("drink_crit_3_s");
        const volumeM = document.getElementById("drink_crit_3_m");
        const volumeL = document.getElementById("drink_crit_3_l");
        const volumeXL = document.getElementById("drink_crit_3_xl");

        if (volumeS && volumeS.checked) sum += 0;
        if (volumeM && volumeM.checked) sum += 50;
        if (volumeL && volumeL.checked) sum += 100;
        if (volumeXL && volumeXL.checked) sum += 150;

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
            product_type: 'drink',
            strength: 2,
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
                throw new Error(data.error || 'Ошибка добавления в корзину');
            }

            const modal = document.getElementById("myModal");
            const span = document.getElementsByClassName("close")[0];

            if (span) {
                span.onclick = function () {
                    modal.style.display = "none";
                }
            }

            if (modal) {
                window.onclick = function (event) {
                    if (event.target == modal) {
                        modal.style.display = "none";
                    }
                }
            }

            const errorElem = document.getElementById("loginError");
            if (errorElem) errorElem.innerText = "Товар добавлен в корзину!";
            if (modal) modal.style.display = "block";
        } catch (err) {
            alert(err.message || 'Ошибка добавления в корзину');
        }

        return false;
    }
}

class CartManager {
    constructor() {
        this.productsContainer = document.querySelector('.drinks > div') || document.querySelector('.container_drinks');
        this.foodContainer = document.querySelector('.food > div') || document.querySelector('.container_food');

        if (this.productsContainer) {
            this.initCart();
        }
    }

    async initCart() {
        await this.displayCartItems();
        this.updateTotal();
    }

    async getCart() {
        try {
            const res = await fetch('/api/cart');
            if (!res.ok) return [];
            return await res.json();
        } catch(e) {
            return [];
        }
    }

    async saveCart(item) {
        const data = {
            product_id: item.product_id || item.id,
            product_name: item.product_name || item.name,
            product_image: item.product_image || item.image,
            product_link: item.product_link || item.link,
            product_type: item.product_type || item.type || 'drink',
            strength: item.strength || 0,
            price: item.price || 0,
            quantity: item.quantity || 1,
            options: item.options || {}
        };

        try {
            const res = await fetch('/api/cart', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            return await res.json();
        } catch(e) {
            console.error('Ошибка сохранения в корзину:', e);
        }
    }

    async displayCartItems() {
        const cart = await this.getCart();

        if (this.productsContainer) this.productsContainer.innerHTML = '';
        if (this.foodContainer) this.foodContainer.innerHTML = '';

        if (cart.length === 0) {
            if (this.productsContainer) {
                this.productsContainer.innerHTML = '<p class="empty-cart" style="font-family:Arsenal SC;font-size:20px;padding:20px;">Ваша корзина пуста</p>';
            }
            return cart;
        }

        cart.forEach(item => {
            const card = this.createCartItemCard(item);
            if (item.product_type === 'drink' && this.productsContainer) {
                this.productsContainer.appendChild(card);
            } else if (this.foodContainer) {
                this.foodContainer.appendChild(card);
            } else if (this.productsContainer) {
                this.productsContainer.appendChild(card);
            }
        });

        return cart;
    }

    createCartItemCard(item) {
        const card = document.createElement('div');
        card.className = 'card';

        const imgBlock = document.createElement('div');
        imgBlock.className = 'img_block';

        const img = document.createElement('img');
        img.className = 'img';
        img.src = item.product_image;
        img.alt = item.product_name;

        imgBlock.appendChild(img);
        card.appendChild(imgBlock);

        const fillBlock = document.createElement('div');
        fillBlock.className = 'fill';

        const nameBlock = document.createElement('div');
        nameBlock.className = 'name';

        const name = document.createElement('h3');
        name.textContent = item.product_name;
        nameBlock.appendChild(name);

        if (item.product_type === 'drink' && item.strength) {
            const strengthBlock = document.createElement('div');
            for (let i = 0; i < item.strength; i++) {
                const strengthIcon = document.createElement('img');
                strengthIcon.src = '/assets/images/zerno.svg';
                strengthIcon.alt = 'Степень крепости';
                strengthBlock.appendChild(strengthIcon);
            }
            nameBlock.appendChild(strengthBlock);
        }

        fillBlock.appendChild(nameBlock);

        const optionsBlock = document.createElement('div');
        optionsBlock.className = 'options';

        if (item.options && typeof item.options === 'object') {
            for (const [category, value] of Object.entries(item.options)) {
                const option = document.createElement('p');
                option.innerHTML = `<strong>${category}:</strong> ${value}`;
                optionsBlock.appendChild(option);
            }
        }

        fillBlock.appendChild(optionsBlock);

        const priceP = document.createElement('p');
        priceP.innerHTML = `<b>${item.price} ₽</b>`;
        priceP.style.fontFamily = '"Arsenal SC", sans-serif';
        priceP.style.fontSize = '20px';
        fillBlock.appendChild(priceP);

        const removeBtn = document.createElement('button');
        removeBtn.textContent = 'Удалить';
        removeBtn.style.cssText = 'background:#c0392b;color:white;border:none;padding:8px 16px;font-family:"Arsenal SC";font-size:16px;cursor:pointer;margin-top:8px;';
        removeBtn.onclick = async () => {
            await fetch('/api/cart/' + item.id, { method: 'DELETE' });
            await this.displayCartItems();
            this.updateTotal();
        };
        fillBlock.appendChild(removeBtn);

        card.appendChild(fillBlock);

        return card;
    }

    async updateTotal() {
        const cart = await this.getCart();
        let total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        const firstRow = document.querySelector('.rows .row:first-child h4');
        const lastRow = document.querySelector('.rows .row:last-child h4');
        if (firstRow) firstRow.innerHTML = `Всего: <span>${total} ₽</span>`;
        if (lastRow) lastRow.innerHTML = `К оплате: <span>${total} ₽</span>`;
    }
}

if (document.querySelector('.additional')) {
    document.addEventListener('DOMContentLoaded', () => {
        const optionsManager = new ProductOptionsManager();
        optionsManager.initCheckboxes();
    });
}

if (document.querySelector('.container_drinks') || document.querySelector('.drinks')) {
    document.addEventListener('DOMContentLoaded', () => {
        const cartManager = new CartManager();
    });
}
