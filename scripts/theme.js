const themeToggle = document.getElementById('theme-toggle');
const themeIcon = themeToggle.querySelector('.theme-icon');
const html = document.documentElement;

const savedTheme = localStorage.getItem('theme') || 'dark';
html.setAttribute('data-theme', savedTheme);
updateThemeIcon(savedTheme);

function updateThemeIcon(theme) {
    if (theme === 'light') {
        themeIcon.src = 'assets/images/moon.svg';
        themeIcon.alt = 'Switch to dark mode';
    } else {
        themeIcon.src = 'assets/images/sun.svg';
        themeIcon.alt = 'Switch to light mode';
    }
}

themeToggle.addEventListener('click', () => {
    const currentTheme = html.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

    themeToggle.classList.add('animating');

    html.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);

    setTimeout(() => {
        themeToggle.classList.remove('animating');
    }, 600);
});
