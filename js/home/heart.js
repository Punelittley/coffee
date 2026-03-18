document.addEventListener('DOMContentLoaded', async function() {
    const um = await getUserManager();
    const user = um.readCurrentUser();

    Array.from(document.getElementsByClassName("heart_")).forEach(card => card.classList.add("unactive"));

    if (user) {
        const favs = await um.getFavorites();
        favs.forEach(cardId => {
            const card = document.getElementById(`card_${cardId}`);
            const cardActive = document.getElementById(`card_${cardId}_active`);
            if (card && cardActive) {
                card.classList.add("unactive");
                cardActive.classList.remove("unactive");
            }
        });
    }
});

async function heart(cardId) {
    const um = await getUserManager();
    const user = um.readCurrentUser();
    if (!user) {
        alert('Пожалуйста, войдите в систему, чтобы добавлять в избранное');
        return;
    }

    const card = document.getElementById(`card_${cardId}`);
    const cardActive = document.getElementById(`card_${cardId}_active`);

    if (!card.classList.contains("unactive")) {
        card.classList.add("unactive");
        cardActive.classList.remove("unactive");
        await um.addFavorite(cardId);
    } else {
        card.classList.remove("unactive");
        cardActive.classList.add("unactive");
        await um.removeFavorite(cardId);
    }
}
