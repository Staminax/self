document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('cat-modal');
    const modalClose = document.querySelector('.modal-close');
    const prevBtn = document.querySelector('.modal-prev');
    const nextBtn = document.querySelector('.modal-next');

    let currentCardIndex = 0;

    modal.classList.remove('active');

    function displayCard(index) {
        if (!catCardsData || catCardsData.length === 0) return;

        if (index < 0) index = catCardsData.length - 1;
        if (index >= catCardsData.length) index = 0;

        currentCardIndex = index;
        const card = catCardsData[index];

        const typeIcons = ['DARK', 'DIVINE', 'EARTH', 'FIRE', 'LAUGH', 'LIGHT', 'WATER', 'WIND'];
        const randomType = typeIcons[Math.floor(Math.random() * typeIcons.length)];
        const cardImage = document.querySelector('.card-image img');
        if (cardImage) cardImage.src = card.image;

        const currentLang = document.documentElement.lang || 'en';
        const cardTitle = document.getElementById('cardTitle');
        if (cardTitle) cardTitle.textContent = translations[currentLang][card.titleKey];

        const cardType = document.getElementById('cardType');
        if (cardType) cardType.src = `assets/types/${randomType}.webp`;

        const starsContainer = document.querySelector('.card-stars');
        if (starsContainer) {
            starsContainer.innerHTML = '';
            for (let i = 0; i < card.stars; i++) {
                const star = document.createElement('img');
                star.src = 'assets/images/star.png';
                star.alt = 'Star';
                starsContainer.appendChild(star);
            }
        }

        const monsterType = document.getElementById('monsterType');
        if (monsterType) monsterType.textContent = `[ ${translations[currentLang][card.typeKey]} ]`;

        const description = document.getElementById('monsterDescription');
        if (description) {
            description.textContent = translations[currentLang][card.descKey];
        }

        const statValues = document.querySelectorAll('.card-stats .stat-value');
        if (statValues.length >= 2) {
            statValues[0].textContent = card.atk;
            statValues[1].textContent = card.def;
        }

        const currentCount = document.getElementById('current-count');
        const totalCount = document.getElementById('total-count');
        if (currentCount) currentCount.textContent = index + 1;
        if (totalCount) totalCount.textContent = catCardsData.length;
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
            displayCard(0);
            modal.classList.add('active');
        }
    });

    if (prevBtn) {
        prevBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            displayCard(currentCardIndex - 1);
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            displayCard(currentCardIndex + 1);
        });
    }

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
        if (!modal.classList.contains('active')) return;

        if (e.key === 'Escape') {
            modal.classList.remove('active');
        } else if (e.key === 'ArrowLeft') {
            displayCard(currentCardIndex - 1);
        } else if (e.key === 'ArrowRight') {
            displayCard(currentCardIndex + 1);
        }
    });
});
