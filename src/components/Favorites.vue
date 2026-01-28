<template>
  <div class="favorites">
    <div class="header">
      <h2>我的收藏</h2>
      <div class="filter-section">
        <label>排序方式：</label>
        <select v-model="sortBy" @change="filterFavorites">
          <option value="newest">最新收藏</option>
          <option value="oldest">最早收藏</option>
          <option value="likes">点赞数最多</option>
        </select>
      </div>
    </div>

    <div class="wishes-grid">
      <div
        v-for="wish in filteredFavorites"
        :key="wish.id"
        class="wish-card"
        @click="goToDetail(wish.id)"
      >
        <div class="wish-header">
          <h3>{{ wish.title }}</h3>
          <span class="job-badge" :class="getJobClass(wish.job)">{{ wish.job }}</span>
        </div>
        <p class="wish-description">{{ wish.description }}</p>
        <div class="wish-footer">
          <div class="wish-meta">
            <span class="submitter">提交者：{{ wish.submitter }}</span>
            <span class="date">{{ formatDate(wish.createdAt) }}</span>
          </div>
          <div class="wish-stats">
            <span class="likes">👍 {{ wish.likes || 0 }}</span>
            <span class="comments">💬 {{ wish.comments?.length || 0 }}</span>
          </div>
        </div>
        <div class="wish-actions">
          <button class="action-btn unfavorite-btn" @click.stop="unfavorite(wish.id)">
            ⭐ 取消收藏
          </button>
        </div>
      </div>
    </div>

    <div v-if="filteredFavorites.length === 0" class="empty-state">
      <p>您还没有收藏任何愿望</p>
      <router-link to="/" class="link">去浏览愿望 →</router-link>
    </div>
  </div>
</template>

<script>
import { getAllWishes, getWishById } from '../services/wishService'

export default {
  name: 'Favorites',
  data() {
    return {
      favorites: [],
      wishes: [],
      sortBy: 'newest'
    }
  },
  computed: {
    filteredFavorites() {
      let filtered = [...this.wishes]

      // 排序
      filtered.sort((a, b) => {
        if (this.sortBy === 'newest') {
          // 按收藏时间排序（这里简化处理，按愿望创建时间）
          return new Date(b.createdAt) - new Date(a.createdAt)
        } else if (this.sortBy === 'oldest') {
          return new Date(a.createdAt) - new Date(b.createdAt)
        } else if (this.sortBy === 'likes') {
          return (b.likes || 0) - (a.likes || 0)
        }
        return 0
      })

      return filtered
    }
  },
  mounted() {
    this.loadFavorites()
  },
  methods: {
    loadFavorites() {
      // 从localStorage获取收藏列表
      const favoriteIds = JSON.parse(localStorage.getItem('favorites') || '[]')
      const allWishes = getAllWishes()

      // 获取收藏的愿望详情
      this.wishes = allWishes.filter(wish => favoriteIds.includes(wish.id))
    },
    filterFavorites() {
      // 计算属性会自动更新
    },
    goToDetail(id) {
      this.$router.push(`/wish/${id}`)
    },
    unfavorite(wishId) {
      const favorites = JSON.parse(localStorage.getItem('favorites') || '[]')
      const index = favorites.indexOf(wishId)

      if (index > -1) {
        favorites.splice(index, 1)
        localStorage.setItem('favorites', JSON.stringify(favorites))
        this.loadFavorites()
        alert('已取消收藏')
      }
    },
    formatDate(dateString) {
      if (!dateString) return ''
      const date = new Date(dateString)
      return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    },
    getJobClass(job) {
      const jobClasses = {
        开发: 'job-dev',
        设计: 'job-design',
        产品: 'job-product',
        运营: 'job-operation',
        行政: 'job-admin',
        测试: 'job-test',
        其他: 'job-other'
      }
      return jobClasses[job] || 'job-default'
    }
  }
}
</script>

<style scoped>
.favorites {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.header {
  margin-bottom: 2rem;
}

.header h2 {
  font-size: 2rem;
  color: #2c3e50;
  margin-bottom: 1rem;
}

.filter-section {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.filter-section label {
  font-weight: 500;
  color: #555;
}

.filter-section select {
  padding: 0.5rem 1rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
}

.filter-section select:focus {
  outline: none;
  border-color: #2c3e50;
}

.wishes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.wish-card {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition:
    transform 0.2s,
    box-shadow 0.2s;
}

.wish-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.wish-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
  gap: 1rem;
}

.wish-header h3 {
  font-size: 1.25rem;
  color: #2c3e50;
  margin: 0;
  flex: 1;
}

.job-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 500;
}

.job-dev {
  background-color: #e3f2fd;
  color: #1976d2;
}

.job-design {
  background-color: #fce4ec;
  color: #c2185b;
}

.job-product {
  background-color: #f3e5f5;
  color: #7b1fa2;
}

.job-operation {
  background-color: #e8f5e9;
  color: #388e3c;
}

.job-admin {
  background-color: #fff3e0;
  color: #f57c00;
}

.job-test {
  background-color: #e0f2f1;
  color: #00796b;
}

.job-other {
  background-color: #f5f5f5;
  color: #616161;
}

.wish-description {
  color: #666;
  margin-bottom: 1rem;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.wish-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #eee;
}

.wish-meta {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.submitter {
  font-size: 0.875rem;
  color: #666;
}

.date {
  font-size: 0.875rem;
  color: #999;
}

.wish-stats {
  display: flex;
  gap: 1rem;
}

.wish-stats span {
  font-size: 0.875rem;
  color: #666;
}

.wish-actions {
  padding-top: 1rem;
  border-top: 1px solid #eee;
}

.action-btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
  transition: background-color 0.2s;
}

.unfavorite-btn {
  background-color: #f39c12;
  color: white;
}

.unfavorite-btn:hover {
  background-color: #e67e22;
}

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.empty-state p {
  font-size: 1.25rem;
  color: #999;
  margin-bottom: 1rem;
}

.link {
  color: #2c3e50;
  text-decoration: underline;
  font-size: 1rem;
}

.link:hover {
  color: #3498db;
}
</style>
