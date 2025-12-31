/**
 * Sprite Animation Engine
 * Handles sprite sheet loading, frame-by-frame animation, and FPS control
 */

class SpriteAnimator {
    constructor(canvasId, spriteImagePath, frameWidth, frameHeight, totalFrames) {
        // Canvas setup
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');

        // Sprite properties
        this.spriteImage = new Image();
        this.spriteImagePath = spriteImagePath;
        this.frameWidth = frameWidth;
        this.frameHeight = frameHeight;
        this.totalFrames = totalFrames;

        // Animation state
        this.currentFrame = 0;
        this.isPlaying = false;
        this.fps = 24;
        this.frameInterval = 1000 / this.fps;
        this.lastFrameTime = 0;

        // Performance monitoring
        this.actualFps = 0;
        this.frameCount = 0;
        this.fpsLastTime = performance.now();

        // Animation loop ID
        this.animationId = null;

        // Load sprite image
        this.loadSprite();
    }

    loadSprite() {
        this.spriteImage.onload = () => {
            console.log('Sprite loaded successfully');
            this.render();
        };
        this.spriteImage.onerror = () => {
            console.error('Failed to load sprite image');
        };
        this.spriteImage.src = this.spriteImagePath;
    }

    setFPS(fps) {
        this.fps = Math.max(1, Math.min(60, fps));
        this.frameInterval = 1000 / this.fps;
    }

    play() {
        if (!this.isPlaying) {
            this.isPlaying = true;
            this.lastFrameTime = performance.now();
            this.animate();
        }
    }

    pause() {
        this.isPlaying = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    nextFrame() {
        this.currentFrame = (this.currentFrame + 1) % this.totalFrames;
        this.render();
        this.updateFrameDisplay();
    }

    prevFrame() {
        this.currentFrame = (this.currentFrame - 1 + this.totalFrames) % this.totalFrames;
        this.render();
        this.updateFrameDisplay();
    }

    animate() {
        if (!this.isPlaying) return;

        const currentTime = performance.now();
        const deltaTime = currentTime - this.lastFrameTime;

        // Update frame based on FPS
        if (deltaTime >= this.frameInterval) {
            this.currentFrame = (this.currentFrame + 1) % this.totalFrames;
            this.render();
            this.updateFrameDisplay();
            this.lastFrameTime = currentTime - (deltaTime % this.frameInterval);
        }

        // Calculate actual FPS
        this.frameCount++;
        if (currentTime - this.fpsLastTime >= 1000) {
            this.actualFps = Math.round(this.frameCount * 1000 / (currentTime - this.fpsLastTime));
            this.frameCount = 0;
            this.fpsLastTime = currentTime;
            this.updatePerformanceDisplay();
        }

        this.animationId = requestAnimationFrame(() => this.animate());
    }

    render() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Calculate source position in sprite sheet (4x2 grid layout)
        const framesPerRow = 4;
        const row = Math.floor(this.currentFrame / framesPerRow);
        const col = this.currentFrame % framesPerRow;

        const sx = col * this.frameWidth;
        const sy = row * this.frameHeight;

        // Draw current frame
        this.ctx.drawImage(
            this.spriteImage,
            sx, sy,
            this.frameWidth, this.frameHeight,
            0, 0,
            this.canvas.width, this.canvas.height
        );
    }

    updateFrameDisplay() {
        const currentFrameEl = document.getElementById('currentFrame');
        if (currentFrameEl) {
            currentFrameEl.textContent = this.currentFrame + 1;
        }
    }

    updatePerformanceDisplay() {
        const actualFpsEl = document.getElementById('actualFps');
        if (actualFpsEl) {
            actualFpsEl.textContent = this.actualFps;
        }
    }
}

// ===== Application Initialization =====

let animator;

document.addEventListener('DOMContentLoaded', () => {
    // Initialize animator
    // Note: The sprite sheet has 8 frames, but we need to determine the actual frame width
    // For now, assuming the generated image is 2048x256 (8 frames × 256px each)
    animator = new SpriteAnimator('animationCanvas', 'images/sprite.png', 256, 256, 8);

    // Set total frames display
    const totalFramesEl = document.getElementById('totalFrames');
    if (totalFramesEl) {
        totalFramesEl.textContent = '8';
    }

    // ===== Event Listeners =====

    // FPS Slider
    const fpsSlider = document.getElementById('fpsSlider');
    const fpsValue = document.getElementById('fpsValue');

    fpsSlider.addEventListener('input', (e) => {
        const fps = parseInt(e.target.value);
        fpsValue.textContent = fps;
        animator.setFPS(fps);
    });

    // Play/Pause Button
    const playPauseBtn = document.getElementById('playPauseBtn');
    const playIcon = document.getElementById('playIcon');
    const pauseIcon = document.getElementById('pauseIcon');

    playPauseBtn.addEventListener('click', () => {
        if (animator.isPlaying) {
            animator.pause();
            playIcon.style.display = 'block';
            pauseIcon.style.display = 'none';
            playPauseBtn.setAttribute('aria-label', '재생');
        } else {
            animator.play();
            playIcon.style.display = 'none';
            pauseIcon.style.display = 'block';
            playPauseBtn.setAttribute('aria-label', '일시정지');
        }
    });

    // Previous Frame Button
    const prevBtn = document.getElementById('prevBtn');
    prevBtn.addEventListener('click', () => {
        if (animator.isPlaying) {
            animator.pause();
            playIcon.style.display = 'block';
            pauseIcon.style.display = 'none';
        }
        animator.prevFrame();
    });

    // Next Frame Button
    const nextBtn = document.getElementById('nextBtn');
    nextBtn.addEventListener('click', () => {
        if (animator.isPlaying) {
            animator.pause();
            playIcon.style.display = 'block';
            pauseIcon.style.display = 'none';
        }
        animator.nextFrame();
    });

    // Keyboard controls
    document.addEventListener('keydown', (e) => {
        switch (e.key) {
            case ' ':
            case 'Enter':
                e.preventDefault();
                playPauseBtn.click();
                break;
            case 'ArrowLeft':
                e.preventDefault();
                prevBtn.click();
                break;
            case 'ArrowRight':
                e.preventDefault();
                nextBtn.click();
                break;
        }
    });

    // Auto-start animation
    setTimeout(() => {
        animator.play();
        playIcon.style.display = 'none';
        pauseIcon.style.display = 'block';
        playPauseBtn.setAttribute('aria-label', '일시정지');
    }, 500);
});
