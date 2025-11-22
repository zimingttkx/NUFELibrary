import { shallowMount, createLocalVue } from '@vue/test-utils';
import FavoriteMonitor from '@/views/FavoriteMonitor.vue';
import axios from 'axios';

// Mock axios
jest.mock('axios');

// Mock window.alert and window.confirm
global.alert = jest.fn();
global.confirm = jest.fn(() => true);

const localVue = createLocalVue();

describe('FavoriteMonitor.vue', () => {
  let wrapper;

  beforeEach(() => {
    jest.clearAllMocks();
    global.alert.mockClear();
    global.confirm.mockClear();

    // Provide complete mock responses
    axios.get.mockResolvedValue({
      data: {
        code: 0,
        data: {
          libList: [],
          favorites: [],
          seats: [],
          total: 0,
          valid: true,
          expiry: '2025-11-23 20:00:00',
          checkedAt: '2025-11-22 13:53:00'
        }
      }
    });

    axios.post.mockResolvedValue({
      data: {
        code: 0,
        msg: 'Success'
      }
    });
  });

  afterEach(() => {
    if (wrapper) {
      wrapper.destroy();
      wrapper = null;
    }
  });

  describe('组件基础测试', () => {
    test('应该能够创建组件实例', () => {
      wrapper = shallowMount(FavoriteMonitor, { localVue });

      expect(wrapper.vm).toBeTruthy();
      expect(wrapper.vm.$options.name).toBe('FavoriteMonitor');
    });

    test('应该初始化正确的data', () => {
      wrapper = shallowMount(FavoriteMonitor, { localVue });

      expect(wrapper.vm.favorites).toEqual([]);
      expect(wrapper.vm.seatsStatus).toEqual({});
      expect(wrapper.vm.refreshingStatus).toBe(false);
      expect(wrapper.vm.removingId).toBeNull();
      expect(wrapper.vm.reservingId).toBeNull();
      expect(wrapper.vm.cancelingId).toBeNull();
    });
  });

  describe('工具方法测试', () => {
    beforeEach(() => {
      wrapper = shallowMount(FavoriteMonitor, { localVue });
    });

    test('getStatusText应该返回正确的文本', () => {
      // 测试空闲状态
      expect(wrapper.vm.getStatusText('available', false)).toBe('✅ 空闲');
      // 测试占用状态
      expect(wrapper.vm.getStatusText('occupied', false)).toBe('🔴 已占用');
      // 测试已预约状态
      expect(wrapper.vm.getStatusText('reserved', false)).toBe('📅 已预约');
      // 测试未知状态
      expect(wrapper.vm.getStatusText('unknown', false)).toBe('❓ 未知');
      // 测试我的预约
      expect(wrapper.vm.getStatusText('reserved', true)).toBe('📅 我的预约');
    });

    test('getStatusClass应该返回正确的CSS类', () => {
      expect(wrapper.vm.getStatusClass('available')).toBe('status-available');
      expect(wrapper.vm.getStatusClass('occupied')).toBe('status-occupied');
      expect(wrapper.vm.getStatusClass('reserved')).toBe('status-reserved');
      expect(wrapper.vm.getStatusClass('unknown')).toBe('status-unknown');
      expect(wrapper.vm.getStatusClass(null)).toBe('');
    });

    test('formatTime应该正确格式化时间戳', () => {
      const timestamp = new Date('2025-11-22T10:05:03').getTime();
      const formatted = wrapper.vm.formatTime(timestamp);
      expect(formatted).toBe('10:05:03');
    });

    test('formatTime应该处理空值', () => {
      expect(wrapper.vm.formatTime(null)).toBe('');
      expect(wrapper.vm.formatTime(undefined)).toBe('');
    });
  });

  describe('计算属性测试', () => {
    beforeEach(() => {
      wrapper = shallowMount(FavoriteMonitor, { localVue });
    });

    test('favoritesWithStatus应该合并收藏列表和状态信息', async () => {
      await wrapper.vm.$nextTick();

      wrapper.vm.favorites = [
        { id: '429-179', seatName: '179' },
        { id: '429-180', seatName: '180' }
      ];

      wrapper.vm.seatsStatus = {
        '429-179': { status: 'available', isMyReservation: false },
        '429-180': { status: 'occupied', isMyReservation: false }
      };

      await wrapper.vm.$nextTick();

      expect(wrapper.vm.favoritesWithStatus.length).toBe(2);
      expect(wrapper.vm.favoritesWithStatus[0].status).toBe('available');
      expect(wrapper.vm.favoritesWithStatus[1].status).toBe('occupied');
    });

    test('favoritesWithStatus应该处理没有状态的收藏', async () => {
      await wrapper.vm.$nextTick();

      wrapper.vm.favorites = [
        { id: '429-179', seatName: '179' }
      ];
      wrapper.vm.seatsStatus = {};

      await wrapper.vm.$nextTick();

      expect(wrapper.vm.favoritesWithStatus[0].status).toBeNull();
      expect(wrapper.vm.favoritesWithStatus[0].isMyReservation).toBe(false);
    });
  });

  describe('删除收藏功能测试', () => {
    beforeEach(() => {
      wrapper = shallowMount(FavoriteMonitor, { localVue });
    });

    test('removeFavorite应该显示确认对话框', async () => {
      await wrapper.vm.$nextTick();

      const favorite = { id: '429-179', seatName: '179' };
      wrapper.vm.favorites = [favorite];

      await wrapper.vm.removeFavorite(favorite);

      expect(global.confirm).toHaveBeenCalled();
    });

    test('removeFavorite用户取消时不应该调用API', async () => {
      global.confirm.mockReturnValueOnce(false);
      await wrapper.vm.$nextTick();

      const favorite = { id: '429-179', seatName: '179' };

      await wrapper.vm.removeFavorite(favorite);

      expect(axios.post).not.toHaveBeenCalledWith(
        expect.stringContaining('/lib/removeFavoriteSeat'),
        expect.anything()
      );
    });

    test('removeFavorite成功时应该刷新列表', async () => {
      axios.post.mockResolvedValueOnce({
        data: { code: 0, msg: '删除成功' }
      });
      axios.get.mockResolvedValueOnce({
        data: { code: 0, data: { favorites: [] } }
      });

      await wrapper.vm.$nextTick();

      const favorite = { id: '429-179', seatName: '179' };
      wrapper.vm.favorites = [favorite];

      await wrapper.vm.removeFavorite(favorite);

      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/lib/removeFavoriteSeat'),
        { id: '429-179' }
      );
      expect(wrapper.vm.toast.show).toBe(true);
      expect(wrapper.vm.toast.type).toBe('success');
    });
  });

  describe('状态刷新功能测试', () => {
    beforeEach(() => {
      wrapper = shallowMount(FavoriteMonitor, { localVue });
    });

    test('refreshSeatsStatus没有收藏时应该提示', async () => {
      await wrapper.vm.$nextTick();
      wrapper.vm.favorites = [];

      await wrapper.vm.refreshSeatsStatus();

      expect(wrapper.vm.toast.show).toBe(true);
      expect(wrapper.vm.toast.message).toBe('没有收藏座位需要刷新');
      expect(wrapper.vm.toast.type).toBe('warning');
    });

    test('refreshSeatsStatus应该调用正确的API', async () => {
      axios.get.mockResolvedValueOnce({
        data: {
          code: 0,
          data: {
            seats: [
              { id: '429-179', status: 'available', isMyReservation: false }
            ]
          }
        }
      });

      await wrapper.vm.$nextTick();
      wrapper.vm.favorites = [{ id: '429-179', seatName: '179' }];

      await wrapper.vm.refreshSeatsStatus();

      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('/lib/getFavoriteSeatsStatus')
      );
    });

    test('refreshSeatsStatus成功后应该更新seatsStatus', async () => {
      axios.get.mockResolvedValueOnce({
        data: {
          code: 0,
          data: {
            seats: [
              { id: '429-179', status: 'available', isMyReservation: false, lastUpdate: Date.now() }
            ]
          }
        }
      });

      await wrapper.vm.$nextTick();
      wrapper.vm.favorites = [{ id: '429-179', seatName: '179' }];

      await wrapper.vm.refreshSeatsStatus();

      expect(wrapper.vm.seatsStatus['429-179']).toBeDefined();
      expect(wrapper.vm.seatsStatus['429-179'].status).toBe('available');
      expect(wrapper.vm.lastStatusUpdate).toBeTruthy();
    });
  });

  describe('预订功能测试', () => {
    beforeEach(() => {
      wrapper = shallowMount(FavoriteMonitor, { localVue });
    });

    test('reserveSeat应该显示确认对话框', async () => {
      await wrapper.vm.$nextTick();

      const favorite = { id: '429-179', seatName: '179', status: 'available' };

      await wrapper.vm.reserveSeat(favorite);

      expect(global.confirm).toHaveBeenCalled();
    });

    test('reserveSeat用户取消时不应该调用API', async () => {
      global.confirm.mockReturnValueOnce(false);
      await wrapper.vm.$nextTick();

      const favorite = { id: '429-179', seatName: '179' };

      await wrapper.vm.reserveSeat(favorite);

      expect(axios.post).not.toHaveBeenCalledWith(
        expect.stringContaining('/lib/reserveFavoriteSeat'),
        expect.anything()
      );
    });

    test('reserveSeat应该调用正确的API', async () => {
      axios.post.mockResolvedValueOnce({
        data: { code: 0, msg: '预订成功！座位：179号' }
      });
      axios.get.mockResolvedValueOnce({
        data: { code: 0, data: { seats: [] } }
      });

      await wrapper.vm.$nextTick();
      wrapper.vm.favorites = [{ id: '429-179', seatName: '179' }];

      const favorite = { id: '429-179', seatName: '179' };

      await wrapper.vm.reserveSeat(favorite);

      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/lib/reserveFavoriteSeat'),
        { id: '429-179' }
      );
    });
  });

  describe('取消预订功能测试', () => {
    beforeEach(() => {
      wrapper = shallowMount(FavoriteMonitor, { localVue });
    });

    test('cancelReservation应该显示确认对话框', async () => {
      await wrapper.vm.$nextTick();

      const favorite = {
        id: '429-179',
        seatName: '179',
        isMyReservation: true,
        reservationId: '12345'
      };

      await wrapper.vm.cancelReservation(favorite);

      expect(global.confirm).toHaveBeenCalled();
    });

    test('cancelReservation用户取消时不应该调用API', async () => {
      global.confirm.mockReturnValueOnce(false);
      await wrapper.vm.$nextTick();

      const favorite = {
        id: '429-179',
        seatName: '179',
        reservationId: '12345'
      };

      await wrapper.vm.cancelReservation(favorite);

      expect(axios.post).not.toHaveBeenCalledWith(
        expect.stringContaining('/lib/cancelReservation'),
        expect.anything()
      );
    });

    test('cancelReservation应该调用正确的API', async () => {
      axios.post.mockResolvedValueOnce({
        data: { code: 0, msg: '取消预订成功' }
      });
      axios.get.mockResolvedValueOnce({
        data: { code: 0, data: { seats: [] } }
      });

      await wrapper.vm.$nextTick();
      wrapper.vm.favorites = [{ id: '429-179', seatName: '179' }];

      const favorite = {
        id: '429-179',
        seatName: '179',
        reservationId: '12345'
      };

      await wrapper.vm.cancelReservation(favorite);

      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/lib/cancelReservation'),
        { reservationId: '12345' }
      );
    });
  });

  describe('加载状态测试', () => {
    beforeEach(() => {
      wrapper = shallowMount(FavoriteMonitor, { localVue });
    });

    test('删除时应该设置removingId', async () => {
      axios.post.mockImplementation(() => new Promise(resolve => {
        setTimeout(() => resolve({ data: { code: 0 } }), 100);
      }));

      await wrapper.vm.$nextTick();
      wrapper.vm.favorites = [{ id: '429-179', seatName: '179' }];

      const favorite = { id: '429-179', seatName: '179' };
      const promise = wrapper.vm.removeFavorite(favorite);

      expect(wrapper.vm.removingId).toBe('429-179');

      await promise;
      expect(wrapper.vm.removingId).toBeNull();
    });

    test('预订时应该设置reservingId', async () => {
      axios.post.mockImplementation(() => new Promise(resolve => {
        setTimeout(() => resolve({ data: { code: 0 } }), 100);
      }));
      axios.get.mockResolvedValue({ data: { code: 0, data: { seats: [] } } });

      await wrapper.vm.$nextTick();
      wrapper.vm.favorites = [{ id: '429-179', seatName: '179' }];

      const favorite = { id: '429-179', seatName: '179' };
      const promise = wrapper.vm.reserveSeat(favorite);

      expect(wrapper.vm.reservingId).toBe('429-179');

      await promise;
      expect(wrapper.vm.reservingId).toBeNull();
    });

    test('刷新状态时应该设置refreshingStatus', async () => {
      axios.get.mockImplementation(() => new Promise(resolve => {
        setTimeout(() => resolve({ data: { code: 0, data: { seats: [] } } }), 100);
      }));

      await wrapper.vm.$nextTick();
      wrapper.vm.favorites = [{ id: '429-179', seatName: '179' }];

      const promise = wrapper.vm.refreshSeatsStatus();

      expect(wrapper.vm.refreshingStatus).toBe(true);

      await promise;
      expect(wrapper.vm.refreshingStatus).toBe(false);
    });
  });

  describe('错误处理测试', () => {
    beforeEach(() => {
      wrapper = shallowMount(FavoriteMonitor, { localVue });
    });

    test('API错误应该显示错误提示', async () => {
      axios.post.mockRejectedValueOnce(new Error('Network Error'));

      await wrapper.vm.$nextTick();
      wrapper.vm.favorites = [{ id: '429-179', seatName: '179' }];

      const favorite = { id: '429-179', seatName: '179' };

      await wrapper.vm.removeFavorite(favorite);

      expect(wrapper.vm.toast.show).toBe(true);
      expect(wrapper.vm.toast.message).toBe('删除收藏失败，请检查网络连接');
      expect(wrapper.vm.toast.type).toBe('error');
    });

    test('API返回错误码应该显示错误信息', async () => {
      axios.post.mockResolvedValueOnce({
        data: { code: 1, msg: '删除失败' }
      });

      await wrapper.vm.$nextTick();
      wrapper.vm.favorites = [{ id: '429-179', seatName: '179' }];

      const favorite = { id: '429-179', seatName: '179' };

      await wrapper.vm.removeFavorite(favorite);

      expect(wrapper.vm.toast.show).toBe(true);
      expect(wrapper.vm.toast.message).toContain('删除失败');
      expect(wrapper.vm.toast.type).toBe('error');
    });
  });

  describe('智能预约功能测试', () => {
    beforeEach(() => {
      wrapper = shallowMount(FavoriteMonitor, { localVue });
      jest.clearAllMocks();
    });

    test('没有收藏时应该显示提示', async () => {
      await wrapper.vm.$nextTick();
      wrapper.vm.favorites = [];

      await wrapper.vm.smartReserve();

      expect(wrapper.vm.toast.show).toBe(true);
      expect(wrapper.vm.toast.message).toBe('没有收藏座位');
      expect(wrapper.vm.toast.type).toBe('warning');
    });

    test('应该先刷新状态再预约', async () => {
      axios.get.mockResolvedValueOnce({
        data: {
          code: 0,
          data: {
            seats: [
              { id: '429-179', status: 'available', isMyReservation: false }
            ]
          }
        }
      });
      axios.post.mockResolvedValueOnce({
        data: { code: 0, msg: '预订成功！座位：179号' }
      });
      axios.get.mockResolvedValueOnce({
        data: { code: 0, data: { seats: [] } }
      });

      await wrapper.vm.$nextTick();
      wrapper.vm.favorites = [{ id: '429-179', seatName: '179' }];

      await wrapper.vm.smartReserve();

      // 应该调用两次get（一次刷新状态，一次预约后刷新）
      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('/lib/getFavoriteSeatsStatus')
      );
    });

    test('找到空闲座位后应该预约', async () => {
      axios.get.mockResolvedValueOnce({
        data: {
          code: 0,
          data: {
            seats: [
              { id: '429-179', status: 'available', isMyReservation: false },
              { id: '429-180', status: 'occupied', isMyReservation: false }
            ]
          }
        }
      });
      axios.post.mockResolvedValueOnce({
        data: { code: 0, msg: '预订成功！座位：179号' }
      });
      axios.get.mockResolvedValueOnce({
        data: { code: 0, data: { seats: [] } }
      });

      await wrapper.vm.$nextTick();
      wrapper.vm.favorites = [
        { id: '429-179', seatName: '179' },
        { id: '429-180', seatName: '180' }
      ];

      await wrapper.vm.smartReserve();

      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/lib/reserveFavoriteSeat'),
        { id: '429-179' }
      );
    });

    test('没有空闲座位时应该提示', async () => {
      axios.get.mockResolvedValueOnce({
        data: {
          code: 0,
          data: {
            seats: [
              { id: '429-179', status: 'occupied', isMyReservation: false },
              { id: '429-180', status: 'reserved', isMyReservation: false }
            ]
          }
        }
      });

      await wrapper.vm.$nextTick();
      wrapper.vm.favorites = [
        { id: '429-179', seatName: '179' },
        { id: '429-180', seatName: '180' }
      ];

      await wrapper.vm.smartReserve();

      expect(wrapper.vm.toast.message).toBe('没有找到空闲的座位，所有收藏座位都已被占用或预约');
      expect(wrapper.vm.toast.type).toBe('warning');
      expect(axios.post).not.toHaveBeenCalledWith(
        expect.stringContaining('/lib/reserveFavoriteSeat'),
        expect.anything()
      );
    });

    test('预约成功后应该显示成功提示', async () => {
      axios.get.mockResolvedValueOnce({
        data: {
          code: 0,
          data: {
            seats: [
              { id: '429-179', status: 'available', isMyReservation: false }
            ]
          }
        }
      });
      axios.post.mockResolvedValueOnce({
        data: { code: 0, msg: '预订成功！座位：179号' }
      });
      axios.get.mockResolvedValueOnce({
        data: {
          code: 0,
          data: {
            seats: [
              { id: '429-179', status: 'reserved', isMyReservation: true }
            ]
          }
        }
      });

      await wrapper.vm.$nextTick();
      wrapper.vm.favorites = [{ id: '429-179', seatName: '179' }];

      // 在预约成功后检查toast消息（在第二次刷新之前）
      const originalRefresh = wrapper.vm.refreshSeatsStatus;
      let toastBeforeRefresh = null;
      wrapper.vm.refreshSeatsStatus = async function() {
        toastBeforeRefresh = { ...this.toast };
        return originalRefresh.call(this);
      };

      await wrapper.vm.smartReserve();

      expect(toastBeforeRefresh.type).toBe('success');
      expect(toastBeforeRefresh.message).toContain('预订成功');
    });

    test('预约失败时应该显示错误提示', async () => {
      axios.get.mockResolvedValueOnce({
        data: {
          code: 0,
          data: {
            seats: [
              { id: '429-179', status: 'available', isMyReservation: false }
            ]
          }
        }
      });
      axios.post.mockResolvedValueOnce({
        data: { code: 1, msg: '预订失败：座位已被占用' }
      });

      await wrapper.vm.$nextTick();
      wrapper.vm.favorites = [{ id: '429-179', seatName: '179' }];

      await wrapper.vm.smartReserve();

      expect(wrapper.vm.toast.type).toBe('error');
      expect(wrapper.vm.toast.message).toContain('预订失败');
    });

    test('智能预约时应该设置smartReserving状态', async () => {
      axios.get.mockImplementation(() => new Promise(resolve => {
        setTimeout(() => resolve({ data: { code: 0, data: { seats: [] } } }), 100);
      }));

      await wrapper.vm.$nextTick();
      wrapper.vm.favorites = [{ id: '429-179', seatName: '179' }];

      const promise = wrapper.vm.smartReserve();

      expect(wrapper.vm.smartReserving).toBe(true);

      await promise;
      expect(wrapper.vm.smartReserving).toBe(false);
    });
  });
});
