document.addEventListener('DOMContentLoaded', () => {
    const avatar = document.querySelector('.profile-avatar');
    const cursorDot = document.getElementById('cursor-dot');
    const trailCanvas = document.getElementById('cursor-trail');

    if (!avatar) return;

    avatar.addEventListener('mouseenter', () => {
        if (cursorDot) cursorDot.style.opacity = '0';
        if (trailCanvas) trailCanvas.style.opacity = '0';
    });

    avatar.addEventListener('mouseleave', () => {
        if (cursorDot) cursorDot.style.opacity = '1';
        if (trailCanvas) trailCanvas.style.opacity = '1';
    });
});
