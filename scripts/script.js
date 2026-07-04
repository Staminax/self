const canvas = document.getElementById('choreographer');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    generateAllBranches();
}

let seed = 1337;
function seededRandom() {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
}

function getBranchColors() {
    const root = document.documentElement;
    const baseColor = getComputedStyle(root).getPropertyValue('--branch-base').trim();
    const hoverColor = getComputedStyle(root).getPropertyValue('--branch-hover').trim();

    const hexToRgb = (hex) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 200, g: 200, b: 200 };
    };

    return {
        base: hexToRgb(baseColor),
        hover: hexToRgb(hoverColor)
    };
}

const config = {
    baseColor: { r: 200, g: 200, h: 200 },
    hoverBrightness: 40,
    hoverScale: 6.56,
    hoverRadius: 60,
    minBranchWidth: 0.5,
    maxBranchWidth: 2.0,
    branchAngleVariation: Math.PI / 3.0,
    branchLengthMin: 50,
    branchLengthMax: 140,
    maxDepth: 12,
    branchProbability: 0.96,
    connectionDistance: 200,
    connectionProbability: 0.85
};

let allBranches = [];
let preservedRoots = [];
let mouseX = -1000;
let mouseY = -1000;
let lastMouseMoveTime = 0;


let animationProgress = 0;
let animationStartTime = null;
const ANIMATION_DURATION = 2000;
let isAnimating = true;
let branchRegenTimeout = null;
let lastRegeneratedIndex = -1;

let textRects = [];

let lastAnimateTs = 0;

let transientBranches = [];
const MAX_TRANSIENTS = 6;
let transientSpawnAcc = 0;
let nextTransientAt = 2000;

function updatePredictedRects(sectionIndex) {
    const targetSection = sections[sectionIndex];
    if (!targetSection) return;

    const cards = targetSection.querySelectorAll('.glass-card');
    const padding = 20;

    textRects = Array.from(cards).map(card => {
        const rect = card.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const viewportWidth = window.innerWidth;
        const rectWidth = rect.width;
        const rectHeight = rect.height;

        return {
            x: (viewportWidth - rectWidth) / 2 - padding,
            y: (viewportHeight - rectHeight) / 2 - padding,
            w: rectWidth + (padding * 2),
            h: rectHeight + (padding * 2)
        };
    });
}

function isInsideCard(x, y) {
    for (const rect of textRects) {
        if (x >= rect.x && x <= rect.x + rect.w &&
            y >= rect.y && y <= rect.y + rect.h) {
            return true;
        }
    }
    return false;
}

class BranchSegment {
    constructor(x1, y1, x2, y2, width, depth, startTime = 0, duration = 100, color = null) {
        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;
        this.width = width;
        this.depth = depth;
        this.children = [];
        this.startTime = startTime;
        this.duration = duration;
        this.endTime = startTime + duration;
        this.color = color;

        const dx = x2 - x1;
        const dy = y2 - y1;

        const length = Math.sqrt(dx * dx + dy * dy);
        this.length = length;

        const offsetX = -dy / length;
        const offsetY = dx / length;

        const curvature = (seededRandom() - 0.5) * length * 0.15;

        this.cx = (x1 + x2) / 2 + offsetX * curvature;
        this.cy = (y1 + y2) / 2 + offsetY * curvature;
    }

    distanceToPoint(px, py) {
        const dx = this.x2 - this.x1;
        const dy = this.y2 - this.y1;
        const lengthSquared = dx * dx + dy * dy;

        if (lengthSquared === 0) {
            return Math.sqrt((px - this.x1) ** 2 + (py - this.y1) ** 2);
        }

        let t = ((px - this.x1) * dx + (py - this.y1) * dy) / lengthSquared;
        t = Math.max(0, Math.min(1, t));

        const projX = this.x1 + t * dx;
        const projY = this.y1 + t * dy;

        return Math.sqrt((px - projX) ** 2 + (py - projY) ** 2);
    }

