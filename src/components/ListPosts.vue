<script setup lang="ts">
import { useRouter } from 'vue-router/auto'
import { englishOnly, formatDate } from '~/logics'
import type { Post } from '~/types'

const props = defineProps<{
  type?: string
  posts?: Post[]
  extra?: Post[]
  pageSize?: number
}>()

const pageSize = props.pageSize || 10

const startPath = props.type ? `/${props.type}` : '/posts'
const router = useRouter()
const routes: Post[] = router.getRoutes()
  .filter(i => i.path.startsWith(startPath) && i.meta.frontmatter.date && !i.meta.frontmatter.draft)
  .filter(i => !i.path.endsWith('.html'))
  .map(i => ({
    path: i.meta.frontmatter.redirect || i.path,
    title: i.meta.frontmatter.title,
    date: i.meta.frontmatter.date,
    lang: i.meta.frontmatter.lang,
    duration: i.meta.frontmatter.duration,
    recording: i.meta.frontmatter.recording,
    upcoming: i.meta.frontmatter.upcoming,
    redirect: i.meta.frontmatter.redirect,
    place: i.meta.frontmatter.place,
    desc: i.meta.frontmatter.description,
    image: i.meta.frontmatter.image,
    imageType: i.meta.frontmatter.imageType || 'top',
  }))

const allPosts = computed(() =>
  [...(props.posts || routes), ...props.extra || []]
    .sort((a, b) => +new Date(b.date) - +new Date(a.date))
    .filter(i => !englishOnly.value || i.lang !== 'zh'),
)

const currentPage = ref(1)
const totalPages = computed(() => Math.ceil(allPosts.value.length / pageSize))

const posts = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  const end = start + pageSize
  return allPosts.value.slice(start, end)
})

function prevPage() {
  if (currentPage.value > 1)
    currentPage.value--
}

function nextPage() {
  if (currentPage.value < totalPages.value)
    currentPage.value++
}

const getYear = (a: Date | string | number) => new Date(a).getFullYear()
const isFuture = (a?: Date | string | number) => a && new Date(a) > new Date()
const isSameYear = (a?: Date | string | number, b?: Date | string | number) => a && b && getYear(a) === getYear(b)
function isSameGroup(a: Post, b?: Post) {
  return (isFuture(a.date) === isFuture(b?.date)) && isSameYear(a.date, b?.date)
}

function getGroupName(p: Post) {
  if (isFuture(p.date))
    return 'Upcoming'
  return getYear(p.date)
}

function getCardBorderClass() {
  switch (props.type) {
    case 'interest':
    case 'product':
      return 'card-border-none'
    default:
      return 'card-border-default'
  }
}
</script>

<template>
  <div class="card-grid">
    <template v-if="!posts.length">
      <div py2 op50>
        { nothing here yet }
      </div>
    </template>

    <template v-for="route, idx in posts" :key="route.path">
      <div
        v-if="!isSameGroup(route, posts[idx - 1])"
        select-none relative h20 pointer-events-none slide-enter
        :style="{
          '--enter-stage': idx - 2,
          '--enter-step': '60ms',
        }"
      >
        <span text-8em color-transparent absolute right--3rem top--3rem font-bold text-stroke-1 text-stroke-hex-ccc class="year-bg">{{ getGroupName(route) }}</span>
      </div>
      <component
        :is="route.path.includes('://') ? 'a' : 'RouterLink'"
        v-bind="
          route.path.includes('://') ? {
            href: route.path,
            target: '_blank',
            rel: 'noopener noreferrer',
          } : {
            to: route.path,
          }
        "
        class="card slide-enter no-underline"
        :class="[getCardBorderClass(), { 'has-image': route.image }]"
        :style="{
          '--enter-stage': idx,
          '--enter-step': '60ms',
        }"
      >
        <div v-if="route.image && props.type === 'interest'" class="card-image">
          <img :src="route.image" :alt="route.title">
        </div>

        <div class="card-body">
          <div class="card-header" flex="~ gap-2 items-center">
            <span
              v-if="route.lang === 'zh'"
              class="text-xs bg-zinc:15 text-zinc5 rounded px-1 py-0.5"
            >中文</span>
            <span class="title text-xl leading-1.2em font-bold hover-glow">{{ route.title }}</span>
            <span
              v-if="route.redirect"
              op50 flex-none text-xs ml--1.5
              i-carbon-arrow-up-right
              title="External"
            />
          </div>

          <p v-if="route.desc" class="card-desc text-sm op70 mt-2 line-clamp-3">
            {{ route.desc }}
          </p>

          <div class="card-meta flex items-center gap-3 mt-3 text-xs op50">
            <span>{{ formatDate(route.date, true) }}</span>
            <span v-if="route.duration">{{ route.duration }}</span>
            <span v-if="route.place" class="hidden md:block">{{ route.place }}</span>
          </div>
        </div>
      </component>
    </template>
  </div>

  <!-- 分页 -->
  <div v-if="totalPages > 1" class="pagination flex justify-center items-center gap-4 mt-8">
    <button
      class="hover:opacity-100 op50 hover:op100 disabled:opacity-30 disabled:cursor-not-allowed text-lg px-2"
      :disabled="currentPage === 1"
      @click="prevPage"
    >
      &lt;
    </button>
    <span class="text-sm op60">
      {{ currentPage }} / {{ totalPages }}
    </span>
    <button
      class="hover:opacity-100 op50 hover:op100 disabled:opacity-30 disabled:cursor-not-allowed text-lg px-2"
      :disabled="currentPage === totalPages"
      @click="nextPage"
    >
      &gt;
    </button>
  </div>
</template>

<style scoped>
.card-grid {
  padding-top: 10px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
}

.card {
  display: flex;
  flex-direction: column;
  padding: 0;
  border-radius: 0.75rem;
  background: transparent;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

.card-border-default {
  border: 1px solid transparent;
}

.card-border-default:hover {
  border-color: var(--c-border);
  background: var(--c-bg-soft);
  transform: translateY(-8px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
}

.card-border-none {
  border: none !important;
  background: var(--c-bg-soft);
}

.card-border-none:hover {
  border: none !important;
  background: var(--c-bg);
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
}

.card-border-soft {
  border: 1px solid var(--c-border);
  background: var(--c-bg-soft);
}

.card-border-soft:hover {
  border-color: var(--c-border);
  transform: translateY(-8px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
}

.card.has-image {
  flex-direction: column;
}

.card-image {
  width: 100%;
  height: 180px;
  overflow: hidden;
}

.card-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s;
  margin: 0;
}

.card:hover .card-image img {
  transform: scale(1.05);
}

.card:hover .hover-glow {
  background: -webkit-linear-gradient(120deg, var(--vp-c-brand-1) 30%, var(--vp-c-brand-next));
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: rainbow 5s linear infinite;
}

.card-body {
  padding: 1.25rem;
}

.card-header {
  flex-wrap: wrap;
}

.card-desc {
  color: inherit;
}

.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.year-bg {
  opacity: 0.4;
}

.dark .year-bg {
  opacity: 0.3;
}
</style>
