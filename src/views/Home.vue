<template>
  <div class="home">
    <div class="header">
      <h2>愿望单展示</h2>
      <div class="filter-section">
        <label>按职业筛选：</label>
        <select v-model="selectedJob" @change="filterWishes">
          <option value="全部">全部</option>
          <option v-for="job in jobs" :key="job" :value="job">{{ job }}</option>
        </select>
        <label class="sort-label">排序方式：</label>
        <select v-model="sortBy" @change="filterWishes">
          <option value="newest">最新优先</option>
          <option value="oldest">最旧优先</option>
          <option value="likes">点赞数最多</option>
        </select>
      </div>
    </div>

    <div class="wishes-grid">
      <div
        v-for="wish in filteredWishes"
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
            <span class="likes">👍 {{ wish.likes }}</span>
            <span class="comments">💬 {{ wish.comments.length }}</span>
          </div>
        </div>
      </div>
    </div>

    <div v-if="filteredWishes.length === 0" class="empty-state">
      <p>暂无愿望数据</p>
    </div>
  </div>
</template>

<script>
import { getAllWishes, getWishesByJob, getAllJobs } from '../services/wishService'

export default {
  name: 'Home',
  data() {
    return {
      wishes: [],
      selectedJob: '全部',
      sortBy: 'newest',
      jobs: []
    }
  },
  computed: {
    filteredWishes() {
      let filtered =
        this.selectedJob === '全部'
          ? this.wishes.filter(w => w.status === 'published')
          : getWishesByJob(this.selectedJob)

      // 排序
      filtered = [...filtered].sort((a, b) => {
        if (this.sortBy === 'newest') {
          return new Date(b.createdAt) - new Date(a.createdAt)
        } else if (this.sortBy === 'oldest') {
          return new Date(a.createdAt) - new Date(b.createdAt)
        } else if (this.sortBy === 'likes') {
          return b.likes - a.likes
        }
        return 0
      })

      return filtered
    }
  },
  mounted() {
    this.loadWishes()
    this.jobs = getAllJobs()
  },
  methods: {
    loadWishes() {
      this.wishes = getAllWishes()
    },
    filterWishes() {
      // 计算属性会自动更新
    },
    goToDetail(id) {
      this.$router.push(`/wish/${id}`)
    },
    formatDate(dateString) {
      const date = new Date(dateString)
      return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    },
    getJobClass(job) {
      const classes = {
        开发: 'job-dev',
        设计: 'job-design',
        行政: 'job-admin'
      }
      return classes[job] || ''
    }
  }
}
</script>

<style scoped>
.home {
  padding: 2rem 0;
}

.header {
  margin-bottom: 2rem;
}

.header h2 {
  font-size: 2rem;
  margin-bottom: 1rem;
  color: #2c3e50;
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

.sort-label {
  margin-left: 2rem;
}

.filter-section select {
  padding: 0.5rem 1rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  background-color: white;
  cursor: pointer;
}

.filter-section select:hover {
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
  align-items: start;
  margin-bottom: 1rem;
}

.wish-header h3 {
  font-size: 1.25rem;
  color: #2c3e50;
  flex: 1;
  margin-right: 1rem;
}

.job-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 500;
  white-space: nowrap;
}

.job-dev {
  background-color: #e3f2fd;
  color: #1976d2;
}

.job-design {
  background-color: #fce4ec;
  color: #c2185b;
}

.job-admin {
  background-color: #f3e5f5;
  color: #7b1fa2;
}

.wish-description {
  color: #666;
  line-height: 1.6;
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
  padding-top: 1rem;
  border-top: 1px solid #eee;
}

.wish-meta {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.875rem;
  color: #999;
}

.wish-stats {
  display: flex;
  gap: 1rem;
  font-size: 0.875rem;
  color: #666;
}

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  color: #999;
}

.empty-state p {
  font-size: 1.25rem;
}
</style>