    draw(hoverEffect = 0, currentAnimationTime = Infinity) {
        let drawProgress = 1;
        if (currentAnimationTime !== Infinity) {
            if (currentAnimationTime < this.startTime) return;
            drawProgress = Math.min(1, (currentAnimationTime - this.startTime) / this.duration);
        }

        const colors = getBranchColors();
        const baseBrightness = colors.base.r;

        let effectiveHover = hoverEffect;

        if (this.color && this.color.neon) {
            effectiveHover = 1;
        }

        let drawFlash = 0;
        if (drawProgress < 1) {
            drawFlash = 0;
        }

        const brightness = Math.min(255, baseBrightness + config.hoverBrightness * effectiveHover + drawFlash);
        const width = this.width * (1 + (config.hoverScale - 1) * effectiveHover);

        ctx.beginPath();
        ctx.moveTo(this.x1, this.y1);

        ctx.quadraticCurveTo(this.cx, this.cy, this.x2, this.y2);

        if (this.color) {
            const boost = this.color.neon ? config.hoverBrightness : config.hoverBrightness * effectiveHover;

            const r = Math.min(255, this.color.r + boost);
            const g = Math.min(255, this.color.g + boost);
            const b = Math.min(255, this.color.b + boost);
            if (this.color.neon) {
                ctx.strokeStyle = `rgb(${colors.hover.r}, ${colors.hover.g}, ${colors.hover.b})`;
                ctx.shadowBlur = 30;
                ctx.shadowColor = `rgb(${r}, ${g}, ${b})`;
            } else {
                ctx.strokeStyle = `rgb(${r}, ${g}, ${b})`;
                ctx.shadowBlur = 0;
            }
        } else {
            if (effectiveHover > 0.1) {
                const hoverIntensity = effectiveHover;
                ctx.strokeStyle = '#ffffff';
                ctx.shadowBlur = 20 * hoverIntensity;
                ctx.shadowColor = `rgba(255, 0, 0, ${hoverIntensity})`;
            } else {
                ctx.strokeStyle = `rgb(${brightness}, ${brightness}, ${brightness})`;
                ctx.shadowBlur = 0;
            }
        }
        ctx.lineWidth = width;
        ctx.lineCap = 'round';

        if (drawProgress < 1) {
            const curveLen = this.length * 1.1;
            const drawLen = curveLen * drawProgress;
            ctx.setLineDash([drawLen, curveLen]);
        } else {
            ctx.setLineDash([]);
        }

        ctx.stroke();
        ctx.setLineDash([]);
    }
}

function createBranch(x, y, angle, length, width, depth, startTime = 0) {
    if (depth > config.maxDepth || width < config.minBranchWidth) {
        return null;
    }

    const x2 = x + Math.cos(angle) * length;
    const y2 = y + Math.sin(angle) * length;

    if (isInsideCard(x2, y2)) {
        return null;
    }

    const drawSpeed = 0.25;
    const duration = length / drawSpeed;

    const segment = new BranchSegment(x, y, x2, y2, width, depth, startTime, duration);
    allBranches.push(segment);

    if (depth < config.maxDepth && seededRandom() < config.branchProbability) {
        const rand = seededRandom();
        let numBranches = 1;
        if (rand > 0.45) numBranches = 2;
        if (rand > 0.85) numBranches = 3;

        for (let i = 0; i < numBranches; i++) {
            const angleVariation = (seededRandom() - 0.5) * config.branchAngleVariation * 2;
            const newAngle = angle + angleVariation;

            const lengthMultiplier = 0.7 + seededRandom() * 0.4;
            const newLength = length * lengthMultiplier;

            const newWidth = width * (0.6 + seededRandom() * 0.2);

            const child = createBranch(x2, y2, newAngle, newLength, newWidth, depth + 1, segment.endTime);
            if (child) {
                segment.children.push(child);
            }
        }
    }
    return segment;
}

const observerOptions = {
    threshold: 0.5
};

const sections = document.querySelectorAll('.snap-section');
let currentSectionIndex = 0;
let isScrollLocked = false;

const upBtn = document.querySelector('.scroll-up-btn');
const langSwitcher = document.querySelector('.language-switcher');
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
            if (['about', 'stacks', 'experience', 'personal'].includes(entry.target.id)) {
                if (typeof typewriterTitles === 'function') {
                    setTimeout(() => typewriterTitles('#' + entry.target.id), 200);
                }
            }
            const index = Array.from(sections).indexOf(entry.target);
            if (index !== -1) {
                requestRegeneration(index);
            }

            langSwitcher.style.opacity = '1';
            langSwitcher.style.pointerEvents = 'auto';
        }
    });
}, observerOptions);

