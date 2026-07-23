#!/bin/bash
# Editor 产品迭代监控脚本
# 用法: bash scripts/monitor.sh [--json]

set -e

JSON_MODE=false
if [[ "$1" == "--json" ]]; then
  JSON_MODE=true
fi

cd "$(dirname "$0")/.."

# 采集指标
TEST_RESULT="N/A"
BUILD_RESULT="N/A"
WIDGET_COUNT=0
COMPOSABLE_COUNT=0
TEST_SPEC_COUNT=0
HARDCODED_CN_FILES=0
BUILD_SIZE="N/A"

# 测试
if pnpm test > /tmp/editor-test.log 2>&1; then
  TEST_RESULT="✅ PASS"
  TEST_PASSED=$(grep -o '[0-9]* passed' /tmp/editor-test.log | tail -1 || echo "0 passed")
else
  TEST_RESULT="❌ FAIL"
  TEST_PASSED="failed"
fi

# Build
if pnpm build:check > /tmp/editor-build.log 2>&1; then
  BUILD_RESULT="✅ PASS"
else
  BUILD_RESULT="❌ FAIL"
fi

# Widget 数量
WIDGET_COUNT=$(grep -r 'registerWidget' src/widgets/ 2>/dev/null | wc -l | tr -d ' ')

# Composable 数量
COMPOSABLE_COUNT=$(ls src/composables/use*.ts 2>/dev/null | wc -l | tr -d ' ')

# 测试规格数量
TEST_SPEC_COUNT=$(find src -name '*.test.ts' 2>/dev/null | wc -l | tr -d ' ')

# 硬编码中文
HARDCODED_CN_FILES=$(grep -rl '[一-龥]' src/ --include='*.vue' --include='*.ts' 2>/dev/null | wc -l | tr -d ' ')

# Build 产物大小
if [ -d "dist" ]; then
  BUILD_SIZE=$(du -sh dist/ | cut -f1)
fi

# 输出
if $JSON_MODE; then
  cat <<EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "quality": {
    "test_result": "$(echo $TEST_RESULT | tr -d '✅❌ ')",
    "test_passed": "$TEST_PASSED",
    "build_result": "$(echo $BUILD_RESULT | tr -d '✅❌ ')"
  },
  "scale": {
    "widget_count": $WIDGET_COUNT,
    "composable_count": $COMPOSABLE_COUNT,
    "test_spec_count": $TEST_SPEC_COUNT
  },
  "experience": {
    "hardcoded_cn_files": $HARDCODED_CN_FILES,
    "build_size": "$BUILD_SIZE"
  }
}
EOF
else
  echo "========================================"
  echo "  Editor 产品迭代监控报告"
  echo "  $(date '+%Y-%m-%d %H:%M:%S')"
  echo "========================================"
  echo ""
  echo "--- 质量指标 ---"
  echo "  测试状态:   $TEST_RESULT ($TEST_PASSED)"
  echo "  Build 状态: $BUILD_RESULT"
  echo ""
  echo "--- 规模指标 ---"
  echo "  Widget 注册数: $WIDGET_COUNT"
  echo "  Composable 数: $COMPOSABLE_COUNT"
  echo "  测试规格数:    $TEST_SPEC_COUNT"
  echo ""
  echo "--- 体验指标 ---"
  echo "  硬编码中文文件: $HARDCODED_CN_FILES"
  echo "  Build 产物大小: $BUILD_SIZE"
  echo ""
  echo "========================================"
fi
