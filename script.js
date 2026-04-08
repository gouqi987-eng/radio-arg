/**
 * 深夜电台 98.7 - ARG电台交互脚本
 */

class Radio {
    constructor() {
        // 状态
        this.isPoweredOn = false;
        this.currentFrequency = 98.7;
        this.volume = 50;
        this.isTuning = false;

        // 预置频道（可自定义内容）
        this.channels = {
            88.0: { title: '空白的静电', subtitle: '只有沙沙的噪音...' },
            90.5: { title: '远古的回声', subtitle: '来自很久以前的声音' },
            93.2: { title: '深夜热线', subtitle: '有人想和你说话' },
            96.8: { title: '？？？', subtitle: '无法识别的信号' },
            98.7: { title: '找到你了', subtitle: '欢迎来到深夜电台' },
            101.3: { title: '杂音', subtitle: '信号不稳定...' },
            104.7: { title: '另一个频率', subtitle: '这里也有秘密' },
            107.5: { title: '静默', subtitle: '什么都没有' }
        };

        // 关键频率（解密点）
        this.secretFrequency = 98.7;

        // DOM元素
        this.elements = {
            powerLed: document.getElementById('powerLed'),
            frequency: document.getElementById('frequency'),
            dialNeedle: document.getElementById('dialNeedle'),
            channelDisplay: document.getElementById('channelDisplay'),
            channelContent: document.getElementById('channelContent'),
            tuningKnob: document.getElementById('tuningKnob'),
            volumeKnob: document.getElementById('volumeKnob'),
            noiseOverlay: document.getElementById('noiseOverlay'),
            secretPanel: document.getElementById('secretPanel'),
            tuningHint: document.getElementById('tuningHint'),
            dialMarks: document.querySelectorAll('.dial-mark')
        };

        this.init();
    }

    init() {
        this.bindEvents();
        this.updateDialNeedle();
        this.startAmbientEffects();
    }

    bindEvents() {
        // 开机/调频旋钮 - 点击开机，拖动调频
        this.elements.tuningKnob.addEventListener('mousedown', (e) => this.startTuning(e));
        this.elements.tuningKnob.addEventListener('touchstart', (e) => this.startTuning(e));

        // 音量旋钮
        this.elements.volumeKnob.addEventListener('mousedown', (e) => this.adjustVolume(e));
        this.elements.volumeKnob.addEventListener('touchstart', (e) => this.adjustVolume(e));

        // 点击频道显示屏也可以开机
        this.elements.channelDisplay.addEventListener('click', () => this.togglePower());

        // 全局鼠标/触摸移动和抬起
        document.addEventListener('mousemove', (e) => this.onDrag(e));
        document.addEventListener('mouseup', () => this.stopDrag());
        document.addEventListener('touchmove', (e) => this.onDrag(e));
        document.addEventListener('touchend', () => this.stopDrag());
    }

    togglePower() {
        this.isPoweredOn = !this.isPoweredOn;

        if (this.isPoweredOn) {
            this.elements.powerLed.classList.add('on');
            this.elements.channelDisplay.classList.remove('static-strong');
            this.elements.tuningHint.classList.add('visible');
            this.updateChannel();
        } else {
            this.elements.powerLed.classList.remove('on');
            this.elements.channelDisplay.classList.add('static-strong');
            this.elements.tuningHint.classList.remove('visible');
            this.elements.channelContent.innerHTML = `
                <div class="broadcast-info">
                    <span class="broadcast-title">等待调频...</span>
                    <span class="broadcast-subtitle"></span>
                </div>
            `;
        }
    }

    startTuning(e) {
        if (!this.isPoweredOn) {
            this.togglePower();
        }
        this.isTuning = true;
        this.tuningStartY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;
        this.tuningStartFreq = this.currentFrequency;
        document.body.classList.add('tuning');
        this.elements.tuningHint.textContent = '旋转调频中...';
    }

    onDrag(e) {
        if (!this.isTuning) return;

        const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;
        const deltaY = this.tuningStartY - clientY;
        const freqDelta = deltaY * 0.05; // 灵敏度

        this.currentFrequency = Math.max(88, Math.min(108, this.tuningStartFreq + freqDelta));
        this.updateFrequency();
        this.updateChannel();
    }

