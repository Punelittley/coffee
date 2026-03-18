const authForm = document.getElementById("authForm");
if (authForm) {
    authForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;
        const errorElem = document.getElementById("loginError");
        const modal = document.getElementById("myModal");

        try {
            const um = await getUserManager();
            await um.login(email, password);
            errorElem.innerText = "Вы успешно авторизовались!";
            modal.style.display = "block";
            setupModal();
            setTimeout(() => {
                const user = um.readCurrentUser();
                if (user && user.role === 'admin') window.location.href = "/admin/admin.html";
                else if (user && user.role === 'seller') window.location.href = "/seller/seller.html";
                else window.location.href = "/profile/index.html";
            }, 1500);
        } catch (err) {
            errorElem.innerText = err.message || "Неверный email или пароль!";
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
