document.addEventListener('DOMContentLoaded', () => {
    const card = document.querySelector('#cardContainer');
    const cursorDot = document.getElementById('cursor-dot');
    const trailCanvas = document.getElementById('cursor-trail');

    if (!card) return;

    const shimmer = document.createElement('div');
    shimmer.style.position = 'absolute';
    shimmer.style.inset = '0';
    shimmer.style.borderRadius = 'inherit';
    shimmer.style.pointerEvents = 'none';
    shimmer.style.opacity = '0';
    shimmer.style.transition = 'opacity 0.3s ease';
    shimmer.style.zIndex = '100';
    shimmer.style.mixBlendMode = 'color-dodge';
    card.appendChild(shimmer);

    let cachedRect = null;
    let rafId = null;
    let pendingX = 0;
    let pendingY = 0;

    function applyTilt() {
        rafId = null;
        if (!cachedRect) return;

        const x = pendingX - cachedRect.left;
        const y = pendingY - cachedRect.top;
        const centerX = cachedRect.width / 2;
        const centerY = cachedRect.height / 2;
        const rotateX = (y - centerY) / 5;
        const rotateY = (centerX - x) / 5;
        const position = 50 + (rotateX * 4);

        shimmer.style.background = `linear-gradient(180deg, transparent ${position - 30}%, rgba(255, 255, 255, 0.2) ${position}%, transparent ${position + 30}%)`;
        card.style.transform = `scale(1.05) perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(30px)`;
    }

    card.addEventListener('mouseenter', () => {
        cachedRect = card.getBoundingClientRect();
        if (cursorDot) cursorDot.style.opacity = '0';
        if (trailCanvas) trailCanvas.style.opacity = '0';
        shimmer.style.opacity = '1';
    });

    card.addEventListener('mouseleave', () => {
        if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
        cachedRect = null;
        if (cursorDot) cursorDot.style.opacity = '1';
        if (trailCanvas) trailCanvas.style.opacity = '1';
        card.style.transform = 'scale(1) perspective(1000px) rotateX(0) rotateY(0) translateZ(0)';
        shimmer.style.opacity = '0';
    });

    card.addEventListener('mousemove', (e) => {
        pendingX = e.clientX;
        pendingY = e.clientY;
        if (!rafId) rafId = requestAnimationFrame(applyTilt);
    });

    card.addEventListener('touchstart', () => {
        cachedRect = card.getBoundingClientRect();
        shimmer.style.opacity = '1';
    });

    card.addEventListener('touchmove', (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        pendingX = touch.clientX;
        pendingY = touch.clientY;
        if (!rafId) rafId = requestAnimationFrame(applyTilt);
    }, { passive: false });

    card.addEventListener('touchend', () => {
        if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
        cachedRect = null;
        card.style.transform = 'scale(1) perspective(1000px) rotateX(0) rotateY(0) translateZ(0)';
        shimmer.style.opacity = '0';
    });
});
