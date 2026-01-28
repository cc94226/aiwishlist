<template>
  <div class="my-wishes">
    <div class="header">
      <h2>我的愿望</h2>
      <div class="filter-section">
        <label>状态筛选：</label>
        <select v-model="statusFilter" @change="filterWishes">
          <option value="">全部</option>
          <option value="published">已发布</option>
          <option value="draft">草稿</option>
          <option value="archived">已归档</option>
        </select>
        <label>排序方式：</label>
        <select v-model="sortBy" @change="filterWishes">
          <option value="newest">最新</option>
          <option value="oldest">最早</option>
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
          <span class="status-badge" :class="getStatusClass(wish.status)">
            {{ getStatusText(wish.status) }}
          </span>
        </div>
        <p class="wish-description">{{ wish.description }}</p>
        <div class="wish-footer">
          <div class="wish-meta">
            <span class="job-badge" :class="getJobClass(wish.job)">{{ wish.job }}</span>
            <span class="date">{{ formatDate(wish.createdAt) }}</span>
          </div>
          <div class="wish-stats">
            <span class="likes">👍 {{ wish.likes || 0 }}</span>
            <span class="comments">💬 {{ wish.comments?.length || 0 }}</span>
          </div>
        </div>
        <div class="wish-actions">
          <button v-if="canEdit(wish)" class="action-btn edit-btn" @click.stop="editWish(wish.id)">
            编辑
          </button>
          <button
            v-if="canDelete(wish)"
            class="action-btn delete-btn"
            @click.stop="deleteWish(wish.id)"
          >
            删除
          </button>
        </div>
      </div>
    </div>

    <div v-if="filteredWishes.length === 0" class="empty-state">
      <p>您还没有提交任何愿望</p>
      <router-link to="/submit" class="link">立即提交 →</router-link>
    </div>
  </div>
</template>

<script>
import { getUserWishes, deleteWish } from '../services/wishService'
import { getCurrentUser } from '../services/authService'

export default {
  name: 'MyWishes',
  props: {
    userId: {
      type: String,
      default: null
    },
    limit: {
      type: Number,
      default: null
    }
  },
  data() {
    return {
      wishes: [],
      statusFilter: '',
      sortBy: 'newest',
      currentUser: null
    }
  },
  computed: {
    filteredWishes() {
      let filtered = [...this.wishes]

      // 状态筛选
      if (this.statusFilter) {
        filtered = filtered.filter(w => w.status === this.statusFilter)
      }

      // 排序
      filtered.sort((a, b) => {
        if (this.sortBy === 'newest') {
          return new Date(b.createdAt) - new Date(a.createdAt)
        } else if (this.sortBy === 'oldest') {
          return new Date(a.createdAt) - new Date(b.createdAt)
        } else if (this.sortBy === 'likes') {
          return (b.likes || 0) - (a.likes || 0)
        }
        return 0
      })

      // 限制数量
      if (this.limit) {
        filtered = filtered.slice(0, this.limit)
      }

      return filtered
    }
  },
  mounted() {
    this.loadUser()
    this.loadWishes()
  },
  methods: {
    loadUser() {
      this.currentUser = getCurrentUser()
    },
    loadWishes() {
      const userId = this.userId || this.currentUser?.id || this.currentUser?.name
      if (!userId) {
        return
      }

      const userWishes = getUserWishes(userId)
      this.wishes = userWishes
    },
    filterWishes() {
      // 计算属性会自动更新
    },
    goToDetail(id) {
      this.$router.push(`/wish/${id}`)
    },
    editWish(id) {
      this.$router.push(`/wish/${id}?edit=true`)
    },
    deleteWish(id) {
      if (confirm('确定要删除这个愿望吗？')) {
        deleteWish(id)
        this.loadWishes()
        this.$emit('wish-deleted', id)
      }
    },
    canEdit(wish) {
      if (!this.currentUser) return false
      // 管理员可以编辑所有愿望，普通用户只能编辑自己的草稿
      return (
        this.currentUser.role === 'admin' ||
        (wish.submitter_id === this.currentUser.id && wish.status === 'draft')
      )
    },
    canDelete(wish) {
      if (!this.currentUser) return false
      // 管理员可以删除所有愿望，普通用户只能删除自己的草稿
      return (
        this.currentUser.role === 'admin' ||
        (wish.submitter_id === this.currentUser.id && wish.status === 'draft')
      )
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
    getStatusClass(status) {
      const classes = {
        published: 'status-published',
        draft: 'status-draft',
        archived: 'status-archived'
      }
      return classes[status] || ''
    },
    getStatusText(status) {
      const texts = {
        published: '已发布',
        draft: '草稿',
        archived: '已归档'
      }
      return texts[status] || status
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
.my-wishes {
  width: 100%;
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

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 500;
}

.status-published {
  background-color: #e8f5e9;
  color: #2e7d32;
}

.status-draft {
  background-color: #fff3e0;
  color: #e65100;
}

.status-archived {
  background-color: #fce4ec;
  color: #c2185b;
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
  display: flex;
  gap: 0.5rem;
}

.action-btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
  transition: background-color 0.2s;
}

.edit-btn {
  background-color: #3498db;
  color: white;
}

.edit-btn:hover {
  background-color: #2980b9;
}

.delete-btn {
  background-color: #e74c3c;
  color: white;
}

.delete-btn:hover {
  background-color: #c0392b;
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
