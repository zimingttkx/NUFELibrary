<template>
  <div class="container">
    <!-- Toast提示 -->
    <transition name="toast-fade">
      <div v-if="toast.show" class="toast" :class="toast.type">
        {{ toast.message }}
      </div>
    </transition>

    <div class="body">
      <!-- 顶部导航栏 -->
      <div class="top-nav">
        <button class="back-button" @click="goBack">
          ← 返回主页
        </button>
        <div class="cutline">楼层占用情况 📊</div>
        <div class="nav-placeholder"></div>
      </div>

      <!-- Cookie状态卡片 -->
      <div class="section-card cookie-status-card">
        <div class="section-title">系统状态</div>
        <div class="status-grid">
          <div class="status-item" :class="cookieValid ? 'status-valid' : 'status-invalid'">
            <span class="status-label">Cookie状态：</span>
            <span class="status-value">{{ cookieValid ? '✅ 有效' : '❌ 无效' }}</span>
          </div>
          <div v-if="lastUpdate" class="status-item">
            <span class="status-label">最后刷新：</span>
            <span class="status-value">{{ formatTime(lastUpdate) }}</span>
          </div>
        </div>
        <button class="button-31 refresh-button" @click="loadFloorOccupancy" :disabled="loading">
          {{ loading ? '刷新中...' : '🔄 刷新数据' }}
        </button>
      </div>

      <!-- 楼层占用列表 -->
      <div class="section-card floors-list-card">
        <div class="section-header">
          <div class="section-title">楼层占用列表</div>
          <div class="section-info">
            共 {{ floors.length }} 个楼层
          </div>
        </div>

        <div v-if="loading && floors.length === 0" class="loading-text">
          正在加载数据...
        </div>
        <div v-else-if="floors.length === 0" class="empty-text">
          {{ cookieValid ? '暂无数据' : '请先设置有效的Cookie' }}
        </div>
        <div v-else class="floors-grid">
          <div
            v-for="(floor, index) in floors"
            :key="floor.libId"
            class="floor-card"
            :class="getOccupancyClass(floor.occupancyRate)"
          >
            <div class="floor-header">
              <div class="floor-index">{{ index + 1 }}</div>
              <div class="floor-info">
                <div class="floor-name">{{ floor.libName }}</div>
                <div class="floor-level">{{ floor.libFloor }}</div>
              </div>
              <div class="occupancy-badge" :class="getOccupancyClass(floor.occupancyRate)">
                {{ floor.occupancyRate }}%
              </div>
            </div>
            <div class="floor-stats">
              <div class="stat-item">
                <div class="stat-value">{{ floor.total }}</div>
                <div class="stat-label">总座位</div>
              </div>
              <div class="stat-item occupied">
                <div class="stat-value">{{ floor.occupied }}</div>
                <div class="stat-label">已占用</div>
              </div>
              <div class="stat-item available">
                <div class="stat-value">{{ floor.available }}</div>
                <div class="stat-label">可用</div>
              </div>
            </div>
            <div class="progress-bar">
              <div
                class="progress-fill"
                :class="getOccupancyClass(floor.occupancyRate)"
                :style="{ width: floor.occupancyRate + '%' }"
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";

export default {
  name: 'FloorOccupancy',
  data() {
    return {
      DOMAIN: "http://127.0.0.1:8899",
      floors: [],
      loading: false,
      cookieValid: false,
      lastUpdate: null,
      // Toast提示
      toast: {
        show: false,
        message: '',
        type: 'info',
        timer: null
      }
    };
  },
  methods: {
    // 显示Toast提示
    showToast(message, type = 'info', duration = 3000) {
      if (this.toast.timer) {
        clearTimeout(this.toast.timer);
      }

      this.toast.message = message;
      this.toast.type = type;
      this.toast.show = true;

      this.toast.timer = setTimeout(() => {
        this.toast.show = false;
      }, duration);
    },
    // 返回主页
    goBack() {
      this.$router.push('/');
    },
    // 加载楼层占用情况
    async loadFloorOccupancy() {
      this.loading = true;
      try {
        const res = await axios.get(`${this.DOMAIN}/lib/getFloorOccupancy`);

        if (res.data.code === 0) {
          this.floors = res.data.data.floors || [];
          this.cookieValid = res.data.data.cookieValid;
          this.lastUpdate = res.data.data.lastUpdate;
          this.showToast(`✅ 刷新成功，加载了 ${this.floors.length} 个楼层的数据`, "success");
        } else {
          this.cookieValid = false;
          this.showToast(`❌ ${res.data.msg || '加载失败'}`, "error");
        }
      } catch (error) {
        console.error("[loadFloorOccupancy错误]", error);
        this.showToast("❌ 加载失败，请检查网络连接", "error");
      } finally {
        this.loading = false;
      }
    },
    // 获取占用率对应的CSS类
    getOccupancyClass(rate) {
      if (rate >= 80) return 'high';
      if (rate >= 50) return 'medium';
      return 'low';
    },
    // 格式化时间
    formatTime(timestamp) {
      if (!timestamp) return '';
      const date = new Date(timestamp);
      return date.toLocaleString('zh-CN', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    }
  },
  async mounted() {
    // 页面加载时自动刷新数据
    await this.loadFloorOccupancy();
  }
};
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

.container {
  width: 100%;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #4facfe 75%, #00f2fe 100%);
  background-size: 400% 400%;
  animation: gradientShift 15s ease infinite;
  padding: 30px 20px;
  box-sizing: border-box;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    pointer-events: none;
  }
}

@keyframes gradientShift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

/* Toast提示样式 */
.toast {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  padding: 14px 28px;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  color: white;
  z-index: 9999;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(10px);
}

