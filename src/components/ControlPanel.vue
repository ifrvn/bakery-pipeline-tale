<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { OP } from '@/game/levelConfigs';

const props = defineProps({
  api: {
    type: Object,
    required: true,
  },
  config: {
    type: Object,
    required: true,
  },
});

const steps = ref([]);
const state = ref(props.api.getState());
let off = null;

let nextStepId = 1;

onMounted(() => {
  off = props.api.onStateChange((s) => {
    state.value = s;
  });
});

onBeforeUnmount(() => {
  off?.();
  off = null;
});

function onDragStartCard(e, op) {
  e.dataTransfer?.setData('text/plain', op);
  e.dataTransfer?.setData('application/x-bakery-op', op);
  if (e.dataTransfer) e.dataTransfer.effectAllowed = 'copy';
}

function readDroppedOp(e) {
  const op = e.dataTransfer?.getData('application/x-bakery-op') || e.dataTransfer?.getData('text/plain') || '';
  return op ?? '';
}

function onDropToProgram(e) {
  if (state.value.status !== 'idle') return;
  const op = readDroppedOp(e);
  if (op === OP.INBOX.title || op === OP.OUTBOX.title) {
    steps.value = [...steps.value, { id: nextStepId++, title: op }];
  }
}

function addByClick(title) {
  if (state.value.status !== 'idle') return;
  steps.value = [...steps.value, { id: nextStepId++, title }];
}

function removeStep(stepId) {
  if (state.value.status !== 'idle') return;
  steps.value = steps.value.filter((s) => s.id !== stepId);
}

function clearProgram() {
  if (state.value.status !== 'idle') return;
  steps.value = [];
}

const programOps = computed(() => steps.value.map((s) => s.title));

function play() {
  if (state.value.status !== 'idle') return;
  props.api.play(programOps.value);
}

function reset() {
  props.api.reset();
  clearProgram();
}
</script>

<template>
  <div class="overlay">
    <!-- 指令卡片区 -->
    <div class="card-wrap">
      <button
        v-for="card in config.availableOps"
        :key="card.title"
        class="palette__item"
        type="button"
        draggable="true"
        :disabled="state.status !== 'idle'"
        @dragstart="(e) => onDragStartCard(e, card.title)"
        @click="addByClick(card.title)"
      >
        <div class="cmd-card">
          {{ card.title }}
        </div>
        <div class="palette__desc">
          {{ card.desc }}
        </div>
      </button>
    </div>

    <!-- 右侧面板区 -->
    <div class="panel-wrap">
      <div class="panel__header">
        {{ config.levelName }}
      </div>
      <div class="panel__body">
        <div class="panel__mission">
          {{ config.levelDesc }}
        </div>

        <div class="panel__program" @dragover.prevent @drop.prevent="onDropToProgram">
          <div v-if="steps.length === 0" class="program__empty">把指令卡片拖进来</div>
          <div v-else class="program__list">
            <div
              v-for="(step, index) in steps"
              :key="step.id"
              class="program__row"
              :class="{
                'is-active': state.status === 'running' && state.pointer === index,
              }"
            >
              <div class="row__no">
                {{ String(index + 1).padStart(2, '0') }}
              </div>
              <div class="row__cmd">
                <div class="cmd-card">
                  {{ step.title }}
                </div>
              </div>
              <button
                class="row__remove"
                type="button"
                :disabled="state.status !== 'idle'"
                @click="removeStep(step.id)"
              >
                ×
              </button>
            </div>
          </div>
        </div>

        <div
          v-if="state.status === 'finished'"
          class="panel__result"
          :class="{
            'is-success': state.result === 'success',
            'is-fail': state.result === 'fail',
          }"
        >
          {{ state.message }}
        </div>
      </div>

      <div class="panel__controls">
        <button
          class="control control--play"
          type="button"
          :disabled="state.status !== 'idle' || steps.length === 0"
          @click="play"
        >
          播放
        </button>
        <button class="control" type="button" :disabled="state.status === 'running'" @click="reset">重置</button>
        <button class="control" type="button" :disabled="state.status !== 'idle'" @click="clearProgram">清空</button>
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
    display: flex;
    flex-direction: column;
    gap: 0.9rem;
    background: #987f6b;
    padding: 20px;
    border-top-left-radius: 12px;
    border-bottom-left-radius: 12px;

    .palette__item {
      text-align: left;
      border: 1px solid rgba(0, 0, 0, 0.14);
      background-color: rgba(255, 255, 255, 0.72);
      border-radius: 12px;
      padding: 0.6rem;
      cursor: grab;
      display: flex;
      flex-direction: column;
      gap: 0.45rem;

      &:active {
        cursor: grabbing;
      }

      &:disabled {
        cursor: not-allowed;
        opacity: 0.55;
      }

      .cmd-card {
        height: 34px;
        border-radius: 6px;
        display: flex;
        align-items: center;
        padding: 0 0.7rem;
        font-weight: 900;
        color: #596630;
        background-color: #b3c574;
        box-shadow: 0 0 5px rgba(0, 0, 0, 0.1);
      }

      .palette__desc {
        color: rgba(40, 20, 8, 0.65);
        font-weight: 800;
        font-size: 0.85rem;
        line-height: 1.25;
      }
    }
  }

  .panel-wrap {
    width: 300px;
    background-color: #bba694;
    display: flex;
    flex-direction: column;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);

    .panel__header {
      padding: 1.1rem 1rem;
      background-color: rgba(0, 0, 0, 0.18);
      border-bottom: 1px solid rgba(0, 0, 0, 0.16);
      font-weight: 900;
      color: rgba(40, 20, 8, 0.9);
      letter-spacing: 0.08em;
      font-size: 1.1rem;
    }

    .panel__body {
      flex: 1;
      padding: 1rem;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      gap: 0.9rem;

      .panel__mission {
        background-color: rgba(255, 255, 255, 0.55);
        border: 1px solid rgba(0, 0, 0, 0.12);
        border-radius: 12px;
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

        .program__list {
          display: flex;
          flex-direction: column;
          gap: 0.55rem;

          .program__row {
            display: grid;
            grid-template-columns: 44px 1fr 28px;
            gap: 0.55rem;
            align-items: center;

            &.is-active {
              .cmd-card {
                box-shadow: 0 0 0 2px rgba(50, 205, 50, 0.35);
              }
            }

            .row__no {
              color: rgba(40, 20, 8, 0.65);
              font-weight: 900;
              text-align: right;
              font-variant-numeric: tabular-nums;
            }

            .row__cmd {
              .cmd-card {
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
      }

      .panel__result {
        border-radius: 12px;
        padding: 0.75rem 0.85rem;
        font-weight: 900;
        line-height: 1.35;

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
