<template>
    <div class="container">
        <div class="body">
            <div class="cutline">梓铭祝你天天开心</div>

            <!-- 方式一：扫码获取Cookie -->
            <div class="section-card">
                <div class="section-title">方式一：扫码获取Cookie</div>
                <div class="qrcode-container">
                    <img :src="`${DOMAIN}/static/qrcode.png`" alt="扫码登录" class="qrcode-img" />
                    <div class="qrcode-tip">微信扫码后复制链接</div>
                </div>
                <input v-model="codeUrl" class="input-field" placeholder="粘贴扫码后的链接" />
                <button class="button-31 scan-button" role="button" @click="setCookieByCode">提取Cookie</button>
            </div>

            <!-- 方式二：手动输入Cookie -->
            <div class="section-card">
                <div class="section-title">方式二：手动输入Cookie</div>
                <input v-model="newCookie" class="input-field" placeholder="输入完整Cookie" />
                <button class="button-31" role="button" @click="setCookie">设置Cookie</button>
            </div>

            <!-- 座位设置 -->
            <div class="section-card">
                <div class="section-title">座位设置</div>
                <el-cascader class="mycascader" popper-class="custom-popper" :options="libList" v-model="selectedOptions"
                    @change="handleChange" placeholder="选择场馆楼层">
                </el-cascader>
                <input v-model="seatConfig" class="input-field" type="text" placeholder="输入座位号（如：179 或 D001）" />
                <div class="button-group">
                    <button class="button-31" role="button" @click="changeSeat">保存设置</button>
                    <button class="button-31 test-button" role="button" @click="testReserve">测试预约</button>
                </div>
            </div>

            <!-- 备选座位管理 -->
            <div class="section-card seat-list-card">
                <div class="section-title">备选座位管理（自动轮询）</div>
                <div class="hint-text">添加多个座位，当前座位满时自动尝试下一个</div>
                <button class="button-31 add-seat-button" role="button" @click="addSeatToList">添加当前座位到备选</button>

                <div v-if="seatListData.length > 0" class="seat-list">
                    <div v-for="(seat, index) in seatListData" :key="index" class="seat-item">
                        <div class="seat-info">
                            <span class="seat-index">{{ index + 1 }}.</span>
                            <span class="seat-name">{{ seat.name }}</span>
                            <span class="seat-lib">{{ seat.libName }}</span>
                        </div>
                        <button class="delete-button" @click="removeSeatFromList(seat.libId, seat.name)">删除</button>
                    </div>
                </div>
                <div v-else class="empty-hint">
                    暂无备选座位，请先选择场馆和座位后点击"添加"
                </div>
            </div>

            <!-- 刷新场馆 -->
            <div class="refresh-section">
                <button class="button-31 refresh-button" role="button" @click="refreshLibList">刷新场馆列表</button>
                <div class="hint-text">首次使用请先刷新场馆列表</div>
            </div>
        </div>
    </div>
</template>