document.querySelectorAll('.snap-section').forEach(section => {
    observer.observe(section);
});



function smoothScroll(target, duration) {
    const container = document.querySelector('.scroll-container');
    const start = container.scrollTop;
    const distance = target - start;
    let startTime = null;

    function animation(currentTime) {
        if (startTime === null) startTime = currentTime;
        const timeElapsed = currentTime - startTime;

        let run;
        let t = timeElapsed / (duration / 2);
        if (t < 1) {
            run = distance / 2 * t * t + start;
        } else {
            t--;
            run = -distance / 2 * (t * (t - 2) - 1) + start;
        }

        container.scrollTop = run;

        if (timeElapsed < duration) {
            requestAnimationFrame(animation);
        } else {
            container.scrollTop = target;
        }
    }

    requestAnimationFrame(animation);
}

function requestRegeneration(index) {
    if (index === lastRegeneratedIndex) return;
    lastRegeneratedIndex = index;
    currentSectionIndex = index;

    if (branchRegenTimeout) clearTimeout(branchRegenTimeout);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    allBranches = [];
    transientBranches = [];
    isAnimating = false;

    branchRegenTimeout = setTimeout(() => {
        generateAllBranches(index);
    }, 100);
}

function scrollToSection(index) {
    if (index < 0 || index >= sections.length) return;

    const targetPosition = sections[index].offsetTop;

    requestRegeneration(index);

    isScrollLocked = true;
    smoothScroll(targetPosition, 500);

    setTimeout(() => {
        isScrollLocked = false;
    }, 510);
}

window.addEventListener('wheel', (e) => {
    if (window.innerWidth <= 768) return;

    if (isScrollLocked) return;

    // Check if scrolling inside timeline only
    const timeline = e.target.closest('.timeline');

    if (timeline) {
        // Completely block section navigation when scrolling in timeline
        return;
    }

    if (e.deltaY > 0) {
        scrollToSection(currentSectionIndex + 1);
    } else if (e.deltaY < 0) {
        scrollToSection(currentSectionIndex - 1);
    }
}, { passive: false });

window.addEventListener('keydown', (e) => {
    if (e.ctrlKey && (e.key === '+' || e.key === '-' || e.key === '=' || e.key === '0')) {
        e.preventDefault();
    }
}, { passive: false });

window.addEventListener('wheel', (e) => {
    if (e.ctrlKey) {
        e.preventDefault();
    }
}, { passive: false });



window.addEventListener('keydown', (e) => {
    if (window.innerWidth <= 768) return;

    if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (!isScrollLocked) {
            scrollToSection(currentSectionIndex + 1);
        }
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (!isScrollLocked) {
            scrollToSection(currentSectionIndex - 1);
        }
    }
});

const homeScrollDown = document.getElementById('home-scroll-down');
if (homeScrollDown) {
    homeScrollDown.addEventListener('click', (e) => {
        e.preventDefault();
        scrollToSection(1);
    });
}

const scrollContainer = document.querySelector('.scroll-container');
if (scrollContainer) {
    scrollContainer.addEventListener('scroll', () => {
        if (window.innerWidth <= 768) {
            const isAtBottom = scrollContainer.scrollTop + scrollContainer.clientHeight >= scrollContainer.scrollHeight - 50;

            if (isAtBottom) {
                upBtn?.classList.remove('hidden');
            } else {
                upBtn?.classList.add('hidden');
            }
        }
    });
}

