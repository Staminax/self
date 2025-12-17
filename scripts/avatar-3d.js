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
        avatar.style.transform = 'scale(1) perspective(1000px) rotateX(0) rotateY(0) translateZ(0)';
    });

    avatar.addEventListener('mousemove', (e) => {
        const rect = avatar.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = (y - centerY) / 5;
        const rotateY = (centerX - x) / 5;

        avatar.style.transform = `scale(1.1) perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(30px)`;
    });
});
