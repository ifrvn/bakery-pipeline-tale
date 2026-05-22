<script setup>
import { useRouter } from 'vue-router';

const router = useRouter();

const enterGame = () => {
  router.push('/levels');
};
</script>

<template>
  <div class="landing" @click="enterGame">
    <div class="landing__mask"></div>
    <button class="landing__cta" type="button" @click.stop="enterGame">点击开始</button>
  </div>
</template>

<style scoped lang="scss">
.landing {
  width: 100%;
  height: 100%;
  overflow: hidden;
  position: relative;
  background-image: url('../assets/images/landing_bg.png');
  background-size: cover;
  background-position: center;
  cursor: pointer;

  .landing__mask {
    position: absolute;
    inset: 0;
    background: radial-gradient(circle at 50% 35%, rgba(0, 0, 0, 0.15), rgba(0, 0, 0, 0.55));
  }

  .landing__cta {
    position: absolute;
    bottom: 5rem;
    left: 50%;
    transform: translateX(-50%);
    height: 52px;
    padding: 0 1.6rem;
    border-radius: 14px;
    border: 1px solid rgba(255, 255, 255, 0.25);
    background: rgba(255, 255, 255, 0.16);
    color: rgba(255, 255, 255, 0.92);
    font-weight: 900;
    font-size: 1.1rem;
    cursor: pointer;
    backdrop-filter: blur(6px);
  }
}
</style>
