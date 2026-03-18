async function logOut() {
    const um = await getUserManager();
    await um.logout();
    window.location.href = "/log/authorization/";
}

document.addEventListener('DOMContentLoaded', function() {
    const logoutButton = document.getElementById('logOut');
    if (logoutButton) {
        logoutButton.addEventListener('click', function(e) {
            e.preventDefault();
            logOut();
        });
    }
});
