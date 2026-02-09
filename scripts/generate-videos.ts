/**
 * BridgeQuest - HeyGen Video Generator
 * Generates lesson intro videos for Quadri, Cuori Gioco, Cuori Licita
 */

import { quadriWorldsAdapted } from "../src/data/quadri-lessons";
import { cuoriGiocoWorlds } from "../src/data/cuori-gioco-lessons";
import { cuoriLicitaWorlds } from "../src/data/cuori-licita-lessons";
import type { World } from "../src/data/lessons";
import * as fs from "fs";
import * as path from "path";

const API_KEY = "sk_V2_hgu_kkTAIaL7IDS_q9wuCHxCeBxnIXX07IdecaQRRBKjxLFq";
const AVATAR_ID = "8734f8e7c55647498a62a88d6810f2ea";
const VOICE_ID = "915ddcfeebea4e86a94d48a6e142fb8a";
const OUTPUT_DIR = path.join(__dirname, "../public/videos");

interface VideoJob {
  name: string;
  filename: string;
  script: string;
  videoId?: string;
  status?: string;
  url?: string;
}

// Build script for a lesson
function buildScript(title: string, subtitle: string, firstContent: string): string {
  const intro = "Benvenuto a BridgeQuest! Sono il tuo Maestro.";
  const body = firstContent.substring(0, 500).replace(/\s+/g, " ").trim();
  return `${intro} Oggi parliamo di: ${title}. ${subtitle}. ${body}`;
}

// Collect all video jobs
function collectJobs(): VideoJob[] {
  const jobs: VideoJob[] = [];

  function addCourseJobs(worlds: World[], prefix: string) {
    for (const w of worlds) {
      for (const l of w.lessons) {
        const theoryContent = l.modules[0]?.content
          ?.filter((c) => c.type === "text" || c.type === "heading" || c.type === "rule")
          .slice(0, 4)
          .map((c) => c.content)
          .join(" ") || "";

        jobs.push({
          name: `${prefix}-${l.id}`,
          filename: `maestro-${prefix}-lezione${l.id}.mp4`,
          script: buildScript(l.title, l.subtitle, theoryContent),
        });
      }
    }
  }

  addCourseJobs(quadriWorldsAdapted, "quadri");
  addCourseJobs(cuoriGiocoWorlds, "cuori-gioco");
  addCourseJobs(cuoriLicitaWorlds, "cuori-licita");

  return jobs;
}

// Create a video via HeyGen API
async function createVideo(job: VideoJob): Promise<string> {
  const res = await fetch("https://api.heygen.com/v2/video/generate", {
    method: "POST",
    headers: {
      "X-Api-Key": API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      video_inputs: [
        {
          character: {
            type: "avatar",
            avatar_id: AVATAR_ID,
            avatar_style: "normal",
          },
          voice: {
            type: "text",
            input_text: job.script,
            voice_id: VOICE_ID,
            speed: 1.0,
          },
          background: {
            type: "color",
            value: "#f0fdf4", // light green matching bridgequest theme
          },
        },
      ],
      dimension: {
        width: 1280,
        height: 720,
      },
    }),
  });

  const data = await res.json();
  if (data.error) {
    throw new Error(`API Error for ${job.name}: ${JSON.stringify(data.error)}`);
  }
  return data.data?.video_id;
}

// Check video status
async function checkStatus(videoId: string): Promise<{ status: string; url?: string }> {
  const res = await fetch(`https://api.heygen.com/v1/video_status.get?video_id=${videoId}`, {
    headers: { "X-Api-Key": API_KEY },
  });
  const data = await res.json();
  return {
    status: data.data?.status || "unknown",
    url: data.data?.video_url,
  };
}

// Download video
async function downloadVideo(url: string, filepath: string): Promise<void> {
  const res = await fetch(url);
  const buffer = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(filepath, buffer);
}

// Wait for video to be ready (poll)
async function waitForVideo(videoId: string, name: string): Promise<string> {
  let attempts = 0;
  const maxAttempts = 120; // 10 minutes max
  while (attempts < maxAttempts) {
    const { status, url } = await checkStatus(videoId);
    if (status === "completed" && url) {
      console.log(`  ✓ ${name} ready!`);
      return url;
    }
    if (status === "failed") {
      throw new Error(`Video ${name} failed`);
    }
    process.stdout.write(`  ${name}: ${status} (${attempts * 5}s)...\r`);
    await new Promise((r) => setTimeout(r, 5000));
    attempts++;
  }
  throw new Error(`Timeout waiting for ${name}`);
}

// Main
async function main() {
  // Ensure output dir
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const jobs = collectJobs();
  console.log(`\n🎬 BridgeQuest Video Generator`);
  console.log(`📹 ${jobs.length} videos to generate\n`);

  // Check which already exist
  const existing = jobs.filter((j) => fs.existsSync(path.join(OUTPUT_DIR, j.filename)));
  const todo = jobs.filter((j) => !fs.existsSync(path.join(OUTPUT_DIR, j.filename)));
  console.log(`✓ ${existing.length} already exist, ${todo.length} to generate\n`);

  if (todo.length === 0) {
    console.log("All videos already generated!");
    return;
  }

  // Generate in batches of 3 (to not overwhelm API)
  const batchSize = 3;
  for (let i = 0; i < todo.length; i += batchSize) {
    const batch = todo.slice(i, i + batchSize);
    console.log(`\n--- Batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(todo.length / batchSize)} ---`);

    // Submit batch
    const submissions: { job: VideoJob; videoId: string }[] = [];
    for (const job of batch) {
      try {
        console.log(`  → Submitting ${job.name}...`);
        const videoId = await createVideo(job);
        console.log(`    Video ID: ${videoId}`);
        submissions.push({ job, videoId });
      } catch (e: any) {
        console.error(`  ✗ Failed to submit ${job.name}: ${e.message}`);
      }
    }

    // Wait for all in batch
    for (const { job, videoId } of submissions) {
      try {
        const url = await waitForVideo(videoId, job.name);
        const filepath = path.join(OUTPUT_DIR, job.filename);
        console.log(`  ↓ Downloading ${job.filename}...`);
        await downloadVideo(url, filepath);
        console.log(`  ✓ Saved ${job.filename}`);
      } catch (e: any) {
        console.error(`  ✗ ${job.name}: ${e.message}`);
      }
    }
  }

  console.log(`\n🎉 Done! Check ${OUTPUT_DIR}`);
}

main().catch(console.error);
