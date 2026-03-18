const registForm = document.getElementById("registForm");
if (registForm) {
    registForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const surname = document.getElementById("surname").value.trim();
        const name = document.getElementById("name").value.trim();
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;
        const confirmPassword = document.getElementById("password_confirm").value;
        const checkbox = document.getElementById("checkbox");
        const errorElem = document.getElementById("loginError");
        const modal = document.getElementById("myModal");

        if (password !== confirmPassword) {
            errorElem.innerText = "Пароли не совпадают!";
            modal.style.display = "block";
            setupModal();
            return;
        }
        if (!checkbox.checked) {
            errorElem.innerText = "Примите соглашение!";
            modal.style.display = "block";
            setupModal();
            return;
        }

        try {
            const um = await getUserManager();
            await um.register(surname, name, email, password);
            errorElem.innerText = "Вы успешно зарегистрировались!";
            modal.style.display = "block";
            setupModal();
            setTimeout(() => { window.location.href = "/profile/"; }, 1500);
        } catch (err) {
            errorElem.innerText = err.message || "Ошибка регистрации";
            modal.style.display = "block";
            setupModal();
        }
    });
}

function setupModal() {
    const modal = document.getElementById("myModal");
    const span = document.getElementsByClassName("close")[0];
    if (span) span.onclick = () => modal.style.display = "none";
    window.onclick = (event) => { if (event.target == modal) modal.style.display = "none"; };
}