    stopDrag() {
        if (this.isTuning) {
            this.isTuning = false;
            document.body.classList.remove('tuning');
            this.checkSecretFrequency();
            this.elements.tuningHint.textContent = '旋转旋钮来调频...';
        }
    }

    adjustVolume(e) {
        const rect = this.elements.volumeKnob.getBoundingClientRect();
        const centerY = rect.top + rect.height / 2;
        const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;

        // 简化：上下滑动调整音量
        const delta = this.tuningStartY - clientY;
        this.volume = Math.max(0, Math.min(100, this.volume + delta * 0.5));

        // 音量影响静电强度
        const noiseLevel = this.volume > 70 ? 'static-weak' : (this.volume > 30 ? 'static-medium' : 'static-strong');
        this.elements.channelDisplay.classList.remove('static-strong', 'static-medium', 'static-weak');
        if (!this.isPoweredOn) {
            this.elements.channelDisplay.classList.add(noiseLevel);
        }

        this.tuningStartY = clientY;
    }

    updateFrequency() {
        this.elements.frequency.textContent = this.currentFrequency.toFixed(1);
        this.updateDialNeedle();
    }

    updateDialNeedle() {
        // 将频率映射到刻度盘位置 (88-108 -> 0-100%)
        const percent = (this.currentFrequency - 88) / (108 - 88) * 100;
        const dialWidth = this.elements.dialNeedle.parentElement.offsetWidth - 40;
        const position = (percent / 100) * dialWidth;
        this.elements.dialNeedle.style.left = `${position + 20}px`;
    }

    updateChannel() {
        if (!this.isPoweredOn) return;

        // 找到最近的预置频道
        const freqs = Object.keys(this.channels).map(Number);
        let closestFreq = freqs[0];
        let minDist = Math.abs(this.currentFrequency - closestFreq);

        for (const freq of freqs) {
            const dist = Math.abs(this.currentFrequency - freq);
            if (dist < minDist) {
                minDist = dist;
                closestFreq = freq;
            }
        }

        const channel = this.channels[closestFreq];
        const dist = Math.abs(this.currentFrequency - closestFreq);

        // 根据距离决定信号强度
        if (dist < 0.3) {
            // 信号很强
            this.elements.channelContent.innerHTML = `
                <div class="broadcast-info">
                    <span class="broadcast-title">${channel.title}</span>
                    <span class="broadcast-subtitle">${channel.subtitle}</span>
                </div>
            `;
        } else if (dist < 1.5) {
            // 信号弱，有杂音
            this.elements.channelContent.innerHTML = `
                <div class="broadcast-info" style="opacity: 0.6">
                    <span class="broadcast-title">${channel.title}</span>
                    <span class="broadcast-subtitle">${channel.subtitle}</span>
                </div>
            `;
        } else {
            // 几乎只有静电
            this.elements.channelContent.innerHTML = `
                <div class="broadcast-info" style="opacity: 0.3">
                    <span class="broadcast-title">. . . . .</span>
                    <span class="broadcast-subtitle">信号搜索中...</span>
                </div>
            `;
        }

        // 更新刻度盘高亮
        this.elements.dialMarks.forEach(mark => {
            const markVal = parseInt(mark.textContent);
            if (Math.abs(markVal - this.currentFrequency) < 2) {
                mark.classList.add('active');
            } else {
                mark.classList.remove('active');
            }
        });
    }

    checkSecretFrequency() {
        // 检查是否调到了关键频率
        if (Math.abs(this.currentFrequency - this.secretFrequency) < 0.2) {
            // 发现秘密！
            this.showSecret();
        }
    }

    showSecret() {
        this.elements.secretPanel.style.display = 'flex';
        // 可以添加音效
    }

    startAmbientEffects() {
        // 随机静电闪烁
        setInterval(() => {
            if (Math.random() > 0.7 && this.isPoweredOn) {
                this.elements.channelDisplay.style.opacity = '0.95';
                setTimeout(() => {
                    this.elements.channelDisplay.style.opacity = '1';
                }, 50);
            }
        }, 500);
    }
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    window.radio = new Radio();
});
