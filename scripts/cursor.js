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

    if (!trailCanvas) return;

    const ctx = trailCanvas.getContext('2d');
    trailCanvas.width = window.innerWidth;
    trailCanvas.height = window.innerHeight;

    window.addEventListener('resize', () => {
        trailCanvas.width = window.innerWidth;
        trailCanvas.height = window.innerHeight;
    });

    let mouseX = -100;
    let mouseY = -100;
    const trailPoints = [];
    const maxPoints = 40;
    let isOverUI = false;
    let lastMoveTime = Date.now();
    let isMoving = false;

    const getTrailColor = () => {
        const style = getComputedStyle(document.documentElement);
        const color = style.getPropertyValue('--cursor-trail').trim();
        return color;
    };

    document.addEventListener('mousemove', (e) => {
        if (cursorDot && cursorDot.style.opacity !== '1') {
            cursorDot.style.opacity = '1';
        }
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
        ctx.clearRect(0, 0, trailCanvas.width, trailCanvas.height);

        const timeSinceMove = Date.now() - lastMoveTime;
        if (timeSinceMove > 100) {
            isMoving = false;
            if (trailPoints.length > 0) {
                trailPoints.shift();
            }
        }

        if (!isOverUI && isMoving && trailPoints.length > 2) {
            const color = getTrailColor();
            let baseRGB = '255, 255, 255';
            const match = color.match(/(\d+),\s*(\d+),\s*(\d+)/);
            if (match) baseRGB = `${match[1]}, ${match[2]}, ${match[3]}`;

            const pts = [];
            pts.push({ x: trailPoints[0].x, y: trailPoints[0].y });
            for (let i = 1; i < trailPoints.length - 1; i++) {
                const prev = trailPoints[i - 1];
                const curr = trailPoints[i];
                const next = trailPoints[i + 1];
                const midX1 = (prev.x + curr.x) / 2;
                const midY1 = (prev.y + curr.y) / 2;
                const midX2 = (curr.x + next.x) / 2;
                const midY2 = (curr.y + next.y) / 2;
                const steps = 3;
                for (let s = 1; s <= steps; s++) {
                    const t = s / steps;
                    const x = (1 - t) * (1 - t) * midX1 + 2 * (1 - t) * t * curr.x + t * t * midX2;
                    const y = (1 - t) * (1 - t) * midY1 + 2 * (1 - t) * t * curr.y + t * t * midY2;
                    pts.push({ x, y });
                }
            }
            pts.push({ x: trailPoints[trailPoints.length - 1].x, y: trailPoints[trailPoints.length - 1].y });

            if (pts.length >= 3) {
                const left = [];
                const right = [];
                for (let i = 0; i < pts.length; i++) {
                    const p = pts[i];
                    const next = pts[Math.min(i + 1, pts.length - 1)];
                    const prev = pts[Math.max(i - 1, 0)];
                    const dx = next.x - prev.x;
                    const dy = next.y - prev.y;
                    const len = Math.sqrt(dx * dx + dy * dy) || 1;
                    const nx = -dy / len;
                    const ny = dx / len;
                    const t = i / (pts.length - 1);
                    const w = t * 8 + 0.5;
                    left.push({ x: p.x + nx * w, y: p.y + ny * w });
                    right.push({ x: p.x - nx * w, y: p.y - ny * w });
                }

                const grad = ctx.createLinearGradient(pts[0].x, pts[0].y, pts[pts.length - 1].x, pts[pts.length - 1].y);
                grad.addColorStop(0, `rgba(${baseRGB}, 0)`);
                grad.addColorStop(1, `rgba(${baseRGB}, 0.55)`);
                ctx.fillStyle = grad;

                ctx.beginPath();
                ctx.moveTo(left[0].x, left[0].y);
                for (let i = 1; i < left.length; i++) ctx.lineTo(left[i].x, left[i].y);
                for (let i = right.length - 1; i >= 0; i--) ctx.lineTo(right[i].x, right[i].y);
                ctx.closePath();
                ctx.fill();
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
