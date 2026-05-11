<template>
  <div class="dashboard-container">
    <!-- 顶部统计卡片 -->
    <el-row :gutter="20">
      <el-col :span="6">
        <el-card class="overview-card">
          <div class="card-content">
            <div class="avatar users">
              <el-image :src="url1" style="width: 40px; height: 40px;" fit="fill" />
            </div>
            <div class="info">
              <p class="title">用户数</p>
              <p class="number">{{ systemOverview.totalUsers || 0 }}</p>
              <p class="subtitle-title">
                活跃用户数：{{ systemOverview.activeUsers || 0 }}
              </p>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card class="overview-card">
          <div class="card-content">
            <div class="avatar like">
              <el-image :src="url2" style="width: 40px; height: 40px;" fit="fill" />
            </div>
            <div class="info">
              <p class="title">情绪日志</p>
              <p class="number">{{ systemOverview.totalDiaries || 0 }}</p>
              <p class="subtitle-title">
                今日日志数：{{ systemOverview.todayDiaries || 0 }}
              </p>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card class="overview-card">
          <div class="card-content">
            <div class="avatar comments">
              <el-image :src="url3" style="width: 40px; height: 40px;" fit="fill" />
            </div>
            <div class="info">
              <p class="title">咨询会话</p>
              <p class="number">{{ consultationInfo.totalSessions || 0 }}</p>
              <p class="subtitle-title">
                今日新增会话：{{ consultationInfo.todayNewSessions || 0 }}
              </p>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card class="overview-card">
          <div class="card-content">
            <div class="avatar smile">
              <el-image :src="url4" style="width: 40px; height: 40px;" fit="fill" />
            </div>
            <div class="info">
              <p class="title">平均情绪</p>
              <p class="number">{{ systemOverview.avgMoodScore || 0 }}</p>
              <p class="subtitle-title">情绪健康指数</p>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 情绪趋势 + 咨询会话分析 -->
    <el-row :gutter="24" style="margin-top: 20px;">
      <el-col :span="12">
        <el-card class="chart-card" style="height: 100%;">
          <template #header>
            <div class="card-header">系统分析</div>
          </template>

          <div class="chart-content">
            <div ref="emotionChartRef" style="width: 100%; height: 300px;"></div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="12">
        <el-card class="chart-card" style="height: 100%;">
          <template #header>
            <div class="card-header">咨询会话分析</div>
          </template>

          <div class="chart-content">
            <div class="consultation-status">
              <div class="stat-item">
                <div class="stat-label">咨询会话数</div>
                <div class="stat-value">
                  {{ consultationInfo.totalSessions || 0 }}
                </div>
              </div>

              <div class="stat-item">
                <div class="stat-label">平均时长</div>
                <div class="stat-value">
                  {{ consultationInfo.avgDurationMinutes || 0 }}
                </div>
              </div>

              <div class="stat-item">
                <div class="stat-label">活跃用户</div>
                <div class="stat-value">
                  {{ systemOverview.activeUsers || 0 }}
                </div>
              </div>
            </div>

            <div ref="consultationChartRef" style="width: 100%; height: 260px;"></div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 用户活跃度趋势 -->
    <el-row :gutter="24" style="margin-top: 20px;">
      <el-col :span="24">
        <el-card class="chart-card" style="height: 100%;">
          <template #header>
            <div class="card-header">用户活跃度趋势</div>
          </template>

          <div class="chart-content user-activity-chart-content">
            <div ref="userActivityChartRef" style="width: 100%; height: 360px;"></div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, onBeforeUnmount } from 'vue'
import { GetAnalyticFunction } from '../api/admin.js'
import * as echarts from 'echarts'

const aiData = ref({})

const systemOverview = computed(() => {
  return aiData.value.systemOverview || {}
})

const consultationInfo = computed(() => {
  return aiData.value.consultationStatus || aiData.value.consultationStats || {}
})

const url1 = new URL('../assets/images/users.png', import.meta.url).href
const url2 = new URL('../assets/images/like.png', import.meta.url).href
const url3 = new URL('../assets/images/comments.png', import.meta.url).href
const url4 = new URL('../assets/images/smile.png', import.meta.url).href

const emotionChartRef = ref(null)
const consultationChartRef = ref(null)
const userActivityChartRef = ref(null)

