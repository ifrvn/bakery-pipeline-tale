<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { getLevelConfigsById, getLevelCount } from '@/game/levelConfigs';

const router = useRouter();

const totalLevels = getLevelCount();

const levels = computed(() =>
  Array.from({ length: totalLevels }, (_, i) => {
    const cfg = getLevelConfigsById(i + 1);
    return { id: i + 1, name: `第${i + 1}关：${cfg.levelName}` };
  })
);

const maxUnlockedLevel = ref(1);

onMounted(() => {
  const saved = localStorage.getItem('bakery-max-level');
  if (saved) maxUnlockedLevel.value = parseInt(saved, 10);
});

const selectLevel = (levelId) => {
  if (levelId <= maxUnlockedLevel.value) {
    router.push(`/play/${levelId}`);
  }
};

const goBack = () => {
  router.push('/');
};

const progressText = computed(
  () => `已解锁：${Math.min(maxUnlockedLevel.value, totalLevels)}/${totalLevels}`
);
</script>

<template>
  <div class="levels">
    <div class="levels__header">
      <button class="header__back" type="button" @click="goBack">返回</button>
      <div class="header__title">选择关卡</div>
      <div class="header__progress">
        {{ progressText }}
      </div>
    </div>

    <div class="levels__list">
      <button
        v-for="level in levels"
        :key="level.id"
        type="button"
        class="level"
        :class="{ 'is-locked': level.id > maxUnlockedLevel }"
        @click="selectLevel(level.id)"
      >
        <div class="level__no">
          {{ String(level.id).padStart(2, '0') }}
        </div>
        <div class="level__name">
          {{ level.name }}
        </div>
        <div v-if="level.id > maxUnlockedLevel" class="level__lock">🔒</div>
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.levels {
  width: 100%;
  height: 100%;
  background: linear-gradient(#f7ead6, #e3caa6);
  display: flex;
  flex-direction: column;
  overflow: hidden;

  .levels__header {
    height: 72px;
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: center;
    padding: 0 1rem;
    background-color: rgba(0, 0, 0, 0.55);
    border-bottom: 1px solid rgba(255, 255, 255, 0.12);

    .header__back {
      height: 44px;
      padding: 0 1rem;
      border-radius: 12px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      background-color: rgba(255, 255, 255, 0.12);
      color: rgba(255, 255, 255, 0.92);
      font-weight: 900;
      cursor: pointer;
    }

    .header__title {
      text-align: center;
      font-weight: 900;
      color: rgba(255, 255, 255, 0.92);
      letter-spacing: 0.08em;
      font-size: 1.2rem;
    }

    .header__progress {
      color: rgba(255, 255, 255, 0.75);
      font-weight: 800;
      font-size: 0.95rem;
    }
  }

  .levels__list {
    flex: 1;
    padding: 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    overflow: auto;

    .level {
      height: 86px;
      border-radius: 16px;
      border: 1px solid rgba(0, 0, 0, 0.12);
      background-color: rgba(255, 255, 255, 0.78);
      display: grid;
      grid-template-columns: 72px 1fr auto;
      align-items: center;
      gap: 0.9rem;
      padding: 0 1rem;
      cursor: pointer;
      text-align: left;

      &.is-locked {
        cursor: not-allowed;
        opacity: 0.6;
      }

      .level__no {
        width: 56px;
        height: 56px;
        border-radius: 14px;
        background-color: rgba(145, 215, 93, 0.9);
        border: 1px solid rgba(0, 0, 0, 0.14);
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 900;
        font-variant-numeric: tabular-nums;
        color: rgba(0, 0, 0, 0.75);
      }

      .level__name {
        font-weight: 900;
        color: rgba(40, 20, 8, 0.9);
        font-size: 1.15rem;
        line-height: 1.25;
      }

      .level__lock {
        font-size: 1.25rem;
      }
    }
  }
}
</style>
