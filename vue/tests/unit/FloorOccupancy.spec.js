import { shallowMount, createLocalVue } from '@vue/test-utils';
import FloorOccupancy from '@/views/FloorOccupancy.vue';
import axios from 'axios';

// Mock axios
jest.mock('axios');

const localVue = createLocalVue();

describe('FloorOccupancy.vue', () => {
  let wrapper;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    if (wrapper) {
      wrapper.destroy();
      wrapper = null;
    }
  });

  describe('组件基础测试', () => {
    test('应该能够创建组件实例', () => {
      wrapper = shallowMount(FloorOccupancy, { localVue });

      expect(wrapper.vm).toBeTruthy();
      expect(wrapper.vm.$options.name).toBe('FloorOccupancy');
    });

    test('应该初始化正确的data', () => {
      // 阻止mounted钩子执行
      axios.get.mockResolvedValueOnce({
        data: {
          code: 0,
          data: {
            floors: [],
            cookieValid: false,
            lastUpdate: null
          }
        }
      });

      wrapper = shallowMount(FloorOccupancy, { localVue });

      // 在mounted之前检查初始状态
      expect(wrapper.vm.floors).toEqual([]);
      expect(wrapper.vm.cookieValid).toBe(false);
    });
  });

  describe('加载楼层数据测试', () => {
    test('mounted时应该自动加载数据', async () => {
      axios.get.mockResolvedValueOnce({
        data: {
          code: 0,
          data: {
            floors: [
              {
                libId: 429,
                libName: '一楼东区东一',
                libFloor: '1楼',
                total: 120,
                occupied: 85,
                available: 35,
                occupancyRate: 70.83
              }
            ],
            cookieValid: true,
            lastUpdate: Date.now()
          }
        }
      });

      wrapper = shallowMount(FloorOccupancy, { localVue });
      await wrapper.vm.$nextTick();

      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('/lib/getFloorOccupancy')
      );
    });

    test('加载成功应该更新floors数据', async () => {
      const mockFloors = [
        {
          libId: 429,
          libName: '一楼东区东一',
          libFloor: '1楼',
          total: 120,
          occupied: 85,
          available: 35,
          occupancyRate: 70.83
        },
        {
          libId: 430,
          libName: '二楼西区',
          libFloor: '2楼',
          total: 100,
          occupied: 50,
          available: 50,
          occupancyRate: 50.0
        }
      ];

      axios.get.mockResolvedValueOnce({
        data: {
          code: 0,
          data: {
            floors: mockFloors,
            cookieValid: true,
            lastUpdate: Date.now()
          }
        }
      });

      wrapper = shallowMount(FloorOccupancy, { localVue });
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.floors.length).toBe(2);
      expect(wrapper.vm.floors).toEqual(mockFloors);
      expect(wrapper.vm.cookieValid).toBe(true);
      expect(wrapper.vm.lastUpdate).toBeTruthy();
    });

    test('加载成功应该显示成功提示', async () => {
      axios.get.mockResolvedValueOnce({
        data: {
          code: 0,
          data: {
            floors: [{ libId: 429, libName: '测试楼层' }],
            cookieValid: true,
            lastUpdate: Date.now()
          }
        }
      });

      wrapper = shallowMount(FloorOccupancy, { localVue });
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.toast.show).toBe(true);
      expect(wrapper.vm.toast.type).toBe('success');
      expect(wrapper.vm.toast.message).toContain('刷新成功');
    });

    test('加载失败应该显示错误提示', async () => {
      axios.get.mockResolvedValueOnce({
        data: {
          code: 1,
          msg: '请先设置Cookie'
        }
      });

      wrapper = shallowMount(FloorOccupancy, { localVue });
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.cookieValid).toBe(false);
      expect(wrapper.vm.toast.type).toBe('error');
    });

    test('网络错误应该显示错误提示', async () => {
      axios.get.mockRejectedValueOnce(new Error('Network Error'));

      wrapper = shallowMount(FloorOccupancy, { localVue });
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.toast.show).toBe(true);
      expect(wrapper.vm.toast.type).toBe('error');
      expect(wrapper.vm.toast.message).toContain('网络连接');
    });

    test('加载时应该设置loading状态', async () => {
      axios.get.mockImplementation(() => new Promise(resolve => {
        setTimeout(() => resolve({ data: { code: 0, data: { floors: [], cookieValid: false, lastUpdate: Date.now() } } }), 100);
      }));

      wrapper = shallowMount(FloorOccupancy, { localVue });

      expect(wrapper.vm.loading).toBe(true);

      await wrapper.vm.$nextTick();
      await new Promise(resolve => setTimeout(resolve, 150));

      expect(wrapper.vm.loading).toBe(false);
    });
  });

  describe('工具方法测试', () => {
    beforeEach(() => {
      wrapper = shallowMount(FloorOccupancy, { localVue });
    });

    test('getOccupancyClass应该返回正确的CSS类', () => {
      expect(wrapper.vm.getOccupancyClass(90)).toBe('high');
      expect(wrapper.vm.getOccupancyClass(80)).toBe('high');
      expect(wrapper.vm.getOccupancyClass(70)).toBe('medium');
      expect(wrapper.vm.getOccupancyClass(50)).toBe('medium');
      expect(wrapper.vm.getOccupancyClass(30)).toBe('low');
      expect(wrapper.vm.getOccupancyClass(0)).toBe('low');
    });

    test('formatTime应该正确格式化时间戳', () => {
      const timestamp = new Date('2025-11-22T10:05:03').getTime();
      const formatted = wrapper.vm.formatTime(timestamp);
      expect(formatted).toBeTruthy();
      expect(formatted).toContain('10:05:03');
    });

    test('formatTime应该处理空值', () => {
      expect(wrapper.vm.formatTime(null)).toBe('');
      expect(wrapper.vm.formatTime(undefined)).toBe('');
    });
  });

  describe('刷新功能测试', () => {
    test('点击刷新按钮应该重新加载数据', async () => {
      axios.get.mockResolvedValue({
        data: {
          code: 0,
          data: {
            floors: [],
            cookieValid: true,
            lastUpdate: Date.now()
          }
        }
      });

      wrapper = shallowMount(FloorOccupancy, { localVue });
      await wrapper.vm.$nextTick();

      jest.clearAllMocks();

      await wrapper.vm.loadFloorOccupancy();

      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('/lib/getFloorOccupancy')
      );
    });

    test('刷新时按钮应该禁用', async () => {
      axios.get.mockImplementation(() => new Promise(resolve => {
        setTimeout(() => resolve({ data: { code: 0, data: { floors: [], cookieValid: false, lastUpdate: Date.now() } } }), 100);
      }));

      wrapper = shallowMount(FloorOccupancy, { localVue });
      await wrapper.vm.$nextTick();

      const promise = wrapper.vm.loadFloorOccupancy();

      expect(wrapper.vm.loading).toBe(true);

      await promise;
      expect(wrapper.vm.loading).toBe(false);
    });
  });

  describe('Toast提示测试', () => {
    beforeEach(() => {
      wrapper = shallowMount(FloorOccupancy, { localVue });
    });

    test('showToast应该显示提示', () => {
      wrapper.vm.showToast('测试消息', 'success');

      expect(wrapper.vm.toast.show).toBe(true);
      expect(wrapper.vm.toast.message).toBe('测试消息');
      expect(wrapper.vm.toast.type).toBe('success');
    });

    test('showToast应该自动隐藏', () => {
      jest.useFakeTimers();

      wrapper.vm.showToast('测试消息', 'info', 100);

      expect(wrapper.vm.toast.show).toBe(true);

      jest.advanceTimersByTime(150);

      expect(wrapper.vm.toast.show).toBe(false);

      jest.useRealTimers();
    });

    test('连续调用showToast应该清除之前的定时器', () => {
      wrapper.vm.showToast('第一条消息', 'info', 1000);
      const firstTimer = wrapper.vm.toast.timer;

      wrapper.vm.showToast('第二条消息', 'success', 1000);
      const secondTimer = wrapper.vm.toast.timer;

      expect(firstTimer).not.toBe(secondTimer);
      expect(wrapper.vm.toast.message).toBe('第二条消息');
    });
  });

  describe('导航功能测试', () => {
    test('goBack应该导航到首页', () => {
      const mockRouter = {
        push: jest.fn()
      };

      wrapper = shallowMount(FloorOccupancy, {
        localVue,
        mocks: {
          $router: mockRouter
        }
      });

      wrapper.vm.goBack();

      expect(mockRouter.push).toHaveBeenCalledWith('/');
    });
  });

  describe('数据显示测试', () => {
    test('没有数据时应该显示空状态', async () => {
      axios.get.mockResolvedValueOnce({
        data: {
          code: 0,
          data: {
            floors: [],
            cookieValid: true,
            lastUpdate: Date.now()
          }
        }
      });

      wrapper = shallowMount(FloorOccupancy, { localVue });
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.floors.length).toBe(0);
    });

    test('Cookie无效时应该显示提示', async () => {
      axios.get.mockResolvedValueOnce({
        data: {
          code: 1,
          msg: '请先设置Cookie',
          data: {
            floors: [],
            cookieValid: false,
            lastUpdate: Date.now()
          }
        }
      });

      wrapper = shallowMount(FloorOccupancy, { localVue });
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.cookieValid).toBe(false);
    });
  });
});
