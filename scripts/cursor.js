document.addEventListener('DOMContentLoaded', () => {
    const trailCanvas = document.getElementById('cursor-trail');
    const cursorDot = document.getElementById('cursor-dot');
    const cursorEye = document.getElementById('cursor-eye');
    const uiSelector = 'a, button, .social-btn, .lang-btn, .scroll-btn, .social-links, .language-switcher';

    if (!trailCanvas) {
        return;
    }

    const ctx = trailCanvas.getContext('2d');
    trailCanvas.width = window.innerWidth;
    trailCanvas.height = window.innerHeight;

    window.addEventListener('resize', () => {
        trailCanvas.width = window.innerWidth;
        trailCanvas.height = window.innerHeight;
    });

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    const trailPoints = [];
    const maxPoints = 30;
    let isOverUI = false;
    let lastMoveTime = Date.now();
    let isMoving = false;

    const getTrailColor = () => {
        const style = getComputedStyle(document.documentElement);
        const color = style.getPropertyValue('--cursor-trail').trim();
        return color;
    };

    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        lastMoveTime = Date.now();
        isMoving = true;

        trailPoints.push({ x: mouseX, y: mouseY });
        if (trailPoints.length > maxPoints) {
            trailPoints.shift();
        }
    });

    document.addEventListener('mouseover', (e) => {
        if (e.target.closest('.cats-trigger')) {
            if (cursorDot) cursorDot.style.opacity = '0';
            if (cursorEye) cursorEye.classList.remove('active');
            return;
        }
        if (e.target.closest(uiSelector)) {
            isOverUI = true;
            if (cursorEye) cursorEye.classList.add('active');
            if (cursorDot) cursorDot.style.opacity = '0';
        }
    });

    document.addEventListener('mouseout', (e) => {
        if (e.target.closest('.cats-trigger')) {
            if (cursorDot) cursorDot.style.opacity = '1';
            return;
        }
        if (e.target.closest(uiSelector)) {
            if (!e.relatedTarget || !e.relatedTarget.closest(uiSelector)) {
                isOverUI = false;
                if (cursorEye) cursorEye.classList.remove('active');
                if (cursorDot) cursorDot.style.opacity = '1';
            }
        }
    });

    const animateCursor = () => {
        ctx.clearRect(0, 0, trailCanvas.width, trailCanvas.height);

        const timeSinceMove = Date.now() - lastMoveTime;
        if (timeSinceMove > 100) {
            isMoving = false;
            if (trailPoints.length > 0) {
                trailPoints.shift();
            }
        }

        if (!isOverUI && isMoving && trailPoints.length > 1) {
            const color = getTrailColor();

            for (let i = 0; i < trailPoints.length - 1; i++) {
                const point = trailPoints[i];
                const nextPoint = trailPoints[i + 1];
                const opacity = (i / trailPoints.length) * 0.9;
                const width = (i / trailPoints.length) * 20 + 5;

                let strokeColor;
                if (color.startsWith('rgba')) {
                    strokeColor = color.replace(/[\d.]+\)$/g, `${opacity})`);
                } else if (color.startsWith('rgb')) {
                    strokeColor = color.replace('rgb', 'rgba').replace(')', `, ${opacity})`);
                } else {
                    strokeColor = `rgba(255, 255, 255, ${opacity})`;
                }

                ctx.strokeStyle = strokeColor;
                ctx.lineWidth = width;
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';

                ctx.shadowBlur = 20;
                ctx.shadowColor = strokeColor;

                ctx.beginPath();
                ctx.moveTo(point.x, point.y);
                ctx.lineTo(nextPoint.x, nextPoint.y);
                ctx.stroke();
            }
        }

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
