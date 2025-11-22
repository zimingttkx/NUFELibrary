import router from '@/router';

describe('Router配置测试', () => {
  test('应该包含4个路由', () => {
    expect(router.options.routes.length).toBeGreaterThanOrEqual(4);
  });

  test('应该有首页路由', () => {
    const homeRoute = router.options.routes.find(r => r.path === '/');
    expect(homeRoute).toBeDefined();
    expect(homeRoute.name).toBe('Home');
  });

  test('应该有预约管理路由', () => {
    const reservationRoute = router.options.routes.find(r => r.path === '/reservation');
    expect(reservationRoute).toBeDefined();
    expect(reservationRoute.name).toBe('Reservation');
  });

  test('应该有座位查看路由', () => {
    const seatViewRoute = router.options.routes.find(r => r.path === '/seat-view');
    expect(seatViewRoute).toBeDefined();
    expect(seatViewRoute.name).toBe('SeatView');
  });

  test('应该有收藏监控路由', () => {
    const favoriteMonitorRoute = router.options.routes.find(r => r.path === '/favorite-monitor');
    expect(favoriteMonitorRoute).toBeDefined();
    expect(favoriteMonitorRoute.name).toBe('FavoriteMonitor');
    expect(favoriteMonitorRoute.meta.title).toBe('收藏监控');
  });

  test('路由模式应该是hash', () => {
    expect(router.mode).toBe('hash');
  });
});
