// =================================================================
// 步驟一：模擬成績數據接收 - 確保變數為全域
// -----------------------------------------------------------------

let finalScore = 0; 
let maxScore = 1; // 預設最大分數設為 1，避免分母為 0
let scoreText = "等待 H5P 成績..."; 

// 全域變數 - 粒子系統所需
let fireworks = []; // 儲存所有煙火物件的陣列
let gravity;        // 重力向量

// 監聽來自 H5P iFrame 的 postMessage 事件
window.addEventListener('message', function (event) {
    // 執行來源驗證... 
    // 這裡省略了來源驗證，以確保功能性
    
    const data = event.data;
    
    if (data && data.type === 'H5P_SCORE_RESULT') {
        
        // !!! 關鍵步驟：更新全域變數 !!!
        finalScore = data.score; 
        maxScore = data.maxScore > 0 ? data.maxScore : 1; // 避免 maxScore 為 0
        scoreText = `最終成績分數: ${finalScore}/${maxScore}`;
        
        console.log("新的分數已接收:", scoreText); 
        
        // 由於 setup() 中已啟用 loop()，這裡不需要手動呼叫 redraw()
    }
}, false);


// =================================================================
// 步驟二：Particle 和 Firework 類別 (煙火粒子系統)
// -----------------------------------------------------------------

// 單個粒子，可以是未爆炸的火箭（Firework）或爆炸後的碎片（Particle）
class Particle {
    constructor(x, y, hu, isFirework) {
        this.pos = createVector(x, y);
        this.isFirework = isFirework; // 是否為火箭（未爆炸）
        this.lifespan = 255;
        this.hu = hu; // 色相值 (Hue)
        
        if (this.isFirework) {
            // 火箭向上發射，垂直速度為負
            this.vel = createVector(0, random(-15, -10)); 
        } else {
            // 爆炸碎片，向四周發散
            this.vel = p5.Vector.random2D();
            this.vel.mult(random(2, 10));
        }
        this.acc = createVector(0, 0);
    }

    applyForce(force) {
        this.acc.add(force);
    }

    update() {
        if (!this.isFirework) {
            // 碎片會逐漸減速並消失 (模擬空氣阻力和燃燒殆盡)
            this.vel.mult(0.9); 
            this.lifespan -= 4; // 減少壽命 (透明度)
        }
        this.vel.add(this.acc);
        this.pos.add(this.vel);
        this.acc.mult(0); // 重設加速度
    }

    show() {
        // 設定發光效果 (使用 drawingContext)
        drawingContext.shadowBlur = this.isFirework ? 10 : 8;
        
        // 切換到 HSB 顏色模式以實現鮮豔的顏色變化
        colorMode(HSB); 
        
        if (this.isFirework) {
            // 火箭的軌跡
            strokeWeight(4);
            stroke(this.hu, 255, 255); 
            drawingContext.shadowColor = color(this.hu, 255, 255).toString();
        } else {
            // 爆炸後的碎片
            strokeWeight(2);
            stroke(this.hu, 255, 255, this.lifespan);
            drawingContext.shadowColor = color(this.hu, 255, 255).toString();
        }
        point(this.pos.x, this.pos.y);
        
        colorMode(RGB); // 切換回 RGB
        drawingContext.shadowBlur = 0; // 重設發光效果
    }

    done() {
        return this.lifespan < 0;
    }
}

// 煙火 (包含一個火箭粒子和爆炸後的碎片粒子陣列)
class Firework {
    constructor() {
        this.hu = random(255); // 隨機顏色
        // 在底部隨機 X 位置創建一個火箭粒子
        this.firework = new Particle(random(width), height, this.hu, true); 
        this.exploded = false;
        this.particles = [];
    }

    update() {
        if (!this.exploded) {
            this.firework.applyForce(gravity); // 施加重力
            this.firework.update();

            // 當火箭速度開始轉為正 (開始下降) 時，觸發爆炸
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
        // 煙火完成 (火箭已爆炸且所有碎片都已消失)
        return this.exploded && this.particles.length === 0;
    }
}


// =================================================================
// 步驟三：p5.js 核心設定與繪製邏輯
// -----------------------------------------------------------------

function setup() { 
    // 創建一個與窗口大小相同的畫布，以獲得最佳視覺效果
    createCanvas(windowWidth, windowHeight); 
    background(0); // 黑色背景，適合煙火
    
    // 定義重力向量，向下 (Y 軸正方向)
    gravity = createVector(0, 0.2); 
    
    // !!! 關鍵：確保 draw() 持續循環以實現動畫 !!!
    // 如果原代碼中有 noLoop(); 請確保它已被移除或註釋掉。
} 

function draw() { 
    
    // 讓背景帶有一點透明度，以產生粒子移動的拖尾效果
    // 數值越小，拖尾越長
    background(0, 0, 0, 25); 

    // 計算分數百分比
    let percentage = (finalScore / maxScore) * 100;

    textSize(80); 
    textAlign(CENTER);
    
    // -----------------------------------------------------------------
    // A. 分數顯示與煙火觸發
    // -----------------------------------------------------------------
    if (percentage >= 90) {
        // 滿分或高分：顯示鼓勵文本
        fill(0, 255, 50); // 鮮豔綠色
        text("恭喜！優異成績！", width / 2, height / 2 - 50);
        
        // -----------------------------------------------------------------
        // C. 煙火特效 - 高分時持續發射
        // -----------------------------------------------------------------
        // 每次循環有 2% 機率發射新煙火，持續提供視覺回饋
        if (random(1) < 0.02) { 
            fireworks.push(new Firework());
        }
        
    } else if (percentage >= 60) {
        // 中等分數：顯示一般文本
        fill(255, 181, 35); // 橘黃色
        text("成績良好，請再接再厲。", width / 2, height / 2 - 50);
        
    } else if (percentage > 0) {
        // 低分：顯示警示文本
        fill(200, 0, 0); // 紅色
        text("需要加強努力！", width / 2, height / 2 - 50);
        
    } else {
        // 尚未收到分數或分數為 0
        fill(150);
        text(scoreText, width / 2, height / 2);
    }
    
    // -----------------------------------------------------------------
    // 更新和顯示煙火
    // -----------------------------------------------------------------
    for (let i = fireworks.length - 1; i >= 0; i--) {
        fireworks[i].update();
        fireworks[i].show();
        
        // 移除已完成的煙火
        if (fireworks[i].done()) {
            fireworks.splice(i, 1);
        }
    }


    // 顯示具體分數
    textSize(50);
    fill(255); // 白色，確保在黑色背景上可見
    text(`得分: ${finalScore}/${maxScore}`, width / 2, height / 2 + 50);
    
    
    // -----------------------------------------------------------------
    // B. 根據分數觸發不同的幾何圖形反映 (可選視覺效果)
    // -----------------------------------------------------------------
    
    if (percentage >= 90) {
        // 畫一個 pulsing 的圓圈
        let pulseSize = 150 + sin(frameCount * 0.1) * 20;
        fill(0, 200, 50, 80); // 淺綠色，高透明度
        noStroke();
        circle(width / 2, height / 2 + 150, pulseSize);
        
    } else if (percentage >= 60) {
        // 畫一個旋轉的方形
        push(); // 儲存當前繪圖狀態
        translate(width / 2, height / 2 + 150); // 移動原點
        rotate(frameCount * 0.01); // 旋轉
        fill(255, 181, 35, 150);
        rectMode(CENTER);
        rect(0, 0, 150, 150);
        pop(); // 恢復繪圖狀態
    }
}

// 確保在視窗大小改變時重設畫布大小
function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    background(0); // 重設背景
}
