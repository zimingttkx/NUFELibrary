<template>
  <div class="seat-view-container">
    <div class="seat-view-body">
      <!-- 返回首页按钮 -->
      <div class="back-home-section">
        <button class="back-home-button" @click="goHome">
          ← 返回首页
        </button>
      </div>

      <div class="page-title">实时座位查看</div>

      <!-- 图书馆选择 -->
      <div class="lib-selector-card">
        <div class="section-title">选择图书馆</div>
        <el-cascader
          class="lib-cascader"
          popper-class="custom-popper"
          :options="libOptions"
          v-model="selectedLib"
          @change="handleLibChange"
          placeholder="选择要查看的图书馆">
        </el-cascader>
        <button class="refresh-button" @click="refreshAllLibs">刷新全部数据</button>
      </div>

      <!-- 座位统计卡片 -->
      <div v-if="currentLibStats" class="stats-cards">
        <div class="stat-card total-card">
          <div class="stat-icon">📊</div>
          <div class="stat-value">{{ currentLibStats.total }}</div>
          <div class="stat-label">总座位数</div>
        </div>
        <div class="stat-card available-card">
          <div class="stat-icon">✅</div>
          <div class="stat-value">{{ currentLibStats.available }}</div>
          <div class="stat-label">可用座位</div>
        </div>
        <div class="stat-card booking-card">
          <div class="stat-icon">🔒</div>
          <div class="stat-value">{{ currentLibStats.booking }}</div>
          <div class="stat-label">已预约</div>
        </div>
        <div class="stat-card used-card">
          <div class="stat-icon">👤</div>
          <div class="stat-value">{{ currentLibStats.used }}</div>
          <div class="stat-label">使用中</div>
        </div>
      </div>

      <!-- 座位详情 -->
      <div v-if="currentLibInfo" class="seats-detail-card">
        <div class="section-title">
          {{ currentLibInfo.lib_floor }} - {{ currentLibInfo.lib_name }}
          <span class="update-time">更新时间: {{ updateTime }}</span>
        </div>

        <!-- 座位分类显示 -->
        <div class="seats-categories">
          <!-- 可用座位 -->
          <div class="category-section" v-if="seats.available && seats.available.length > 0">
            <div class="category-header available-header">
              <span class="category-icon">✅</span>
              <span class="category-title">可用座位 ({{ seats.available.length }})</span>
            </div>
            <div class="seats-grid">
              <div v-for="seat in seats.available" :key="seat.id" class="seat-tag available-tag">
                {{ seat.name }}
              </div>
            </div>
          </div>

          <!-- 已预约座位 -->
          <div class="category-section" v-if="seats.booking && seats.booking.length > 0">
            <div class="category-header booking-header">
              <span class="category-icon">🔒</span>
              <span class="category-title">已预约 ({{ seats.booking.length }})</span>
            </div>
            <div class="seats-grid">
              <div v-for="seat in seats.booking" :key="seat.id" class="seat-tag booking-tag">
                {{ seat.name }}
              </div>
            </div>
          </div>

          <!-- 使用中座位 -->
          <div class="category-section" v-if="seats.used && seats.used.length > 0">
            <div class="category-header used-header">
              <span class="category-icon">👤</span>
              <span class="category-title">使用中 ({{ seats.used.length }})</span>
            </div>
            <div class="seats-grid">
              <div v-for="seat in seats.used" :key="seat.id" class="seat-tag used-tag">
                {{ seat.name }}
              </div>
            </div>
          </div>

          <!-- 不可用座位 -->
          <div class="category-section" v-if="seats.unavailable && seats.unavailable.length > 0">
            <div class="category-header unavailable-header">
              <span class="category-icon">❌</span>
              <span class="category-title">不可用 ({{ seats.unavailable.length }})</span>
            </div>
            <div class="seats-grid">
              <div v-for="seat in seats.unavailable" :key="seat.id" class="seat-tag unavailable-tag">
                {{ seat.name }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading状态 -->
      <div v-if="loading" class="loading-overlay">
        <div class="loading-spinner"></div>
        <div class="loading-text">加载中...</div>
      </div>

      <!-- 空状态提示 -->
      <div v-if="!currentLibInfo && !loading" class="empty-state">
        <div class="empty-icon">🏛️</div>
        <div class="empty-text">请选择图书馆查看座位状态</div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'SeatView',
  data() {
    return {
      DOMAIN: 'http://127.0.0.1:8899',
      libOptions: [],
      selectedLib: [],
      currentLibInfo: null,
      currentLibStats: null,
      seats: {
        available: [],
        booking: [],
        used: [],
        unavailable: []
      },
      loading: false,
      updateTime: ''
    }
  },
  methods: {
    goHome() {
      this.$router.push('/')
    },
    async loadLibList() {
      try {
        const res = await axios.get(`${this.DOMAIN}/lib/getLibList`)
        const { code, data } = res.data
        if (code === 0) {
          this.libOptions = data.libList.map(lib => ({
            label: `${lib.lib_floor} - ${lib.lib_name}`,
            value: lib.lib_id
          }))
          // 默认加载第一个图书馆
          if (this.libOptions.length > 0) {
            this.selectedLib = [this.libOptions[0].value]
            await this.loadSeatStatus(this.libOptions[0].value)
          }
        }
      } catch (error) {
        console.error('[loadLibList错误]', error)
        alert('❌ 加载图书馆列表失败')
      }
    },
    async loadSeatStatus(libId) {
      this.loading = true
      try {
        const res = await axios.get(`${this.DOMAIN}/lib/getSeatStatus`, {
          params: { libId }
        })
        const { code, data } = res.data
        if (code === 0) {
          this.currentLibInfo = data.libInfo
          this.currentLibStats = data.stats
          this.seats = {
            available: data.seats.available || [],
            booking: data.seats.booking || [],
            used: data.seats.used || [],
            unavailable: data.seats.unavailable || []
          }
          this.updateTime = new Date().toLocaleTimeString('zh-CN')
        } else {
          alert('❌ 获取座位状态失败')
        }
      } catch (error) {
        console.error('[loadSeatStatus错误]', error)
        alert('❌ 获取座位状态失败，请检查网络连接')
      } finally {
        this.loading = false
      }
    },
    handleLibChange(value) {
      if (value && value.length > 0) {
        this.loadSeatStatus(value[0])
      }
    },
    async refreshAllLibs() {
      if (this.selectedLib && this.selectedLib.length > 0) {
        await this.loadSeatStatus(this.selectedLib[0])
        alert('✅ 数据已刷新')
      } else {
        alert('❗请先选择图书馆')
      }
    }
  },
  async mounted() {
    await this.loadLibList()
  }
}
</script>

