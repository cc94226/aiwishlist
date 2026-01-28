<template>
  <div class="wish-detail">
    <div v-if="wish" class="detail-card">
      <div class="detail-header">
        <button class="back-btn" @click="goBack">← 返回</button>
        <div class="header-content">
          <h1>{{ wish.title }}</h1>
          <span class="job-badge" :class="getJobClass(wish.job)">{{ wish.job }}</span>
        </div>
      </div>

      <div class="detail-body">
        <!-- 岗位匹配分析 -->
        <div v-if="matchInfo" class="match-analysis">
          <h3>岗位匹配分析</h3>
          <div class="match-content">
            <div class="match-score">
              <span class="match-icon">{{ matchInfo.icon }}</span>
              <span class="match-level" :style="{ color: matchInfo.color }">
                {{ matchInfo.level }}
              </span>
              <span class="match-percentage">匹配度：{{ matchInfo.score }}%</span>
            </div>
            <div class="match-details">
              <p>您的岗位：<strong>{{ matchInfo.userJob }}</strong></p>
              <p>愿望岗位：<strong>{{ matchInfo.wishJob }}</strong></p>
            </div>
          </div>
        </div>

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
          <button class="action-btn like-btn" @click="likeWish">
            👍 点赞 ({{ wish.likes }})
          </button>
          <button class="action-btn favorite-btn" :class="{ active: isFavorited }" @click="toggleFavorite">
            ⭐ {{ isFavorited ? '已收藏' : '收藏' }}
          </button>
          <button 
            v-if="canEdit" 
            class="action-btn edit-btn" 
            @click="editWish"
          >
            ✏️ 编辑
          </button>
          <button 
            v-if="canDelete" 
            class="action-btn delete-btn" 
            @click="deleteWish"
          >
            🗑️ 删除
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
            <button class="comment-submit-btn" :disabled="!newComment.trim()" @click="addComment">
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

    <!-- 编辑愿望对话框 -->
    <div v-if="showEditDialog" class="modal-overlay" @click="closeEditDialog">
      <div class="modal-content" @click.stop>
        <h3>编辑愿望</h3>
        <form @submit.prevent="saveEdit">
          <div class="form-group">
            <label>愿望名称：</label>
            <input v-model="editingWish.title" required class="form-input" />
          </div>
          <div class="form-group">
            <label>需求描述：</label>
            <textarea v-model="editingWish.description" required rows="4" class="form-textarea"></textarea>
          </div>
          <div class="form-group">
            <label>职业：</label>
            <select v-model="editingWish.job" required class="form-select">
              <option value="开发">开发</option>
              <option value="设计">设计</option>
              <option value="行政">行政</option>
              <option value="产品">产品</option>
              <option value="运营">运营</option>
              <option value="其他">其他</option>
            </select>
          </div>
          <div class="form-actions">
            <button type="submit" class="btn btn-primary">保存</button>
            <button type="button" class="btn btn-secondary" @click="closeEditDialog">取消</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import { getWishById, likeWish as likeWishService, addComment as addCommentService, updateWish, deleteWish as deleteWishService } from '../services/wishService'
import { canEditWish, canDeleteWish } from '../services/authService'
import { getWishMatchInfo } from '../services/matchService'

export default {
  name: 'WishDetail',
  data() {
    return {
      wish: null,
      newComment: '',
      isFavorited: false,
      showEditDialog: false,
      editingWish: null,
      matchInfo: null
    }
  },
  computed: {
    canEdit() {
      return this.wish && canEditWish(this.wish)
    },
    canDelete() {
      return this.wish && canDeleteWish(this.wish)
    }
  },
  watch: {
    '$route.params.id'() {
      this.loadWish()
      this.loadFavoriteStatus()
      this.loadMatchInfo()
    }
  },
  mounted() {
    this.loadWish()
    this.loadFavoriteStatus()
    this.loadMatchInfo()
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
    loadMatchInfo() {
      if (this.wish) {
        this.matchInfo = getWishMatchInfo(this.wish)
      }
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
    },
    editWish() {
      if (this.wish) {
        this.editingWish = { ...this.wish }
        this.showEditDialog = true
      }
    },
    closeEditDialog() {
      this.showEditDialog = false
      this.editingWish = null
    },
    saveEdit() {
      if (this.editingWish) {
        const updated = updateWish(this.editingWish.id, {
          title: this.editingWish.title,
          description: this.editingWish.description,
          job: this.editingWish.job
        })
        if (updated) {
          this.wish = updated
          this.loadMatchInfo() // 重新加载匹配信息
          this.closeEditDialog()
          alert('愿望更新成功！')
        }
      }
    },
    deleteWish() {
      if (confirm('确定要删除这个愿望吗？此操作不可恢复！')) {
        const success = deleteWishService(this.wish.id)
        if (success) {
          alert('愿望已删除')
          this.$router.push('/')
        }
      }
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

.match-analysis {
  padding: 1.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 8px;
  color: white;
  margin-bottom: 2rem;
}

.match-analysis h3 {
  margin-bottom: 1rem;
  color: white;
  font-size: 1.25rem;
}

.match-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.match-score {
  display: flex;
  align-items: center;
  gap: 1rem;
  font-size: 1.1rem;
}

.match-icon {
  font-size: 1.5rem;
}

.match-level {
  font-weight: bold;
  font-size: 1.2rem;
}

.match-percentage {
  margin-left: auto;
  background-color: rgba(255, 255, 255, 0.2);
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-weight: 500;
}

.match-details {
  display: flex;
  gap: 2rem;
  font-size: 0.95rem;
  opacity: 0.9;
}

.match-details p {
  margin: 0;
}

.match-details strong {
  color: white;
  font-weight: 600;
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

.edit-btn {
  background-color: #3498db;
  color: white;
  border-color: #3498db;
}

.edit-btn:hover {
  background-color: #2980b9;
  border-color: #2980b9;
}

.delete-btn {
  background-color: #e74c3c;
  color: white;
  border-color: #e74c3c;
}

.delete-btn:hover {
  background-color: #c0392b;
  border-color: #c0392b;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  max-width: 600px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-content h3 {
  margin-bottom: 1.5rem;
  color: #2c3e50;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #555;
}

.form-input,
.form-textarea,
.form-select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  font-family: inherit;
}

.form-textarea {
  resize: vertical;
}

.form-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
}

.btn-primary {
  background-color: #2c3e50;
  color: white;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.btn-primary:hover {
  background-color: #34495e;
}

.btn-secondary {
  background-color: #ecf0f1;
  color: #2c3e50;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.btn-secondary:hover {
  background-color: #bdc3c7;
}
</style>
