// =================================================================
// 步驟一：模擬成績數據接收 (保持不變)
// -----------------------------------------------------------------


// 確保這是全域變數
let finalScore = 0; 
let maxScore = 0;
let scoreText = ""; // 用於 p5.js 繪圖的文字

// 全域變數 - 粒子系統所需
let fireworks = []; // 儲存所有煙火物件的陣列
let gravity;        // 重力向量


window.addEventListener('message', function (event) {
    // 執行來源驗證...
    // ...
    const data = event.data;
    
    if (data && data.type === 'H5P_SCORE_RESULT') {
        
        // !!! 關鍵步驟：更新全域變數 !!!
        finalScore = data.score; // 更新全域變數
        maxScore = data.maxScore;
        scoreText = `最終成績分數: ${finalScore}/${maxScore}`;
        
        console.log("新的分數已接收:", scoreText); 
        
        // ----------------------------------------
        // 關鍵步驟 2: 呼叫重新繪製 (見方案二)
        // ----------------------------------------
        if (typeof redraw === 'function') {
            // 由於 draw() 會在 loop() 中自動執行，我們只需確保 setup 後有 loop()
            // 如果 setup 中啟用了 loop()，這裡的 redraw() 就不再需要，但保留以防萬一。
            redraw(); 
        }
    }
}, false);


// =================================================================
// 步驟三：Particle 和 Firework 類別 (新增部分)
// -----------------------------------------------------------------

// 單個粒子，可以是未爆炸的火箭（Firework）或爆炸後的碎片（Particle）
class Particle {
    constructor(x, y, hu, isFirework) {
        this.pos = createVector(x, y);
        this.isFirework = isFirework; // 是否為火箭（未爆炸）
        this.lifespan = 255;
        this.hu = hu;
        
        if (this.isFirework) {
            // 火箭向上發射，垂直速度為負
            this.vel = createVector(0, random(-12, -8)); 
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
        colorMode(HSB); // 暫時切換到 HSB 模式
        if (this.isFirework) {
            // 火箭的軌跡
            strokeWeight(4);
            stroke(this.hu, 255, 255); 
        } else {
            // 爆炸後的碎片
            strokeWeight(2);
            stroke(this.hu, 255, 255, this.lifespan);
        }
        point(this.pos.x, this.pos.y);
        colorMode(RGB); // 切換回 RGB
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
// 步驟二：使用 p5.js 繪製分數 (在網頁 Canvas 上顯示)
// -----------------------------------------------------------------

function setup() { 
    createCanvas(windowWidth, windowHeight); // 擴大畫布以獲得更好的煙火效果
    background(255); 
    // 定義重力向量，向下 (Y 軸正方向)
    gravity = createVector(0, 0.2); 
    
    // !!! 關鍵：移除 noLoop()，讓 draw() 持續循環以實現動畫 !!!
    // noLoop(); 
} 

// score_display.js 中的 draw() 函數片段

function draw() { 
    // 讓背景帶有一點透明度 (trail effect)
    background(0, 0, 0, 50); // 黑底，帶透明度

    // 計算百分比
    let percentage = (finalScore / maxScore) * 100;

    textSize(80); 
    textAlign(CENTER);
    
    // -----------------------------------------------------------------
    // A. 根據分數區間改變文本顏色和內容 (畫面反映一)
    // -----------------------------------------------------------------
    if (percentage >= 90) {
        // 滿分或高分：顯示鼓勵文本，使用鮮豔顏色
        fill(0, 200, 50); // 綠色 [6]
        text("恭喜！優異成績！", width / 2, height / 2 - 50);
        
        // -----------------------------------------------------------------
        // C. 煙火特效 (新增部分)
        // -----------------------------------------------------------------
        // 隨機發射煙火 (機率控制)
        if (random(1) < 0.05) { // 每次循環有 5% 機率發射新煙火
            fireworks.push(new Firework());
        }
        
    } else if (percentage >= 60) {
        // 中等分數：顯示一般文本，使用黃色 [6]
        fill(255, 181, 35); 
        text("成績良好，請再接再厲。", width / 2, height / 2 - 50);
        
    } else if (percentage > 0) {
        // 低分：顯示警示文本，使用紅色 [6]
        fill(200, 0, 0); 
        text("需要加強努力！", width / 2, height / 2 - 50);
        
    } else {
        // 尚未收到分數或分數為 0
        fill(150);
        text(scoreText, width / 2, height / 2);
    }
    
    // -----------------------------------------------------------------
    // 更新和顯示煙火 (新增部分)
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
    fill(255); // 為了在黑底上顯示，改為白色
    text(`得分: ${finalScore}/${maxScore}`, width / 2, height / 2 + 50);
    
    
    // -----------------------------------------------------------------
    // B. 根據分數觸發不同的幾何圖形反映 (畫面反映二)
    // -----------------------------------------------------------------
    
    if (percentage >= 90) {
        // 畫一個大圓圈代表完美 [7] (在黑底上調整顏色和透明度)
        fill(0, 200, 50, 50); // 淺綠色，高透明度
        noStroke();
        circle(width / 2, height / 2 + 150, 150);
        
    } else if (percentage >= 60) {
        // 畫一個方形 [4]
        fill(255, 181, 35, 150);
        rectMode(CENTER);
        rect(width / 2, height / 2 + 150, 150, 150);
    }
    
    // ... 其他幾何圖形反映可以保留或移除
}