<style lang="scss" scoped>
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes gradientShift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.seat-view-container {
  width: 100%;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #4facfe 75%, #00f2fe 100%);
  background-size: 400% 400%;
  animation: gradientShift 15s ease infinite;
  padding: 30px 20px;
  box-sizing: border-box;
}

.seat-view-body {
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  animation: fadeInUp 0.8s ease;
}

.back-home-section {
  margin-bottom: 20px;
}

.back-home-button {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
  border: none;
  border-radius: 12px;
  padding: 12px 28px;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(240, 147, 251, 0.4);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 24px rgba(240, 147, 251, 0.6);
  }

  &:active {
    transform: translateY(-1px);
  }
}

.page-title {
  color: white;
  font-weight: 900;
  font-size: 40px;
  text-align: center;
  text-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  letter-spacing: 3px;
  margin-bottom: 40px;
}

.lib-selector-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  padding: 28px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  margin-bottom: 30px;
  border: 1px solid rgba(255, 255, 255, 0.5);
  animation: fadeInUp 0.6s ease;
}

.section-title {
  font-size: 18px;
  font-weight: 800;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 16px;
  padding-left: 12px;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 4px;
    height: 20px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 2px;
  }
}

.update-time {
  font-size: 13px;
  color: rgba(102, 126, 234, 0.6);
  font-weight: 500;
  margin-left: 16px;
}

.lib-cascader {
  width: 100%;
  margin-bottom: 16px;
}

.refresh-button {
  width: 100%;
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
  color: white;
  border: none;
  border-radius: 12px;
  padding: 14px 24px;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(17, 153, 142, 0.4);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 24px rgba(17, 153, 142, 0.6);
  }
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 30px;

  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }
}

