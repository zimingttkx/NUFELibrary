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
        <div class="cutline">收藏座位监控 🎯</div>
        <div class="nav-placeholder"></div>
      </div>

      <!-- Cookie状态 -->
      <div class="section-card cookie-status-card">
        <div class="section-title">Cookie状态</div>
        <div v-if="cookieStatus" class="cookie-info">
          <div class="status-item" :class="cookieStatus.valid ? 'status-valid' : 'status-invalid'">
            <span class="status-label">状态：</span>
            <span class="status-value">{{ cookieStatus.valid ? '✅ 有效' : '❌ 无效' }}</span>
          </div>
          <div v-if="cookieStatus.expiry" class="status-item">
            <span class="status-label">过期时间：</span>
            <span class="status-value">{{ cookieStatus.expiry }}</span>
          </div>
          <div class="status-item">
            <span class="status-label">检查时间：</span>
            <span class="status-value">{{ cookieStatus.checkedAt }}</span>
          </div>
        </div>
        <div class="cookie-buttons">
          <button class="button-31 refresh-cookie-button" @click="checkCookie">
            {{ checkingCookie ? '检查中...' : '刷新Cookie状态' }}
          </button>
          <button class="button-31 clear-cookie-button" @click="clearCookie">
            {{ clearingCookie ? '清除中...' : '清除Cookie' }}
          </button>
        </div>
      </div>

      <!-- 收藏列表 -->
      <div class="section-card favorites-list-card">
        <div class="section-header">
          <div class="section-title">收藏座位列表</div>
          <div class="section-actions">
            <button
              class="button-31 cancel-all-button"
              @click="cancelAllReservations"
              :disabled="cancelingAll"
            >
              {{ cancelingAll ? '退订中...' : '🚫 退订当前预约' }}
            </button>
            <button
              class="button-31 test-reserve-button"
              @click="testReserve"
              :disabled="testingReserve || favorites.length === 0"
            >
              {{ testingReserve ? '测试中...' : '🧪 预定测试' }}
            </button>
            <button
              class="button-31 smart-reserve-button"
              @click="smartReserve"
              :disabled="smartReserving || favorites.length === 0"
            >
              {{ smartReserving ? '预约中...' : '🎯 智能预约' }}
            </button>
            <button
              class="button-31 refresh-status-button"
              @click="refreshSeatsStatus"
              :disabled="refreshingStatus || favorites.length === 0"
            >
              {{ refreshingStatus ? '刷新中...' : '刷新状态' }}
            </button>
          </div>
        </div>
        <div v-if="lastStatusUpdate" class="last-update-time">
          最后更新: {{ formatTime(lastStatusUpdate) }}
        </div>
        <div v-if="loadingFavorites" class="loading-text">加载中...</div>
        <div v-else-if="favorites.length === 0" class="empty-text">
          暂无收藏座位
        </div>
        <div v-else class="favorites-list">
          <div
            v-for="(favorite, index) in favoritesWithStatus"
            :key="favorite.id"
            class="favorite-item"
            :class="getStatusClass(favorite.status)"
          >
            <div class="favorite-index">{{ index + 1 }}</div>
            <div class="favorite-info">
              <div class="favorite-seat-name">
                座位 {{ favorite.seatName }}号
                <span v-if="favorite.status" class="status-badge" :class="getStatusClass(favorite.status)">
                  {{ getStatusText(favorite.status, favorite.isMyReservation) }}
                </span>
              </div>
              <div class="favorite-details">
                <span>{{ favorite.libName }}</span>
                <span class="separator">•</span>
                <span>{{ favorite.libFloor }}</span>
              </div>
            </div>
            <div class="favorite-actions">
              <!-- 预订按钮 - 仅当座位空闲时显示 -->
              <button
                v-if="favorite.status === 'available'"
                class="action-button reserve-button"
                @click="reserveSeat(favorite)"
                :disabled="reservingId === favorite.id"
              >
                {{ reservingId === favorite.id ? '预订中...' : '预订' }}
              </button>
              <!-- 取消预订按钮 - 当座位已被预订时显示 -->
              <button
                v-if="favorite.status === 'reserved' || favorite.isMyReservation"
                class="action-button cancel-button"
                @click="cancelReservation(favorite)"
                :disabled="cancelingId === favorite.reservationId"
              >
                {{ cancelingId === favorite.reservationId ? '取消中...' : '取消预订' }}
              </button>
              <!-- 删除收藏按钮 -->
              <button
                class="action-button delete-button"
                @click="removeFavorite(favorite)"
                :disabled="removingId === favorite.id"
              >
                {{ removingId === favorite.id ? '删除中...' : '删除' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 添加收藏 -->
      <div class="section-card add-favorite-card">
        <div class="section-title">添加收藏座位</div>
        <div class="add-form">
          <div class="form-row">
            <select
              v-model="newFavorite.libId"
              class="select-field"
              @change="onLibraryChange"
            >
              <option value="">选择图书馆</option>
              <option v-for="lib in libraries" :key="lib.lib_id" :value="lib.lib_id">
                {{ lib.lib_floor }} - {{ lib.lib_name }}
              </option>
            </select>
            <select
              v-model="newFavorite.libFloor"
              class="select-field"
              :disabled="!newFavorite.libId"
            >
              <option value="">选择楼层</option>
              <option v-for="floor in floors" :key="floor" :value="floor">
                {{ floor }}
              </option>
            </select>
          </div>
          <div class="form-row">
            <input
              v-model="newFavorite.seatKey"
              class="input-field"
              placeholder="座位键 (如: 25,13)"
            />
            <input
              v-model="newFavorite.seatName"
              class="input-field"
              placeholder="座位号 (如: 179)"
            />
          </div>
          <button class="button-31 add-button" @click="addFavorite">
            {{ addingFavorite ? '添加中...' : '添加到收藏' }}
          </button>
        </div>
      </div>

    </div>
  </div>
</template>

<script>
import axios from "axios";

export default {
  name: 'FavoriteMonitor',
  data() {
    return {
      DOMAIN: "http://127.0.0.1:8899",
      cookieStatus: null,
      checkingCookie: false,
      clearingCookie: false,
      favorites: [],
      loadingFavorites: false,
      libraries: [],
      floors: [],
      newFavorite: {
        libId: '',
        libName: '',
        libFloor: '',
        seatKey: '',
        seatName: ''
      },
      addingFavorite: false,
      // 状态刷新相关
      seatsStatus: {},
      refreshingStatus: false,
      lastStatusUpdate: null,
      // 删除收藏相关
      removingId: null,
      // 预订相关
      reservingId: null,
      cancelingId: null,
      smartReserving: false,
      testingReserve: false,
      cancelingAll: false,
      // Toast提示
      toast: {
        show: false,
        message: '',
        type: 'info', // success, error, warning, info
        timer: null
      }
    };
  },
  computed: {
    // 合并收藏列表和状态信息
    favoritesWithStatus() {
      return this.favorites.map(fav => {
        const status = this.seatsStatus[fav.id] || {};
        return {
          ...fav,
          status: status.status || null,
          isMyReservation: status.isMyReservation || false,
          reservationId: status.reservationId || null,
          lastUpdate: status.lastUpdate || null,
          error: status.error || null
        };
      });
    }
  },
  methods: {
    // 显示Toast提示
    showToast(message, type = 'info', duration = 3000) {
      // 清除之前的定时器
      if (this.toast.timer) {
        clearTimeout(this.toast.timer);
      }

      this.toast.message = message;
      this.toast.type = type;
      this.toast.show = true;

      // 自动隐藏
      this.toast.timer = setTimeout(() => {
        this.toast.show = false;
      }, duration);
    },
    // 返回主页
    goBack() {
      this.$router.push('/');
    },
    async checkCookie() {
      this.checkingCookie = true;
      try {
        const res = await axios.get(`${this.DOMAIN}/lib/getCookieStatus`);
        if (res.data.code === 0) {
          this.cookieStatus = res.data.data;
          if (this.cookieStatus.valid) {
            this.showToast("Cookie有效", "success");
          } else {
            this.showToast("Cookie无效或已过期，请重新设置", "error");
          }
        } else {
          this.showToast("检查Cookie失败", "error");
        }
      } catch (error) {
        console.error("[checkCookie错误]", error);
        this.showToast("检查Cookie失败，请检查网络连接", "error");
      } finally {
        this.checkingCookie = false;
      }
    },
    async clearCookie() {
      if (!confirm("确定要清除Cookie吗？清除后需要重新设置Cookie才能使用预约功能。")) {
        return;
      }

      this.clearingCookie = true;
      try {
        const res = await axios.post(`${this.DOMAIN}/lib/clearCookie`);
        if (res.data.code === 0) {
          this.showToast("Cookie已清除", "success");
          // 重新检查Cookie状态
          await this.checkCookie();
        } else {
          this.showToast(`清除Cookie失败: ${res.data.msg || '未知错误'}`, "error");
        }
      } catch (error) {
        console.error("[clearCookie错误]", error);
        this.showToast("清除Cookie失败，请检查网络连接", "error");
      } finally {
        this.clearingCookie = false;
      }
    },
    async loadFavorites() {
      this.loadingFavorites = true;
      try {
        const res = await axios.get(`${this.DOMAIN}/lib/getFavoriteSeats`);
        if (res.data.code === 0) {
          this.favorites = res.data.data.favorites;
          console.log(`✓ 加载了 ${this.favorites.length} 个收藏座位`);
        } else {
          this.showToast("加载收藏列表失败", "error");
        }
      } catch (error) {
        console.error("[loadFavorites错误]", error);
        this.showToast("加载收藏列表失败，请检查网络连接", "error");
      } finally {
        this.loadingFavorites = false;
      }
    },
    async loadLibraries() {
      try {
        const res = await axios.get(`${this.DOMAIN}/lib/getLibList`);
        if (res.data.code === 0) {
          this.libraries = res.data.data.libList;
          console.log(`✓ 加载了 ${this.libraries.length} 个图书馆`);
        } else {
          console.error("加载图书馆列表失败");
        }
      } catch (error) {
        console.error("[loadLibraries错误]", error);
      }
    },
    onLibraryChange() {
      // 当用户选择图书馆时，自动填充图书馆名称和获取楼层列表
      const selectedLib = this.libraries.find(lib => lib.lib_id === this.newFavorite.libId);
      if (selectedLib) {
        this.newFavorite.libName = selectedLib.lib_name;

        // 获取该图书馆的所有楼层（从libraries中筛选同名图书馆的所有楼层）
        const sameLibs = this.libraries.filter(lib => lib.lib_name === selectedLib.lib_name);
        this.floors = [...new Set(sameLibs.map(lib => lib.lib_floor))];

        // 自动选择当前楼层
        this.newFavorite.libFloor = selectedLib.lib_floor;
      }
    },
    async addFavorite() {
      // 验证输入 - 只验证必须的字段
      if (!this.newFavorite.libId) {
        this.showToast("请选择图书馆", "warning");
        return;
      }

      // 座位键和座位号至少填写一个（二选一）
      if (!this.newFavorite.seatKey && !this.newFavorite.seatName) {
        this.showToast("请填写座位键或座位号（至少填写一个）", "warning");
        return;
      }

      this.addingFavorite = true;
      try {
        const requestData = {
          libId: parseInt(this.newFavorite.libId),
          libName: this.newFavorite.libName || '',
          libFloor: this.newFavorite.libFloor || '',
          seatKey: this.newFavorite.seatKey.trim(),
          seatName: this.newFavorite.seatName.trim()
        };

        console.log('准备添加收藏:', requestData);

        const res = await axios.post(`${this.DOMAIN}/lib/addFavoriteSeat`, requestData);

        console.log('添加收藏响应:', res.data);

        if (res.data.code === 0) {
          this.showToast(`成功添加座位 ${this.newFavorite.seatName}号 到收藏`, "success");
          // 清空表单
          this.newFavorite = {
            libId: '',
            libName: '',
            libFloor: '',
            seatKey: '',
            seatName: ''
          };
          this.floors = [];
          // 重新加载收藏列表
          await this.loadFavorites();
        } else {
          this.showToast(`添加失败: ${res.data.msg || '未知错误'}`, "error");
        }
      } catch (error) {
        console.error("[addFavorite错误]", error);
        if (error.response) {
          console.error("错误响应:", error.response.data);
          this.showToast(`添加收藏失败: ${error.response.data.msg || error.message}`, "error");
        } else {
          this.showToast("添加收藏失败，请检查网络连接", "error");
        }
      } finally {
        this.addingFavorite = false;
      }
    },
    // 删除收藏
    async removeFavorite(favorite) {
      if (!confirm(`确定要删除座位 ${favorite.seatName}号 的收藏吗？`)) {
        return;
      }

      this.removingId = favorite.id;
      try {
        const res = await axios.post(`${this.DOMAIN}/lib/removeFavoriteSeat`, {
          id: favorite.id
        });

        if (res.data.code === 0) {
          this.showToast(`已删除座位 ${favorite.seatName}号 的收藏`, "success");
          // 从状态缓存中删除
          delete this.seatsStatus[favorite.id];
          // 重新加载收藏列表
          await this.loadFavorites();
        } else {
          this.showToast(`删除失败: ${res.data.msg || '未知错误'}`, "error");
        }
      } catch (error) {
        console.error("[removeFavorite错误]", error);
        this.showToast("删除收藏失败，请检查网络连接", "error");
      } finally {
        this.removingId = null;
      }
    },
    // 刷新座位状态
    async refreshSeatsStatus() {
      if (this.favorites.length === 0) {
        this.showToast("没有收藏座位需要刷新", "warning");
        return;
      }

      this.refreshingStatus = true;
      try {
        const res = await axios.get(`${this.DOMAIN}/lib/getFavoriteSeatsStatus`);

        if (res.data.code === 0) {
          const seats = res.data.data.seats || [];
          // 更新状态缓存
          const newStatus = {};
          seats.forEach(seat => {
            newStatus[seat.id] = {
              status: seat.status,
              isMyReservation: seat.isMyReservation,
              reservationId: seat.reservationId,
              lastUpdate: seat.lastUpdate,
              error: seat.error
            };
          });
          this.seatsStatus = newStatus;
          this.lastStatusUpdate = Date.now();
          this.showToast(`已刷新 ${seats.length} 个座位的状态`, "success");
          console.log(`✓ 已刷新 ${seats.length} 个座位的状态`);
        } else {
          this.showToast(`刷新状态失败: ${res.data.msg || '未知错误'}`, "error");
        }
      } catch (error) {
        console.error("[refreshSeatsStatus错误]", error);
        this.showToast("刷新状态失败，请检查网络连接", "error");
      } finally {
        this.refreshingStatus = false;
      }
    },
    // 退订当前所有预约
    async cancelAllReservations() {
      if (!confirm("确定要退订当前所有预约吗？\n这将取消您账号下的所有座位预约。")) {
        return;
      }

      this.cancelingAll = true;
      try {
        // 调用后端API获取并取消所有预约
        const res = await axios.post(`${this.DOMAIN}/lib/cancelAllReservations`);

        if (res.data.code === 0) {
          this.showToast(res.data.msg, "success", 4000);

          // 清空本地所有座位的预约状态
          Object.keys(this.seatsStatus).forEach(id => {
            this.seatsStatus[id] = {
              ...this.seatsStatus[id],
              status: 'available',
              isMyReservation: false,
              reservationId: null,
              lastUpdate: Date.now()
            };
          });

          // 延迟刷新服务器状态
          setTimeout(async () => {
            await this.refreshSeatsStatus();
          }, 1000);
        } else {
          this.showToast(res.data.msg || '退订失败', "error");
        }
      } catch (error) {
        console.error("[cancelAllReservations错误]", error);
        this.showToast("退订失败，请检查网络连接", "error");
      } finally {
        this.cancelingAll = false;
      }
    },
    // 预定测试 - 自动找一个空闲座位测试预约功能
    async testReserve() {
      if (this.favorites.length === 0) {
        this.showToast("没有收藏座位", "warning");
        return;
      }

      if (!confirm("确定要进行预定测试吗？\n系统会自动找一个空闲座位进行预约，成功后立即取消。")) {
        return;
      }

      this.testingReserve = true;
      try {
        const res = await axios.get(`${this.DOMAIN}/lib/testReserveFavorite`);

        if (res.data.code === 0) {
          this.showToast(res.data.msg, "success", 5000);
          // 刷新状态
          await this.refreshSeatsStatus();
        } else {
          this.showToast(res.data.msg || '测试失败', "error", 5000);
        }
      } catch (error) {
        console.error("[testReserve错误]", error);
        this.showToast("预定测试失败，请检查Cookie和网络连接", "error");
      } finally {
        this.testingReserve = false;
      }
    },
    // 智能预约 - 自动找到第一个空闲座位并预约
    async smartReserve() {
      if (this.favorites.length === 0) {
        this.showToast("没有收藏座位", "warning");
        return;
      }

      this.smartReserving = true;
      try {
        // 先刷新所有座位状态
        await this.refreshSeatsStatus();

        // 找到第一个空闲的座位
        const availableSeat = this.favoritesWithStatus.find(seat => seat.status === 'available');

        if (!availableSeat) {
          this.showToast("没有找到空闲的座位，所有收藏座位都已被占用或预约", "warning");
          return;
        }

        // 预约该座位
        const res = await axios.post(`${this.DOMAIN}/lib/reserveFavoriteSeat`, {
          id: availableSeat.id
        });

        if (res.data.code === 0) {
          this.showToast(`✅ ${res.data.msg}`, "success", 4000);
          // 刷新状态
          await this.refreshSeatsStatus();
        } else {
          this.showToast(`❌ ${res.data.msg || '预订失败'}`, "error");
        }
      } catch (error) {
        console.error("[smartReserve错误]", error);
        this.showToast("智能预约失败，请检查Cookie和网络连接", "error");
      } finally {
        this.smartReserving = false;
      }
    },
    // 预订座位
    async reserveSeat(favorite) {
      if (!confirm(`确定要预订座位 ${favorite.seatName}号 吗？`)) {
        return;
      }

      this.reservingId = favorite.id;
      try {
        const res = await axios.post(`${this.DOMAIN}/lib/reserveFavoriteSeat`, {
          id: favorite.id
        });

        if (res.data.code === 0) {
          this.showToast(res.data.msg, "success");

          // 立即更新本地状态，让用户立即看到"取消预订"按钮
          if (res.data.data && res.data.data.reservationId) {
            this.seatsStatus[favorite.id] = {
              ...this.seatsStatus[favorite.id],
              status: 'reserved',
              isMyReservation: true,
              reservationId: res.data.data.reservationId,
              lastUpdate: Date.now()
            };
          }

          // 延迟刷新服务器状态以确保数据同步
          setTimeout(async () => {
            await this.refreshSeatsStatus();
          }, 1000);
        } else {
          this.showToast(res.data.msg || '预订失败', "error");
        }
      } catch (error) {
        console.error("[reserveSeat错误]", error);
        this.showToast("预订失败，请检查网络连接", "error");
      } finally {
        this.reservingId = null;
      }
    },
    // 取消预订
    async cancelReservation(favorite) {
      if (!confirm(`确定要取消座位 ${favorite.seatName}号 的预订吗？`)) {
        return;
      }

      // 如果没有 reservationId，先尝试获取
      let reservationId = favorite.reservationId;

      if (!reservationId) {
        // 刷新状态以获取 reservationId
        this.showToast("正在获取预订信息...", "info", 2000);
        await this.refreshSeatsStatus();

        // 重新获取更新后的 favorite
        const updatedFavorite = this.favoritesWithStatus.find(f => f.id === favorite.id);
        reservationId = updatedFavorite?.reservationId;

        if (!reservationId) {
          this.showToast("无法获取预订ID，请刷新后重试", "error");
          return;
        }
      }

      this.cancelingId = reservationId;
      try {
        const res = await axios.post(`${this.DOMAIN}/lib/cancelReservation`, {
          reservationId: reservationId
        });

        if (res.data.code === 0) {
          this.showToast(res.data.msg, "success");

          // 立即更新本地状态，让"取消预订"按钮立即消失，"预订"按钮出现
          this.seatsStatus[favorite.id] = {
            ...this.seatsStatus[favorite.id],
            status: 'available',
            isMyReservation: false,
            reservationId: null,
            lastUpdate: Date.now()
          };

          // 延迟刷新服务器状态以确保数据同步
          setTimeout(async () => {
            await this.refreshSeatsStatus();
          }, 1000);
        } else {
          this.showToast(res.data.msg || '取消失败', "error");
        }
      } catch (error) {
        console.error("[cancelReservation错误]", error);
        this.showToast("取消预订失败，请检查网络连接", "error");
      } finally {
        this.cancelingId = null;
      }
    },
    // 获取状态文本
    getStatusText(status, isMyReservation) {
      if (isMyReservation) return '📅 我的预约';
      switch (status) {
        case 'available': return '✅ 空闲';
        case 'occupied': return '🔴 已占用';
        case 'reserved': return '📅 已预约';
        case 'unknown': return '❓ 未知';
        default: return '';
      }
    },
    // 获取状态CSS类
    getStatusClass(status) {
      switch (status) {
        case 'available': return 'status-available';
        case 'occupied': return 'status-occupied';
        case 'reserved': return 'status-reserved';
        case 'unknown': return 'status-unknown';
        default: return '';
      }
    },
    // 格式化时间
    formatTime(timestamp) {
      if (!timestamp) return '';
      const date = new Date(timestamp);
      return date.toLocaleString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    }
  },
  async mounted() {
    // 初始化时检查Cookie
    await this.checkCookie();
    // 加载收藏列表
    await this.loadFavorites();
    // 加载图书馆列表
    await this.loadLibraries();
    // 自动刷新座位状态（如果有收藏的话）
    if (this.favorites.length > 0) {
      await this.refreshSeatsStatus();
    }
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

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
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
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  position: relative;
  z-index: 1;

  @media (max-width: 1200px) {
    grid-template-columns: 1fr;
  }
}

.section-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  padding: 28px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.3);
  display: flex;
  flex-direction: column;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  animation: fadeInUp 0.6s ease;
  border: 1px solid rgba(255, 255, 255, 0.5);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
    transition: left 0.5s;
  }

  &:hover {
    transform: translateY(-8px) scale(1.02);
    box-shadow: 0 16px 48px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.5);

    &::before {
      left: 100%;
    }
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

.cookie-info {
  display: flex;
  flex-direction: column;
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

  &:hover {
    background: rgba(102, 126, 234, 0.1);
    border-color: rgba(102, 126, 234, 0.3);
  }

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

.button-31 {
  width: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  border: none;
  box-sizing: border-box;
  color: white;
  cursor: pointer;
  display: inline-block;
  font-family: "Helvetica Neue", Arial, sans-serif;
  font-size: 16px;
  font-weight: 700;
  line-height: 1.5;
  margin: 0;
  min-height: 50px;
  outline: none;
  padding: 14px 24px;
  text-align: center;
  user-select: none;
  -webkit-user-select: none;
  touch-action: manipulation;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.4);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
    transition: left 0.5s;
  }

  &:hover::before {
    left: 100%;
  }

  &:hover {
    transform: translateY(-3px) scale(1.02);
    box-shadow: 0 8px 24px rgba(102, 126, 234, 0.5);
  }

  &:active {
    transform: translateY(-1px) scale(0.98);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  }
}

