/**
 * Sprite Animation Engine
 * Handles sprite sheet loading, frame-by-frame animation, and FPS control
 */

class SpriteAnimator {
    constructor(canvasId, spriteImagePath, totalFrames, frameWidth = null, frameHeight = null) {
        // Canvas setup
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');

        // Sprite properties
        this.spriteImage = new Image();
        this.spriteImagePath = spriteImagePath;
        this.frameWidth = frameWidth;
        this.frameHeight = frameHeight;
        this.totalFrames = totalFrames;

        // Grid layout (will be calculated if auto-detecting)
        this.framesPerRow = 4; // Default, will be updated
        this.framesPerCol = 2; // Default, will be updated

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

        // Offset and spacing for manual grid configuration
        this.offsetX = 0;
        this.offsetY = 0;
        this.spacingX = 0;
        this.spacingY = 0;

        // Auto-detect mode flag
        this.autoDetect = true;

        // Load sprite image
        this.loadSprite();
    }

    loadSprite() {
        this.spriteImage.onload = () => {
            // Auto-detect frame dimensions if not provided
            if (!this.frameWidth || !this.frameHeight) {
                this.detectSpriteLayout();
            } else {
                // Calculate grid layout from provided dimensions
                this.framesPerRow = Math.floor(this.spriteImage.width / this.frameWidth);
                this.framesPerCol = Math.floor(this.spriteImage.height / this.frameHeight);
            }

            console.log('Sprite loaded successfully');
            this.displaySpriteInfo();
            this.render();
        };
        this.spriteImage.onerror = () => {
            console.error('Failed to load sprite image');
        };
        this.spriteImage.src = this.spriteImagePath;
    }

    detectSpriteLayout() {
        const imgWidth = this.spriteImage.width;
        const imgHeight = this.spriteImage.height;

        // Find the best grid layout for the total frames
        const bestLayout = this.findBestGridLayout(this.totalFrames, imgWidth, imgHeight);

        this.framesPerRow = bestLayout.cols;
        this.framesPerCol = bestLayout.rows;
        this.frameWidth = Math.floor(imgWidth / bestLayout.cols);
        this.frameHeight = Math.floor(imgHeight / bestLayout.rows);

        // Auto-adjust canvas size to match frame dimensions
        this.canvas.width = this.frameWidth;
        this.canvas.height = this.frameHeight;

        console.log(`Auto-detected: ${imgWidth}x${imgHeight} → ${bestLayout.cols}x${bestLayout.rows} grid, frame: ${this.frameWidth}x${this.frameHeight}`);
    }

    findBestGridLayout(totalFrames, imgWidth, imgHeight) {
        // Find all possible grid combinations
        const layouts = [];
        for (let cols = 1; cols <= totalFrames; cols++) {
            if (totalFrames % cols === 0) {
                const rows = totalFrames / cols;
                const frameW = imgWidth / cols;
                const frameH = imgHeight / rows;
                const aspectRatio = frameW / frameH;

                layouts.push({
                    cols,
                    rows,
                    frameW,
                    frameH,
                    aspectRatio,
                    // Prefer wider layouts (more columns) for sprite sheets
                    score: cols * 2 + (aspectRatio > 0.1 && aspectRatio < 3 ? 10 : 0)
                });
            }
        }

        // Sort by score (higher is better)
        layouts.sort((a, b) => b.score - a.score);

        return layouts[0];
    }