.stat-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  padding: 24px;
  text-align: center;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  border: 2px solid rgba(255, 255, 255, 0.5);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  animation: fadeInUp 0.6s ease;

  &:hover {
    transform: translateY(-8px);
    box-shadow: 0 16px 48px rgba(0, 0, 0, 0.2);
  }
}

.stat-icon {
  font-size: 36px;
  margin-bottom: 12px;
}

.stat-value {
  font-size: 32px;
  font-weight: 900;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 14px;
  color: rgba(0, 0, 0, 0.6);
  font-weight: 600;
}

.total-card .stat-value {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.available-card .stat-value {
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.booking-card .stat-value {
  background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.used-card .stat-value {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.seats-detail-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  padding: 28px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.5);
  animation: fadeInUp 0.7s ease;
}

.seats-categories {
  margin-top: 24px;
}

.category-section {
  margin-bottom: 32px;

  &:last-child {
    margin-bottom: 0;
  }
}

.category-header {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  padding: 12px 16px;
  border-radius: 12px;
  font-weight: 700;
  font-size: 16px;
}

.category-icon {
  font-size: 20px;
  margin-right: 10px;
}

.available-header {
  background: linear-gradient(135deg, rgba(17, 153, 142, 0.1) 0%, rgba(56, 239, 125, 0.1) 100%);
  color: #11998e;
}

.booking-header {
  background: linear-gradient(135deg, rgba(250, 112, 154, 0.1) 0%, rgba(254, 225, 64, 0.1) 100%);
  color: #fa709a;
}

.used-header {
  background: linear-gradient(135deg, rgba(240, 147, 251, 0.1) 0%, rgba(245, 87, 108, 0.1) 100%);
  color: #f093fb;
}

.unavailable-header {
  background: linear-gradient(135deg, rgba(255, 107, 107, 0.1) 0%, rgba(238, 90, 111, 0.1) 100%);
  color: #ff6b6b;
}

.seats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 12px;
}

.seat-tag {
  padding: 12px;
  border-radius: 10px;
  text-align: center;
  font-weight: 700;
  font-size: 14px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: default;
}

.available-tag {
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(17, 153, 142, 0.3);

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 20px rgba(17, 153, 142, 0.5);
  }
}

.booking-tag {
  background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(250, 112, 154, 0.3);

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 20px rgba(250, 112, 154, 0.5);
  }
}

.used-tag {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(240, 147, 251, 0.3);

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 20px rgba(240, 147, 251, 0.5);
  }
}

.unavailable-tag {
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(255, 107, 107, 0.3);

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 20px rgba(255, 107, 107, 0.5);
  }
}

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.loading-spinner {
  width: 60px;
  height: 60px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

.loading-text {
  color: white;
  font-size: 18px;
  font-weight: 600;
}

.empty-state {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  padding: 80px 40px;
  text-align: center;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.5);
  animation: fadeInUp 0.6s ease;
}

.empty-icon {
  font-size: 80px;
  margin-bottom: 24px;
}

.empty-text {
  font-size: 18px;
  color: rgba(102, 126, 234, 0.7);
  font-weight: 600;
}
</style>

<style>
.custom-popper {
  .el-cascader-node.in-active-path,
  .el-cascader-node.is-active,
  .el-cascader-node.is-selectable.in-checked-path {
    color: #667eea !important;
    font-weight: 700;
  }

  .el-cascader-node:hover {
    background: rgba(102, 126, 234, 0.1) !important;
  }
}

.el-cascader {
  width: 100% !important;
}

.el-cascader .el-input__inner {
  height: 52px !important;
  border-radius: 12px !important;
  border: 2px solid rgba(102, 126, 234, 0.2) !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
  background: rgba(255, 255, 255, 0.8) !important;
  font-weight: 500 !important;
  font-size: 15px !important;
}

.el-cascader .el-input__inner:hover {
  border-color: rgba(102, 126, 234, 0.4) !important;
}

.el-input.is-focus .el-input__inner,
.el-cascader .el-input.is-focus .el-input__inner {
  border-color: #667eea !important;
  background: white !important;
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.25) !important;
  transform: translateY(-2px);
}
</style>