const emotionChart = ref(null)
const consultationChart = ref(null)
const userActivityChart = ref(null)

onMounted(async () => {
  try {
    const res = await GetAnalyticFunction()

    console.log('数据分析接口返回：', res)

    aiData.value = res?.data?.data || res?.data || res || {}

    await nextTick()
    initChart()
  } catch (error) {
    console.error('数据分析接口请求失败：', error)
    aiData.value = {}
  }
})

const initEmotionChart = () => {
  if (!emotionChartRef.value) return

  if (emotionChart.value) {
    emotionChart.value.dispose()
  }

  emotionChart.value = echarts.init(emotionChartRef.value)

  const emotionTrends = aiData.value.emotionTrend || []

  const option = {
    title: {
      text: '情绪趋势分布',
      textStyle: {
        fontSize: 16,
        fontWeight: 600,
        color: '#2d3436'
      },
      left: 'center',
      top: 10
    },
    tooltip: {
      trigger: 'axis',
      borderWidth: 1,
      borderColor: '#fab1a0',
      textStyle: {
        color: '#2d3436'
      }
    },
    legend: {
      data: ['平均情绪得分', '记录数量'],
      top: 40
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: 80,
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: emotionTrends.map(item => item.date),
      boundaryGap: false
    },
    yAxis: [
      {
        type: 'value',
        name: '平均情绪得分',
        position: 'left'
      },
      {
        type: 'value',
        name: '记录数量',
        position: 'right'
      }
    ],
    series: [
      {
        name: '平均情绪得分',
        type: 'line',
        data: emotionTrends.map(item => item.avgMoodScore),
        smooth: true,
        yAxisIndex: 0,
        lineStyle: {
          width: 3,
          color: '#fab1a0'
        },
        itemStyle: {
          color: '#fab1a0'
        }
      },
      {
        name: '记录数量',
        type: 'line',
        data: emotionTrends.map(item => item.recordCount),
        smooth: true,
        yAxisIndex: 1,
        lineStyle: {
          width: 3,
          color: '#eeb5a3'
        },
        itemStyle: {
          color: '#eeb5a3'
        }
      }
    ]
  }

  emotionChart.value.setOption(option)
}

const initConsultationChart = () => {
  if (!consultationChartRef.value) return

  if (consultationChart.value) {
    consultationChart.value.dispose()
  }

  consultationChart.value = echarts.init(consultationChartRef.value)

  const dailyTrend = consultationInfo.value.dailyTrend || []

  const option = {
    title: {
      text: '咨询活动统计',
      textStyle: {
        fontSize: 16,
        fontWeight: 600,
        color: '#2d3436'
      },
      left: 'center',
      top: 10
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#fab1a0',
      borderWidth: 1,
      textStyle: {
        color: '#2d3436'
      }
    },
    legend: {
      data: ['会话数量', '参与用户数'],
      top: 40,
      textStyle: {
        color: '#636e72'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: 80,
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: dailyTrend.map(item => item.date),
      axisLabel: {
        color: '#636e72'
      }
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        color: '#636e72'
      }
    },
    series: [
      {
        name: '会话数量',
        type: 'bar',
        data: dailyTrend.map(item => item.sessionCount),
        itemStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: '#74b9ff' },
              { offset: 1, color: '#0984e3' }
            ]
          }
        },
        barWidth: '40%'
      },
      {
        name: '参与用户数',
        type: 'bar',
        data: dailyTrend.map(item => item.userCount),
        itemStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: '#fdcb6e' },
              { offset: 1, color: '#f39c12' }
            ]
          }
        },
        barWidth: '40%'
      }
    ]
  }

  consultationChart.value.setOption(option)
}

