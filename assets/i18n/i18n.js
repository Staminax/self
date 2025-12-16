function changeLanguage(lang) {
    if (!translations[lang]) return;

    document.documentElement.lang = lang;

    document.querySelectorAll('.lang-btn').forEach(btn => {
        if (btn.dataset.lang === lang) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.dataset.i18n;
        if (translations[lang][key]) {
            element.textContent = translations[lang][key];
        }
    });

    const skillsList = document.querySelector('.skills-list');
    if (skillsList && translations[lang].skills) {
        skillsList.innerHTML = '';
        translations[lang].skills.forEach(skillText => {
            const span = document.createElement('span');
            span.className = 'skill-tag';
            span.textContent = skillText;
            skillsList.appendChild(span);
        });
    }
}

document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const lang = btn.dataset.lang;
        changeLanguage(lang);
    });
});

changeLanguage('en');
