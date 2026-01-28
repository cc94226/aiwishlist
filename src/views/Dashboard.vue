<template>
  <div class="dashboard">
    <div v-if="currentUser" class="dashboard-container">
      <h2 class="dashboard-title">用户仪表板</h2>

      <!-- 用户信息卡片 -->
      <div class="user-info-card">
        <div class="user-avatar">
          <span class="avatar-text">{{ currentUser.name.charAt(0) }}</span>
        </div>
        <div class="user-details">
          <h3>{{ currentUser.name }}</h3>
          <p class="user-email">{{ currentUser.email }}</p>
          <p class="user-role">{{ currentUser.role === 'admin' ? '管理员' : '普通用户' }}</p>
          <p v-if="currentUser.job" class="user-job">岗位：{{ currentUser.job }}</p>
        </div>
      </div>

      <!-- 统计卡片 -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">📝</div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.submittedWishes }}</div>
            <div class="stat-label">提交的愿望</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">⭐</div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.favoritedWishes }}</div>
            <div class="stat-label">收藏的愿望</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">👍</div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.totalLikes }}</div>
            <div class="stat-label">获得的点赞</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">💬</div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.totalComments }}</div>
            <div class="stat-label">收到的评论</div>
          </div>
        </div>
      </div>

      <!-- 我的愿望列表 -->
      <div class="section">
        <div class="section-header">
          <h3>我的愿望</h3>
          <router-link to="/submit" class="btn-primary">+ 提交新愿望</router-link>
        </div>
        <div v-if="myWishes.length > 0" class="wishes-list">
          <div
            v-for="wish in myWishes"
            :key="wish.id"
            class="wish-item"
            @click="goToDetail(wish.id)"
          >
            <div class="wish-item-header">
              <h4>{{ wish.title }}</h4>
              <span class="status-badge" :class="getStatusClass(wish.status)">
                {{ getStatusText(wish.status) }}
              </span>
            </div>
            <p class="wish-item-description">{{ wish.description }}</p>
            <div class="wish-item-footer">
              <span class="wish-meta">{{ formatDate(wish.createdAt) }}</span>
              <div class="wish-stats">
                <span class="likes">👍 {{ wish.likes }}</span>
                <span class="comments">💬 {{ wish.comments.length }}</span>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="empty-state">
          <p>您还没有提交任何愿望</p>
          <router-link to="/submit" class="btn-primary">立即提交</router-link>
        </div>
      </div>

      <!-- 收藏的愿望列表 -->
      <div class="section">
        <div class="section-header">
          <h3>收藏的愿望</h3>
        </div>
        <div v-if="favoritedWishes.length > 0" class="wishes-list">
          <div
            v-for="wish in favoritedWishes"
            :key="wish.id"
            class="wish-item"
            @click="goToDetail(wish.id)"
          >
            <div class="wish-item-header">
              <h4>{{ wish.title }}</h4>
              <span class="job-badge" :class="getJobClass(wish.job)">{{ wish.job }}</span>
            </div>
            <p class="wish-item-description">{{ wish.description }}</p>
            <div class="wish-item-footer">
              <span class="wish-meta">提交者：{{ wish.submitter }}</span>
              <div class="wish-stats">
                <span class="likes">👍 {{ wish.likes }}</span>
                <span class="comments">💬 {{ wish.comments.length }}</span>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="empty-state">
          <p>您还没有收藏任何愿望</p>
          <router-link to="/" class="btn-secondary">浏览愿望</router-link>
        </div>
      </div>

      <!-- 快速操作 -->
      <div class="section">
        <h3>快速操作</h3>
        <div class="quick-actions">
          <router-link to="/submit" class="action-btn">
            <span class="action-icon">➕</span>
            <span>提交新愿望</span>
          </router-link>
          <router-link to="/" class="action-btn">
            <span class="action-icon">🔍</span>
            <span>浏览愿望</span>
          </router-link>
          <router-link to="/profile" class="action-btn">
            <span class="action-icon">👤</span>
            <span>个人设置</span>
          </router-link>
          <router-link v-if="currentUser.role === 'admin'" to="/admin" class="action-btn">
            <span class="action-icon">⚙️</span>
            <span>管理面板</span>
          </router-link>
        </div>
      </div>
    </div>

    <div v-else class="no-user">
      <p>请先登录</p>
      <router-link to="/login" class="btn-primary">前往登录</router-link>
    </div>
  </div>
</template>

<script>
import { getCurrentUser } from '../services/authService'
import { getUserWishes, getAllWishes } from '../services/wishService'

