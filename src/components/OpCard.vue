<script setup>
defineProps({
  title: {
    type: String,
    required: true,
  },
  subTitle: {
    type: String,
    default: '',
  },
  disabled: {
    type: Boolean,
    default: false,
  },
});

defineEmits(['click']);
</script>

<template>
  <div
    class="op-card"
    :class="{ 'is-disabled': disabled }"
    role="button"
    :tabindex="disabled ? -1 : 0"
    @click="!disabled && $emit('click')"
  >
    <div class="card-title">{{ title }}</div>
    <div v-if="subTitle" class="card-subtitle">{{ subTitle }}</div>
  </div>
</template>

<style scoped lang="scss">
.op-card {
  padding: 0.1rem 0.6rem;
  cursor: grab;
  color: #596630;
  background-color: #b2c377;
  box-shadow: 0 0 5px rgba(0, 0, 0, 0.55);
  user-select: none;

  &:active {
    cursor: grabbing;
  }

  &.is-disabled {
    cursor: not-allowed;
    opacity: 0.55;
    pointer-events: none;
  }

  .card-title {
    font-weight: bold;
    font-size: 1.4rem;
  }

  .card-subtitle {
    font-weight: 800;
    font-size: 0.85rem;
  }
}
</style>
