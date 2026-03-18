document.addEventListener('DOMContentLoaded', async function() {
    const um = await getUserManager();
    const user = um.readCurrentUser();

    if (!user) {
        window.location.href = '/log/authorization/';
        return;
    }

    document.getElementById("surname").value = user.surname || "";
    document.getElementById("name").value = user.name || "";
    document.getElementById("pathronymic").value = user.patronymic || "";
    document.getElementById("phone").value = user.phone || "";
    document.getElementById("email").value = user.email || "";
    document.getElementById("birth").value = user.birth || "";
    document.getElementById("city").value = user.city || "";

    const nameEl = document.querySelector('.card .container h4');
    if (nameEl) nameEl.textContent = `${user.surname || ''} ${user.name || ''}`;
    const bonusEl = document.querySelector('.bonus h4');
    if (bonusEl) bonusEl.textContent = user.loyalty_points || 0;
    const levelEl = document.querySelector('.level h2');
    if (levelEl) levelEl.textContent = `${user.loyalty_level || 1} УРОВЕНЬ`;
    const discountEl = document.querySelector('.level h3');
    if (discountEl) discountEl.textContent = `Уровень вашей карты даёт вам доступ к клиентской скидке ${user.discount || 0}%`;

    try {
        const res = await fetch('/api/orders');
        if (res.ok) {
            const orders = await res.json();
            const readyOrders = orders.filter(o => o.status === 'ready' || o.status === 'delivered');
            if (readyOrders.length > 0) {
                let ordersSection = document.querySelector('.orders_story');
                if (!ordersSection) {
                    ordersSection = document.createElement('div');
                    ordersSection.className = 'orders_story';
                    ordersSection.style.cssText = 'padding:0 7vw 6vw;';
                    document.querySelector('main').appendChild(ordersSection);
                }
                ordersSection.innerHTML = '<h2 style="align-self:center;margin-bottom:30px;">Мои заказы</h2>';
                readyOrders.forEach(order => {
                    const div = document.createElement('div');
                    div.style.cssText = 'border:1px solid #6F4E37;padding:15px;margin-bottom:10px;background:#fff8f0;';
                    const statusText = order.status === 'ready' ? 'Готов к выдаче' : 'Выдан';
                    div.innerHTML = `
                        <h3 style="font-family:'Arsenal SC';">Заказ №${order.id} — ${statusText}</h3>
                        <p style="font-family:'Arsenal SC';font-size:18px;">Сумма: ${order.total} ₽</p>
                        <p style="font-family:'Arsenal SC';font-size:14px;">Дата: ${new Date(order.created_at).toLocaleString('ru')}</p>
                    `;
                    ordersSection.appendChild(div);
                });
            }
        }
    } catch(e) {}
});
