<script setup>
import { computed } from "vue";

const props = defineProps({
  modelValue: { type: Number, default: 0 },
  average: { type: Number, default: null },
  count: { type: Number, default: null },
  readonly: { type: Boolean, default: false },
  label: { type: String, default: "Rating" },
});
const emit = defineEmits(["update:modelValue"]);

const stars = [1, 2, 3, 4, 5];
const displayValue = computed(() =>
  props.readonly ? Math.round(props.average ?? 0) : props.modelValue,
);

function select(score) {
  if (!props.readonly) emit("update:modelValue", score);
}
function onKeydown(event, score) {
  if (props.readonly) return;
  if (event.key === "ArrowRight" || event.key === "ArrowUp") {
    event.preventDefault();
    select(Math.min(score + 1, 5));
  } else if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
    event.preventDefault();
    select(Math.max(score - 1, 1));
  }
}
</script>

<template>
  <div
    class="star-rating"
    :role="readonly ? undefined : 'radiogroup'"
    :aria-label="readonly ? undefined : label"
  >
    <template v-if="readonly">
      <span class="star-rating__icons" aria-hidden="true">
        <svg
          v-for="n in stars"
          :key="n"
          class="star"
          :class="{ 'star--filled': n <= displayValue }"
          viewBox="0 0 20 20"
        >
          <path
            d="M10 1.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L10 14.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9L10 1.5z"
          />
        </svg>
      </span>
      <span class="star-rating__text">
        {{ average != null ? average.toFixed(1) : "No ratings yet" }}
        <span v-if="count">({{ count }})</span>
      </span>
    </template>
    <template v-else>
      <button
        v-for="n in stars"
        :key="n"
        type="button"
        role="radio"
        :aria-checked="n === modelValue"
        :aria-label="`${n} star${n > 1 ? 's' : ''}`"
        class="star-rating__btn"
        :tabindex="n === (modelValue || 1) ? 0 : -1"
        @click="select(n)"
        @keydown="onKeydown($event, n)"
      >
        <svg
          class="star"
          :class="{ 'star--filled': n <= modelValue }"
          viewBox="0 0 20 20"
        >
          <path
            d="M10 1.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L10 14.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9L10 1.5z"
          />
        </svg>
      </button>
      <span class="star-rating__value">{{
        modelValue ? `${modelValue} / 5` : "Not rated"
      }}</span>
    </template>
  </div>
</template>

<style scoped>
.star-rating {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
}
.star-rating__icons {
  display: inline-flex;
  gap: 0.125rem;
}
.star-rating__btn {
  background: none;
  border: none;
  padding: 0.125rem;
  cursor: pointer;
  line-height: 0;
}
.star-rating__btn:focus-visible {
  outline: 2px solid #2f80ed;
  outline-offset: 2px;
  border-radius: 4px;
}
.star {
  width: 20px;
  height: 20px;
  fill: #e5e7eb;
}
.star--filled {
  fill: #ffb900;
}
.star-rating__text,
.star-rating__value {
  font-size: 0.875rem;
  color: #4a5565;
  font-weight: 600;
}
</style>
