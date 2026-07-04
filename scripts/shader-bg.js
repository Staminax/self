(function () {
    const canvas = document.getElementById('shader-bg');
    if (!canvas) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const gl = canvas.getContext('webgl', { antialias: false, alpha: true, premultipliedAlpha: true })
             || canvas.getContext('experimental-webgl', { antialias: false, alpha: true, premultipliedAlpha: true });
    if (!gl) { canvas.style.display = 'none'; return; }

    const vsSource = `
        attribute vec2 a_pos;
        void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
    `;

    const fsSource = `
        precision highp float;
        uniform float u_time;
        uniform vec2 u_res;
        uniform vec2 u_mouse;
        uniform vec2 u_mouseVel;
        uniform float u_intensity;
        uniform float u_light;

        float hash(vec2 p) {
            p = fract(p * vec2(123.34, 456.21));
            p += dot(p, p + 45.32);
            return fract(p.x * p.y);
        }

        float noise(vec2 p) {
            vec2 i = floor(p);
            vec2 f = fract(p);
            f = f * f * (3.0 - 2.0 * f);
            return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
                       mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
        }

        float fbm(vec2 p) {
            float v = 0.0, a = 0.5;
            for (int i = 0; i < 5; i++) {
                v += a * noise(p);
                p = p * 2.0 + 1.3;
                a *= 0.5;
            }
            return v;
        }

        void main() {
            vec2 uv = gl_FragCoord.xy / u_res;
            vec2 p = (gl_FragCoord.xy - 0.5 * u_res) / min(u_res.x, u_res.y);

            float breath = 1.0 + sin(u_time * 0.08) * 0.06;
            p *= 3.0 * breath;

            float t = u_time * 0.035;
            p += vec2(t * 0.2, t * 0.12);

            vec2 mp = (u_mouse - 0.5 * u_res) / min(u_res.x, u_res.y) * 3.0 * breath;
            mp += vec2(t * 0.2, t * 0.12);
            float mouseDist = length(p - mp);

            vec2 fromMouse = p - mp + vec2(0.0001);
            p += normalize(fromMouse) * exp(-mouseDist * 2.0) * 0.2;

            vec2 q = vec2(fbm(p + vec2(t * 0.8, 0.0)),
                           fbm(p + vec2(5.2, 1.3) - t * 0.6));
            vec2 r = vec2(fbm(p + 1.8 * q + vec2(1.7, 9.2) + t * 0.4),
                           fbm(p + 1.8 * q + vec2(8.3, 2.8) - t * 0.3));
            float f = fbm(p + 2.0 * r + vec2(t * 0.15, t * 0.08));

            float veins = 1.0 - abs(f - 0.5) * 2.0;
            veins = pow(max(veins, 0.0), 2.5);

            float cursorClear = exp(-mouseDist * 2.5);
            veins *= 1.0 - cursorClear * 0.6;

            float redThread = smoothstep(0.49, 0.51, f) * smoothstep(0.53, 0.51, f);

            vec3 veinCol = u_light > 0.5
                ? vec3(0.08, 0.08, 0.1)
                : vec3(0.7, 0.7, 0.75);
            vec3 redCol = vec3(0.55, 0.12, 0.12);

            vec3 col = mix(veinCol, redCol, clamp(redThread * 0.125, 0.0, 1.0));

            float vAlpha = veins * 0.5;
            float rAlpha = redThread * 0.0075;
            float alpha = (vAlpha + rAlpha) * u_intensity;

            float cursorGlow = exp(-mouseDist * 1.5) * 0.15 * u_intensity;
            col += veinCol * cursorGlow;
            alpha += cursorGlow;

            alpha *= 1.0 - cursorClear * 0.5;

            alpha *= 1.0 - length(uv - 0.5) * 0.6;

            gl_FragColor = vec4(col * alpha, alpha);
        }
    `;

    function compile(type, src) {
        const s = gl.createShader(type);
        gl.shaderSource(s, src);
        gl.compileShader(s);
        if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { gl.deleteShader(s); return null; }
        return s;
    }

    const vs = compile(gl.VERTEX_SHADER, vsSource);
    const fs = compile(gl.FRAGMENT_SHADER, fsSource);
    if (!vs || !fs) { canvas.style.display = 'none'; return; }

    const prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { canvas.style.display = 'none'; return; }
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const posLoc = gl.getAttribLocation(prog, 'a_pos');
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0.0, 0.0, 0.0, 0.0);

    const uTime = gl.getUniformLocation(prog, 'u_time');
    const uRes = gl.getUniformLocation(prog, 'u_res');
    const uMouse = gl.getUniformLocation(prog, 'u_mouse');
    const uMouseVel = gl.getUniformLocation(prog, 'u_mouseVel');
    const uIntensity = gl.getUniformLocation(prog, 'u_intensity');
    const uLight = gl.getUniformLocation(prog, 'u_light');

    let mouseX = 0, mouseY = 0;
    let mouseVelX = 0, mouseVelY = 0;
    let prevMouseX = 0, prevMouseY = 0;
    let currentIntensity = 0;
    let isLight = document.documentElement.getAttribute('data-theme') === 'light' ? 1.0 : 0.0;

    window.shaderTargetIntensity = reducedMotion ? 1 : 0;

    function getScale() { return window.innerWidth <= 768 ? 0.5 : 1.0; }

    function resize() {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const scale = getScale();
        canvas.width = Math.floor(window.innerWidth * dpr * scale);
        canvas.height = Math.floor(window.innerHeight * dpr * scale);
        canvas.style.width = window.innerWidth + 'px';
        canvas.style.height = window.innerHeight + 'px';
        gl.viewport(0, 0, canvas.width, canvas.height);
    }

    resize();
    window.addEventListener('resize', resize);

    window.addEventListener('mousemove', (e) => {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const scale = getScale();
        const nx = e.clientX * dpr * scale;
        const ny = canvas.height - e.clientY * dpr * scale;
        mouseVelX = (nx - prevMouseX) * 0.8 + mouseVelX * 0.2;
        mouseVelY = (ny - prevMouseY) * 0.8 + mouseVelY * 0.2;
        prevMouseX = nx;
        prevMouseY = ny;
        mouseX = nx;
        mouseY = ny;
    });

    new MutationObserver(() => {
        isLight = document.documentElement.getAttribute('data-theme') === 'light' ? 1.0 : 0.0;
    }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    function drawFrame(time, intensity) {
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.uniform1f(uTime, time);
        gl.uniform2f(uRes, canvas.width, canvas.height);
        gl.uniform2f(uMouse, mouseX, mouseY);
        gl.uniform2f(uMouseVel, mouseVelX, mouseVelY);
        gl.uniform1f(uIntensity, intensity);
        gl.uniform1f(uLight, isLight);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    if (reducedMotion) {
        currentIntensity = 1;
        drawFrame(0, 1);
        new MutationObserver(() => drawFrame(0, 1))
            .observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
        window.addEventListener('resize', () => drawFrame(0, 1));
        return;
    }

    const startTime = performance.now();

    function render() {
        const time = (performance.now() - startTime) * 0.001;
        currentIntensity += (window.shaderTargetIntensity - currentIntensity) * 0.02;
        mouseVelX *= 0.92;
        mouseVelY *= 0.92;
        drawFrame(time, currentIntensity);
        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
})();
