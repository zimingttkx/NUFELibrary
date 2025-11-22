# 收藏位置监控功能设计文档

## 功能概述

添加"收藏位置监控"功能，允许用户：
1. 收藏感兴趣的座位
2. 实时监控收藏座位的状态
3. 直接预订/取消当前空闲的座位
4. 数据持久化，重启程序自动加载

---

## 数据结构设计

### 1. 收藏座位数据结构 (favoriteSeat)

```javascript
{
  id: String,           // 唯一标识符 (libId-key)
  libId: Number,        // 图书馆ID
  libName: String,      // 图书馆名称
  libFloor: String,     // 楼层
  seatKey: String,      // 座位key (例如: "1,2.")
  seatName: String,     // 座位号码
  addedAt: Number       // 添加时间戳
}
```

### 2. CookeObj 扩展

在现有的 `CookeObj` 中添加：

```javascript
const CookeObj = {
  Cookie: String,
  libId: Number,
  key: String,
  seatName: String,
  keyList: Array,
  favoriteSeats: Array  // 新增：收藏座位列表
};
```

### 3. 座位状态信息 (seatStatus)

```javascript
{
  id: String,               // 收藏ID
  libId: Number,
  libName: String,
  libFloor: String,
  seatKey: String,
  seatName: String,
  status: String,           // 状态: 'available'(空闲) | 'occupied'(已占) | 'reserved'(已预约) | 'unknown'
  isMyReservation: Boolean, // 是否是我的预约
  reservationId: String,    // 预约ID (用于取消)
  lastUpdate: Number        // 最后更新时间
}
```

---

## API接口设计

### 后端API (nodeServer)

#### 1. 收藏座位管理

| 方法 | 路径 | 功能 | 请求参数 | 响应 |
|------|------|------|----------|------|
| POST | /lib/addFavoriteSeat | 添加收藏座位 | `{libId, libName, libFloor, seatKey, seatName}` | `{code, msg, data}` |
| DELETE | /lib/removeFavoriteSeat | 删除收藏座位 | `{id}` | `{code, msg}` |
| GET | /lib/getFavoriteSeats | 获取收藏列表 | 无 | `{code, data: [favorites]}` |
| DELETE | /lib/clearFavoriteSeats | 清空收藏 | 无 | `{code, msg}` |

#### 2. 座位监控

| 方法 | 路径 | 功能 | 请求参数 | 响应 |
|------|------|------|----------|------|
| GET | /lib/getFavoriteSeatsStatus | 获取收藏座位状态 | 无 | `{code, data: [seatStatus]}` |
| POST | /lib/reserveFavoriteSeat | 预订收藏座位 | `{id}` (收藏ID) | `{code, msg, reservationId}` |
| POST | /lib/cancelReservation | 取消预订 | `{reservationId}` | `{code, msg}` |
| GET | /lib/testReservationAvailable | 测试是否可预订 | 无 | `{code, available, msg}` |

---

## 实现步骤

### 步骤1: 后端 - 收藏座位数据管理 ✅ 待实现

**文件**: `nodeServer/fuckinglib/myCooke.js`

1. 扩展 `CookeObj` 添加 `favoriteSeats` 字段
2. 确保数据加载和保存包含 `favoriteSeats`

### 步骤2: 后端 - 收藏座位控制器 ✅ 待实现

**文件**: `nodeServer/fuckinglib/favorites.js` (新建)

实现以下函数：
- `addFavoriteSeatController(ctx)` - 添加收藏
- `removeFavoriteSeatController(ctx)` - 删除收藏
- `getFavoriteSeatsController(ctx)` - 获取列表
- `clearFavoriteSeatsController(ctx)` - 清空收藏

### 步骤3: 后端 - 座位监控和预订 ✅ 待实现

**文件**: `nodeServer/fuckinglib/favorites.js`

实现以下函数：
- `getFavoriteSeatsStatusController(ctx)` - 查询收藏座位状态
- `reserveFavoriteSeatController(ctx)` - 预订座位
- `cancelReservationController(ctx)` - 取消预订
- `testReservationAvailableController(ctx)` - 测试预订功能

### 步骤4: 后端 - 路由配置 ✅ 待实现

**文件**: `nodeServer/router/index.js`