const initUserActivityChart = () => {
  if (!userActivityChartRef.value) return

  if (userActivityChart.value) {
    userActivityChart.value.dispose()
  }

  userActivityChart.value = echarts.init(userActivityChartRef.value)

  const activityData = aiData.value.userActivity || []

  const option = {
    title: {
      text: '用户活跃度趋势',
      textStyle: {
        fontSize: 16,
        fontWeight: 600,
        color: '#2d3436'
      },
      left: 'center',
      top: 10
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#fab1a0',
      borderWidth: 1,
      textStyle: {
        color: '#2d3436'
      }
    },
    legend: {
      data: ['活跃用户', '新增用户', '日记用户', '咨询用户'],
      top: 40,
      textStyle: {
        color: '#636e72'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: 80,
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: activityData.map(item => item.date),
      axisLine: {
        lineStyle: {
          color: 'rgba(244, 162, 97, 0.3)'
        }
      },
      axisLabel: {
        color: '#636e72'
      }
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        color: '#636e72'
      },
      axisLine: {
        lineStyle: {
          color: 'rgba(244, 162, 97, 0.3)'
        }
      },
      splitLine: {
        lineStyle: {
          color: 'rgba(244, 162, 97, 0.1)'
        }
      }
    },
    series: [
      {
        name: '活跃用户',
        type: 'line',
        data: activityData.map(item => item.activeUsers),
        smooth: true,
        lineStyle: {
          width: 3,
          color: '#a29bfe'
        },
        itemStyle: {
          color: '#a29bfe'
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(162, 155, 254, 0.4)' },
              { offset: 1, color: 'rgba(162, 155, 254, 0.1)' }
            ]
          }
        }
      },
      {
        name: '新增用户',
        type: 'line',
        data: activityData.map(item => item.newUsers),
        smooth: true,
        lineStyle: {
          width: 3,
          color: '#fdcb6e'
        },
        itemStyle: {
          color: '#fdcb6e'
        }
      },
      {
        name: '日记用户',
        type: 'line',
        data: activityData.map(item => item.diaryUsers),
        smooth: true,
        lineStyle: {
          width: 3,
          color: '#00b894'
        },
        itemStyle: {
          color: '#00b894'
        }
      },
      {
        name: '咨询用户',
        type: 'line',
        data: activityData.map(item => item.consultationUsers),
        smooth: true,
        lineStyle: {
          width: 3,
          color: '#fab1a0'
        },
        itemStyle: {
          color: '#fab1a0'
        }
      }
    ]
  }

  userActivityChart.value.setOption(option)
}

const initChart = () => {
  initEmotionChart()
  initConsultationChart()
  initUserActivityChart()
}

onBeforeUnmount(() => {
  if (emotionChart.value) {
    emotionChart.value.dispose()
  }

  if (consultationChart.value) {
    consultationChart.value.dispose()
  }

  if (userActivityChart.value) {
    userActivityChart.value.dispose()
  }
})
</script>

<style lang="scss" scoped>
.dashboard-container {
  min-height: 100%;
  padding: 4px;
  background: linear-gradient(180deg, #f8fbff 0%, #f4f7fb 100%);

  .overview-card,
  .chart-card {
    border: 0;
    border-radius: 14px;
    box-shadow: 0 10px 28px rgba(15, 23, 42, 0.08);
  }

  .overview-card {
    transition: transform 0.2s ease, box-shadow 0.2s ease;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 14px 34px rgba(15, 23, 42, 0.12);
    }
  }

  .card-header {
    font-size: 16px;
    font-weight: 700;
    color: #1f2937;
  }

  .card-content {
    display: flex;
    align-items: center;

    .avatar {
      margin-right: 12px;
      width: 60px;
      height: 60px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;

      &.users {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      }

      &.like {
        background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      }

      &.comments {
        background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
      }

      &.smile {
        background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
      }
    }

    .info {
      .title {
        font-size: 14px;
        color: #7f8c8d;
        margin-bottom: 4px;
      }

      .number {
        font-size: 24px;
        font-weight: 700;
        color: #2c3e50;
        margin-bottom: 4px;
      }

      .subtitle-title {
        font-size: 12px;
        color: #95a5a6;
      }
    }
  }

  .chart-content {
    padding: 20px;
    height: 300px;
    position: relative;
    background: linear-gradient(180deg, #ffffff 0%, #fbfdff 100%);
    border-radius: 12px;

    canvas {
      width: 100% !important;
      height: 100% !important;
    }

    .consultation-status {
      display: flex;
      justify-content: space-around;
      margin-bottom: 20px;

      .stat-item {
        min-width: 112px;
        padding: 10px 14px;
        border-radius: 10px;
        background: #f8fafc;
        text-align: center;

        .stat-label {
          font-size: 12px;
          color: #7f8c8d;
          margin-bottom: 4px;
        }

        .stat-value {
          font-size: 18px;
          font-weight: 600;
          color: #2c3e50;
        }
      }
    }
  }

  .user-activity-chart-content {
    height: 420px;
  }
}
</style>