    displaySpriteInfo() {
        const infoEl = document.getElementById('spriteInfo');
        if (infoEl) {
            infoEl.innerHTML = `
                <strong>🎨 스프라이트 정보</strong><br>
                이미지: ${this.spriteImage.width}×${this.spriteImage.height}px<br>
                그리드: ${this.framesPerRow}×${this.framesPerCol} (${this.totalFrames}프레임)<br>
                프레임: ${this.frameWidth}×${this.frameHeight}px
            `;
        }
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

        // Calculate source position in sprite sheet using dynamic grid layout
        const row = Math.floor(this.currentFrame / this.framesPerRow);
        const col = this.currentFrame % this.framesPerRow;

        // Apply offset and spacing
        const sx = this.offsetX + col * (this.frameWidth + this.spacingX);
        const sy = this.offsetY + row * (this.frameHeight + this.spacingY);

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

    setManualGrid(totalFrames, cols, frameWidth, frameHeight, offsetX = 0, offsetY = 0, spacingX = 0, spacingY = 0) {
        // Validate inputs
        if (totalFrames < 1 || cols < 1 || frameWidth < 1 || frameHeight < 1) {
            console.error('Invalid grid parameters');
            return false;
        }

        // Update properties
        this.totalFrames = totalFrames;
        this.framesPerRow = cols;
        this.framesPerCol = Math.ceil(totalFrames / cols);
        this.frameWidth = frameWidth;
        this.frameHeight = frameHeight;
        this.offsetX = offsetX;
        this.offsetY = offsetY;
        this.spacingX = spacingX;
        this.spacingY = spacingY;
        this.autoDetect = false;

        // Update canvas size to match frame dimensions
        this.canvas.width = frameWidth;
        this.canvas.height = frameHeight;

        // Reset to first frame
        this.currentFrame = 0;
        this.render();
        this.updateFrameDisplay();
        this.displaySpriteInfo();

        console.log(`Manual grid set: ${cols}x${this.framesPerCol}, frame: ${frameWidth}x${frameHeight}`);
        return true;
    }

    loadFromFile(file) {
        return new Promise((resolve, reject) => {
            if (!file || !file.type.startsWith('image/')) {
                reject(new Error('Invalid file type'));
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                this.spriteImagePath = e.target.result;
                this.spriteImage.onload = () => {
                    console.log('New sprite loaded from file');

                    // Auto-detect if enabled
                    if (this.autoDetect) {
                        this.detectSpriteLayout();
                    }

                    this.render();
                    this.displaySpriteInfo();
                    resolve();
                };
                this.spriteImage.onerror = () => {
                    reject(new Error('Failed to load image'));
                };
                this.spriteImage.src = this.spriteImagePath;
            };
            reader.onerror = () => {
                reject(new Error('Failed to read file'));
            };
            reader.readAsDataURL(file);
        });
    }

    triggerAutoDetect() {
        this.autoDetect = true;
        this.detectSpriteLayout();
        this.render();
        this.displaySpriteInfo();
        console.log('Auto-detect triggered');
    }
}

// ===== Application Initialization =====

let animator;

document.addEventListener('DOMContentLoaded', () => {
    // Initialize animator with auto-detection
    // Only specify total frames, let the system detect sprite dimensions
    animator = new SpriteAnimator('animationCanvas', 'images/sprite.png', 8);

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

    // Sprite Upload
    const spriteUpload = document.getElementById('spriteUpload');
    const fileName = document.getElementById('fileName');

    spriteUpload.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (file) {
            try {
                fileName.textContent = file.name;
                await animator.loadFromFile(file);

                // Update UI fields with detected values
                document.getElementById('totalFrames').value = animator.totalFrames;
                document.getElementById('gridCols').value = animator.framesPerRow;
                document.getElementById('frameWidth').value = animator.frameWidth;
                document.getElementById('frameHeight').value = animator.frameHeight;

                console.log('Sprite uploaded successfully');
            } catch (error) {
                console.error('Error loading sprite:', error);
                fileName.textContent = '업로드 실패';
            }
        }
    });

    // Auto Detect Button
    const autoDetectBtn = document.getElementById('autoDetectBtn');
    autoDetectBtn.addEventListener('click', () => {
        animator.triggerAutoDetect();

        // Update UI fields with detected values
        document.getElementById('totalFrames').value = animator.totalFrames;
        document.getElementById('gridCols').value = animator.framesPerRow;
        document.getElementById('frameWidth').value = animator.frameWidth;
        document.getElementById('frameHeight').value = animator.frameHeight;
    });

    // Apply Grid Button
    const applyGridBtn = document.getElementById('applyGridBtn');
    applyGridBtn.addEventListener('click', () => {
        const totalFrames = parseInt(document.getElementById('totalFrames').value);
        const gridCols = parseInt(document.getElementById('gridCols').value);
        const frameWidth = parseInt(document.getElementById('frameWidth').value);
        const frameHeight = parseInt(document.getElementById('frameHeight').value);
        const offsetX = parseInt(document.getElementById('offsetX').value) || 0;
        const offsetY = parseInt(document.getElementById('offsetY').value) || 0;
        const spacingX = parseInt(document.getElementById('spacingX').value) || 0;
        const spacingY = parseInt(document.getElementById('spacingY').value) || 0;

        const success = animator.setManualGrid(
            totalFrames,
            gridCols,
            frameWidth,
            frameHeight,
            offsetX,
            offsetY,
            spacingX,
            spacingY
        );

        if (success) {
            console.log('Manual grid applied successfully');
        }
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
