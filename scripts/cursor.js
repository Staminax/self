document.addEventListener('DOMContentLoaded', () => {
    const trailCanvas = document.getElementById('cursor-trail');
    const cursorDot = document.getElementById('cursor-dot');
    const cursorEye = document.getElementById('cursor-eye');
    const uiSelector = 'a, button, .social-btn, .lang-btn, .scroll-btn, .social-links, .language-switcher, .timeline-marker-link';

    if (window.matchMedia('(max-width: 768px)').matches || 'ontouchstart' in window) {
        if (cursorDot) cursorDot.style.display = 'none';
        if (cursorEye) cursorEye.style.display = 'none';
        if (trailCanvas) trailCanvas.style.display = 'none';
        return;
    }

    if (trailCanvas) trailCanvas.style.display = 'none';

    let mouseX = -100;
    let mouseY = -100;
    let isOverUI = false;

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
            isOverUI = true;
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
                isOverUI = false;
                if (cursorDot) cursorDot.classList.remove('hovered');
            }
        }
    });

    const animateCursor = () => {
        if (cursorDot) {
            cursorDot.style.left = `${mouseX}px`;
            cursorDot.style.top = `${mouseY}px`;
        }

        if (cursorEye) {
            cursorEye.style.transform = `translate(${mouseX}px, ${mouseY}px) translate(-50%, -50%) ${cursorEye.classList.contains('active') ? 'scale(1)' : 'scale(0)'}`;
        }

        requestAnimationFrame(animateCursor);
    };
    animateCursor();

    const branchCanvas = document.getElementById('cursor-branches');
    if (branchCanvas) {
        const ctx = branchCanvas.getContext('2d');
        branchCanvas.width = 80;
        branchCanvas.height = 80;

        let lastDrawTime = 0;
        const drawMiniBranches = (timestamp) => {
            if (timestamp - lastDrawTime < 16) {
                requestAnimationFrame(drawMiniBranches);
                return;
            }
            lastDrawTime = timestamp;
            ctx.clearRect(0, 0, 80, 80);
            const pulseValue = Math.sin(timestamp * 0.003) * 0.3 + 0.7;
            ctx.strokeStyle = `rgba(255, 50, 50, ${0.6 * pulseValue})`;
            ctx.lineWidth = 1.6 * (0.8 + pulseValue * 0.4);

            const centerX = 40;
            const centerY = 40;
            const numBranches = 12;

            for (let i = 0; i < numBranches; i++) {
                const angle = (Math.PI * 2 / numBranches) * i + timestamp * 0.0005;
                const length = 16 + Math.sin(timestamp * 0.002 + i) * 5;

                ctx.beginPath();
                ctx.moveTo(centerX, centerY);
                const endX = centerX + Math.cos(angle) * length;
                const endY = centerY + Math.sin(angle) * length;
                ctx.lineTo(endX, endY);
                ctx.stroke();

                ctx.beginPath();
                ctx.moveTo(endX, endY);
                const subAngle1 = angle + 0.5;
                const subLength = length * 0.75;
                ctx.lineTo(endX + Math.cos(subAngle1) * subLength, endY + Math.sin(subAngle1) * subLength);
                ctx.stroke();

                ctx.beginPath();
                ctx.moveTo(endX, endY);
                const subAngle2 = angle - 0.5;
                ctx.lineTo(endX + Math.cos(subAngle2) * subLength, endY + Math.sin(subAngle2) * subLength);
                ctx.stroke();

                ctx.beginPath();
                ctx.moveTo(endX + Math.cos(subAngle1) * subLength, endY + Math.sin(subAngle1) * subLength);
                const subSubAngle1 = subAngle1 + 0.3;
                const subSubLength = subLength * 0.6;
                ctx.lineTo(
                    endX + Math.cos(subAngle1) * subLength + Math.cos(subSubAngle1) * subSubLength,
                    endY + Math.sin(subAngle1) * subLength + Math.sin(subSubAngle1) * subSubLength
                );
                ctx.stroke();

                ctx.beginPath();
                ctx.moveTo(endX + Math.cos(subAngle2) * subLength, endY + Math.sin(subAngle2) * subLength);
                const subSubAngle2 = subAngle2 - 0.3;
                ctx.lineTo(
                    endX + Math.cos(subAngle2) * subLength + Math.cos(subSubAngle2) * subSubLength,
                    endY + Math.sin(subAngle2) * subLength + Math.sin(subSubAngle2) * subSubLength
                );
                ctx.stroke();
            }

            requestAnimationFrame(drawMiniBranches);
        };

        requestAnimationFrame(drawMiniBranches);
    }
});
