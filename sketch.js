// =================================================================
// 步驟一：模擬成績數據接收 - 確保變數為全域
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
    
    if (data && data.type === 'H5P_SCORE_RESULT') {
        
        // !!! 關鍵步驟：更新全域變數 !!!
        finalScore = data.score; 
        maxScore = data.maxScore > 0 ? data.maxScore : 1; 
        scoreText = `最終成績分數: ${finalScore}/${maxScore}`;
        
        console.log("新的分數已接收:", scoreText); 
    }
}, false);


// =================================================================
// 步驟二：Particle 和 Firework 類別 (煙火粒子系統)
// -----------------------------------------------------------------

// 單個粒子 (Particle) 類別
class Particle {
    constructor(x, y, hu, isFirework) {
        // 使用 p5.js 的 createVector 確保向量運算可用
        this.pos = createVector(x, y); 
        this.isFirework = isFirework;
        this.lifespan = 255;
        this.hu = hu; 
        this.acc = createVector(0, 0);

        if (this.isFirework) {
            // 火箭向上發射
            this.vel = createVector(0, random(-15, -10)); 
        } else {
            // 爆炸碎片，向四周發散
            this.vel = p5.Vector.random2D();
            this.vel.mult(random(1, 8)); // 碎片速度調整得稍慢
        }
    }

    applyForce(force) {
        this.acc.add(force);
    }

    update() {
        if (!this.isFirework) {
            // 碎片會逐漸減速並消失
            this.vel.mult(0.9); 
            this.lifespan -= 4; 
        }
        this.vel.add(this.acc);
        this.pos.add(this.vel);
        this.acc.mult(0); // 重設加速度
    }

    show() {
        // 使用 drawingContext 實現發光效果
        drawingContext.shadowBlur = this.isFirework ? 10 : 6;
        drawingContext.shadowColor = color(this.hu, 255, 255).toString();
        
        if (this.isFirework) {
            strokeWeight(4);
            stroke(this.hu, 255, 255); 
        } else {
            strokeWeight(2);
            // 碎片透明度隨壽命減少
            stroke(this.hu, 255, 255, this.lifespan);
        }
        point(this.pos.x, this.pos.y);
        
        drawingContext.shadowBlur = 0; // 重設發光效果
    }

    done() {
        return this.lifespan < 0;
    }
}

// 煙火 (Firework) 類別
class Firework {
    constructor() {
        this.hu = random(255); 
        // 在底部隨機 X 位置創建火箭
        this.firework = new Particle(random(width), height, this.hu, true); 
        this.exploded = false;
        this.particles = [];
    }

    update() {
        if (!this.exploded) {
            this.firework.applyForce(gravity); 
            this.firework.update();

            // 觸發爆炸
            if (this.firework.vel.y >= 0) {
                this.exploded = true;
                this.explode();
            }
        }

        // 更新爆炸後的碎片粒子
        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].applyForce(gravity);
            this.particles[i].update();
            if (this.particles[i].done()) {
                this.particles.splice(i, 1);
            }
        }
    }

    explode() {
        // 產生 100 個碎片粒子
        for (let i = 0; i < 100; i++) {
            let p = new Particle(this.firework.pos.x, this.firework.pos.y, this.hu, false);
            this.particles.push(p);
        }
    }

    show() {
        if (!this.exploded) {
            this.firework.show(); // 顯示火箭
        }
        // 顯示所有碎片粒子
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
    // 使用 window.innerWidth/Height 確保畫布填滿整個視窗
    createCanvas(windowWidth, windowHeight); 
    
    // 設定 HSB 顏色模式，用於煙火的色相調整
    colorMode(HSB, 255); 
    
    // 定義重力向量，向下 (Y 軸正方向)
    gravity = createVector(0, 0.2); 
    
    // 讓 draw() 持續循環以實現動畫，這是關鍵
    // 如果您原有的程式碼中有 noLoop(); 請確保它已不存在或被註釋
} 

function draw() { 
    
    // 讓背景帶有一點透明度 (trail effect)，數值 25 提供了適中的拖尾效果
    background(0, 0, 0, 25); 

    // 計算分數百分比
    let percentage = (finalScore / maxScore) * 100;

    textSize(80); 
    textAlign(CENTER, CENTER); // 確保文字在中心對齊
    
    // -----------------------------------------------------------------
    // A. 分數顯示與煙火觸發
    // -----------------------------------------------------------------
    
    // 確保分數文字在黑底上可見，先設定白色
    fill(255);
    
    if (percentage >= 90) {
        // 高分：顯示鼓勵文本 (使用高亮度顏色)
        fill(85, 255, 255); // HSB: 綠色/黃色
        text("恭喜！優異成績！", width / 2, height / 2 - 50);
        
        // 煙火特效 - 高分時持續發射
        if (random(1) < 0.05) { // 提高發射機率，讓效果更明顯
            fireworks.push(new Firework());
        }
        
    } else if (percentage >= 60) {
        // 中等分數
        fill(40, 255, 255); // HSB: 橘黃色
        text("成績良好，請再接再厲。", width / 2, height / 2 - 50);
        
    } else if (percentage > 0) {
        // 低分
        fill(0, 255, 255); // HSB: 紅色
        text("需要加強努力！", width / 2, height / 2 - 50);
        
    } else {
        // 尚未收到分數
        fill(150);
        text(scoreText, width / 2, height / 2);
    }
    
    // 顯示具體分數（在黑底上設為白色）
    textSize(50);
    fill(255); 
    text(`得分: ${finalScore}/${maxScore}`, width / 2, height / 2 + 50);
    
    
    // -----------------------------------------------------------------
    // B. 更新和顯示煙火
    // -----------------------------------------------------------------
    for (let i = fireworks.length - 1; i >= 0; i--) {
        fireworks[i].update();
        fireworks[i].show();
        
        // 移除已完成的煙火
        if (fireworks[i].done()) {
            fireworks.splice(i, 1);
        }
    }
}

// 確保在視窗大小改變時重設畫布大小
function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    background(0); 
}
