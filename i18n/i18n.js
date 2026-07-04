function typewriterTitles(scope) {
    const selector = scope
        ? scope + ' h2[data-i18n]'
        : '.about-card h2[data-i18n], .stacks-card h2[data-i18n], .experience-card h2[data-i18n]';

    document.querySelectorAll(selector).forEach(el => {
        if (el._twInterval) {
            clearInterval(el._twInterval);
            el._twInterval = null;
        }

        const text = el.textContent;
        if (!text || text.length === 0) return;

        el.textContent = '';
        const caret = document.createElement('span');
        caret.className = 'typewriter-caret';
        caret.textContent = '|';
        el.appendChild(caret);

        let i = 0;
        el._twInterval = setInterval(() => {
            if (i < text.length) {
                caret.before(text[i]);
                i++;
            } else {
                clearInterval(el._twInterval);
                el._twInterval = null;
            }
        }, 50);
    });
}

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

    // Update experience timeline
    if (typeof updateExperienceTimeline === 'function') {
        updateExperienceTimeline();
    }

    if (document.readyState === 'complete' && typeof typewriterTitles === 'function') {
        typewriterTitles();
    }
}

document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const lang = btn.dataset.lang;
        changeLanguage(lang);
    });
});

changeLanguage('en');
