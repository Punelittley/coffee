async function paying(event) {
    event.preventDefault();
    const paymentMethods = document.querySelectorAll('.form input[type="checkbox"]');
    let selectedMethod = null;

    paymentMethods.forEach(method => {
        if (method.checked) {
            selectedMethod = method.nextElementSibling.textContent.trim();
        }
    });

    if (!selectedMethod) {
        showPayError("Пожалуйста, выберите способ оплаты");
        return false;
    }

    if (selectedMethod.toLowerCase() !== 'наличные') {
        showPayError("Пожалуйста, выберите оплату наличными. Другие способы оплаты пока недоступны.");
        return false;
    }

    try {
        const res = await fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ payment_method: 'cash' })
        });
        const data = await res.json();

        if (!res.ok) {
            showPayError(data.error);
            return false;
        }

        const successModal = document.createElement('div');
        successModal.id = "successModal";
        successModal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);display:flex;justify-content:center;align-items:center;z-index:1000;';
        const content = document.createElement('div');
        content.style.cssText = 'background:#EDE4CC;padding:30px;border:2px solid #6F4E37;text-align:center;max-width:400px;';
        content.innerHTML = `
            <h3 style="font-family:'Arsenal SC';color:#6F4E37;">Заказ оформлен!</h3>
            <p style="font-family:'Arsenal SC';font-size:18px;">Заказ №${data.orderId}</p>
            <p style="font-family:'Arsenal SC';font-size:18px;">Сумма: ${data.total} ₽</p>
            <p style="font-family:'Arsenal SC';font-size:16px;">Оплата: наличными</p>
            <p style="font-family:'Arsenal SC';font-size:14px;margin-top:10px;">Спасибо за заказ!</p>
            <button onclick="document.getElementById('successModal').remove();window.location.href='/profile/';" style="margin-top:15px;padding:10px 20px;background:#6F4E37;color:white;border:none;font-family:'Arsenal SC';font-size:16px;cursor:pointer;">ОК</button>
        `;
        successModal.appendChild(content);
        document.body.appendChild(successModal);

        const dc = document.querySelector('.container_drinks');
        const fc = document.querySelector('.container_food');
        if (dc) dc.innerHTML = '';
        if (fc) fc.innerHTML = '';

    } catch (err) {
        showPayError('Ошибка при оформлении заказа');
    }
    return false;
}

function showPayError(msg) {
    const errorElem = document.getElementById("loginError");
    if (errorElem) errorElem.innerText = msg;
    const modal = document.getElementById("myModal");
    if (modal) modal.style.display = "block";
    const span = document.getElementsByClassName("close")[0];
    if (span) span.onclick = () => modal.style.display = "none";
    window.onclick = (event) => { if (event.target == modal) modal.style.display = "none"; };
}

document.addEventListener('DOMContentLoaded', function() {
    const paymentForm = document.querySelector('aside form');
    if (paymentForm) paymentForm.addEventListener('submit', paying);
});
