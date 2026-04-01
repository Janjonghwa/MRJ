import { calculateFourPillars, fourPillarsToString } from 'manseryeok';

// Test Date: 1995-05-05 12:30
console.log("=== Testing Saju Engine ===");
try {
  const result = calculateFourPillars({
    year: 1995,
    month: 5,
    day: 5,
    hour: 12,
    minute: 30
  });

  const sajuKorean = fourPillarsToString(result);
  console.log('1. Korean String:', sajuKorean);
  
  if (result.year && result.year.hanja) {
    // If toHanjaString exists
    console.log('2. Hanja String:', result.toHanjaString ? result.toHanjaString() : 'N/A');
  } else {
    console.log('2. Object JSON:', JSON.stringify(result, null, 2));
  }
} catch (e) {
  console.error("Test Error:", e.stack);
}
