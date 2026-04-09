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
            90.5: { title: '有人想和你聊聊', subtitle: '来自很久以前的声音' },
            93.2: { title: '一首很熟悉的歌', subtitle: '来自很久以前的声音' },
            96.8: { title: '一首俄语反战歌曲', subtitle: '无法识别的信号' },
            98.7: { title: '奇怪的声音', subtitle: '欢迎来到深夜电台' },
            101.3: { title: '杂音', subtitle: '信号不稳定...' },
            104.7: { title: '另一个频率', subtitle: '这里也有秘密' },
            107.5: { title: '找到了？！', subtitle: '' }
        };

        // 104.7语音内容
        this.channel104Voice = 'She is not mine. Stay away from her.';

        // 关键频率（解密点）
        this.secretFrequency = 107.5;

        // DOM元素
        this.elements = {
            powerLed: document.getElementById('powerLed'),
            frequency: document.getElementById('frequency'),
            dialNeedle: document.getElementById('dialNeedle'),
            channelDisplay: document.getElementById('channelDisplay'),
            channelContent: document.getElementById('channelContent'),
            noiseOverlay: document.getElementById('noiseOverlay'),
            secretPanel: document.getElementById('secretPanel'),
            tuningHint: document.getElementById('tuningHint'),
            dialMarks: document.querySelectorAll('.dial-mark'),
            audio: document.getElementById('radioAudio'),
            channelAudio: document.getElementById('channelAudio'),
            realityAudio: document.getElementById('realityAudio'),
            lubeAudio: document.getElementById('lubeAudio'),
            morseAudio: document.getElementById('morseAudio'),
            channel98Audio: document.getElementById('channel98Audio'),
            bgnoiseAudio: document.getElementById('bgnoiseAudio')
        };

        this.init();
    }

    init() {
        this.bindEvents();
        this.updateDialNeedle();
        this.startAmbientEffects();
    }

    bindEvents() {
        // 点击屏幕开机，左右滑动调频
        document.addEventListener('mousedown', (e) => this.startTuning(e));
        document.addEventListener('touchstart', (e) => this.startTuning(e));

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
            this.elements.audio.volume = this.volume / 100;
            this.elements.audio.play().catch(() => {});
            this.elements.channelAudio.volume = 0;
            this.elements.realityAudio.volume = 0;
            this.elements.lubeAudio.volume = 0;
            this.elements.morseAudio.volume = 0;
            this.elements.channel98Audio.volume = 0;
            this.elements.bgnoiseAudio.volume = 0;
            this.updateChannel();
        } else {
            this.elements.powerLed.classList.remove('on');
            this.elements.channelDisplay.classList.add('static-strong');
            this.elements.tuningHint.classList.remove('visible');
            this.elements.audio.pause();
            this.elements.bgnoiseAudio.pause();
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
        // 左右滑动，所以用clientX
        this.tuningStartX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
        this.tuningStartFreq = this.currentFrequency;
        document.body.classList.add('tuning');
        this.elements.tuningHint.textContent = '左右滑动调频...';
    }

    onDrag(e) {
        if (!this.isTuning) return;

        // 左右滑动，所以用clientX
        const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
        const deltaX = clientX - this.tuningStartX;
        const freqDelta = deltaX * 0.05; // 灵敏度

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

    setChannelAudio(freq, vol) {
        // 重置所有音频
        this.elements.audio.volume = 0;
        this.elements.channelAudio.volume = 0;
        this.elements.realityAudio.volume = 0;
        this.elements.lubeAudio.volume = 0;
        this.elements.morseAudio.volume = 0;
        this.elements.channel98Audio.volume = 0;
        this.elements.bgnoiseAudio.volume = 0;

        // 根据频道播放对应音频
        if (freq === 90.5) {
            this.elements.channelAudio.volume = vol;
            this.elements.channelAudio.play().catch(() => {});
        } else if (freq === 93.2) {
            this.elements.realityAudio.volume = vol;
            this.elements.realityAudio.play().catch(() => {});
        } else if (freq === 96.8) {
            this.elements.lubeAudio.volume = vol;
            this.elements.lubeAudio.play().catch(() => {});
        } else if (freq === 98.7) {
            // 98.7播放指定音频
            this.elements.channel98Audio.volume = vol;
            this.elements.channel98Audio.play().catch(() => {});
            return;
        } else if (freq === 107.5) {
            // 107.5 跳转生日网站
            this.showBirthdayLink();
        } else if (freq === 104.7) {
            // 104.7播放语音（人声加大）
            window.voiceGenerator.speak(this.channel104Voice, Math.min(vol * 1.5, 1));
        } else {
            this.elements.audio.volume = vol;
        }

        // 所有频道都叠加背景杂音
        if (freq !== 107.5) {
            this.elements.bgnoiseAudio.volume = vol * 0.5;
            this.elements.bgnoiseAudio.play().catch(() => {});
        }
    }

    showBirthdayLink() {
        // 显示跳转提示
        this.elements.channelContent.innerHTML = `
            <div class="birthday-link" onclick="window.open('https://gouqi987-eng.github.io/beihai-birthday/', '_blank')">
                <h2>找到了？！</h2>
            </div>
        `;
    }

    stopAllAudio() {
        this.elements.audio.pause();
        this.elements.channelAudio.pause();
        this.elements.realityAudio.pause();
        this.elements.lubeAudio.pause();
        this.elements.morseAudio.pause();
        this.elements.audio.currentTime = 0;
        this.elements.channelAudio.currentTime = 0;
        this.elements.realityAudio.currentTime = 0;
        this.elements.lubeAudio.currentTime = 0;
        this.elements.morseAudio.currentTime = 0;
        this.elements.channel98Audio.currentTime = 0;
        this.elements.bgnoiseAudio.currentTime = 0;
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
            // 信号很强 - 音频清晰，但有轻微背景杂音
            this.elements.channelContent.innerHTML = `
                <div class="broadcast-info">
                    <span class="broadcast-title">${channel.title}</span>
                    <span class="broadcast-subtitle">${channel.subtitle}</span>
                </div>
            `;
            const vol = (this.volume / 100) * (1 - dist * 0.5);
            this.setChannelAudio(closestFreq, vol);
            this.elements.channelDisplay.classList.add('signal-strong');
        } else if (dist < 1.5) {
            // 信号弱，有杂音 - 音量降低，杂音增强
            this.elements.channelContent.innerHTML = `
                <div class="broadcast-info" style="opacity: 0.6">
                    <span class="broadcast-title">${channel.title}</span>
                    <span class="broadcast-subtitle">${channel.subtitle}</span>
                </div>
            `;
            const vol = (this.volume / 100) * 0.4;
            this.setChannelAudio(closestFreq, vol);
            this.elements.channelDisplay.classList.add('signal-weak');
            this.elements.channelDisplay.classList.remove('signal-strong');
        } else {
            // 几乎只有静电 - 几乎无声，强杂音
            this.elements.channelContent.innerHTML = `
                <div class="broadcast-info" style="opacity: 0.3">
                    <span class="broadcast-title">. . . . .</span>
                    <span class="broadcast-subtitle">信号搜索中...</span>
                </div>
            `;
            this.setChannelAudio(closestFreq, (this.volume / 100) * 0.1);
            this.elements.channelDisplay.classList.add('signal-weak');
            this.elements.channelDisplay.classList.remove('signal-strong');
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
        // 隐藏频道98.7已改为播放莫尔斯电码，不弹出提示
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
