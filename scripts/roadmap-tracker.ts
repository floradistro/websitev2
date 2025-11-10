#!/usr/bin/env tsx
/**
 * Apple Standards Roadmap Progress Tracker
 *
 * Tracks progress through the 4-phase remediation plan
 * Run: npx tsx scripts/roadmap-tracker.ts
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

interface Task {
  id: string;
  title: string;
  priority: 'P0' | 'P1' | 'P2';
  effort: number; // hours
  status: 'not-started' | 'in-progress' | 'completed' | 'blocked';
  assignee?: string;
  blockers?: string[];
  completedAt?: string;
}

interface Phase {
  number: 1 | 2 | 3 | 4;
  name: string;
  status: 'not-started' | 'in-progress' | 'completed';
  tasks: Task[];
  startDate?: string;
  endDate?: string;
}

const roadmapData: Phase[] = [
  {
    number: 1,
    name: 'Critical Fixes & Security',
    status: 'not-started',
    tasks: [
      {
        id: '1.1.1',
        title: 'Remove Database Credentials from Source Code',
        priority: 'P0',
        effort: 2,
        status: 'not-started',
      },
      {
        id: '1.1.2',
        title: 'Fix CORS Wildcard Fallback',
        priority: 'P0',
        effort: 1,
        status: 'not-started',
      },
      {
        id: '1.1.3',
        title: 'Stop Error Message Leakage',
        priority: 'P0',
        effort: 3,
        status: 'not-started',
      },
      {
        id: '1.2.1',
        title: 'Fix All Empty Catch Blocks',
        priority: 'P0',
        effort: 4,
        status: 'not-started',
      },
      {
        id: '1.2.2',
        title: 'Add .catch() to Promise Chains',
        priority: 'P0',
        effort: 2,
        status: 'not-started',
      },
      {
        id: '1.2.3',
        title: 'Fix Duplicate Condition in api-handler.ts',
        priority: 'P1',
        effort: 0.5,
        status: 'not-started',
      },
      {
        id: '1.3.1',
        title: 'Add Zod Validation to Auth Endpoints',
        priority: 'P0',
        effort: 6,
        status: 'not-started',
      },
      {
        id: '1.3.2',
        title: 'Add Input Validation to Product Endpoints',
        priority: 'P1',
        effort: 8,
        status: 'not-started',
      },
      {
        id: '1.4.1',
        title: 'Fix usePrefetch Memory Leak',
        priority: 'P0',
        effort: 1,
        status: 'not-started',
      },
      {
        id: '1.5.1',
        title: 'Configure Redis for Caching',
        priority: 'P1',
        effort: 4,
        status: 'not-started',
      },
      {
        id: '1.5.2',
        title: 'Add Rate Limiting to API Routes',
        priority: 'P1',
        effort: 6,
        status: 'not-started',
      },
    ],
  },
  {
    number: 2,
    name: 'Type Safety & Error Handling',
    status: 'not-started',
    tasks: [
      {
        id: '2.1.1',
        title: 'Replace All any Types with Proper Types',
        priority: 'P1',
        effort: 16,
        status: 'not-started',
      },
      {
        id: '2.1.2',
        title: 'Create Comprehensive Type Definitions',
        priority: 'P1',
        effort: 12,
        status: 'not-started',
      },
      {
        id: '2.1.3',
        title: 'Fix Unsafe Type Assertions',
        priority: 'P1',
        effort: 8,
        status: 'not-started',
      },
      {
        id: '2.2.1',
        title: 'Create Global Error Boundary',
        priority: 'P1',
        effort: 4,
        status: 'not-started',
      },
      {
        id: '2.2.2',
        title: 'Add API Error Wrapper',
        priority: 'P1',
        effort: 4,
        status: 'not-started',
      },
      {
        id: '2.3.1',
        title: 'Fix useVendorData Error Handling',
        priority: 'P1',
        effort: 3,
        status: 'not-started',
      },
      {
        id: '2.4.1',
        title: 'Create Database Migration System',
        priority: 'P0',
        effort: 8,
        status: 'not-started',
      },
    ],
  },
  {
    number: 3,
    name: 'Performance & Caching',
    status: 'not-started',
    tasks: [
      {
        id: '3.1.1',
        title: 'Add Redis Caching to Domain Lookups',
        priority: 'P0',
        effort: 6,
        status: 'not-started',
      },
      {
        id: '3.1.2',
        title: 'Optimize Vendor Session Lookup',
        priority: 'P1',
        effort: 4,
        status: 'not-started',
      },
      {
        id: '3.2.1',
        title: 'Fix N+1 Query in Products Endpoint',
        priority: 'P0',
        effort: 6,
        status: 'not-started',
      },
      {
        id: '3.2.2',
        title: 'Add Query Result Caching',
        priority: 'P1',
        effort: 6,
        status: 'not-started',
      },
      {
        id: '3.3.1',
        title: 'Add Memoization to Expensive Calculations',
        priority: 'P1',
        effort: 4,
        status: 'not-started',
      },
      {
        id: '3.3.2',
        title: 'Add React.memo to Heavy Components',
        priority: 'P1',
        effort: 4,
        status: 'not-started',
      },
      {
        id: '3.4.1',
        title: 'Analyze and Reduce Bundle Size',
        priority: 'P1',
        effort: 6,
        status: 'not-started',
      },
      {
        id: '3.5.1',
        title: 'Implement Responsive Images',
        priority: 'P2',
        effort: 4,
        status: 'not-started',
      },
    ],
  },
  {
    number: 4,
    name: 'Testing & Documentation',
    status: 'not-started',
    tasks: [
      {
        id: '4.1.1',
        title: 'Set Up Testing Infrastructure',
        priority: 'P0',
        effort: 4,
        status: 'not-started',
      },
      {
        id: '4.1.2',
        title: 'Test Utility Functions (80% Coverage)',
        priority: 'P0',
        effort: 12,
        status: 'not-started',
      },
      {
        id: '4.1.3',
        title: 'API Route Testing',
        priority: 'P0',
        effort: 16,
        status: 'not-started',
      },
      {
        id: '4.2.1',
        title: 'Test React Components',
        priority: 'P1',
        effort: 12,
        status: 'not-started',
      },
      {
        id: '4.3.1',
        title: 'Expand Playwright Test Suite',
        priority: 'P1',
        effort: 16,
        status: 'not-started',
      },
      {
        id: '4.4.1',
        title: 'Generate API Documentation',
        priority: 'P1',
        effort: 8,
        status: 'not-started',
      },
      {
        id: '4.4.2',
        title: 'Add JSDoc Comments',
        priority: 'P1',
        effort: 8,
        status: 'not-started',
      },
    ],
  },
];

function calculateProgress() {
  let totalTasks = 0;
  let completedTasks = 0;
  let totalEffort = 0;
  let completedEffort = 0;
  let p0Tasks = 0;
  let p0Completed = 0;

  roadmapData.forEach((phase) => {
    phase.tasks.forEach((task) => {
      totalTasks++;
      totalEffort += task.effort;

      if (task.priority === 'P0') {
        p0Tasks++;
        if (task.status === 'completed') p0Completed++;
      }

      if (task.status === 'completed') {
        completedTasks++;
        completedEffort += task.effort;
      }
    });
  });

  return {
    totalTasks,
    completedTasks,
    totalEffort,
    completedEffort,
    p0Tasks,
    p0Completed,
    percentComplete: ((completedTasks / totalTasks) * 100).toFixed(1),
    effortComplete: ((completedEffort / totalEffort) * 100).toFixed(1),
    p0PercentComplete: p0Tasks > 0 ? ((p0Completed / p0Tasks) * 100).toFixed(1) : '0',
  };
}

function getStatusEmoji(status: string): string {
  switch (status) {
    case 'not-started':
      return '⚪';
    case 'in-progress':
      return '🟡';
    case 'completed':
      return '✅';
    case 'blocked':
      return '🔴';
    default:
      return '⚪';
  }
}

function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'P0':
      return '\x1b[31m'; // Red
    case 'P1':
      return '\x1b[33m'; // Yellow
    case 'P2':
      return '\x1b[36m'; // Cyan
    default:
      return '\x1b[0m'; // Reset
  }
}

function displayRoadmap() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║     🍎 APPLE ENGINEERING STANDARDS - ROADMAP TRACKER        ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  const progress = calculateProgress();

  console.log('📊 OVERALL PROGRESS:');
  console.log(`   Tasks: ${progress.completedTasks}/${progress.totalTasks} (${progress.percentComplete}%)`);
  console.log(`   Effort: ${progress.completedEffort}/${progress.totalEffort} hours (${progress.effortComplete}%)`);
  console.log(`   P0 (Critical): ${progress.p0Completed}/${progress.p0Tasks} (${progress.p0PercentComplete}%)\n`);

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  roadmapData.forEach((phase) => {
    const phaseCompleted = phase.tasks.filter((t) => t.status === 'completed').length;
    const phaseTotal = phase.tasks.length;
    const phasePercent = ((phaseCompleted / phaseTotal) * 100).toFixed(0);

    console.log(`\n${getStatusEmoji(phase.status)} PHASE ${phase.number}: ${phase.name.toUpperCase()}`);
    console.log(`   Progress: ${phaseCompleted}/${phaseTotal} tasks (${phasePercent}%)`);

    if (phase.startDate) {
      console.log(`   Started: ${phase.startDate}`);
    }
    if (phase.endDate) {
      console.log(`   Completed: ${phase.endDate}`);
    }

    console.log('   ─────────────────────────────────────────────────────────');

    phase.tasks.forEach((task) => {
      const priorityColor = getPriorityColor(task.priority);
      const resetColor = '\x1b[0m';

      console.log(
        `   ${getStatusEmoji(task.status)} ${priorityColor}[${task.priority}]${resetColor} ${task.id} - ${task.title}`
      );
      console.log(`      Effort: ${task.effort}h | Status: ${task.status}`);

      if (task.assignee) {
        console.log(`      Assignee: ${task.assignee}`);
      }

      if (task.blockers && task.blockers.length > 0) {
        console.log(`      🚫 Blockers: ${task.blockers.join(', ')}`);
      }

      if (task.completedAt) {
        console.log(`      ✓ Completed: ${task.completedAt}`);
      }
    });
  });

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Next Actions
  console.log('🎯 NEXT ACTIONS:\n');
  const nextTasks = roadmapData
    .flatMap((phase) => phase.tasks)
    .filter((task) => task.status === 'not-started' && task.priority === 'P0')
    .slice(0, 5);

  if (nextTasks.length === 0) {
    console.log('   🎉 All P0 tasks completed! Focus on P1 tasks.');
  } else {
    nextTasks.forEach((task, index) => {
      console.log(`   ${index + 1}. [${task.priority}] ${task.id} - ${task.title} (${task.effort}h)`);
    });
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Blocked Items
  const blockedTasks = roadmapData.flatMap((phase) => phase.tasks).filter((task) => task.status === 'blocked');

  if (blockedTasks.length > 0) {
    console.log('🚫 BLOCKED ITEMS:\n');
    blockedTasks.forEach((task) => {
      console.log(`   ${task.id} - ${task.title}`);
      if (task.blockers) {
        console.log(`   Blockers: ${task.blockers.join(', ')}`);
      }
    });
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  }

  console.log('💡 LEGEND:');
  console.log('   ⚪ Not Started  🟡 In Progress  ✅ Completed  🔴 Blocked');
  console.log('   \x1b[31m[P0]\x1b[0m Critical  \x1b[33m[P1]\x1b[0m High  \x1b[36m[P2]\x1b[0m Medium\n');

  console.log('📝 To update task status, edit this file or use:');
  console.log('   npx tsx scripts/roadmap-tracker.ts update <task-id> <status>\n');
}

function updateTask(taskId: string, status: string) {
  let found = false;

  roadmapData.forEach((phase) => {
    const task = phase.tasks.find((t) => t.id === taskId);
    if (task) {
      task.status = status as any;
      if (status === 'completed') {
        task.completedAt = new Date().toISOString().split('T')[0];
      }
      found = true;
      console.log(`✓ Updated task ${taskId} to status: ${status}`);
    }
  });

  if (!found) {
    console.log(`✗ Task ${taskId} not found`);
  }
}

// CLI
const args = process.argv.slice(2);

if (args[0] === 'update' && args[1] && args[2]) {
  updateTask(args[1], args[2]);
  // Save to file (you could persist this to a JSON file)
  console.log('\n(Note: To persist changes, implement JSON file storage)\n');
} else {
  displayRoadmap();
}
