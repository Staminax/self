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
            element.innerHTML = translations[lang][key];
        }
    });

    const skillsList = document.querySelector('.skills-list');
    if (skillsList && translations[lang].skills) {
        skillsList.innerHTML = '';
        translations[lang].skills.forEach(skillText => {
            const span = document.createElement('span');
            span.className = 'skill-tag';
            const textSpan = document.createElement('span');
            textSpan.textContent = skillText;
            textSpan.style.position = 'relative';
            textSpan.style.zIndex = '3';
            span.appendChild(textSpan);
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
