document.addEventListener('DOMContentLoaded', function() {
    const currentPage = document.getElementById('current-page');
    if (!currentPage) return;
    
    const path = window.location.pathname;
    let pageName = path.split('/').pop().replace('.html', '');
    
    if (pageName === 'index' || pageName === '') {
        document.querySelector('.breadcrumbs').style.display = 'none';
    } else {
        const pageTitles = {
            'espresso': 'Эспрессо',
            'americano': 'Американо',
            'capuccino': 'Капучино',
            'latte': 'Латте',
            'raf': 'Раф',
            'hot_chocolate': 'Горячий шоколад',
            'ice_capuccino': 'Айс капучино',
            'ice_latte': 'Айс латте',
            'profile': 'Личный кабинет'
        };
        
        currentPage.textContent = pageTitles[pageName] || pageName;
    }
    
    if (document.querySelector('body').classList.contains('goods-page')) {
        const menuCrumb = document.createElement('li');
        menuCrumb.innerHTML = '<a href="index.html#section2">Меню</a>';
        currentPage.parentNode.insertBefore(menuCrumb, currentPage);
    }
    
    if (pageName === 'profile') {
        const accountCrumb = document.createElement('li');
        accountCrumb.innerHTML = '<a href="account.html">Аккаунт</a>';
        currentPage.parentNode.insertBefore(accountCrumb, currentPage);
        currentPage.textContent = 'Личный кабинет';
    }
});