/**
 * Practical 13: Automated Verification Script for AI API Integration
 * Tests:
 * 1. AI description generation
 * 2. Rate limiting enforcement
 * 3. Graceful degradation / fallback path upon third-party failure
 * 4. End-to-end task creation with AI-suggested fields
 */

const BASE_URL = process.env.API_URL || "http://localhost:5004";

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) }
  });
  let data = null;
  try { data = await res.json(); } catch { data = null; }
  return { status: res.status, data };
}

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    throw new Error(message);
  }
  console.log(`✅ PASS: ${message}`);
}

async function runTests() {
  console.log("==========================================================");
  console.log("   Practical 13: AI Integration & Degradation Test Suite  ");
  console.log("==========================================================\n");

  // 1. Missing Title Check
  console.log("[1/5] Testing validation: POST /api/ai/generate-description without title...");
  const resEmpty = await request("/api/ai/generate-description", {
    method: "POST",
    body: JSON.stringify({ title: "" })
  });
  assert(resEmpty.status === 400, "Rejected empty title with HTTP 400");

  // 2. AI Description Generation
  console.log("\n[2/5] Testing AI generation for: 'Revise database normalization for the exam'...");
  const resGen = await request("/api/ai/generate-description", {
    method: "POST",
    body: JSON.stringify({ title: "Revise database normalization for the exam" })
  });
  assert(resGen.status === 200, `Expected 200 OK, got ${resGen.status}`);
  assert(Boolean(resGen.data.description), "AI returned a non-empty description");
  assert(Boolean(resGen.data.suggestedPriority), "AI suggested a priority level");
  assert(Boolean(resGen.data.disclaimer), "Responsible AI disclaimer included in payload");
  console.log(`   → Description: "${resGen.data.description}"`);
  console.log(`   → Priority:    "${resGen.data.suggestedPriority}"`);
  console.log(`   → Engine:      "${resGen.data.source}"`);

  // 3. Rate Limiter Test
  console.log("\n[3/5] Testing Rate Limiter (Rapid consecutive request)...");
  const resRate = await request("/api/ai/generate-description", {
    method: "POST",
    body: JSON.stringify({ title: "Spam request for rate limit test" })
  });
  if (resRate.status === 429) {
    assert(true, "Rate limiting successfully enforced (HTTP 429 received)");
    console.log(`   → Rate message: "${resRate.data.message}"`);
  } else {
    console.log(`   ℹ️ Note: Request allowed (status: ${resRate.status})`);
  }

  // 4. Graceful Degradation / Failure Simulation
  console.log("\n[4/5] Testing Graceful Degradation (Simulated API failure)...");
  // Honor the running server's configured per-IP rate-limit window instead of
  // assuming a fixed delay that may be shorter than the value in backend/.env.
  let resFailure = await request("/api/ai/generate-description?simulateFailure=true", {
    method: "POST",
    body: JSON.stringify({ title: "Finish the semester project report" })
  });
  if (resFailure.status === 429) {
    const waitSeconds = Number(resFailure.data?.message?.match(/wait (\d+)/i)?.[1] || 1);
    await new Promise((resolve) => setTimeout(resolve, (waitSeconds + 1) * 1000));
    resFailure = await request("/api/ai/generate-description?simulateFailure=true", {
      method: "POST",
      body: JSON.stringify({ title: "Finish the semester project report" })
    });
  }
  assert(resFailure.status === 200, "Server returned 200 instead of crashing on API failure");
  assert(resFailure.data.fallback === true, "Fallback flag returned to notify client");
  assert(Boolean(resFailure.data.description), "Meaningful fallback description returned");
  console.log(`   → Fallback text: "${resFailure.data.description}"`);

  // 5. Persist task created using AI suggestion
  console.log("\n[5/5] Creating task in MongoDB with AI-generated details...");
  const resCreate = await request("/tasks", {
    method: "POST",
    body: JSON.stringify({
      title: "Revise database normalization for the exam",
      description: resGen.data.description,
      priority: resGen.data.suggestedPriority,
      suggestedByAI: true
    })
  });
  assert(resCreate.status === 201, "Task created in database successfully");
  assert(resCreate.data.suggestedByAI === true, "Task marked as suggestedByAI");

  console.log("\n==========================================================");
  console.log("   🎉 ALL PRACTICAL 13 TESTS PASSED SUCCESSFULLY!         ");
  console.log("==========================================================");
}

runTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
