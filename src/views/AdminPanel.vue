<template>
  <div class="admin-panel">
    <div class="admin-header">
      <h2>系统管理面板</h2>
      <div class="user-info">
        <span
          >当前用户：{{ currentUser?.name }} ({{
            currentUser?.role === 'admin' ? '管理员' : '普通用户'
          }})</span
        >
        <button class="logout-btn" @click="logout">退出登录</button>
      </div>
    </div>

    <div v-if="!isAdmin" class="no-permission">
      <p>⚠️ 您没有管理员权限，无法访问此页面。</p>
      <router-link to="/" class="link">返回首页</router-link>
    </div>

    <div v-else class="admin-content">
      <div class="filter-section">
        <label>筛选状态：</label>
        <select v-model="statusFilter" @change="filterWishes">
          <option value="all">全部</option>
          <option value="published">已发布</option>
          <option value="unpublished">已下架</option>
          <option value="draft">草稿</option>
        </select>
        <label class="sort-label">排序：</label>
        <select v-model="sortBy" @change="filterWishes">
          <option value="newest">最新优先</option>
          <option value="oldest">最旧优先</option>
          <option value="likes">点赞数最多</option>
        </select>
      </div>

      <div class="wishes-table">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>愿望名称</th>
              <th>职业</th>
              <th>提交者</th>
              <th>点赞数</th>
              <th>状态</th>
              <th>提交时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="wish in filteredWishes" :key="wish.id">
              <td>{{ wish.id }}</td>
              <td class="title-cell">{{ wish.title }}</td>
              <td>{{ wish.job }}</td>
              <td>{{ wish.submitter }}</td>
              <td>{{ wish.likes }}</td>
              <td>
                <span class="status-badge" :class="getStatusClass(wish.status)">
                  {{ getStatusText(wish.status) }}
                </span>
              </td>
              <td>{{ formatDate(wish.createdAt) }}</td>
              <td class="actions-cell">
                <button class="btn btn-edit" @click="editWish(wish.id)">编辑</button>
                <button
                  v-if="wish.status === 'published'"
                  class="btn btn-unpublish"
                  @click="unpublishWish(wish.id)"
                >
                  下架
                </button>
                <button
                  v-if="wish.status === 'unpublished'"
                  class="btn btn-publish"
                  @click="publishWish(wish.id)"
                >
                  发布
                </button>
                <button class="btn btn-delete" @click="deleteWish(wish.id)">删除</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="filteredWishes.length === 0" class="empty-state">
        <p>暂无愿望数据</p>
      </div>
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
            <textarea
              v-model="editingWish.description"
              required
              rows="4"
              class="form-textarea"
            ></textarea>
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
          <div class="form-group">
            <label>状态：</label>
            <select v-model="editingWish.status" class="form-select">
              <option value="published">已发布</option>
              <option value="unpublished">已下架</option>
              <option value="draft">草稿</option>
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
import {
  getAllWishesForAdmin,
  updateWish,
  deleteWish as deleteWishService,
  unpublishWish as unpublishWishService,
  publishWish as publishWishService
} from '../services/wishService'
import { getCurrentUser, isAdmin, logout as logoutService } from '../services/authService'

export default {
  name: 'AdminPanel',
  data() {
    return {
      wishes: [],
      statusFilter: 'all',
      sortBy: 'newest',
      currentUser: null,
      showEditDialog: false,
      editingWish: null
    }
  },
  computed: {
    isAdmin() {
      return isAdmin()
    },
    filteredWishes() {
      let filtered = [...this.wishes]

      // 状态筛选
      if (this.statusFilter !== 'all') {
        filtered = filtered.filter(w => w.status === this.statusFilter)
      }

      // 排序
      filtered.sort((a, b) => {
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
    this.currentUser = getCurrentUser()
    this.loadWishes()
  },
  methods: {
    loadWishes() {
      this.wishes = getAllWishesForAdmin()
    },
    filterWishes() {
      // 计算属性会自动更新
    },
    editWish(id) {
      const wish = this.wishes.find(w => w.id === id)
      if (wish) {
        this.editingWish = { ...wish }
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
          job: this.editingWish.job,
          status: this.editingWish.status
        })
        if (updated) {
          this.loadWishes()
          this.closeEditDialog()
          alert('愿望更新成功！')
        }
      }
    },
    unpublishWish(id) {
      if (confirm('确定要下架这个愿望吗？')) {
        const updated = unpublishWishService(id)
        if (updated) {
          this.loadWishes()
          alert('愿望已下架')
        }
      }
    },
    publishWish(id) {
      const updated = publishWishService(id)
      if (updated) {
        this.loadWishes()
        alert('愿望已发布')
      }
    },
    deleteWish(id) {
      if (confirm('确定要删除这个愿望吗？此操作不可恢复！')) {
        const success = deleteWishService(id)
        if (success) {
          this.loadWishes()
          alert('愿望已删除')
        }
      }
    },
    formatDate(dateString) {
      const date = new Date(dateString)
      return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    },
    getStatusText(status) {
      const statusMap = {
        published: '已发布',
        unpublished: '已下架',
        draft: '草稿'
      }
      return statusMap[status] || status
    },
    getStatusClass(status) {
      const classMap = {
        published: 'status-published',
        unpublished: 'status-unpublished',
        draft: 'status-draft'
      }
      return classMap[status] || ''
    },
    logout() {
      logoutService()
      this.$router.push('/')
    }
  }
}
</script>

<style scoped>
.admin-panel {
  padding: 2rem 0;
}

.admin-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #eee;
}

.admin-header h2 {
  font-size: 2rem;
  color: #2c3e50;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.logout-btn {
  padding: 0.5rem 1rem;
  background-color: #e74c3c;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.logout-btn:hover {
  background-color: #c0392b;
}

.no-permission {
  text-align: center;
  padding: 4rem 2rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.no-permission p {
  font-size: 1.25rem;
  color: #e74c3c;
  margin-bottom: 1rem;
}

.link {
  color: #2c3e50;
  text-decoration: underline;
}

.admin-content {
  background: white;
  border-radius: 8px;
  padding: 2rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.filter-section {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
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
}

.wishes-table {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

thead {
  background-color: #f8f9fa;
}

th,
td {
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid #eee;
}

th {
  font-weight: 600;
  color: #2c3e50;
}

.title-cell {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 500;
}

.status-published {
  background-color: #d4edda;
  color: #155724;
}

.status-unpublished {
  background-color: #f8d7da;
  color: #721c24;
}

.status-draft {
  background-color: #fff3cd;
  color: #856404;
}

.actions-cell {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.btn {
  padding: 0.4rem 0.8rem;
  border: none;
  border-radius: 4px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background-color 0.3s;
}

.btn-edit {
  background-color: #3498db;
  color: white;
}

.btn-edit:hover {
  background-color: #2980b9;
}

.btn-unpublish {
  background-color: #f39c12;
  color: white;
}

.btn-unpublish:hover {
  background-color: #e67e22;
}

.btn-publish {
  background-color: #27ae60;
  color: white;
}

.btn-publish:hover {
  background-color: #229954;
}

.btn-delete {
  background-color: #e74c3c;
  color: white;
}

.btn-delete:hover {
  background-color: #c0392b;
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
}

.btn-primary:hover {
  background-color: #34495e;
}

.btn-secondary {
  background-color: #ecf0f1;
  color: #2c3e50;
  padding: 0.75rem 1.5rem;
}

.btn-secondary:hover {
  background-color: #bdc3c7;
}

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  color: #999;
}
</style>
