// Original short brass fanfare, synthesized locally. No audio download is needed.
// Called only from a user gesture; failure never prevents entry to the site.
export function playRoyalFanfare(): () => void {
  const AudioCtor = window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtor) return () => {};
  const ctx = new AudioCtor();
  const master = ctx.createGain();
  master.gain.value = 0.34;
  const limiter = ctx.createDynamicsCompressor();
  limiter.threshold.value = -16;
  limiter.ratio.value = 5;
  master.connect(limiter).connect(ctx.destination);

  const echo = ctx.createDelay(0.5);
  echo.delayTime.value = 0.16;
  const room = ctx.createGain();
  room.gain.value = 0.16;
  master.connect(echo).connect(room).connect(limiter);
  const wave = ctx.createPeriodicWave(new Float32Array(13), new Float32Array([0, 1, .7, .5, .32, .22, .15, .1, .065, .035, .02, .012, .008]));
  const origin = ctx.currentTime + .04;

  function horn(midi: number, offset: number, length: number, level: number) {
    const start = origin + offset;
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.Q.value = .6;
    filter.frequency.setValueAtTime(1000, start);
    filter.frequency.exponentialRampToValueAtTime(4300, start + .06);
    filter.frequency.exponentialRampToValueAtTime(1800, start + length);
    osc.setPeriodicWave(wave);
    osc.frequency.value = 440 * Math.pow(2, (midi - 69) / 12);
    osc.detune.setValueAtTime(-12, start);
    osc.detune.linearRampToValueAtTime(0, start + .04);
    env.gain.setValueAtTime(0, start);
    env.gain.linearRampToValueAtTime(level, start + .025);
    env.gain.linearRampToValueAtTime(level * .8, start + .1);
    env.gain.setValueAtTime(level * .8, start + length - .06);
    env.gain.exponentialRampToValueAtTime(.0001, start + length + .18);
    const vibrato = ctx.createOscillator();
    const depth = ctx.createGain();
    vibrato.frequency.value = 5.1;
    depth.gain.setValueAtTime(0, start);
    depth.gain.linearRampToValueAtTime(5, start + .25);
    vibrato.connect(depth).connect(osc.detune);
    osc.connect(filter).connect(env).connect(master);
    osc.start(start); osc.stop(start + length + .22);
    vibrato.start(start); vibrato.stop(start + length + .22);
  }

  // Trumpet call, response, then a sustained C-major heraldic chord.
  [[67, 0, .22], [67, .28, .22], [72, .58, .48], [76, 1.13, .42], [74, 1.62, .28], [79, 1.98, 1.04]].forEach(([note, time, length]) => horn(note, time, length, .34));
  [[60, .58, .48], [64, 1.13, .42], [62, 1.62, .28], [72, 1.98, 1.04], [64, 1.98, 1.04], [48, 1.98, 1.04]].forEach(([note, time, length]) => horn(note, time, length, .14));

  let closed = false;
  const stop = () => {
    if (closed) return;
    closed = true;
    void ctx.close().catch(() => {});
  };
  void ctx.resume().catch(stop);
  return stop;
}
