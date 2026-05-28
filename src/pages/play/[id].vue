<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { createGameApp } from '~/game/runtime/createGameApp';
import { createGameScene } from '~/game/scenes/createGameScene';
import { getLevelConfigsById, getLevelCount } from '~/game/levelConfigs';
import ControlPanel from '~/components/ControlPanel.vue';

const route = useRoute();
const router = useRouter();

const levelId = computed(() => +route.params.id);

const containerRef = ref(null);
const overlayApiRef = ref(null);
const levelConfig = ref(null);
let app = null;
let off = null;

const createSceneTemp = (ctx) => createGameScene(ctx, levelId.value);

onMounted(() => {
  const factory = createSceneTemp;
  if (!containerRef.value || !factory) return;
  Promise.resolve(createGameApp(containerRef.value, factory)).then((created) => {
    app = created;
    overlayApiRef.value = app.sceneCtl.api;
    levelConfig.value = getLevelConfigsById(levelId.value);
    off = overlayApiRef.value.onStateChange((s) => {
      if (s.status !== 'finished' || s.result !== 'success') return;
      const current = levelId.value;
      if (!Number.isFinite(current)) return;
      const nextUnlocked = Math.min(getLevelCount(), current + 1);
      const saved = localStorage.getItem('bakery-max-level');
      const savedNum = saved ? parseInt(saved, 10) : 1;
      const target = Math.max(savedNum, nextUnlocked);
      localStorage.setItem('bakery-max-level', String(target));
    });
    app.start();
  });
});

onBeforeUnmount(() => {
  off?.();
  off = null;
  app?.dispose();
  app = null;
});

const goBack = () => {
  router.push('/levels');
};
</script>

<template>
  <div class="play">
    <div class="play__layout">
      <div ref="containerRef" class="play__stage"></div>
      <ControlPanel v-if="overlayApiRef" :api="overlayApiRef" :config="levelConfig" />
    </div>
    <button class="play__back" type="button" @click="goBack">返回关卡</button>
  </div>
</template>

<style scoped lang="scss">
.play {
  width: 100%;
  height: 100%;
  overflow: hidden;
  position: relative;
  background-color: #fbf1e2;

  .play__layout {
    width: 100%;
    height: 100%;
    display: flex;
    overflow: hidden;
  }

  .play__stage {
    flex: 1;
    height: 100%;
  }

  .play__back {
    position: absolute;
    top: 14px;
    left: 14px;
    height: 44px;
    padding: 0 1rem;
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    background-color: rgba(0, 0, 0, 0.35);
    color: rgba(255, 255, 255, 0.92);
    font-weight: 900;
    cursor: pointer;
  }
}
</style>