.toast.success {
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
}

.toast.error {
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%);
}

.toast.warning {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.toast.info {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.toast-fade-enter-active,
.toast-fade-leave-active {
  transition: all 0.3s ease;
}

.toast-fade-enter,
.toast-fade-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-20px);
}

/* 顶部导航栏 */
.top-nav {
  grid-column: 1 / -1;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.back-button {
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  padding: 12px 24px;
  color: white;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);

  &:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: translateX(-4px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
  }
}

.nav-placeholder {
  width: 120px;
}

.cutline {
  color: white;
  font-weight: 900;
  font-size: 32px;
  margin: 0;
  text-align: center;
  text-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  letter-spacing: 2px;
  animation: fadeInUp 0.8s ease;
  position: relative;
  z-index: 1;
}

.body {
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
}

.section-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  padding: 28px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  animation: fadeInUp 0.6s ease;
  border: 1px solid rgba(255, 255, 255, 0.5);

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.2);
  }
}

.section-title {
  font-size: 18px;
  font-weight: 800;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 16px;
  text-align: left;
  letter-spacing: 0.5px;
  position: relative;
  padding-left: 12px;

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

.cookie-status-card {
  grid-column: 1 / -1;
}

.status-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 12px;
  margin-bottom: 20px;
}

.status-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background: rgba(102, 126, 234, 0.05);
  border-radius: 10px;
  border: 2px solid rgba(102, 126, 234, 0.1);
  transition: all 0.3s ease;

  &.status-valid {
    background: rgba(56, 239, 125, 0.1);
    border-color: rgba(56, 239, 125, 0.3);

    .status-value {
      color: #11998e;
      font-weight: 800;
    }
  }

  &.status-invalid {
    background: rgba(255, 107, 107, 0.1);
    border-color: rgba(255, 107, 107, 0.3);

    .status-value {
      color: #ff6b6b;
      font-weight: 800;
    }
  }
}

.status-label {
  font-weight: 600;
  color: rgba(102, 126, 234, 0.7);
  min-width: 100px;
}

.status-value {
  font-weight: 600;
  color: #667eea;
}

.refresh-button {
  width: 100%;
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  border-radius: 12px;
  border: none;
  color: white;
  cursor: pointer;
  font-size: 16px;
  font-weight: 700;
  min-height: 50px;
  padding: 14px 24px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 16px rgba(79, 172, 254, 0.4);

  &:hover:not(:disabled) {
    transform: translateY(-3px);
    box-shadow: 0 8px 24px rgba(79, 172, 254, 0.6);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.floors-list-card {
  grid-column: 1 / -1;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-header .section-title {
  margin-bottom: 0;
}

.section-info {
  font-size: 14px;
  color: rgba(102, 126, 234, 0.7);
  font-weight: 600;
}

.loading-text,
.empty-text {
  text-align: center;
  padding: 40px 20px;
  font-size: 16px;
  color: rgba(102, 126, 234, 0.6);
  font-weight: 600;
}

.floors-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
}

.floor-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  border: 2px solid rgba(102, 126, 234, 0.1);
  transition: all 0.3s ease;
  animation: fadeInUp 0.4s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  }

  &.low {
    border-color: rgba(56, 239, 125, 0.3);
    background: linear-gradient(to bottom right, white 0%, rgba(56, 239, 125, 0.05) 100%);
  }

  &.medium {
    border-color: rgba(240, 147, 251, 0.3);
    background: linear-gradient(to bottom right, white 0%, rgba(240, 147, 251, 0.05) 100%);
  }

  &.high {
    border-color: rgba(255, 107, 107, 0.3);
    background: linear-gradient(to bottom right, white 0%, rgba(255, 107, 107, 0.05) 100%);
  }
}

.floor-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.floor-index {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 16px;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.floor-info {
  flex: 1;
  min-width: 0;
}

.floor-name {
  font-size: 16px;
  font-weight: 800;
  color: #667eea;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.floor-level {
  font-size: 13px;
  color: rgba(102, 126, 234, 0.6);
  font-weight: 600;
}

.occupancy-badge {
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 800;
  flex-shrink: 0;

  &.low {
    background: rgba(56, 239, 125, 0.2);
    color: #11998e;
  }

  &.medium {
    background: rgba(240, 147, 251, 0.2);
    color: #f093fb;
  }

  &.high {
    background: rgba(255, 107, 107, 0.2);
    color: #ff6b6b;
  }
}

.floor-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}

.stat-item {
  text-align: center;
  padding: 12px;
  background: rgba(102, 126, 234, 0.05);
  border-radius: 10px;
  border: 1px solid rgba(102, 126, 234, 0.1);

  &.occupied {
    background: rgba(255, 107, 107, 0.05);
    border-color: rgba(255, 107, 107, 0.2);

    .stat-value {
      color: #ff6b6b;
    }
  }

  &.available {
    background: rgba(56, 239, 125, 0.05);
    border-color: rgba(56, 239, 125, 0.2);

    .stat-value {
      color: #11998e;
    }
  }
}

.stat-value {
  font-size: 24px;
  font-weight: 800;
  color: #667eea;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  color: rgba(102, 126, 234, 0.7);
  font-weight: 600;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: rgba(102, 126, 234, 0.1);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  transition: width 0.6s ease;
  border-radius: 4px;

  &.low {
    background: linear-gradient(90deg, #11998e 0%, #38ef7d 100%);
  }

  &.medium {
    background: linear-gradient(90deg, #f093fb 0%, #f5576c 100%);
  }

  &.high {
    background: linear-gradient(90deg, #ff6b6b 0%, #ee5a6f 100%);
  }
}

.button-31 {
  width: 100%;
}
</style>
