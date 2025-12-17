document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('cat-modal');
    const modalClose = document.querySelector('.modal-close');

    modal.classList.remove('active');

    function loadRandomCatCard() {
        if (!catCardsData || catCardsData.length === 0) return;

        const randomCard = catCardsData[Math.floor(Math.random() * catCardsData.length)];

        const typeIcons = ['DARK', 'DIVINE', 'EARTH', 'FIRE', 'LAUGH', 'LIGHT', 'WATER', 'WIND'];
        const randomType = typeIcons[Math.floor(Math.random() * typeIcons.length)];
        const cardImage = document.querySelector('.card-image img');
        if (cardImage) cardImage.src = randomCard.image;

        const currentLang = document.documentElement.lang || 'en';
        const cardTitle = document.getElementById('cardTitle');
        if (cardTitle) cardTitle.textContent = translations[currentLang][randomCard.titleKey];

        const cardType = document.getElementById('cardType');
        if (cardType) cardType.src = `assets/types/${randomType}.webp`;

        const starsContainer = document.querySelector('.card-stars');
        if (starsContainer) {
            starsContainer.innerHTML = '';
            for (let i = 0; i < randomCard.stars; i++) {
                const star = document.createElement('img');
                star.src = 'assets/images/star.png';
                star.alt = 'Star';
                starsContainer.appendChild(star);
            }
        }

        const monsterType = document.getElementById('monsterType');
        if (monsterType) monsterType.textContent = `[${translations[currentLang][randomCard.typeKey]}]`;

        const description = document.getElementById('monsterDescription');
        if (description) description.textContent = translations[currentLang][randomCard.descKey];

        const statValues = document.querySelectorAll('.card-stats .stat-value');
        if (statValues.length >= 2) {
            statValues[0].textContent = randomCard.atk;
            statValues[1].textContent = randomCard.def;
        }
    }

    document.body.addEventListener('click', (e) => {
        let element = e.target;
        let foundTrigger = false;
        let depth = 0;

        while (element && element !== document.body && depth < 10) {
            if (element.classList && element.classList.contains('cats-trigger')) {
                foundTrigger = true;
                break;
            }
            element = element.parentElement;
            depth++;
        }

        if (foundTrigger) {
            e.preventDefault();
            e.stopPropagation();
            loadRandomCatCard();
            modal.classList.add('active');
        }
    });

    if (modalClose) {
        modalClose.addEventListener('click', (e) => {
            e.stopPropagation();
            modal.classList.remove('active');
        });
    }

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            modal.classList.remove('active');
        }
    });
});
