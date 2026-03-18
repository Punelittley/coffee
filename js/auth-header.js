
document.addEventListener('DOMContentLoaded', async function () {
    const um = await getUserManager();
    const user = um.readCurrentUser();

    document.querySelectorAll('.auth-icon-wrap').forEach(wrap => {
        const loginBtn = wrap.querySelector('.auth-login-btn');
        const profileBtn = wrap.querySelector('.auth-profile-btn');

        if (user) {
            if (loginBtn) loginBtn.style.display = 'none';
            if (profileBtn) profileBtn.style.display = 'inline-block';
        } else {
            if (loginBtn) loginBtn.style.display = 'inline-block';
            if (profileBtn) profileBtn.style.display = 'none';
        }
    });
});
