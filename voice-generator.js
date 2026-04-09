/**
 * 语音生成器 - 生成清晰人声
 */

class VoiceGenerator {
    constructor() {
        this.audioContext = null;
        this.isPlaying = false;
        this.nodes = [];
        this.utterance = null;
    }

    init() {
        if (this.audioContext) return;
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }

    speak(text, vol = 0.5) {
        this.stop();
        this.init();
        this.isPlaying = true;

        // 使用 SpeechSynthesis 生成语音
        if ('speechSynthesis' in window) {
            this.utterance = new SpeechSynthesisUtterance(text);
            this.utterance.rate = 0.9;
            this.utterance.pitch = 0.8;
            this.utterance.volume = vol;

            this.utterance.onend = () => {
                this.stop();
            };

            this.utterance.onerror = () => {
                this.stop();
            };

            // 直接使用语音合成（无音效干扰）
            window.speechSynthesis.speak(this.utterance);
        }
    }

    stop() {
        this.isPlaying = false;

        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }

        this.nodes.forEach(node => {
            try { node.stop(); } catch(e) {}
            try { node.disconnect(); } catch(e) {}
        });
        this.nodes = [];
    }

    setVolume(vol) {
        if (this.utterance) {
            this.utterance.volume = vol;
        }
    }
}

window.voiceGenerator = new VoiceGenerator();
