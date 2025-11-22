<template>
  <div class="home-container">
    <div class="home-body">
      <div class="home-title">梓铭祝你天天开心</div>

      <div class="nav-cards">
        <!-- 预约管理卡片 -->
        <div class="nav-card" @click="goToReservation">
          <div class="card-icon">📅</div>
          <div class="card-title">预约管理</div>
          <div class="card-desc">管理图书馆座位预约<br/>设置Cookie、配置座位、测试预约</div>
        </div>

        <!-- 座位查看卡片 -->
        <div class="nav-card" @click="goToSeatView">
          <div class="card-icon">👀</div>
          <div class="card-title">座位查看</div>
          <div class="card-desc">查看实时座位状态<br/>座位分布、使用情况统计</div>
        </div>

        <!-- 收藏监控卡片 -->
        <div class="nav-card" @click="goToFavoriteMonitor">
          <div class="card-icon">⭐</div>
          <div class="card-title">收藏监控</div>
          <div class="card-desc">监控收藏座位<br/>实时预订、快速取消</div>
        </div>

        <!-- 楼层占用情况卡片 -->
        <div class="nav-card" @click="goToFloorOccupancy">
          <div class="card-icon">📊</div>
          <div class="card-title">楼层占用</div>
          <div class="card-desc">楼层占用统计<br/>可视化数据、占用率分析</div>
        </div>
      </div>

      <div class="footer-text">选择一个功能开始使用</div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Home',
  methods: {
    goToReservation() {
      this.$router.push('/reservation')
    },
    goToSeatView() {
      this.$router.push('/seat-view')
    },
    goToFavoriteMonitor() {
      this.$router.push('/favorite-monitor')
    },
    goToFloorOccupancy() {
      this.$router.push('/floor-occupancy')
    }
  }
}
</script>

<style lang="scss" scoped>
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
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

.home-container {
  width: 100%;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #4facfe 75%, #00f2fe 100%);
  background-size: 400% 400%;
  animation: gradientShift 15s ease infinite;
  padding: 60px 20px;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;

  .home-body {
    width: 100%;
    max-width: 900px;
    animation: fadeInUp 0.8s ease;
  }

  .home-title {
    color: white;
    font-weight: 900;
    font-size: 48px;
    text-align: center;
    text-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    letter-spacing: 3px;
    margin-bottom: 60px;

    @media (max-width: 768px) {
      font-size: 32px;
      margin-bottom: 40px;
    }
  }

  .nav-cards {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 32px;
    margin-bottom: 40px;

    @media (max-width: 1200px) {
      grid-template-columns: repeat(2, 1fr);
    }

    @media (max-width: 768px) {
      grid-template-columns: 1fr;
      gap: 24px;
    }
  }

  .nav-card {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(20px);
    border-radius: 24px;
    padding: 48px 32px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
    cursor: pointer;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    border: 2px solid rgba(255, 255, 255, 0.5);
    text-align: center;
    position: relative;
    overflow: hidden;

    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
      transition: left 0.6s;
    }

    &:hover {
      transform: translateY(-12px) scale(1.03);
      box-shadow: 0 16px 48px rgba(0, 0, 0, 0.25);
      border-color: rgba(102, 126, 234, 0.8);

      &::before {
        left: 100%;
      }

      .card-icon {
        transform: scale(1.2) rotate(10deg);
      }
    }

    &:active {
      transform: translateY(-8px) scale(1.01);
    }

    .card-icon {
      font-size: 80px;
      margin-bottom: 24px;
      transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      display: inline-block;
    }

    .card-title {
      font-size: 28px;
      font-weight: 800;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin-bottom: 16px;
      letter-spacing: 1px;
    }

    .card-desc {
      font-size: 16px;
      color: rgba(0, 0, 0, 0.6);
      line-height: 1.8;
      font-weight: 500;
    }
  }

  .footer-text {
    text-align: center;
    color: rgba(255, 255, 255, 0.9);
    font-size: 18px;
    font-weight: 600;
    text-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    letter-spacing: 1px;
  }
}
</style>
