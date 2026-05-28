<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { VueDraggable } from 'vue-draggable-plus';
import OpCard from './OpCard.vue';

const props = defineProps({
  api: {
    type: Object,
    required: true,
  },
  config: {
    type: Object,
    required: true,
  },
  onNextLevel: {
    type: Function,
    default: null,
  },
  onReplay: {
    type: Function,
    default: null,
  },
});

const steps = ref([]);
const state = ref(props.api.getState());
let off = null;

let nextStepId = 1;

const isIdle = computed(() => state.value.status === 'idle');

onMounted(() => {
  off = props.api.onStateChange((s) => {
    state.value = s;
  });
});

onBeforeUnmount(() => {
  off?.();
  off = null;
});

/**
 * Called when a card is cloned from the palette into the program list.
 * vue-draggable-plus passes the original item; we assign a unique id here.
 */
function makeStep(card) {
  const step = { id: nextStepId++, title: card.title };
  if (card.title === 'jump') step.target = 1;
  return step;
}

function onClone(item) {
  return makeStep(item);
}

function addByClick(card) {
  if (!isIdle.value) return;
  steps.value = [...steps.value, makeStep(card)];
}

function removeStep(stepId) {
  if (!isIdle.value) return;
  steps.value = steps.value.filter((s) => s.id !== stepId);
}

function clearProgram() {
  if (!isIdle.value) return;
  steps.value = [];
}

const programOps = computed(() =>
  steps.value.map((s) => (s.target !== undefined ? { title: s.title, target: s.target } : { title: s.title }))
);

function play() {
  if (!isIdle.value) return;
  props.api.play(programOps.value);
}

function reset() {
  props.api.reset();
  clearProgram();
}
</script>