function generateAllBranches(targetIndex = 0) {
    if (branchRegenTimeout) clearTimeout(branchRegenTimeout);
    allBranches = [];
    transientBranches = [];

    updatePredictedRects(targetIndex);

    seed = 12345;

    const numRoots = Math.floor((canvas.width * canvas.height) / 6000) + 20;

    const rootPositions = [];

    if (preservedRoots.length > 0) {
        function addSubtree(branch) {
            allBranches.push(branch);
            if (branch.children) {
                branch.children.forEach(child => addSubtree(child));
            }
        }

        preservedRoots.forEach(root => {
            addSubtree(root);
            rootPositions.push({ x: root.x1, y: root.y1 });
        });
    }

    const minRootDistance = 60;

    for (let i = 0; i < numRoots; i++) {
        let x, y, safe;
        let attempts = 0;

        do {
            x = seededRandom() * canvas.width;
            y = seededRandom() * canvas.height;
            safe = true;

            for (const pos of rootPositions) {
                const dist = Math.sqrt((x - pos.x) ** 2 + (y - pos.y) ** 2);
                if (dist < minRootDistance) {
                    safe = false;
                    break;
                }
            }
            attempts++;
        } while (!safe && attempts < 20);

        if (safe || attempts >= 20) {
            if (isInsideCard(x, y)) {
                let rootAttempts = 0;
                while (isInsideCard(x, y) && rootAttempts < 5) {
                    x = seededRandom() * canvas.width;
                    y = seededRandom() * canvas.height;
                    rootAttempts++;
                }
                if (isInsideCard(x, y)) continue;
            }

            rootPositions.push({ x, y });

            const angle = seededRandom() * Math.PI * 2;
            const length = config.branchLengthMin + seededRandom() * (config.branchLengthMax - config.branchLengthMin);
            const width = config.minBranchWidth + seededRandom() * (config.maxBranchWidth - config.minBranchWidth);

            const rootStartTime = seededRandom() * 1000;

            createBranch(x, y, angle, length, width, 0, rootStartTime);
        }
    }

    connectNearbyBranches();

    allBranches.sort((a, b) => a.startTime - b.startTime);

    totalAnimationDuration = 0;
    for (const branch of allBranches) {
        if (branch.endTime > totalAnimationDuration) {
            totalAnimationDuration = branch.endTime;
        }
    }

    animationProgress = 0;
    animationStartTime = null;
    isAnimating = true;
}

function connectNearbyBranches() {
    const endpoints = [];

    for (let i = 0; i < allBranches.length; i++) {
        const branch = allBranches[i];

        endpoints.push({
            x: branch.x2,
            y: branch.y2,
            width: branch.width,
            endTime: branch.endTime,
            index: i
        });
    }

    for (let i = 0; i < endpoints.length; i++) {
        if (seededRandom() > config.connectionProbability) continue;

        const ep1 = endpoints[i];

        let closestDist = Infinity;
        let closestEp = null;

        for (let j = 0; j < endpoints.length; j++) {
            if (i === j) continue;

            const ep2 = endpoints[j];
            const dist = Math.sqrt((ep2.x - ep1.x) ** 2 + (ep2.y - ep1.y) ** 2);

            if (dist < closestDist) {
                closestDist = dist;
                closestEp = ep2;
            }
        }

        const maxDist = 300;

        if (closestEp && closestDist < maxDist) {
            const ep2 = closestEp;
            const avgWidth = (ep1.width + ep2.width) / 2;

            const startTime = Math.max(ep1.endTime, ep2.endTime);

            const duration = closestDist / 0.25;

            const connector = new BranchSegment(ep1.x, ep1.y, ep2.x, ep2.y, avgWidth * 0.5, 99, startTime, duration);
            allBranches.push(connector);
        }
    }
}

function drawBranches(currentAnimationTime) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const now = Date.now();
    const stillTime = now - lastMouseMoveTime;
    const stillness = lastMouseMoveTime > 0 ? Math.min(1, stillTime / 400) : 0;
    const pulse = stillness > 0 ? Math.sin(now * 0.004) * 0.12 * stillness : 0;

    for (const branch of allBranches) {
        if (isAnimating && branch.startTime > currentAnimationTime) {
            break;
        }

        const distance = branch.distanceToPoint(mouseX, mouseY);

        let hoverEffect = 0;
        if (distance < config.hoverRadius) {
            hoverEffect = 1 - (distance / config.hoverRadius);
            hoverEffect = Math.pow(hoverEffect, 2);
            hoverEffect = Math.min(1, hoverEffect * (1 + stillness * 0.5) + pulse);
        }

        branch.draw(hoverEffect, isAnimating ? currentAnimationTime : Infinity);
    }
}