添加新路由：
```javascript
router.post('/lib/addFavoriteSeat', addFavoriteSeatController);
router.delete('/lib/removeFavoriteSeat', removeFavoriteSeatController);
router.get('/lib/getFavoriteSeats', getFavoriteSeatsController);
router.delete('/lib/clearFavoriteSeats', clearFavoriteSeatsController);
router.get('/lib/getFavoriteSeatsStatus', getFavoriteSeatsStatusController);
router.post('/lib/reserveFavoriteSeat', reserveFavoriteSeatController);
router.post('/lib/cancelReservation', cancelReservationController);
router.get('/lib/testReservationAvailable', testReservationAvailableController);
```

### 步骤5: 单元测试 - 收藏功能 ✅ 待实现

**文件**: `nodeServer/fuckinglib/__tests__/favorites.test.js`

测试：
- 添加收藏座位
- 删除收藏座位
- 获取收藏列表
- 数据持久化

### 步骤6: 单元测试 - 预订功能 ✅ 待实现

**文件**: `nodeServer/__tests__/integration/favorites.integration.test.js`

测试：
- 查询座位状态
- 预订座位
- 取消预订
- 测试功能

### 步骤7: 前端 - 监控页面UI ✅ 待实现

**文件**: `vue/src/views/FavoriteMonitor.vue` (新建)

页面功能：
- 显示收藏座位列表
- 实时状态显示（空闲/已占/已预约）
- 添加/删除收藏按钮
- 预订/取消按钮
- 测试功能按钮
- 自动刷新

### 步骤8: 前端 - 路由配置 ✅ 待实现

**文件**: `vue/src/router/index.js`

添加路由：
```javascript
{
  path: '/favorite-monitor',
  name: 'FavoriteMonitor',
  component: () => import('@/views/FavoriteMonitor.vue')
}
```

### 步骤9: 前端 - 首页入口 ✅ 待实现

**文件**: `vue/src/views/Home.vue`

添加"收藏监控"导航卡片

### 步骤10: 前端单元测试 ✅ 待实现

**文件**: `vue/tests/unit/FavoriteMonitor.spec.js`

测试组件功能

### 步骤11: 集成测试 ✅ 待实现

完整流程测试：
1. 添加收藏座位
2. 查询座位状态
3. 预订空闲座位
4. 取消预订
5. 删除收藏

---

## GraphQL API 参考

### 查询座位状态

```graphql
query getLibSeat($libId: Int!, $seatKey: String!) {
  userAuth {
    reserve {
      getSeat(libId: $libId, key: $seatKey) {
        id
        key
        name
        status
        lib_id
      }
    }
  }
}
```

### 预订座位 (当天)

```graphql
mutation reserve($key: String!, $libid: Int!) {
  userAuth {
    reserve {
      save(key: $key, libId: $libid)
    }
  }
}
```

### 查询我的预约

```graphql
query myReservations {
  userAuth {
    reserve {
      getMyReserve {
        id
        lib_id
        seat_key
        seat_name
        start
        end
      }
    }
    prereserve {
      prereserve {
        id
        lib_id
        seat_key
        seat_name
        day
      }
    }
  }
}
```

### 取消预约

```graphql
mutation cancel($id: String!) {
  userAuth {
    reserve {
      cancel(id: $id)
    }
  }
}
```

---

## 错误处理

### 常见错误及处理

| 错误 | 原因 | 处理方式 |
|------|------|----------|
| Cookie无效 | 未登录或过期 | 提示重新获取Cookie |
| 座位已被占用 | 预订时座位被抢 | 提示用户，更新状态 |
| 重复收藏 | ID已存在 | 提示已收藏 |
| 预约失败 | 不在预约时间 | 提示时间限制 |
| 网络错误 | API超时 | 重试或提示 |

---

## 测试计划

1. **单元测试覆盖率目标**: 80%+
2. **测试环境**: Jest + Supertest
3. **测试数据**: 使用真实Cookie和座位信息
4. **测试顺序**:
   - 后端功能测试 → 修复问题
   - 前端功能测试 → 修复问题
   - 集成测试 → 修复问题
   - 总体测试 → 确认无误

---

**设计完成时间**: 2025-11-22
**设计者**: Claude Code
