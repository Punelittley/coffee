async function login() {
    const um = await getUserManager();
    const user = um.readCurrentUser();
    if (!user) {
        window.location.href = "/log/authorization/";
    } else {
        if (user.role === 'admin') window.location.href = "/admin/admin.html";
        else if (user.role === 'seller') window.location.href = "/seller/seller.html";
        else window.location.href = "/profile/";
    }
}