.cookie-buttons {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
}

.refresh-cookie-button {
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
  box-shadow: 0 4px 16px rgba(17, 153, 142, 0.4);

  &:hover {
    box-shadow: 0 8px 24px rgba(17, 153, 142, 0.6);
  }
}

.clear-cookie-button {
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%);
  box-shadow: 0 4px 16px rgba(255, 107, 107, 0.4);

  &:hover {
    box-shadow: 0 8px 24px rgba(255, 107, 107, 0.6);
  }
}

.favorites-list-card {
  grid-column: 1 / -1;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 12px;
}

.section-header .section-title {
  margin-bottom: 0;
}

.section-actions {
  display: flex;
  gap: 12px;
}

.cancel-all-button {
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%);
  box-shadow: 0 4px 16px rgba(255, 107, 107, 0.4);
  min-width: 140px;
  min-height: 40px;
  font-size: 14px;
  padding: 10px 20px;

  &:hover {
    box-shadow: 0 8px 24px rgba(255, 107, 107, 0.6);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
}

.test-reserve-button {
  background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
  box-shadow: 0 4px 16px rgba(168, 237, 234, 0.4);
  min-width: 120px;
  min-height: 40px;
  font-size: 14px;
  padding: 10px 20px;
  color: #667eea !important;
  font-weight: 800;

  &:hover {
    box-shadow: 0 8px 24px rgba(168, 237, 234, 0.6);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
}

.smart-reserve-button {
  background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
  box-shadow: 0 4px 16px rgba(250, 112, 154, 0.4);
  min-width: 130px;
  min-height: 40px;
  font-size: 14px;
  padding: 10px 20px;

  &:hover {
    box-shadow: 0 8px 24px rgba(250, 112, 154, 0.6);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
}

.refresh-status-button {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  box-shadow: 0 4px 16px rgba(79, 172, 254, 0.4);
  min-width: 120px;
  min-height: 40px;
  font-size: 14px;
  padding: 10px 20px;

  &:hover {
    box-shadow: 0 8px 24px rgba(79, 172, 254, 0.6);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
}

.last-update-time {
  font-size: 13px;
  color: rgba(102, 126, 234, 0.6);
  margin-bottom: 16px;
  padding-left: 12px;
}

.loading-text,
.empty-text {
  text-align: center;
  padding: 40px 20px;
  font-size: 16px;
  color: rgba(102, 126, 234, 0.6);
  font-weight: 600;
}

.favorites-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.favorite-item {
  display: flex;
  align-items: center;
  padding: 16px;
  background: rgba(102, 126, 234, 0.05);
  border-radius: 12px;
  border: 2px solid rgba(102, 126, 234, 0.1);
  transition: all 0.3s ease;
  animation: fadeInUp 0.4s ease;
  flex-wrap: wrap;
  gap: 12px;

  &:hover {
    background: rgba(102, 126, 234, 0.1);
    border-color: rgba(102, 126, 234, 0.3);
    transform: translateY(-4px);
    box-shadow: 0 8px 20px rgba(102, 126, 234, 0.2);
  }

  &.status-available {
    border-color: rgba(56, 239, 125, 0.4);
    background: rgba(56, 239, 125, 0.08);
  }

  &.status-occupied {
    border-color: rgba(255, 107, 107, 0.4);
    background: rgba(255, 107, 107, 0.08);
  }

  &.status-reserved {
    border-color: rgba(79, 172, 254, 0.4);
    background: rgba(79, 172, 254, 0.08);
  }

  &.status-unknown {
    border-color: rgba(150, 150, 150, 0.4);
    background: rgba(150, 150, 150, 0.08);
  }
}

.favorite-index {
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
  margin-right: 16px;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.favorite-info {
  flex: 1;
  min-width: 0;
}

.favorite-seat-name {
  font-size: 16px;
  font-weight: 800;
  color: #667eea;
  margin-bottom: 6px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.favorite-details {
  font-size: 14px;
  color: rgba(102, 126, 234, 0.7);
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;

  .separator {
    color: rgba(102, 126, 234, 0.4);
  }
}

.status-badge {
  display: inline-block;
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 20px;
  margin-left: 8px;
  font-weight: 700;

  &.status-available {
    background: rgba(56, 239, 125, 0.2);
    color: #11998e;
  }

  &.status-occupied {
    background: rgba(255, 107, 107, 0.2);
    color: #ff6b6b;
  }

  &.status-reserved {
    background: rgba(79, 172, 254, 0.2);
    color: #4facfe;
  }

  &.status-unknown {
    background: rgba(150, 150, 150, 0.2);
    color: #969696;
  }
}

.favorite-actions {
  display: flex;
  gap: 8px;
  margin-left: auto;
  flex-shrink: 0;
}

.action-button {
  padding: 8px 16px;
  border-radius: 8px;
  border: none;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 70px;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.reserve-button {
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(17, 153, 142, 0.3);

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(17, 153, 142, 0.4);
  }
}

.cancel-button {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(245, 87, 108, 0.3);

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(245, 87, 108, 0.4);
  }
}

.delete-button {
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(255, 107, 107, 0.3);

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(255, 107, 107, 0.4);
  }
}

.add-favorite-card {
  grid-column: 1 / -1;
}

.add-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
}

.input-field,
.select-field {
  width: 100%;
  padding: 14px 18px;
  border: 2px solid rgba(102, 126, 234, 0.2);
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  color: #667eea;
  background: rgba(102, 126, 234, 0.05);
  transition: all 0.3s ease;
  outline: none;
  box-sizing: border-box;

  &::placeholder {
    color: rgba(102, 126, 234, 0.4);
    font-weight: 500;
  }

  &:hover {
    border-color: rgba(102, 126, 234, 0.4);
    background: rgba(102, 126, 234, 0.08);
  }

  &:focus {
    border-color: #667eea;
    background: rgba(102, 126, 234, 0.1);
    box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.select-field {
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23667eea' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 18px center;
  padding-right: 45px;

  option {
    background: white;
    color: #667eea;
    font-weight: 600;
  }
}

.add-button {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.4);

  &:hover {
    box-shadow: 0 8px 24px rgba(102, 126, 234, 0.6);
  }
}
</style>
