import fs from "node:fs";
import path from "node:path";
import { courses } from "../src/data/courses";
import { allSmazzate, fioriSmazzate, playableSmazzate } from "../src/data/all-smazzate";
import { quadriSmazzate } from "../src/data/quadri-smazzate";
import { cuoriGiocoSmazzate } from "../src/data/cuori-gioco-smazzate";
import { cuoriLicitaSmazzate } from "../src/data/cuori-licita-smazzate";
import { WBF_DEALS } from "../src/data/wbf-deals";
import { biddingScenarios } from "../src/data/bidding-practice-data";
import { impasseScenarios } from "../src/data/impasse-data";
import { comprehensionData } from "../src/data/comprensione-data";
import { LEVEL_THRESHOLDS } from "../src/lib/xp-levels";
import { DEAL_TEMPLATES } from "../src/lib/deal-generator";
import { QUIZ_LEVELS } from "../src/lib/trick-quiz";

const root = process.cwd();
const walk = (dir: string): string[] => fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
  const full = path.join(dir, entry.name);
  return entry.isDirectory() ? walk(full) : [full];
});
const pageFiles = walk(path.join(root, "src/app")).filter((f) => f.endsWith("/page.tsx"));
const componentFiles = walk(path.join(root, "src/components")).filter((f) => f.endsWith(".tsx"));
const routeFiles = walk(path.join(root, "src/app/api")).filter((f) => f.endsWith("/route.ts"));
const handlerPattern = /export\s+(?:async\s+)?function\s+(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\b|export\s+const\s+(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\b/g;
let handlers = 0;
for (const file of routeFiles) handlers += [...fs.readFileSync(file, "utf8").matchAll(handlerPattern)].length;

const lessonModules = courses.flatMap((c) => c.lessons.flatMap((l) => l.modules));
const contentBlocks = lessonModules.flatMap((m) => m.content);
const typeCounts = new Map<string, number>();
for (const block of contentBlocks) typeCounts.set(block.type, (typeCounts.get(block.type) ?? 0) + 1);
const quizTypes = ["quiz", "true-false", "card-select", "hand-eval", "bid-select", "sequence"]
  .filter((t) => (typeCounts.get(t) ?? 0) > 0);

const secretSource = fs.readFileSync(path.join(root, "src/hooks/use-secret-achievements.ts"), "utf8");
const secretArray = secretSource.match(/const SECRET_ACHIEVEMENTS:[\s\S]*?= \[([\s\S]*?)\n\];/);
const secretAchievementCount = secretArray ? [...secretArray[1].matchAll(/^\s*id:\s*"/gm)].length : 0;
const badgeSource = fs.readFileSync(path.join(root, "src/components/achievement-popup.tsx"), "utf8");
const badgeArray = badgeSource.match(/export const allBadges:[\s\S]*?= \[([\s\S]*?)\n\];/);
const standardBadgeCount = badgeArray ? [...badgeArray[1].matchAll(/\{\s*id:\s*"/g)].length : 0;

const routeFromPage = (file: string) => {
  const rel = path.relative(path.join(root, "src/app"), file).replace(/\/page\.tsx$/, "");
  return rel === "page.tsx" ? "/" : `/${rel}`;
};

console.log(JSON.stringify({
  repository_static_content: {
    courses: courses.length,
    lessons: courses.reduce((n, c) => n + c.lessons.length, 0),
    lessons_by_course: Object.fromEntries(courses.map((c) => [c.id, c.lessons.length])),
    modules: lessonModules.length,
    content_blocks: contentBlocks.length,
    content_block_distribution: Object.fromEntries([...typeCounts.entries()].sort()),
    inline_quiz_types_present: quizTypes,
    inline_quiz_type_count: quizTypes.length,
    inline_quiz_blocks: quizTypes.reduce((n, t) => n + (typeCounts.get(t) ?? 0), 0),
    comprehension_lesson_sets: comprehensionData.length,
    comprehension_questions: comprehensionData.reduce((n, x) => n + x.questions.length, 0),
    bidding_practice_scenarios: biddingScenarios.length,
    impasse_scenarios: impasseScenarios.length,
    fiori_smazzate: fioriSmazzate.length,
    quadri_smazzate: quadriSmazzate.length,
    cuori_gioco_smazzate: cuoriGiocoSmazzate.length,
    cuori_licita_smazzate: cuoriLicitaSmazzate.length,
    all_validated_smazzate: allSmazzate.length,
    playable_smazzate_after_plausibility_filter: playableSmazzate.length,
    wbf_minibridge_deals: WBF_DEALS.length,
    preloaded_hand_definitions_total: allSmazzate.length + WBF_DEALS.length,
    standard_badges: standardBadgeCount,
    secret_achievements: secretAchievementCount,
    xp_levels: LEVEL_THRESHOLDS.length,
    constrained_deal_templates: DEAL_TEMPLATES.length,
    generated_trick_quiz_levels: QUIZ_LEVELS.length,
  },
  interface_inventory: {
    component_tsx_files_under_src_components: componentFiles.length,
    routable_page_files: pageFiles.length,
    routes: pageFiles.map(routeFromPage).sort(),
    api_route_files: routeFiles.length,
    exported_http_handlers: handlers,
  },
}, null, 2));
