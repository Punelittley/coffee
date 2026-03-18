async function cart() {
    const um = await getUserManager();
    const user = um.readCurrentUser();
    if (!user) {
        window.location.href = "/log/authorization/";
    } else {
        window.location.href = "/bag/";
    }
}
