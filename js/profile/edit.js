const modal = document.getElementById("myModal");
const modalContent = document.querySelector(".modal_content");
const closeBtn = document.querySelector(".close");

function showAlert(message, type = 'info') {
    const alertModal = document.createElement('div');
    alertModal.className = 'modal';
    alertModal.id = 'alertModal';
    alertModal.innerHTML = `
        <div class="modal_content flex">
            <p>${message}</p>
            <span class="close">&times;</span>
        </div>
    `;
    document.body.appendChild(alertModal);
    alertModal.style.display = "block";

    const closeAlert = () => { alertModal.remove(); };
    alertModal.querySelector('.close').onclick = closeAlert;
    window.onclick = function (event) {
        if (event.target === alertModal) closeAlert();
    };
    if (type !== 'error') setTimeout(closeAlert, 3000);
}

function showModal(title, content) {
    modalContent.innerHTML = `
        <span class="close flex_">&times;</span>
        <h2>${title}</h2>
        ${content}
        <button id="confirmBtn">Подтвердить</button>
    `;
    modal.style.display = "block";
    modalContent.querySelector('.close').onclick = closeModal;
}

function closeModal() {
    modal.style.display = "none";
}

if (closeBtn) closeBtn.onclick = closeModal;
window.addEventListener("click", function (event) {
    if (event.target === modal) closeModal();
});

async function editProfile() {
    try {
        const um = await getUserManager();
        const user = um.readCurrentUser();
        if (!user) { showAlert("Пользователь не найден", "error"); return; }

        const editForm = `
        <form id="editForm">
            <input type="text" value="${user.surname || ''}" id="editSurname" placeholder="Фамилия" minlength="2">
            <input type="text" value="${user.name || ''}" id="editName" placeholder="Имя" minlength="2">
            <input type="text" value="${user.patronymic || ''}" id="editPathronymic" placeholder="Отчество">
            <input type="tel" value="${user.phone || ''}" id="editPhone" placeholder="Телефон">
            <input type="email" value="${user.email || ''}" id="editEmail" placeholder="Email">
            <input type="date" value="${user.birth || ''}" id="editBirth">
            <input type="text" value="${user.city || ''}" id="editCity" placeholder="Город">
            <input type="password" id="editPassword" placeholder="Новый пароль (мин. 6 симв.)">
            <input type="password" id="editPassword_confirm" placeholder="Подтвердите пароль">
        </form>
        `;
        showModal("Редактирование профиля", editForm);

        document.getElementById("confirmBtn").addEventListener("click", async function () {
            const newPassword = document.getElementById("editPassword").value;
            const newPasswordConfirm = document.getElementById("editPassword_confirm").value;

            if (newPassword && newPassword.length < 6) {
                showAlert("Пароль должен быть минимум 6 символов", "error");
                return;
            }
            if (newPassword && newPassword !== newPasswordConfirm) {
                showAlert("Пароли не совпадают", "error");
                return;
            }

            const data = {
                surname: document.getElementById("editSurname").value,
                name: document.getElementById("editName").value,
                patronymic: document.getElementById("editPathronymic").value,
                phone: document.getElementById("editPhone").value,
                email: document.getElementById("editEmail").value,
                birth: document.getElementById("editBirth").value,
                city: document.getElementById("editCity").value,
            };
            if (newPassword) data.password = newPassword;

            try {
                const um = await getUserManager();
                await um.updateProfile(data);

                ['surname','name','pathronymic','phone','email','birth','city'].forEach(field => {
                    const el = document.getElementById(field);
                    if (el) el.value = data[field === 'pathronymic' ? 'patronymic' : field] || '';
                });

                showAlert("Данные успешно обновлены!", "success");
                closeModal();
            } catch (error) {
                showAlert(error.message, "error");
            }
        });

    } catch (error) {
        showAlert(error.message, "error");
    }
}

document.addEventListener('DOMContentLoaded', function () {
    const editButton = document.querySelector('[onclick="edit()"]');
    if (editButton) {
        editButton.type = "button";
        editButton.onclick = function (e) {
            e.preventDefault();
            editProfile();
        };
    }
});