const uiSelector = '.social-links, .scroll-btn, .language-switcher';

window.addEventListener('mousemove', (e) => {
    lastMouseMoveTime = Date.now();
    if (e.target.closest(uiSelector)) {
        mouseX = -1000;
        mouseY = -1000;
    } else {
        mouseX = e.clientX;
        mouseY = e.clientY;
    }
});

window.addEventListener('touchmove', (e) => {
    lastMouseMoveTime = Date.now();
    if (e.target.closest(uiSelector)) {
        mouseX = -1000;
        mouseY = -1000;
        return;
    }
    const touch = e.touches[0];
    mouseX = touch.clientX;
    mouseY = touch.clientY;
}, { passive: true });

document.addEventListener('mouseleave', () => {
    mouseX = -1000;
    mouseY = -1000;
});

let totalAnimationDuration = 0;

function spawnTransient(ts) {
    if (transientBranches.length >= MAX_TRANSIENTS) return;
    if (allBranches.length < 8) return;

    const centerIdx = Math.floor(seededRandom() * allBranches.length);
    const center = allBranches[centerIdx];
    const cx = center.x2, cy = center.y2;

    const maxRange = 400;
    const candidates = [];
    const sampleSize = Math.min(80, allBranches.length);
    for (let i = 0; i < sampleSize; i++) {
        const idx = Math.floor(seededRandom() * allBranches.length);
        if (idx === centerIdx) continue;
        const b = allBranches[idx];
        const d = Math.sqrt((b.x2 - cx) ** 2 + (b.y2 - cy) ** 2);
        if (d > 40 && d < maxRange) {
            candidates.push({ x: b.x2, y: b.y2, angle: Math.atan2(b.y2 - cy, b.x2 - cx) });
        }
    }

    if (candidates.length < 5) return;

    candidates.sort((a, b) => a.angle - b.angle);

    const n = seededRandom() < 0.5 ? 5 : 6;
    const k = 2;

    const vertices = [{ x: cx, y: cy }];
    const step = candidates.length / n;
    for (let i = 0; i < n; i++) {
        const idx = Math.floor(i * step) % candidates.length;
        vertices.push({ x: candidates[idx].x, y: candidates[idx].y });
    }

    const edges = [];
    for (let i = 1; i <= n; i++) {
        edges.push([0, i]);
        edges.push([i, ((i - 1 + k) % n) + 1]);
    }

    transientBranches.push({
        vertices,
        edges,
        state: 'grow',
        stateStart: ts,
        growMs: 1200 + seededRandom() * 500,
        flashMs: 300,
        dissolveMs: 1200,
        dustAcc: 0
    });
}

function updateTransients(ts, dt) {
    transientSpawnAcc += dt;
    if (transientSpawnAcc >= nextTransientAt && transientBranches.length < MAX_TRANSIENTS) {
        spawnTransient(ts);
        transientSpawnAcc = 0;
        nextTransientAt = 2000 + seededRandom() * 1000;
    }

    for (let i = transientBranches.length - 1; i >= 0; i--) {
        const t = transientBranches[i];
        const stateAge = ts - t.stateStart;

        if (t.state === 'grow' && stateAge >= t.growMs) {
            t.state = 'flash';
            t.stateStart = ts;
        } else if (t.state === 'flash' && stateAge >= t.flashMs) {
            t.state = 'dissolve';
            t.stateStart = ts;
        } else if (t.state === 'dissolve') {
            if (stateAge >= t.dissolveMs) {
                transientBranches.splice(i, 1);
            }
        }
    }
}

