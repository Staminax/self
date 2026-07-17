document.addEventListener('DOMContentLoaded', () => {
    const trailCanvas = document.getElementById('cursor-trail');
    const cursorDot = document.getElementById('cursor-dot');
    const uiSelector = 'a, button, .social-btn, .lang-btn, .scroll-btn, .social-links, .language-switcher, .timeline-marker-link';

    if (window.matchMedia('(max-width: 768px)').matches || 'ontouchstart' in window) {
        if (cursorDot) cursorDot.style.display = 'none';
        if (trailCanvas) trailCanvas.style.display = 'none';
        return;
    }

    if (trailCanvas) trailCanvas.style.display = 'none';

    let mouseX = -100;
    let mouseY = -100;

    document.addEventListener('mousemove', (e) => {
        if (cursorDot && cursorDot.style.opacity !== '1') {
            cursorDot.style.opacity = '1';
        }
        mouseX = e.clientX;
        mouseY = e.clientY;
    });

    document.addEventListener('mouseover', (e) => {
        if (e.target.closest('.cats-trigger')) {
            if (cursorDot) cursorDot.classList.add('hovered');
            return;
        }
        if (e.target.closest(uiSelector)) {
            if (cursorDot) cursorDot.classList.add('hovered');
        }
    });

    document.addEventListener('mouseout', (e) => {
        if (e.target.closest('.cats-trigger')) {
            if (cursorDot) cursorDot.classList.remove('hovered');
            return;
        }
        if (e.target.closest(uiSelector)) {
            if (!e.relatedTarget || !e.relatedTarget.closest(uiSelector)) {
                if (cursorDot) cursorDot.classList.remove('hovered');
            }
        }
    });

    const animateCursor = () => {
        if (cursorDot) {
            cursorDot.style.left = `${mouseX}px`;
            cursorDot.style.top = `${mouseY}px`;
        }
        requestAnimationFrame(animateCursor);
    };
    animateCursor();
});
