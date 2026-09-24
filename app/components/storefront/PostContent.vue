<script setup lang="ts">
import { toPostHtml } from '#shared/utils/post-content'

const props = defineProps<{ content: string }>()

// Safe to v-html: post.service.ts sanitizes the HTML against an allowlist on every save,
// and toPostHtml escapes legacy plain-text posts before wrapping them in <p>.
const html = computed(() => toPostHtml(props.content))
</script>

<template>
  <!-- eslint-disable-next-line vue/no-v-html -->
  <div class="post-content" v-html="html" />
</template>

<style>
.post-content {
  color: var(--ui-text);
  line-height: 1.75;
  overflow-wrap: break-word;
}
.post-content > * + * {
  margin-top: 1rem;
}
.post-content h1,
.post-content h2,
.post-content h3,
.post-content h4 {
  color: var(--ui-text-highlighted);
  font-weight: 700;
  line-height: 1.35;
  margin-top: 1.75rem;
}
.post-content h1 { font-size: 1.75rem; }
.post-content h2 { font-size: 1.5rem; }
.post-content h3 { font-size: 1.25rem; }
.post-content h4 { font-size: 1.125rem; }
.post-content a {
  color: var(--ui-primary);
  text-decoration: underline;
  text-underline-offset: 2px;
}
.post-content ul {
  list-style: disc;
  padding-left: 1.5rem;
}
.post-content ol {
  list-style: decimal;
  padding-left: 1.5rem;
}
.post-content li + li {
  margin-top: 0.25rem;
}
.post-content li > p {
  margin: 0;
}
.post-content blockquote {
  border-left: 4px solid var(--ui-primary);
  padding-left: 1rem;
  color: var(--ui-text-muted);
  font-style: italic;
}
.post-content img {
  max-width: 100%;
  height: auto;
  border-radius: 0.75rem;
  margin-left: auto;
  margin-right: auto;
}
.post-content hr {
  border-color: var(--ui-border);
  margin: 2rem 0;
}
.post-content code {
  background: var(--ui-bg-elevated);
  border-radius: 0.25rem;
  padding: 0.1rem 0.35rem;
  font-size: 0.875em;
}
.post-content pre {
  background: var(--ui-bg-elevated);
  border-radius: 0.5rem;
  padding: 1rem;
  overflow-x: auto;
}
.post-content pre code {
  background: none;
  padding: 0;
}
</style>
