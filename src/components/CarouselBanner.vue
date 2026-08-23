<template>
  <div v-if="items.length > 0" class="hero-carousel">
    <div class="carousel-indicators">
      <button v-for="(item, i) in items" :key="i" class="carousel-dot" :class="{ active: i === 0 }"></button>
    </div>
    <div class="carousel-viewport">
      <div v-for="(item, i) in items" :key="i" class="carousel-slide" :class="{ active: i === 0 }">
        <router-link :to="item.link_url || '/'">
          <div class="carousel-bg" :class="`gradient-${i % 3}`">
            <img v-if="item.image_url" :src="item.image_url" class="carousel-img" :alt="item.title" @error="hideImage" />
          </div>
        </router-link>
        <div class="carousel-caption">
          <h5>{{ item.title }}</h5>
        </div>
      </div>
    </div>
    <button class="carousel-control carousel-control-prev">
      <span class="carousel-arrow carousel-arrow-prev"></span>
    </button>
    <button class="carousel-control carousel-control-next">
      <span class="carousel-arrow carousel-arrow-next"></span>
    </button>
  </div>
</template>

<script setup>
defineProps({
  items: { type: Array, default: () => [] }
})
function hideImage(e) {
  e.target.style.display = 'none'
}
</script>

<style scoped>
.hero-carousel {
  position: relative;
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.carousel-viewport {
  position: relative;
  max-height: 420px;
  overflow: hidden;
}

.carousel-slide {
  display: none;
}

.carousel-slide.active {
  display: block;
}

.carousel-bg {
  height: 420px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.carousel-bg::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.15);
}

.carousel-img {
  width: 100%;
  height: 420px;
  object-fit: cover;
  display: block;
}

.gradient-0 {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
.gradient-1 {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}
.gradient-2 {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.carousel-caption {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.5);
  border-radius: 8px;
  padding: 16px;
  color: #fff;
}

.carousel-caption h5 {
  margin: 0;
  font-size: 16px;
}

.carousel-indicators {
  position: absolute;
  bottom: 12px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 8px;
  z-index: 2;
}

.carousel-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.7);
  background: transparent;
  padding: 0;
  cursor: pointer;
  transition: background 0.2s ease;
}

.carousel-dot.active {
  background: #fff;
  border-color: #fff;
}

.carousel-control {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(0, 0, 0, 0.3);
  border: 0;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 2;
  transition: background 0.2s ease;
}

.carousel-control:hover {
  background: rgba(0, 0, 0, 0.5);
}

.carousel-control-prev {
  left: 12px;
}

.carousel-control-next {
  right: 12px;
}

.carousel-arrow {
  display: block;
  width: 10px;
  height: 10px;
  border-top: 2px solid #fff;
  border-right: 2px solid #fff;
}

.carousel-arrow-prev {
  transform: rotate(-135deg);
  margin-left: 4px;
}

.carousel-arrow-next {
  transform: rotate(45deg);
  margin-right: 4px;
}
</style>
