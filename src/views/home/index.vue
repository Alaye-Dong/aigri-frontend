<script setup lang="ts">
import { computed } from 'vue';
import { useAppStore } from '@/store/modules/app';
import HeaderBanner from './modules/header-banner.vue';
import AgriStatsCards from './modules/agri-stats-cards.vue';
import LineChart from './modules/line-chart.vue';
import PieChart from './modules/pie-chart.vue';
import RecentAlerts from './modules/recent-alerts.vue';
import FarmingActivities from './modules/farming-activities.vue';

const appStore = useAppStore();

const gap = computed(() => (appStore.isMobile ? 0 : 16));
</script>

<template>
  <NSpace vertical :size="16">
    <!-- Header with user greeting and quick stats -->
    <HeaderBanner />

    <!-- Agriculture Statistics Cards -->
    <AgriStatsCards />

    <!-- Environment Trends & Alert Distribution -->
    <NGrid :x-gap="gap" :y-gap="16" responsive="screen" item-responsive>
      <NGi span="24 s:24 m:14">
        <NCard :bordered="false" class="card-wrapper">
          <LineChart />
        </NCard>
      </NGi>
      <NGi span="24 s:24 m:10">
        <NCard :bordered="false" class="card-wrapper">
          <PieChart />
        </NCard>
      </NGi>
    </NGrid>

    <!-- Recent Alerts & Farming Activities -->
    <NGrid :x-gap="gap" :y-gap="16" responsive="screen" item-responsive>
      <NGi span="24 s:24 m:14">
        <RecentAlerts />
      </NGi>
      <NGi span="24 s:24 m:10">
        <FarmingActivities />
      </NGi>
    </NGrid>
  </NSpace>
</template>

<style scoped></style>