export default {
  name: 'Dashboard',
  data() {
    return {
      currentUser: null,
      myWishes: [],
      favoritedWishes: [],
      stats: {
        submittedWishes: 0,
        favoritedWishes: 0,
        totalLikes: 0,
        totalComments: 0
      }
    }
  },
  mounted() {
    this.loadUser()
    this.loadData()
  },
  methods: {
    loadUser() {
      this.currentUser = getCurrentUser()
    },
    loadData() {
      if (!this.currentUser) {
        return
      }

      // 加载用户提交的愿望
      const userWishes = getUserWishes(this.currentUser.id || this.currentUser.name)
      this.myWishes = userWishes
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 10) // 只显示最近10个

      // 加载收藏的愿望
      const favorites = JSON.parse(localStorage.getItem('favorites') || '[]')
      const allWishes = getAllWishes()
      this.favoritedWishes = allWishes
        .filter(w => favorites.includes(w.id))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 10) // 只显示最近10个

      // 计算统计数据
      this.stats.submittedWishes = userWishes.length
      this.stats.favoritedWishes = favorites.length

      // 计算用户获得的点赞总数（用户提交的愿望的点赞数之和）
      this.stats.totalLikes = userWishes.reduce((sum, w) => sum + (w.likes || 0), 0)

      // 计算用户收到的评论总数（用户提交的愿望的评论数之和）
      this.stats.totalComments = userWishes.reduce((sum, w) => sum + (w.comments?.length || 0), 0)
    },
    goToDetail(id) {
      this.$router.push(`/wish/${id}`)
    },
    formatDate(dateString) {
      const date = new Date(dateString)
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    },
    getJobClass(job) {
      const classes = {
        开发: 'job-dev',
        设计: 'job-design',
        行政: 'job-admin',
        产品: 'job-product',
        运营: 'job-operation',
        测试: 'job-test'
      }
      return classes[job] || ''
    },
    getStatusClass(status) {
      const classes = {
        published: 'status-published',
        draft: 'status-draft',
        unpublished: 'status-unpublished'
      }
      return classes[status] || ''
    },
    getStatusText(status) {
      const texts = {
        published: '已发布',
        draft: '草稿',
        unpublished: '已下架'
      }
      return texts[status] || status
    }
  }
}
</script>

<style scoped>
.dashboard {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.dashboard-container {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.dashboard-title {
  font-size: 2rem;
  color: #2c3e50;
  margin-bottom: 1rem;
}

/* 用户信息卡片 */
.user-info-card {
  background: white;
  border-radius: 8px;
  padding: 2rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 2rem;
}

.user-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  color: white;
  font-weight: bold;
}

.user-details h3 {
  font-size: 1.5rem;
  color: #2c3e50;
  margin-bottom: 0.5rem;
}

.user-email {
  color: #666;
  margin-bottom: 0.25rem;
}

.user-role {
  color: #999;
  font-size: 0.9rem;
  margin-bottom: 0.25rem;
}

.user-job {
  color: #2c3e50;
  font-weight: 500;
}

/* 统计卡片 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
}

.stat-card {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 1rem;
}

.stat-icon {
  font-size: 2.5rem;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 2rem;
  font-weight: bold;
  color: #2c3e50;
  margin-bottom: 0.25rem;
}

.stat-label {
  color: #666;
  font-size: 0.9rem;
}

/* 区块 */
.section {
  background: white;
  border-radius: 8px;
  padding: 2rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.section-header h3 {
  font-size: 1.5rem;
  color: #2c3e50;
}

/* 愿望列表 */
.wishes-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.wish-item {
  padding: 1.5rem;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.wish-item:hover {
  border-color: #2c3e50;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.wish-item-header {
  display: flex;
  justify-content: space-between;
  align-items: start;
  margin-bottom: 0.75rem;
}

.wish-item-header h4 {
  font-size: 1.25rem;
  color: #2c3e50;
  flex: 1;
}

.wish-item-description {
  color: #666;
  line-height: 1.6;
  margin-bottom: 1rem;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.wish-item-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.wish-meta {
  color: #999;
  font-size: 0.9rem;
}

.wish-stats {
  display: flex;
  gap: 1rem;
}

.wish-stats .likes,
.wish-stats .comments {
  color: #666;
  font-size: 0.9rem;
}

/* 状态标签 */
.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.85rem;
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

.status-unpublished {
  background-color: #fce4ec;
  color: #c2185b;
}

/* 岗位标签 */
.job-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.85rem;
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

.job-admin {
  background-color: #f3e5f5;
  color: #7b1fa2;
}

.job-product {
  background-color: #e0f2f1;
  color: #00695c;
}

.job-operation {
  background-color: #fff3e0;
  color: #e65100;
}

.job-test {
  background-color: #f1f8e9;
  color: #558b2f;
}

/* 按钮 */
.btn-primary {
  padding: 0.75rem 1.5rem;
  background-color: #2c3e50;
  color: white;
  border: none;
  border-radius: 4px;
  text-decoration: none;
  display: inline-block;
  cursor: pointer;
  transition: background-color 0.3s;
}

.btn-primary:hover {
  background-color: #34495e;
}

.btn-secondary {
  padding: 0.75rem 1.5rem;
  background-color: #ecf0f1;
  color: #2c3e50;
  border: none;
  border-radius: 4px;
  text-decoration: none;
  display: inline-block;
  cursor: pointer;
  transition: background-color 0.3s;
}

.btn-secondary:hover {
  background-color: #bdc3c7;
}

/* 快速操作 */
.quick-actions {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
}

.action-btn {
  padding: 1.5rem;
  background: white;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  text-decoration: none;
  color: #2c3e50;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s;
}

.action-btn:hover {
  border-color: #2c3e50;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.action-icon {
  font-size: 2rem;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 3rem 2rem;
  color: #999;
}

.empty-state p {
  font-size: 1.1rem;
  margin-bottom: 1rem;
}

.no-user {
  text-align: center;
  padding: 4rem 2rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.no-user p {
  font-size: 1.25rem;
  color: #999;
  margin-bottom: 1rem;
}
</style>