function drawTransients(ts) {
    const colors = getBranchColors();
    const cr = colors.base.r, cg = colors.base.g, cb = colors.base.b;

    for (const t of transientBranches) {
        const stateAge = ts - t.stateStart;
        let opacity = 0.85;
        let progress = 1;

        if (t.state === 'grow') {
            progress = Math.min(1, stateAge / t.growMs);
        } else if (t.state === 'flash') {
            opacity = 1;
        } else if (t.state === 'dissolve') {
            opacity = 1 - stateAge / t.dissolveMs;
        }

        const cx = t.vertices[0].x;
        const cy = t.vertices[0].y;
        const dist = Math.sqrt((cx - mouseX) ** 2 + (cy - mouseY) ** 2);
        const hoverBoost = dist < 120 ? (1 - dist / 120) * 0.3 : 0;

        ctx.strokeStyle = `rgba(${cr}, ${cg}, ${cb}, ${Math.min(1, opacity + hoverBoost)})`;
        ctx.shadowColor = `rgba(${cr}, ${cg}, ${cb}, 0.9)`;
        ctx.shadowBlur = 10 + hoverBoost * 14;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        for (const edge of t.edges) {
            const a = t.vertices[edge[0]];
            const b = t.vertices[edge[1]];
            const ex = a.x + (b.x - a.x) * progress;
            const ey = a.y + (b.y - a.y) * progress;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(ex, ey);
            ctx.stroke();
        }

        if (t.state === 'flash') {
            const flashOp = 1 - stateAge / t.flashMs;
            ctx.fillStyle = `rgba(${cr}, ${cg}, ${cb}, ${flashOp})`;
            ctx.shadowBlur = 24;
            for (let i = 0; i < t.vertices.length; i++) {
                const v = t.vertices[i];
                ctx.beginPath();
                ctx.arc(v.x, v.y, 3 + flashOp * 5, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }
    ctx.shadowBlur = 0;
}

function animate(timestamp) {
    const dt = lastAnimateTs ? timestamp - lastAnimateTs : 16;
    lastAnimateTs = timestamp;

    let elapsed = 0;

    if (isAnimating) {
        if (!animationStartTime) {
            animationStartTime = timestamp;
        }

        elapsed = timestamp - animationStartTime;

        if (elapsed > totalAnimationDuration + 500) {
            isAnimating = false;
        }
    } else {
        elapsed = Infinity;
    }

    drawBranches(elapsed);
    updateTransients(timestamp, dt);
    drawTransients(timestamp);
    requestAnimationFrame(animate);
}

window.addEventListener('resize', () => {
    resizeCanvas();
    lastRegeneratedIndex = -1;
    requestRegeneration(currentSectionIndex);
    if (window.innerWidth > 768) {
        if (langSwitcher) {
            langSwitcher.style.opacity = '1';
            langSwitcher.style.pointerEvents = 'auto';
        }
    }
});

const orbEls = document.querySelectorAll('.orb');
let parallaxRAF = null;
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (orbEls.length && !reducedMotion) {
    window.addEventListener('mousemove', (e) => {
        if (window.innerWidth <= 768) return;
        if (parallaxRAF) return;
        parallaxRAF = requestAnimationFrame(() => {
            const px = (e.clientX / window.innerWidth - 0.5) * 2;
            const py = (e.clientY / window.innerHeight - 0.5) * 2;
            orbEls.forEach((orb, i) => {
                const depth = (i + 1) * 10;
                orb.style.translate = `${px * depth}px ${py * depth}px`;
            });
            parallaxRAF = null;
        });
    });
}

function initBranches() {
    resizeCanvas();
    requestRegeneration(0);
    animate();
}

function typeIntro(el, text, delay, speed) {
    setTimeout(() => {
        if (!el) return;
        el.textContent = '';
        const caret = document.createElement('span');
        caret.className = 'typewriter-caret';
        caret.textContent = '|';
        el.appendChild(caret);
        let i = 0;
        const interval = setInterval(() => {
            if (i < text.length) {
                caret.before(text[i]);
                i++;
            } else {
                clearInterval(interval);
            }
        }, speed);
    }, delay);
}

if (reducedMotion) {
    document.getElementById('intro-overlay')?.classList.add('done');
    document.getElementById('home')?.classList.add('in-view');
    initBranches();
} else {
    typeIntro(document.querySelector('.intro-subtitle'), 'original does not mean', 200, 77);
    typeIntro(document.querySelector('.intro-name'), 'good.', 1800, 168);
    setTimeout(initBranches, 3850);
    setTimeout(() => {
        document.getElementById('home')?.classList.add('in-view');
    }, 4150);
    setTimeout(() => {
        document.getElementById('intro-overlay')?.classList.add('done');
    }, 4550);
}
