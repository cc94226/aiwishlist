<template>
  <div class="submit-wish">
    <h2>提交新愿望</h2>
    <form class="wish-form" @submit.prevent="submitWish">
      <div class="form-group">
        <label for="title">愿望名称 *</label>
        <input 
          id="title" 
          v-model="form.title" 
          type="text" 
          required
          placeholder="请输入愿望名称"
          class="form-input"
        />
      </div>

      <div class="form-group">
        <label for="description">需求描述 *</label>
        <textarea 
          id="description" 
          v-model="form.description" 
          required
          placeholder="请详细描述您的需求"
          rows="6"
          class="form-textarea"
        ></textarea>
      </div>

      <div class="form-group">
        <label for="job">提交者岗位 *</label>
        <select 
          id="job" 
          v-model="form.job" 
          required
          class="form-select"
        >
          <option value="">请选择岗位</option>
          <option value="开发">开发</option>
          <option value="设计">设计</option>
          <option value="行政">行政</option>
          <option value="产品">产品</option>
          <option value="运营">运营</option>
          <option value="其他">其他</option>
        </select>
      </div>

      <div class="form-group">
        <label for="submitter">提交者姓名</label>
        <input 
          id="submitter" 
          v-model="form.submitter" 
          type="text" 
          placeholder="可选，默认为匿名用户"
          class="form-input"
        />
      </div>

      <div class="form-actions">
        <button type="submit" class="btn btn-primary">提交愿望</button>
        <button type="button" class="btn btn-draft" @click="saveAsDraft">保存为草稿</button>
        <button type="button" class="btn btn-secondary" @click="resetForm">重置</button>
      </div>
    </form>

    <div v-if="submitSuccess" class="success-message">
      <p>✅ 愿望提交成功！</p>
      <router-link to="/" class="link">返回首页查看</router-link>
    </div>
    <div v-if="draftSuccess" class="success-message">
      <p>✅ 愿望已保存为草稿！您可以在管理面板中编辑和发布。</p>
      <router-link to="/admin" class="link">前往管理面板</router-link>
    </div>
  </div>
</template>

<script>
import { addWish } from '../services/wishService'
import { getCurrentUser } from '../services/authService'

export default {
  name: 'SubmitWish',
  data() {
    return {
      form: {
        title: '',
        description: '',
        job: '',
        submitter: ''
      },
      submitSuccess: false,
      draftSuccess: false
    }
  },
  mounted() {
    // 设置提交者姓名（如果已登录）
    const user = getCurrentUser()
    if (user) {
      this.form.submitter = user.name
    }
  },
  methods: {
    submitWish() {
      const user = getCurrentUser()
      const newWish = addWish({
        title: this.form.title,
        description: this.form.description,
        job: this.form.job,
        submitter: this.form.submitter || undefined,
        submitterId: user ? user.id : null,
        status: 'published'
      })
      
      if (newWish) {
        this.submitSuccess = true
        this.resetForm()
        setTimeout(() => {
          this.submitSuccess = false
        }, 5000)
      }
    },
    saveAsDraft() {
      if (!this.form.title || !this.form.description || !this.form.job) {
        alert('请至少填写愿望名称、需求描述和岗位信息才能保存为草稿')
        return
      }
      
      const user = getCurrentUser()
      const newWish = addWish({
        title: this.form.title,
        description: this.form.description,
        job: this.form.job,
        submitter: this.form.submitter || undefined,
        submitterId: user ? user.id : null,
        status: 'draft'
      })
      
      if (newWish) {
        this.draftSuccess = true
        this.resetForm()
        setTimeout(() => {
          this.draftSuccess = false
        }, 5000)
      }
    },
    resetForm() {
      const user = getCurrentUser()
      this.form = {
        title: '',
        description: '',
        job: '',
        submitter: user ? user.name : ''
      }
    }
  }
}
</script>

<style scoped>
.submit-wish {
  max-width: 600px;
  margin: 0 auto;
  padding: 2rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.submit-wish h2 {
  font-size: 2rem;
  margin-bottom: 2rem;
  color: #2c3e50;
}

.wish-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-weight: 500;
  color: #555;
}

.form-input,
.form-textarea,
.form-select {
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  font-family: inherit;
  transition: border-color 0.3s;
}

.form-input:focus,
.form-textarea:focus,
.form-select:focus {
  outline: none;
  border-color: #2c3e50;
}

.form-textarea {
  resize: vertical;
  min-height: 120px;
}

.form-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.3s;
}

.btn-primary {
  background-color: #2c3e50;
  color: white;
}

.btn-primary:hover {
  background-color: #34495e;
}

.btn-secondary {
  background-color: #ecf0f1;
  color: #2c3e50;
}

.btn-secondary:hover {
  background-color: #bdc3c7;
}

.btn-draft {
  background-color: #f39c12;
  color: white;
}

.btn-draft:hover {
  background-color: #e67e22;
}

.success-message {
  margin-top: 2rem;
  padding: 1rem;
  background-color: #d4edda;
  border: 1px solid #c3e6cb;
  border-radius: 4px;
  color: #155724;
}

.success-message p {
  margin-bottom: 0.5rem;
}

.link {
  color: #2c3e50;
  text-decoration: underline;
}
</style>
