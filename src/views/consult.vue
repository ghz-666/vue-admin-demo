<template>
    <div>
        <PageHead title="咨询管理" />
        <el-table :data="tableData" style="width: 100%">
            <el-table-column prop="id" label="会话ID">
                <template #default="scope">
                    <el-avatar :size="50">{{ scope.row.userNickname }}</el-avatar>
                </template>
            </el-table-column>
            <el-table-column label="情绪日志">
                <template #default="scope">
                    <div class="session-title">{{ scope.row.title }}</div>
                    <div class="session-preview">{{ scope.row.lastMessageContent }}</div>
                </template>
            </el-table-column>
            <el-table-column prop="messageCount" label="消息数" width="100" />
            <el-table-column prop="lastMessageTime" label="最后消息时间" width="200" />
            <el-table-column label="操作">
                <template #default="scope">
                    <el-button @click="handleDetail(scope.row)" type="primary" size="small">详情</el-button>
                </template>
            </el-table-column>
        </el-table>
        <el-pagination layout="prev, pager, next" :total="pagination.total" :page-size="pagination.size"
            @change="handleChange" />
        <el-dialog v-model="showDetailDialog" title="会话详情" width="70%" close-on-click-modal>
            <div class="session-detail">
                <div class="detail-header">
                    <div class="detail-label">用户昵称：</div>
                    <div class="detail-value">{{ sessionDetail.userNickname }}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">开始时间：</div>
                    <div class="detail-value">{{ sessionDetail.startedAt }}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">消息数：</div>
                    <div class="detail-value">{{ sessionDetail.messageCount }}</div>
                </div>
                <div class="messages-container">
                    <div class="messages-header">
                        <h4>对话记录</h4>
                    </div>
                    <div class="messages-list">
                        <div v-for="message in sessionMessages" :key="message.id" class="message-item"
                            :class="message.senderType === 1 ? 'user-message' : 'ai-message'">
                            <div class="message-header">
                                <span>{{ message.senderType === 1 ? '用户' : 'AI助手' }}</span>
                                <span class="time">{{ message.createdAt }}</span>
                            </div>
                            <div class="message-content">{{ message.content }}</div>
                        </div>
                    </div>
                </div>
            </div>
        </el-dialog>
    </div>
</template>

<script setup>
import PageHead from '../components/pagehead.vue'
import { GetConsultCategories } from '@/api/admin.js'
import { pa } from 'element-plus/es/locale/index.mjs'
import { ref, onMounted } from 'vue'
import { GetSessionDetail } from '@/api/admin.js'
const sessionMessages = ref([])
const tableData = ref([])
const sessionDetail = ref({})
const pagination = ref({
    total: 0,
    pageSize: 10,
    currentPage: 1
})
const handleSearch = async () => {
    const data = await GetConsultCategories(pagination.value)
    const { records, total } = data
    tableData.value = records
    pagination.value.total = total
}
onMounted(() => {
    handleSearch()
})
const showDetailDialog = ref(false)
const handleDetail = async (row) => {
    sessionDetail.value = row
    showDetailDialog.value = true
    const data = await GetSessionDetail(row.id)
    console.log(data)
    sessionMessages.value = data
    sessionDetail.value.messageCount = data.length
}
const handleChange = (val) => {
    pagination.value.currentPage = val
    handleSearch()
}
</script>

<style lang="scss" scoped>
.session-title {
    font-weight: 500;
    color: #333;
    margin-bottom: 4px;
}

.session-preview {
    font-size: 13px;
    color: #666;
    margin-bottom: 4px;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.session-detail {
    max-height: 70vh;
    overflow-y: auto;

    .detail-header {
        margin-bottom: 20px;
        padding: 16px;
        background: #f8f9fa;
        border-radius: 8px;
        border: 1px solid #e9ecef;
    }

    .detail-row {
        display: flex;
        align-items: center;
        margin-bottom: 8px;

        :last-child {
            margin-bottom: 0;
        }

        .detail-label {
            font-weight: 500;
            color: #495057;
            min-width: 80px;
            margin-right: 8px;
        }

        .detail-value {
            color: #333;
        }
    }
}

.messages-container {
    margin-top: 20px;

    .messages-header {
        margin-bottom: 16px;

        h4 {
            margin: 0;
            color: #333;
            font-size: 16px;
            font-weight: 500;
        }
    }

    .messages-list {
        max-height: 400px;
        overflow-y: auto;
        border: 1px solid #e9ecef;
        border-radius: 8px;
        padding: 16px;
        background: #fff;

        .message-item {
            margin-bottom: 12px;
            padding: 12px;
            border-radius: 8px;
            background: #f8f9fa;
            border: 1px solid #e9ecef;

            :last-child {
                margin-bottom: 0;
            }

            &.user-message {
                background: #e8f4fd;
            }

            &.ai-message {
                background: #f0f9f0;
            }
        }

        .message-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;

            .sender {
                font-weight: 500;
                color: #333;
                display: flex;
                align-items: center;
                gap: 4px;
            }

            .time {
                font-size: 12px;
                color: #999;
            }

            .message-content {
                color: #333;
                line-height: 1.6;
                white-space: pre-wrap;
                margin-top: 8px;
                font-size: 14px;
            }
        }
    }
}
</style>