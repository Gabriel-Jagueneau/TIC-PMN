let scrollTimeline;
let countersAnimated = false;

let currentScroll = 0;
let targetScroll = 0;
const ease = 0.08; 
let animationFrameId = null;

function initHomeAnimations() {
    const container = document.querySelector('.landing-page');
    const container3D_1 = document.querySelector('.landing-page .shape-1');
    const container3D_2 = document.querySelector('.landing-page .shape-2');
    const container3D_3 = document.querySelector('.landing-page .shape-3');

    // 2. INJECTION DE L'OBJET 3D (À SON EMPLACEMENT D'ORIGINE)
    const viewer_1 = document.createElement('model-viewer');
    viewer_1.setAttribute('src', 'storage/objects/earth_cartoon.glb');
    viewer_1.setAttribute('alt', 'Globe terrestre littoral');
    viewer_1.setAttribute('auto-rotate', '');
    viewer_1.setAttribute('shadow-intensity', '0');
    viewer_1.setAttribute('interaction-prompt', 'none');
    viewer_1.setAttribute('camera-orbit', '0deg 65deg auto');
    viewer_1.setAttribute('auto-rotate-delay', '0');
    viewer_1.setAttribute('rotation-per-second', '10deg');
    
    viewer_1.style.position = 'absolute';
    viewer_1.style.top = '55%';
    viewer_1.style.left = '70%';
    viewer_1.style.transform = 'translate(-50%, -50%)';
    viewer_1.style.margin = '0';
    
    container3D_1.style.position = 'relative';
    container3D_1.appendChild(viewer_1);
    
    const viewer_2 = document.createElement('model-viewer');
    viewer_2.setAttribute('src', 'storage/objects/sat_E_P.glb');
    viewer_2.setAttribute('alt', 'Globe terrestre littoral');
    viewer_2.setAttribute('auto-rotate', '');
    viewer_2.setAttribute('auto-rotate-delay', '0');
    viewer_2.setAttribute('shadow-intensity', '0');
    viewer_2.setAttribute('interaction-prompt', 'none');
    viewer_2.setAttribute('camera-orbit', '0deg 120deg auto');
    viewer_2.setAttribute('rotation-per-second', '10deg');
    
    container3D_2.appendChild(viewer_2);
    
    const viewer_3 = document.createElement('model-viewer');
    viewer_3.setAttribute('src', 'storage/objects/Carte_FR_3D_F.glb');
    viewer_3.setAttribute('alt', 'Globe terrestre littoral');
    viewer_3.setAttribute('shadow-intensity', '0');
    viewer_3.setAttribute('interaction-prompt', 'none');
    viewer_3.setAttribute('camera-orbit', '15deg 50deg auto');
    viewer_3.setAttribute('rotation-per-second', '10deg');
    
    container3D_3.appendChild(viewer_3);
    
    if (container && container3D_1) {
        const oldCanvas = container.querySelector('.global-ripple-canvas');
        if (oldCanvas) oldCanvas.remove();
        
        container3D_1.innerHTML = ''; 
        container3D_1.appendChild(viewer_1);

        const canvas = document.createElement('canvas');
        canvas.className = 'global-ripple-canvas';
        canvas.style.position = 'fixed';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.width = '100vw';
        canvas.style.height = '100vh';
        canvas.style.pointerEvents = 'none';
        canvas.style.zIndex = '1';
        container.insertBefore(canvas, container.firstChild);

        const ctx = canvas.getContext('2d');
        
        let circles = [];
        let frameCount = 0;
        const spawnInterval = 350;

        function resizeCanvas() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        function animateCircles() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            const rect3D = container3D_1.getBoundingClientRect();
            const centerX = rect3D.left + (rect3D.width / 2);
            const centerY = rect3D.top + (rect3D.height / 2);
            
            const currentScreenMax = Math.sqrt(canvas.width * canvas.width + canvas.height * canvas.height);
            const maxRadius = currentScreenMax;

            frameCount++;
            if (frameCount >= spawnInterval) {
                circles.push({ radius: 250, opacity: 0.8 });
                frameCount = 0;
            }

            for (let i = circles.length - 1; i >= 0; i--) {
                let circle = circles[i];
                
                circle.radius += 0.75;
                circle.opacity = 1 - (circle.radius / (maxRadius * 0.8));

                if (circle.radius >= maxRadius || circle.opacity <= 0) {
                    circles.splice(i, 1);
                    continue;
                }

                ctx.beginPath();
                ctx.arc(centerX, centerY, circle.radius, 0, 2 * Math.PI);
                ctx.strokeStyle = `#6bb6ba`;
                circle.opacity = Math.max(circle.opacity, 0);
                ctx.globalAlpha = circle.opacity;
                ctx.lineWidth = 1;
                ctx.stroke();
            }

            requestAnimationFrame(animateCircles);
        }
        animateCircles();
    }

    if (typeof anime === 'undefined') return;
    if (!container) return;

    const spacer = document.querySelector('.hero-cta-spacer');
    const rectSpacer = spacer.getBoundingClientRect();
    const startTop = rectSpacer.top;
    const startLeft = rectSpacer.left;

    countersAnimated = false;
    currentScroll = 0;
    targetScroll = 0;

    scrollTimeline = anime.timeline({
        autoplay: false,
        easing: 'easeOutQuad'
    });

    scrollTimeline
    .add({
        targets: '.fixed-cta-wrapper',
        top: [`${startTop}px`, '50px'],
        left: [`${startLeft+96}px`, `${container.getBoundingClientRect().width/2}px`],
        translateX: ['-50%', '-50%'],
        translateY: ['-50%', '-50%'],
        scale: [1, 1.2],
        duration: 250
    }, 0)
    .add({
        targets: '.radial-glow',
        opacity: [0, 1],
        duration: 250
    }, 0)
    .add({
        targets: '#hero .hero-title',
        translateY: [0, -80],
        opacity: [1, 0],
        duration: 250
    }, 0)
    .add({
        targets: '#hero .hero-subtitle',
        translateY: [0, -60],
        opacity: [1, 0],
        duration: 250
    }, 50)
    .add({
        targets: '.shape-1',
        translateY: [0, -400],
        opacity: [1, 0],
        duration: 300
    }, 0)
    .add({
        targets: '#dynamics .section-title',
        translateY: [40, 0],
        opacity: [0, 1],
        duration: 250
    }, 200)
    .add({
        targets: '#dynamics .dynamic-box:nth-child(1)',
        translateX: [-50, 0],
        opacity: [0, 1],
        duration: 300
    }, 250)
    .add({
        targets: '#dynamics .dynamic-box:nth-child(2)',
        translateX: [50, 0],
        opacity: [0, 1],
        duration: 300
    }, 300)
    .add({
        targets: '.shape-2',
        translateY: [400, 0],
        opacity: [0.6, 1],
        scale: [1.2, 1],
        duration: 300
    }, 200)
    .add({
        targets: '#territorial .section-title',
        clipPath: ['inset(0 100% 0 0)', 'inset(0 0% 0 0)'],
        duration: 300
    }, 500)
    .add({
        targets: '.shape-3',
        scale: [0.6, 0.9],
        opacity: [0, 1],
        translateX: [100, -80],
        duration: 350
    }, 550)
    .add({
        targets: '#territorial .metric-block',
        translateY: [30, 0],
        opacity: [0, 1],
        delay: anime.stagger(50),
        duration: 250
    }, 550)
    .add({
        targets: '.cta-full-box',
        scale: [0.96, 1],
        opacity: [0, 1],
        duration: 300,
        changeComplete: () => {
            animateHomeCountersOnce();
        }
    }, 600); 

    container.addEventListener('wheel', (event) => {
        event.preventDefault();
        
        const maxScroll = container.scrollHeight - container.clientHeight;
        targetScroll += event.deltaY;
        targetScroll = Math.max(0, Math.min(targetScroll, maxScroll));

        if (!animationFrameId) {
            animationFrameId = requestAnimationFrame(updateSmoothScroll);
        }
    }, { passive: false });
}

function updateSmoothScroll() {
    const container = document.querySelector('.landing-page');
    if (!container) return;

    currentScroll += (targetScroll - currentScroll) * ease;
    container.scrollTop = currentScroll;

    const maxScroll = container.scrollHeight - container.clientHeight;
    if (maxScroll > 0) {
        const scrollPercent = currentScroll / maxScroll;
        const acceleratedPercent = Math.min(scrollPercent / 0.5, 1);
        
        scrollTimeline.seek(acceleratedPercent * scrollTimeline.duration);
    }

    if (Math.abs(targetScroll - currentScroll) > 0.1) {
        animationFrameId = requestAnimationFrame(updateSmoothScroll);
    } else {
        currentScroll = targetScroll;
        container.scrollTop = currentScroll;
        animationFrameId = null;
    }
}

function animateHomeCountersOnce() {
    if (countersAnimated) return;
    countersAnimated = true;

    const nums = document.querySelectorAll('.metric-num');
    nums.forEach(num => {
        const target = parseInt(num.getAttribute('data-val'), 10);
        const obj = { value: 0 };
        anime({
            targets: obj,
            value: target,
            round: 1,
            duration: 3000,
            easing: 'easeOutExpo',
            update: () => { num.textContent = obj.value; }
        });
    });
}