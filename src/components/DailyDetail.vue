<script setup lang="ts">
import { useRoute } from 'vue-router'

const route = useRoute()
const date = computed(() => route.params.date as string)

const formattedDate = computed(() => {
  if (!date.value)
    return ''
  const [year, month, day] = date.value.split('-')
  return `${year}年${month}月${day}日`
})
</script>

<template>
  <div class="daily-detail">
    <div class="no-record">
      <p class="date-hint">
        {{ formattedDate }}
      </p>
      <p>暂无记录</p>
    </div>
  </div>
</template>

<style scoped>
.daily-detail {
  max-width: 800px;
  margin: 0 auto;
  padding: 1rem;
}

.no-record {
  text-align: center;
  padding: 3rem;
  opacity: 0.6;
}

.date-hint {
  margin: 0.5rem 0;
  font-size: 0.875rem;
}

.add-link {
  display: inline-block;
  margin-top: 1rem;
  color: #667eea;
  text-decoration: none;
}
</style>
