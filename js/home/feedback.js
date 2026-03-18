function feedback() {
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
    errorElem.innerText = "Ваш попрос отправлен!";
    document.getElementById("myModal").style.display = "block";
    return false; 
}