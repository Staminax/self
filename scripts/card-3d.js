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

    function calculateTilt(x, y, rect) {
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = (y - centerY) / 5;
        const rotateY = (centerX - x) / 5;

        const position = 50 + (rotateX * 4);

        return { rotateX, rotateY, position };
    }

    card.addEventListener('mouseenter', () => {
        if (cursorDot) cursorDot.style.opacity = '0';
        if (trailCanvas) trailCanvas.style.opacity = '0';
        shimmer.style.opacity = '1';
    });

    card.addEventListener('mouseleave', () => {
        if (cursorDot) cursorDot.style.opacity = '1';
        if (trailCanvas) trailCanvas.style.opacity = '1';
        card.style.transform = 'scale(1) perspective(1000px) rotateX(0) rotateY(0) translateZ(0)';
        shimmer.style.opacity = '0';
    });

    card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const { rotateX, rotateY, position } = calculateTilt(x, y, rect);

        shimmer.style.background = `linear-gradient(180deg, transparent ${position - 30}%, rgba(255, 255, 255, 0.2) ${position}%, transparent ${position + 30}%)`;
        card.style.transform = `scale(1.05) perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(30px)`;
    });

    card.addEventListener('touchstart', (e) => {
        shimmer.style.opacity = '1';
    });

    card.addEventListener('touchmove', (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        const rect = card.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;

        const { rotateX, rotateY, position } = calculateTilt(x, y, rect);

        shimmer.style.background = `linear-gradient(180deg, transparent ${position - 30}%, rgba(255, 255, 255, 0.2) ${position}%, transparent ${position + 30}%)`;
        card.style.transform = `scale(1.05) perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(30px)`;
    });

    card.addEventListener('touchend', () => {
        card.style.transform = 'scale(1) perspective(1000px) rotateX(0) rotateY(0) translateZ(0)';
        shimmer.style.opacity = '0';
    });
});