<script>
import axios from "axios";
import CustomInputVue from "./CusInput"
export default {
    data: function () {
        return {
            // DOMAIN: "https://test.api.roadrunner2002.top",
            DOMAIN: "http://10.102.224.242:8899",
            newCookie: "",
            codeUrl: "",
            libList: [],
            libId: "",
            seatName: "",
            seatConfig: "",  // 新的座位配置输入
            selectedOptions: [],
            seatListData: [],  // 备选座位列表
        }
    },
    components: {
        CustomInputVue
    },
    methods: {
        handleChange(value) {
            this.libId = value[0]
        },
        handLibList(libList) {
            const processedLibList = libList.map(item => {
                return {
                    label: `[ID:${item.lib_id}] ${item.lib_floor} ${item.lib_name}`,
                    value: item.lib_id
                };
            });
            return processedLibList
        },
        setCookieByCode: async function() {
            if (!this.codeUrl) {
                alert("请先粘贴扫码后的链接")
                return
            }
            try {
                const res = await axios.post(`${this.DOMAIN}/lib/setCookieByCode`, {
                    codeOrUrl: this.codeUrl
                })
                const { code, msg, cookie } = res.data
                if (code === 0) {
                    alert("✅ 从链接提取Cookie成功！\n现在可以选择场馆和座位了")
                    this.codeUrl = ""
                } else {
                    alert(`❌ ${msg || '提取Cookie失败，code可能已过期'}`)
                }
            } catch (error) {
                console.log("[setCookieByCode错误]", error)
                alert("❌ 提取Cookie失败，请检查链接格式")
            }
        },
        setCookie: async function () {
            if (this.newCookie) {
                try {
                    const res = await axios.post(`${this.DOMAIN}/lib/setCookie`, {
                        newCookie: this.newCookie
                    })
                    const { code, msg } = res.data
                    if (code === 0) {
                        alert("✅set Cookie Successfully!")
                    } else {
                        alert("❌Please refresh your Cookie")
                    }
                } catch (error) {
                    console.log("[1001]", error)
                }
            } else {
                alert("Cookicde为空")
            }

        },
        changeSeat: async function () {
            if (!this.libId) {
                alert("❗请先选择楼层")
                return
            }
            if (!this.seatConfig) {
                alert("❗请输入座位号")
                return
            }

            try {
                const res = await axios.post(`${this.DOMAIN}/lib/changeSeat`, {
                    libId: this.libId,
                    seatName: this.seatConfig
                })
                const { code, data, msg } = res.data
                if (code === 0) {
                    alert(`✅ 座位设置成功！\n场馆：${data.libName}\n座位号：${data.seatName}`)
                } else {
                    alert(`❌ 座位设置失败：${msg || data || '未知错误'}`)
                }
            } catch (error) {
                console.log("[1002]", error)
                alert("❌ 座位设置失败，请检查网络连接")
            }
        },
        testReserve: async function() {
            if (!confirm("确定要立即测试预约吗？\n测试成功后会自动取消预约")) {
                return
            }
            try {
                const res = await axios.get(`${this.DOMAIN}/lib/testReserveAndCancel`)
                const { code, msg } = res.data
                if (code === 0) {
                    alert(`✅ ${msg}`)
                } else {
                    alert(`❌ ${msg || '测试失败'}`)
                }
            } catch (error) {
                console.log("[testReserve错误]", error)
                alert("❌ 测试失败，请检查Cookie和座位设置")
            }
        },
        getLibandSeatInfo: async function () {
            try {
                const res = await axios.get(`${this.DOMAIN}/lib/getLibList`)
                const { code, data } = res.data
                if (code === 0) {
                    const { libId, seatName, libList } = data
                    this.libId = libId
                    this.seatName = seatName
                    this.libList = this.handLibList(libList)
                    this.selectedOptions[0] = libId
                }
                else {
                    console.log("[1003]获取渲染信息失败")
                }
            } catch (error) {
                console.log("[1004]", error)
            }
        },
        refreshLibList: async function () {
            try {
                const res = await axios.get(`${this.DOMAIN}/lib/getLibList2`)
                const { code, data } = res.data
                if (code === 0) {
                    const { libId, seatName, libList } = data
                    this.libId = libId
                    this.seatName = seatName
                    this.libList = this.handLibList(libList)
                    this.selectedOptions[0] = libId
                    alert("✅刷新场馆列表成功，可通过下拉框查看")
                }
                else {
                    alert("❌请先设置有效的Cookie再操作")
                }
            } catch (error) {
                console.log("[1004]", error)
            }
        },
        loadSeatList: async function () {
            try {
                const res = await axios.get(`${this.DOMAIN}/lib/getSeatList`)
                const { code, data } = res.data
                if (code === 0) {
                    this.seatListData = data.seats || []
                }
            } catch (error) {
                console.log("[loadSeatList错误]", error)
            }
        },
        addSeatToList: async function () {
            if (!this.libId) {
                alert("❗请先选择楼层")
                return
            }
            if (!this.seatConfig) {
                alert("❗请输入座位号")
                return
            }
            try {
                const res = await axios.post(`${this.DOMAIN}/lib/addSeat`, {
                    libId: this.libId,
                    seatName: this.seatConfig
                })
                const { code, msg, data } = res.data
                if (code === 0) {
                    alert(`✅ ${msg}\n场馆：${data.libName}\n座位：${data.seatName}\n当前共${data.total}个备选座位`)
                    await this.loadSeatList()  // 刷新列表
                    this.seatConfig = ""  // 清空输入框
                } else {
                    alert(`❌ ${msg || '添加失败'}`)
                }
            } catch (error) {
                console.log("[addSeatToList错误]", error)
                alert("❌ 添加失败，请检查网络连接")
            }
        },
        removeSeatFromList: async function (libId, seatName) {
            if (!confirm(`确定要删除座位 ${seatName} 吗？`)) {
                return
            }
            try {
                const res = await axios.post(`${this.DOMAIN}/lib/removeSeat`, {
                    libId: libId,
                    seatName: seatName
                })
                const { code, msg, data } = res.data
                if (code === 0) {
                    alert(`✅ ${msg}\n剩余${data.remaining}个备选座位`)
                    await this.loadSeatList()  // 刷新列表
                } else {
                    alert(`❌ ${msg || '删除失败'}`)
                }
            } catch (error) {
                console.log("[removeSeatFromList错误]", error)
                alert("❌ 删除失败，请检查网络连接")
            }
        }

    },
    mounted: async function () {
        axios.get(`${this.DOMAIN}/test`).then((res) => {
            console.log("测试接口成功", res.data)
        }, (req) => {
            console.log("测试接口失败", req)
        })
        await this.getLibandSeatInfo();
        await this.loadSeatList();

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

@keyframes pulse {
    0%, 100% {
        transform: scale(1);
    }
    50% {
        transform: scale(1.05);
    }
}

@keyframes shimmer {
    0% {
        background-position: -1000px 0;
    }
    100% {
        background-position: 1000px 0;
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

    .cutline {
        color: white;
        font-weight: 900;
        font-size: 32px;
        margin: 0 0 30px;
        text-align: center;
        text-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        letter-spacing: 2px;
        animation: fadeInUp 0.8s ease;
        position: relative;
        z-index: 1;

        &::after {
            content: '🎯';
            margin-left: 12px;
            display: inline-block;
            animation: pulse 2s ease infinite;
        }
    }

@keyframes gradientShift {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
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

    .cutline {
        grid-column: 1 / -1;
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

    .input-field {
        width: 100%;
        height: 52px;
        border: 2px solid rgba(102, 126, 234, 0.2);
        border-radius: 12px;
        padding: 0 18px;
        font-size: 15px;
        margin: 12px 0;
        box-sizing: border-box;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        background: rgba(255, 255, 255, 0.8);
        font-weight: 500;

        &:focus {
            outline: none;
            border-color: #667eea;
            background: white;
            box-shadow: 0 4px 16px rgba(102, 126, 234, 0.25);
            transform: translateY(-2px);
        }

        &::placeholder {
            color: rgba(102, 126, 234, 0.5);
        }

        &:hover:not(:focus) {
            border-color: rgba(102, 126, 234, 0.4);
        }
    }

    .mycascader {
        width: 100%;
        margin: 12px 0;
    }

    .button-group {
        display: flex;
        gap: 12px;
        margin-top: 12px;
    }

    // 刷新按钮单独一行，跨列
    .refresh-section {
        grid-column: 1 / -1;
        text-align: center;
    }

    .qrcode-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 24px;
        background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
        border-radius: 16px;
        margin-bottom: 16px;
        border: 2px dashed rgba(102, 126, 234, 0.3);
        transition: all 0.3s ease;

        &:hover {
            background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
            border-color: rgba(102, 126, 234, 0.5);
            transform: scale(1.02);
        }
    }

    .qrcode-img {
        width: 180px;
        height: 180px;
        border-radius: 16px;
        border: 3px solid white;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
        transition: transform 0.3s ease;

        &:hover {
            transform: scale(1.05) rotate(2deg);
        }
    }

    .qrcode-tip {
        margin-top: 12px;
        font-size: 14px;
        color: #667eea;
        font-weight: 600;
    }
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
}

.button-31:hover {
    transform: translateY(-3px) scale(1.02);
    box-shadow: 0 8px 24px rgba(102, 126, 234, 0.5);
}

.button-31:active {
    transform: translateY(-1px) scale(0.98);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.scan-button {
    background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
    color: #667eea !important;
    font-weight: 800;
    box-shadow: 0 4px 16px rgba(168, 237, 234, 0.4);

    &:hover {
        box-shadow: 0 8px 24px rgba(168, 237, 234, 0.6);
    }
}

.test-button {
    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    color: white !important;
    flex: 1;
    box-shadow: 0 4px 16px rgba(240, 147, 251, 0.4);

    &:hover {
        box-shadow: 0 8px 24px rgba(240, 147, 251, 0.6);
    }
}

.refresh-button {
    width: auto;
    min-width: 220px;
    max-width: 450px;
    background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
    color: white !important;
    box-shadow: 0 4px 16px rgba(17, 153, 142, 0.4);
    font-size: 17px;
    padding: 16px 32px;

    &:hover {
        box-shadow: 0 8px 24px rgba(17, 153, 142, 0.6);
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

.hint-text {
    font-size: 13px;
    color: rgba(102, 126, 234, 0.7);
    margin-top: 10px;
    text-align: center;
    font-weight: 500;
}

.seat-list-card {
    grid-column: 1 / -1;
}

.add-seat-button {
    background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
    color: white !important;
    margin: 12px 0;
    box-shadow: 0 4px 16px rgba(250, 112, 154, 0.4);

    &:hover {
        box-shadow: 0 8px 24px rgba(250, 112, 154, 0.6);
    }
}

.seat-list {
    margin-top: 20px;
    display: flex;
    flex-direction: column;
    gap: 14px;
}

.seat-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(240, 147, 251, 0.05) 100%);
    border-radius: 14px;
    border: 2px solid rgba(102, 126, 234, 0.15);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    animation: fadeInUp 0.5s ease;

    &:hover {
        background: linear-gradient(135deg, rgba(255, 255, 255, 1) 0%, rgba(240, 147, 251, 0.1) 100%);
        border-color: rgba(102, 126, 234, 0.5);
        transform: translateX(8px);
        box-shadow: 0 6px 20px rgba(102, 126, 234, 0.25);
    }
}

.seat-info {
    display: flex;
    align-items: center;
    gap: 14px;
    flex: 1;
}

.seat-index {
    font-weight: 900;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    min-width: 30px;
    font-size: 17px;
}

.seat-name {
    font-weight: 900;
    color: #667eea;
    font-size: 18px;
    min-width: 70px;
    letter-spacing: 1px;
}

.seat-lib {
    color: rgba(102, 126, 234, 0.7);
    font-size: 14px;
    font-weight: 600;
}

.delete-button {
    background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%);
    color: white;
    border: none;
    border-radius: 10px;
    padding: 8px 20px;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 2px 8px rgba(255, 107, 107, 0.3);

    &:hover {
        transform: translateY(-2px) scale(1.05);
        box-shadow: 0 6px 16px rgba(255, 107, 107, 0.5);
    }

    &:active {
        transform: translateY(0) scale(0.98);
    }
}

.empty-hint {
    padding: 32px 24px;
    text-align: center;
    color: rgba(102, 126, 234, 0.6);
    font-size: 15px;
    background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(240, 147, 251, 0.05) 100%);
    border-radius: 14px;
    margin-top: 16px;
    border: 2px dashed rgba(102, 126, 234, 0.2);
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