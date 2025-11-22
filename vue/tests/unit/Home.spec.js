import { shallowMount } from '@vue/test-utils';
import Home from '@/views/Home.vue';

describe('Home.vue', () => {
  test('应该正确渲染组件', () => {
    const wrapper = shallowMount(Home);
    expect(wrapper.exists()).toBe(true);
  });

  test('应该包含三个导航卡片', () => {
    const wrapper = shallowMount(Home);
    const cards = wrapper.findAll('.nav-card');
    expect(cards.length).toBe(3);
  });

  test('应该包含标题', () => {
    const wrapper = shallowMount(Home);
    const title = wrapper.find('.home-title');
    expect(title.exists()).toBe(true);
    expect(title.text()).toContain('梓铭祝你天天开心');
  });

  test('第一个卡片应该导航到预约管理', () => {
    const mockPush = jest.fn();
    const wrapper = shallowMount(Home, {
      mocks: {
        $router: {
          push: mockPush
        }
      }
    });

    const firstCard = wrapper.find('.nav-card');
    firstCard.trigger('click');

    expect(mockPush).toHaveBeenCalledWith('/reservation');
  });

  test('第二个卡片应该导航到座位查看', () => {
    const mockPush = jest.fn();
    const wrapper = shallowMount(Home, {
      mocks: {
        $router: {
          push: mockPush
        }
      }
    });

    const secondCard = wrapper.findAll('.nav-card').at(1);
    secondCard.trigger('click');

    expect(mockPush).toHaveBeenCalledWith('/seat-view');
  });

  test('应该有预约管理方法', () => {
    const wrapper = shallowMount(Home);
    expect(typeof wrapper.vm.goToReservation).toBe('function');
  });

  test('应该有座位查看方法', () => {
    const wrapper = shallowMount(Home);
    expect(typeof wrapper.vm.goToSeatView).toBe('function');
  });

  test('第三个卡片应该导航到收藏监控', () => {
    const mockPush = jest.fn();
    const wrapper = shallowMount(Home, {
      mocks: {
        $router: {
          push: mockPush
        }
      }
    });

    const thirdCard = wrapper.findAll('.nav-card').at(2);
    thirdCard.trigger('click');

    expect(mockPush).toHaveBeenCalledWith('/favorite-monitor');
  });

  test('应该有收藏监控方法', () => {
    const wrapper = shallowMount(Home);
    expect(typeof wrapper.vm.goToFavoriteMonitor).toBe('function');
  });
});
