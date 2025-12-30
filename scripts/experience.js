const experiencesData = [
    {
        company: "BemAgro S.A",
        logo: "assets/images/companies/bemagro.png",
        url: "https://www.bemagro.com/",
        positionKey: "exp1Position",
        period: "Nov 2024 - Present",
        duration: "1 yr 2 mos",
        locationKey: "exp1Location",
        descriptionKey: "exp1Description"
    },
    {
        company: "CompuSoftware",
        logo: "assets/images/companies/cs.png",
        url: "https://www.cscompusoftware.com.br/",
        positionKey: "exp2Position",
        period: "Oct 2022 - Nov 2024",
        duration: "2 yrs 2 mos",
        locationKey: "exp2Location",
        descriptionKey: "exp2Description"
    },
    {
        company: "FMX Soluções em Tecnologia",
        logo: "assets/images/companies/fmx.png",
        url: "https://fmxsolucoes.com.br/",
        positionKey: "exp3Position",
        period: "May 2021 - Jul 2022",
        duration: "1 yr 3 mos",
        locationKey: "exp3Location",
        descriptionKey: "exp3Description"
    },
    {
        company: "FMX Soluções em Tecnologia",
        logo: "assets/images/companies/fmx.png",
        url: "https://fmxsolucoes.com.br/",
        positionKey: "exp4Position",
        period: "Sep 2018 - Apr 2021",
        duration: "2 yrs 8 mos",
        locationKey: "exp4Location",
        descriptionKey: "exp4Description"
    }
];

function getCurrentLanguage() {
    return document.documentElement.lang || 'en';
}

function getTranslation(key) {
    const lang = getCurrentLanguage();
    return translations[lang]?.[key] || translations.en[key] || '';
}

function updateExperienceTimeline() {
    const timeline = document.querySelector('.timeline');
    if (!timeline) return;

    timeline.innerHTML = '';

    const wrapper = document.createElement('div');
    wrapper.className = 'timeline-wrapper';

    experiencesData.forEach((exp, index) => {
        const item = document.createElement('div');
        item.className = 'timeline-item';

        const position = getTranslation(exp.positionKey);
        const location = getTranslation(exp.locationKey);
        const description = getTranslation(exp.descriptionKey);

        item.innerHTML = `
            <div class="timeline-content">
                <div class="company-header">
                    <div class="company-name">${exp.company}</div>
                    <div class="job-title">${position}</div>
                    <div class="job-period">${exp.period} · ${exp.duration}</div>
                    <div class="job-location">${location}</div>
                </div>
                ${description ? `<div class="job-description">${description}</div>` : ''}
            </div>
            <a href="${exp.url}" target="_blank" rel="noopener noreferrer" class="timeline-marker-link">
                <div class="timeline-marker">
                    <img src="${exp.logo}" alt="${exp.company}" class="company-logo" onerror="this.style.display='none'">
                </div>
            </a>
        `;

        wrapper.appendChild(item);
    });

    timeline.appendChild(wrapper);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', updateExperienceTimeline);
} else {
    updateExperienceTimeline();
}