<template>
  <div class="overlay">
    <!-- 指令卡片区（拖拽源，clone 模式） -->
    <VueDraggable
      class="card-wrap"
      :model-value="config.availableOps"
      :group="{ name: 'ops', pull: 'clone', put: false }"
      :sort="false"
      :disabled="!isIdle"
      :clone="onClone"
    >
      <OpCard
        v-for="card in config.availableOps"
        :key="card.title"
        :title="card.title"
        :sub-title="card.subTitle"
        :disabled="!isIdle"
        @click="addByClick(card)"
      />
    </VueDraggable>

    <!-- 右侧面板区 -->
    <div class="panel-wrap">
      <div class="panel__header">
        {{ config.levelName }}
      </div>
      <div class="panel__body">
        <div class="panel__mission">
          {{ config.levelDesc }}
        </div>

        <!-- 程序列表（拖拽目标，可排序） -->
        <VueDraggable
          v-model="steps"
          class="panel__program"
          :group="{ name: 'ops', pull: false, put: true }"
          :disabled="!isIdle"
          handle=".row__handle"
          ghost-class="row--ghost"
        >
          <div v-if="steps.length === 0" class="program__empty">把指令卡片拖进来</div>
          <div
            v-for="(step, index) in steps"
            :key="step.id"
            class="program__row"
            :class="{
              'is-active': state.status === 'running' && state.pointer === index,
            }"
          >
            <span class="row__handle" :class="{ 'is-disabled': !isIdle }" title="拖动排序">⠿</span>
            <div class="row__no">
              {{ String(index + 1).padStart(2, '0') }}
            </div>
            <div class="row__cmd">
              <div class="card-title">{{ step.title }}</div>
              <input
                v-if="step.title === 'jump'"
                v-model.number="step.target"
                class="jump-target"
                type="number"
                min="1"
                :max="steps.length"
                :disabled="!isIdle"
                title="跳转到第几步"
              />
            </div>
            <button class="row__remove" type="button" :disabled="!isIdle" @click="removeStep(step.id)">×</button>
          </div>
        </VueDraggable>

        <div
          v-if="state.status === 'finished'"
          class="panel__result"
          :class="{
            'is-success': state.result === 'success',
            'is-fail': state.result === 'fail',
          }"
        >
          <div class="result__message">{{ state.message }}</div>
          <div class="result__actions">
            <button
              v-if="state.result === 'success' && onNextLevel"
              class="result__btn result__btn--next"
              type="button"
              @click="onNextLevel"
            >
              下一关 →
            </button>
            <button
              v-if="onReplay"
              class="result__btn"
              type="button"
              @click="onReplay"
            >
              重玩
            </button>
          </div>
        </div>
      </div>

      <div class="panel__controls">
        <button class="control control--play" type="button" :disabled="!isIdle || steps.length === 0" @click="play">
          播放
        </button>
        <button class="control" type="button" :disabled="state.status === 'running'" @click="reset">重置</button>
        <button class="control" type="button" :disabled="!isIdle" @click="clearProgram">清空</button>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.overlay {
  position: absolute;
  right: 20px;
  top: 2%;
  height: 95%;
  flex-shrink: 0;
  display: flex;

  .card-wrap {
    width: 150px;
    position: absolute;
    left: -150px;
    top: 30px;
    background: #987f6b;
    padding: 20px;
    border-top-left-radius: 12px;
    border-bottom-left-radius: 12px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .panel-wrap {
    width: 300px;
    padding: 1rem;
    background-color: #bba694;
    display: flex;
    flex-direction: column;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);

    .panel__header {
      font-weight: 900;
      color: #948275;
      font-size: 3rem;
    }

    .panel__body {
      flex: 1;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      gap: 0.9rem;

      .panel__mission {
        background-color: #e4dfc4;
        border: 1px solid rgba(0, 0, 0, 0.12);
        border-radius: 10px;
        padding: 0.75rem 0.85rem;
        color: rgba(40, 20, 8, 0.82);
        font-weight: 800;
        line-height: 1.35;
      }

      .panel__program {
        flex: 1;
        border-radius: 14px;
        background-color: rgba(255, 255, 255, 0.45);
        border: 1px solid rgba(0, 0, 0, 0.16);
        overflow: auto;
        padding: 0.75rem 0.6rem;
        display: flex;
        flex-direction: column;
        gap: 0.55rem;

        .program__empty {
          height: 100%;
          min-height: 160px;
          border-radius: 12px;
          border: 2px dashed rgba(0, 0, 0, 0.18);
          color: rgba(40, 20, 8, 0.6);
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 1rem;
          line-height: 1.35;
        }

        .program__row {
          display: grid;
          grid-template-columns: 22px 44px 1fr 28px;
          gap: 0.45rem;
          align-items: center;

          &.is-active {
            .card-title {
              box-shadow: 0 0 0 2px rgba(50, 205, 50, 0.35);
            }
          }

          &.row--ghost {
            opacity: 0.4;
          }

          .row__handle {
            color: rgba(40, 20, 8, 0.45);
            font-size: 1.1rem;
            cursor: grab;
            text-align: center;
            line-height: 1;

            &:active {
              cursor: grabbing;
            }

            &.is-disabled {
              cursor: not-allowed;
              opacity: 0.35;
            }
          }

          .row__no {
            color: rgba(40, 20, 8, 0.65);
            font-weight: 900;
            text-align: right;
            font-variant-numeric: tabular-nums;
          }

          .row__cmd {
            display: flex;
            flex-direction: column;
            gap: 3px;

            .card-title {
              height: 34px;
              border-radius: 6px;
              background-color: rgba(145, 215, 93, 0.9);
              border: 1px solid rgba(0, 0, 0, 0.22);
              display: flex;
              align-items: center;
              padding: 0 0.7rem;
              font-weight: 900;
              color: rgba(0, 0, 0, 0.75);
              text-transform: lowercase;
            }

            .jump-target {
              width: 100%;
              height: 24px;
              border-radius: 4px;
              border: 1px solid rgba(0, 0, 0, 0.22);
              background: rgba(255, 255, 255, 0.7);
              text-align: center;
              font-weight: 900;
              font-size: 0.8rem;
              color: rgba(0, 0, 0, 0.75);
              padding: 0 4px;

              &:disabled {
                opacity: 0.5;
              }
            }
          }

          .row__remove {
            height: 26px;
            border-radius: 6px;
            border: 1px solid rgba(0, 0, 0, 0.14);
            background-color: rgba(255, 255, 255, 0.6);
            color: rgba(0, 0, 0, 0.6);
            cursor: pointer;

            &:disabled {
              cursor: not-allowed;
              opacity: 0.45;
            }
          }
        }
      }

      .panel__result {
        border-radius: 12px;
        padding: 0.75rem 0.85rem;
        font-weight: 900;
        line-height: 1.35;
        display: flex;
        flex-direction: column;
        gap: 0.65rem;

        .result__message {
          line-height: 1.4;
        }

        .result__actions {
          display: flex;
          gap: 0.5rem;

          .result__btn {
            flex: 1;
            height: 36px;
            border-radius: 8px;
            border: 1px solid rgba(0, 0, 0, 0.18);
            background-color: rgba(255, 255, 255, 0.55);
            color: rgba(0, 0, 0, 0.75);
            font-weight: 900;
            cursor: pointer;

            &:hover {
              background-color: rgba(255, 255, 255, 0.8);
            }

            &.result__btn--next {
              background-color: rgba(145, 215, 93, 0.85);
              border-color: rgba(0, 0, 0, 0.18);

              &:hover {
                background-color: rgba(145, 215, 93, 1);
              }
            }
          }
        }

        &.is-success {
          background-color: rgba(16, 185, 129, 0.12);
          border: 1px solid rgba(16, 185, 129, 0.35);
          color: #065f46;
        }

        &.is-fail {
          background-color: rgba(255, 72, 72, 0.1);
          border: 1px solid rgba(255, 72, 72, 0.35);
          color: #b42318;
        }
      }
    }

    .panel__controls {
      height: 72px;
      background-color: rgba(0, 0, 0, 0.55);
      border-top: 1px solid rgba(255, 255, 255, 0.12);
      padding: 0 1rem;
      display: flex;
      gap: 0.75rem;
      align-items: center;
      justify-content: flex-start;

      .control {
        height: 44px;
        border-radius: 10px;
        border: 1px solid rgba(255, 255, 255, 0.2);
        background-color: rgba(255, 255, 255, 0.12);
        color: rgba(255, 255, 255, 0.92);
        font-weight: 900;
        cursor: pointer;
        padding: 0 1.05rem;

        &:disabled {
          cursor: not-allowed;
          opacity: 0.45;
        }

        &.control--play {
          background-color: rgba(145, 215, 93, 0.85);
          border-color: rgba(0, 0, 0, 0.18);
          color: rgba(0, 0, 0, 0.75);
        }
      }
    }
  }
}
</style>
