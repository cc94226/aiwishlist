<template>
  <div class="wish-detail">
    <div v-if="wish" class="detail-card">
      <div class="detail-header">
        <button @click="goBack" class="back-btn">← 返回</button>
        <div class="header-content">
          <h1>{{ wish.title }}</h1>
          <span class="job-badge" :class="getJobClass(wish.job)">{{ wish.job }}</span>
        </div>
      </div>

      <div class="detail-body">
        <div class="wish-info">
          <div class="info-item">
            <span class="label">提交者：</span>
            <span class="value">{{ wish.submitter }}</span>
          </div>
          <div class="info-item">
            <span class="label">提交时间：</span>
            <span class="value">{{ formatDate(wish.createdAt) }}</span>
          </div>
        </div>

        <div class="wish-description">
          <h3>需求描述</h3>
          <p>{{ wish.description }}</p>
        </div>

        <div class="wish-actions">
          <button @click="likeWish" class="action-btn like-btn">
            👍 点赞 ({{ wish.likes }})
          </button>
          <button @click="toggleFavorite" class="action-btn favorite-btn" :class="{ active: isFavorited }">
            ⭐ {{ isFavorited ? '已收藏' : '收藏' }}
          </button>
        </div>

        <div class="comments-section">
          <h3>评论 ({{ wish.comments.length }})</h3>
          <div class="comment-form">
            <textarea 
              v-model="newComment" 
              placeholder="写下你的评论..."
              rows="3"
              class="comment-input"
            ></textarea>
            <button @click="addComment" class="comment-submit-btn" :disabled="!newComment.trim()">
              发表评论
            </button>
          </div>
          <div class="comments-list">
            <div v-for="comment in wish.comments" :key="comment.id" class="comment-item">
              <div class="comment-header">
                <span class="comment-author">{{ comment.author }}</span>
                <span class="comment-date">{{ formatDate(comment.createdAt) }}</span>
              </div>
              <p class="comment-content">{{ comment.content }}</p>
            </div>
            <div v-if="wish.comments.length === 0" class="no-comments">
              暂无评论，快来发表第一条评论吧！
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="loading">
      <p>加载中...</p>
    </div>
  </div>
</template>

<script>
import { getWishById, likeWish as likeWishService, addComment as addCommentService } from '../services/wishService'

export default {
  name: 'WishDetail',
  data() {
    return {
      wish: null,
      newComment: '',
      isFavorited: false
    }
  },
  mounted() {
    this.loadWish()
    this.loadFavoriteStatus()
  },
  watch: {
    '$route.params.id'() {
      this.loadWish()
      this.loadFavoriteStatus()
    }
  },
  methods: {
    loadWish() {
      const id = this.$route.params.id
      this.wish = getWishById(id)
      if (!this.wish) {
        // 如果找不到愿望，跳转到首页
        this.$router.push('/')
      }
    },
    loadFavoriteStatus() {
      const favorites = JSON.parse(localStorage.getItem('favorites') || '[]')
      this.isFavorited = favorites.includes(parseInt(this.$route.params.id))
    },
    goBack() {
      this.$router.back()
    },
    likeWish() {
      const updated = likeWishService(this.wish.id)
      if (updated) {
        this.wish = updated
      }
    },
    toggleFavorite() {
      const favorites = JSON.parse(localStorage.getItem('favorites') || '[]')
      const wishId = parseInt(this.$route.params.id)
      
      if (this.isFavorited) {
        const index = favorites.indexOf(wishId)
        if (index > -1) {
          favorites.splice(index, 1)
        }
      } else {
        favorites.push(wishId)
      }
      
      localStorage.setItem('favorites', JSON.stringify(favorites))
      this.isFavorited = !this.isFavorited
    },
    addComment() {
      if (!this.newComment.trim()) return
      
      const updated = addCommentService(this.wish.id, this.newComment)
      if (updated) {
        this.wish = updated
        this.newComment = ''
      }
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
        '开发': 'job-dev',
        '设计': 'job-design',
        '行政': 'job-admin'
      }
      return classes[job] || ''
    }
  }
}
</script>

<style scoped>
.wish-detail {
  max-width: 800px;
  margin: 0 auto;
}

.detail-card {
  background: white;
  border-radius: 8px;
  padding: 2rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.detail-header {
  margin-bottom: 2rem;
}

.back-btn {
  background: none;
  border: none;
  color: #2c3e50;
  font-size: 1rem;
  cursor: pointer;
  margin-bottom: 1rem;
  padding: 0.5rem 0;
  transition: color 0.3s;
}

.back-btn:hover {
  color: #34495e;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: start;
  gap: 1rem;
}

.header-content h1 {
  font-size: 2rem;
  color: #2c3e50;
  flex: 1;
}

.job-badge {
  padding: 0.5rem 1rem;
  border-radius: 12px;
  font-size: 1rem;
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

.detail-body {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.wish-info {
  display: flex;
  gap: 2rem;
  padding: 1rem;
  background-color: #f8f9fa;
  border-radius: 4px;
}

.info-item {
  display: flex;
  gap: 0.5rem;
}

.info-item .label {
  font-weight: 500;
  color: #666;
}

.info-item .value {
  color: #2c3e50;
}

.wish-description h3 {
  font-size: 1.25rem;
  margin-bottom: 1rem;
  color: #2c3e50;
}

.wish-description p {
  line-height: 1.8;
  color: #555;
  font-size: 1.1rem;
}

.wish-actions {
  display: flex;
  gap: 1rem;
}

.action-btn {
  padding: 0.75rem 1.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s;
}

.like-btn:hover {
  background-color: #e3f2fd;
  border-color: #1976d2;
}

.favorite-btn:hover {
  background-color: #fff3e0;
  border-color: #ff9800;
}

.favorite-btn.active {
  background-color: #fff3e0;
  border-color: #ff9800;
  color: #ff9800;
}

.comments-section h3 {
  font-size: 1.25rem;
  margin-bottom: 1rem;
  color: #2c3e50;
}

.comment-form {
  margin-bottom: 2rem;
}

.comment-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  font-family: inherit;
  margin-bottom: 0.5rem;
  resize: vertical;
}

.comment-input:focus {
  outline: none;
  border-color: #2c3e50;
}

.comment-submit-btn {
  padding: 0.5rem 1rem;
  background-color: #2c3e50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
}

.comment-submit-btn:hover:not(:disabled) {
  background-color: #34495e;
}

.comment-submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.comments-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.comment-item {
  padding: 1rem;
  background-color: #f8f9fa;
  border-radius: 4px;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
  color: #666;
}

.comment-author {
  font-weight: 500;
}

.comment-content {
  color: #333;
  line-height: 1.6;
}

.no-comments {
  text-align: center;
  padding: 2rem;
  color: #999;
}

.loading {
  text-align: center;
  padding: 4rem;
  color: #999;
}
</style>
