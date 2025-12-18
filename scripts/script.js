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


let animationProgress = 0;
let animationStartTime = null;
const ANIMATION_DURATION = 2000;
let isAnimating = true;

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
            const index = Array.from(sections).indexOf(entry.target);
            if (index !== -1) {
                currentSectionIndex = index;
            }

            generateAllBranches();

            if (window.innerWidth <= 768) {
                if (entry.target.id === 'home') {
                    langSwitcher.style.opacity = '1';
                    langSwitcher.style.pointerEvents = 'auto';
                } else {
                    langSwitcher.style.opacity = '0';
                    langSwitcher.style.pointerEvents = 'none';
                }
            } else {
                langSwitcher.style.opacity = '1';
                langSwitcher.style.pointerEvents = 'auto';
            }
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

function scrollToSection(index) {
    if (index < 0 || index >= sections.length) return;

    currentSectionIndex = index;

    isScrollLocked = true;

    const targetPosition = sections[index].offsetTop;

    smoothScroll(targetPosition, 500);

    setTimeout(() => {
        isScrollLocked = false;
    }, 600);
}

window.addEventListener('wheel', (e) => {
    if (window.innerWidth <= 768) return;

    if (isScrollLocked) return;

    if (e.deltaY > 0) {
        scrollToSection(currentSectionIndex + 1);
    } else if (e.deltaY < 0) {
        scrollToSection(currentSectionIndex - 1);
    }
}, { passive: true });



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

function generateAllBranches() {
    allBranches = [];

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

    for (const branch of allBranches) {
        if (isAnimating && branch.startTime > currentAnimationTime) {
            break;
        }

        const distance = branch.distanceToPoint(mouseX, mouseY);

        let hoverEffect = 0;
        if (distance < config.hoverRadius) {
            hoverEffect = 1 - (distance / config.hoverRadius);
            hoverEffect = Math.pow(hoverEffect, 2);
        }

        branch.draw(hoverEffect, isAnimating ? currentAnimationTime : Infinity);
    }
}

const uiSelector = '.social-links, .scroll-btn, .language-switcher';

window.addEventListener('mousemove', (e) => {
    if (e.target.closest(uiSelector)) {
        mouseX = -1000;
        mouseY = -1000;
    } else {
        mouseX = e.clientX;
        mouseY = e.clientY;
    }
});

window.addEventListener('touchmove', (e) => {
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

function animate(timestamp) {
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
    requestAnimationFrame(animate);
}

resizeCanvas();
window.addEventListener('resize', () => {
    resizeCanvas();
    if (window.innerWidth > 768) {
        if (langSwitcher) {
            langSwitcher.style.opacity = '1';
            langSwitcher.style.pointerEvents = 'auto';
        }
    }
});
animate();
