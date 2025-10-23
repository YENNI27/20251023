// =================================================================
// 步驟一：成績數據接收 (H5P Score Listener)
// -----------------------------------------------------------------

let finalScore = 0; 
let maxScore = 1; 
let scoreText = "等待 H5P 成績..."; 

// 全域變數 - 粒子系統所需
let fireworks = []; 
let gravity;        

// 監聽來自 H5P iFrame 的 postMessage 事件
window.addEventListener('message', function (event) {
    const data = event.data;
    
    // 確保接收到的是我們需要的 H5P 分數格式
    if (data && data.type === 'H5P_SCORE_RESULT') {
        
        // !!! 關鍵步驟：更新全域變數 !!!
        finalScore = data.score; 
        maxScore = data.maxScore > 0 ? data.maxScore : 1; 
        scoreText = `最終成績分數: ${finalScore}/${maxScore}`;
        
        console.log("新的 H5P 分數已接收:", scoreText); 
    }
}, false);


// =================================================================
// 步驟二：Particle 和 Firework 類別
// -----------------------------------------------------------------

class Particle {
    constructor(x, y, hu, isFirework) {
        this.pos = createVector(x, y); 
        this.isFirework = isFirework;
        this.lifespan = 255;
        this.hu = hu; 
        this.acc = createVector(0, 0);

        if (this.isFirework) {
            this.vel = createVector(0, random(-15, -10)); 
        } else {
            this.vel = p5.Vector.random2D();
            this.vel.mult(random(1, 8));
        }
    }

    applyForce(force) {
        this.acc.add(force);
    }

    update() {
        if (!this.isFirework) {
            this.vel.mult(0.9); 
            this.lifespan -= 4; 
        }
        this.vel.add(this.acc);
        this.pos.add(this.vel);
        this.acc.mult(0); 
    }

    show() {
        if (typeof drawingContext !== 'undefined') {
            drawingContext.shadowBlur = this.isFirework ? 10 : 6;
            drawingContext.shadowColor = color(this.hu, 255, 255).toString();
        }
        
        if (this.isFirework) {
            strokeWeight(4);
            stroke(this.hu, 255, 255); 
        } else {
            strokeWeight(2);
            stroke(this.hu, 255, 255, this.lifespan);
        }
        point(this.pos.x, this.pos.y);
        
        if (typeof drawingContext !== 'undefined') {
            drawingContext.shadowBlur = 0; 
        }
    }

    done() {
        return this.lifespan < 0;
    }
}

class Firework {
    constructor() {
        this.hu = random(255); 
        this.firework = new Particle(random(width), height, this.hu, true); 
        this.exploded = false;
        this.particles = [];
    }

    update() {
        if (!this.exploded) {
            this.firework.applyForce(gravity); 
            this.firework.update();

            if (this.firework.vel.y >= 0) {
                this.exploded = true;
                this.explode();
            }
        }

        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].applyForce(gravity);
            this.particles[i].update();
            if (this.particles[i].done()) {
                this.particles.splice(i, 1);
            }
        }
    }

    explode() {
        for (let i = 0; i < 100; i++) {
            let p = new Particle(this.firework.pos.x, this.firework.pos.y, this.hu, false);
            this.particles.push(p);
        }
    }

    show() {
        if (!this.exploded) {
            this.firework.show(); 
        }
        for (let p of this.particles) {
            p.show();
        }
    }
    
    done() {
        return this.exploded && this.particles.length === 0;
    }
}


// =================================================================
// 步驟三：p5.js 核心設定與繪製邏輯
// -----------------------------------------------------------------

function setup() { 
    createCanvas(windowWidth, windowHeight); 
    colorMode(HSB, 255); 
    gravity = createVector(0, 0.2); 
} 

function draw() { 
    
    // 讓背景帶有一點透明度 (拖尾效果)
    background(0, 0, 0, 25); 

    // 計算分數百分比
    let percentage = (finalScore / maxScore) * 100;

    textSize(80); 
    textAlign(CENTER, CENTER); 
    
    
    // -----------------------------------------------------------------
    // A. 分數顯示與煙火觸發
    // -----------------------------------------------------------------
    
    if (percentage >= 90) {
        fill(85, 255, 255); 
        text("恭喜！優異成績！", width / 2, height / 2 - 50);
        
        // 煙火特效 - 高分時持續發射
        if (random(1) < 0.05) { 
            fireworks.push(new Firework());
        }
        
    } else if (percentage >= 60) {
        fill(40, 255, 255); 
        text("成績良好，請再接再厲。", width / 2, height / 2 - 50);
        
    } else if (percentage > 0) {
        fill(0, 255, 255); 
        text("需要加強努力！", width / 2, height / 2 - 50);
        
    } else {
        // 尚未收到分數 (顯示提示文本)
        fill(255); // 白色
        text(scoreText, width / 2, height / 2);
    }
    
    // 顯示具體分數
    textSize(50);
    fill(255); 
    text(`得分: ${finalScore}/${maxScore}`, width / 2, height / 2 + 50);
    
    
    // -----------------------------------------------------------------
    // B. 更新和顯示煙火
    // -----------------------------------------------------------------
    for (let i = fireworks.length - 1; i >= 0; i--) {
        fireworks[i].update();
        fireworks[i].show();
        
        if (fireworks[i].done()) {
            fireworks.splice(i, 1);
        }
    }
}

// =================================================================
// 步驟四：手動測試模式
// -----------------------------------------------------------------
function keyPressed() {
    // 按下 'T' 鍵時強制觸發高分
    if (key === 't' || key === 'T') {
        finalScore = 95; // 設置一個高分
        maxScore = 100;
        scoreText = `手動測試模式：95/100`;
        console.log("!!! 手動測試模式已啟用 !!!");
    }
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    background(0); 
}
