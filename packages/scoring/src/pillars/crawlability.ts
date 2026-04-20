import type {
  CrawlabilityInput,
  Issue,
  PillarResult,
} from '../types.js';

const CHECKS = {
  llmsTxtPresent: 30,
  aiAgentsAllowed: 30,
  sitemapPresent: 20,
  sitemapReferenced: 10,
  llmsTxtWellFormed: 10,
} as const;

const AI_AGENTS = [
  'GPTBot',
  'ClaudeBot',
  'Claude-Web',
  'anthropic-ai',
  'Google-Extended',
  'PerplexityBot',
  'Applebot-Extended',
  'cohere-ai',
  'Bytespider',
  'CCBot',
  'OAI-SearchBot',
  'ChatGPT-User',
] as const;

export function scoreCrawlability(input: CrawlabilityInput): PillarResult {
  const { robotsTxt, llmsTxt, sitemapXml } = input;

  const llmsPresent = isNonEmptyBody(llmsTxt);
  const llmsWellFormed = llmsPresent && isWellFormedLlmsTxt(llmsTxt!);
  const sitemapPresent = isNonEmptyBody(sitemapXml) && looksLikeSitemap(sitemapXml!);
  const robotsBlocks = robotsBlocksAnyAiAgent(robotsTxt);
  const sitemapReferenced =
    sitemapPresent && sitemapReferencedInRobots(robotsTxt);

  const llmsScore = llmsPresent ? CHECKS.llmsTxtPresent : 0;
  const aiAllowedScore = robotsBlocks.blocksAll
    ? 0
    : robotsBlocks.blockedAgents.length > 0
      ? CHECKS.aiAgentsAllowed * 0.4
      : CHECKS.aiAgentsAllowed;
  const sitemapScore = sitemapPresent ? CHECKS.sitemapPresent : 0;
  const referencedScore = sitemapReferenced ? CHECKS.sitemapReferenced : 0;
  const wellFormedScore = llmsWellFormed ? CHECKS.llmsTxtWellFormed : 0;

  const score =
    Math.round(
      (llmsScore +
        aiAllowedScore +
        sitemapScore +
        referencedScore +
        wellFormedScore) *
        100,
    ) / 100;

  const issues: Issue[] = [];

  if (robotsBlocks.blocksAll) {
    issues.push({
      pillar: 'crawlability',
      code: 'robots-blocks-all',
      severity: 'critical',
      title: 'robots.txt blocks all user agents',
      description:
        'A blanket `Disallow: /` applied to `User-agent: *` prevents every AI agent — and traditional search — from reading your catalog.',
      affectedCount: 1,
      affectedProductIds: [],
      revenueImpactScore: 100,
    });
  } else if (robotsBlocks.blockedAgents.length > 0) {
    issues.push({
      pillar: 'crawlability',
      code: 'robots-blocks-ai-agents',
      severity: 'critical',
      title: `robots.txt blocks ${robotsBlocks.blockedAgents.length} AI agent${robotsBlocks.blockedAgents.length === 1 ? '' : 's'}`,
      description: `Explicit block on ${robotsBlocks.blockedAgents.join(', ')} removes your catalog from AI-agent shopping results. Remove the Disallow line unless you have a specific reason to block.`,
      affectedCount: robotsBlocks.blockedAgents.length,
      affectedProductIds: [],
      revenueImpactScore: 90,
    });
  }

  if (!llmsPresent) {
    issues.push({
      pillar: 'crawlability',
      code: 'missing-llms-txt',
      severity: 'high',
      title: 'No llms.txt served at the site root',
      description:
        'llms.txt is the emerging standard for declaring content to AI agents. A one-screen markdown file at /llms.txt lets agents discover your key pages without scraping a full sitemap.',
      affectedCount: 1,
      affectedProductIds: [],
      revenueImpactScore: 70,
    });
  } else if (!llmsWellFormed) {
    issues.push({
      pillar: 'crawlability',
      code: 'malformed-llms-txt',
      severity: 'low',
      title: 'llms.txt is present but malformed',
      description:
        'llms.txt expects a top-level `# Site name` header followed by `## Section` headings with link lists. Without this structure agents fall back to raw crawling.',
      affectedCount: 1,
      affectedProductIds: [],
      revenueImpactScore: 20,
    });
  }

  if (!sitemapPresent) {
    issues.push({
      pillar: 'crawlability',
      code: 'missing-sitemap',
      severity: 'medium',
      title: 'No sitemap.xml found at the site root',
      description:
        'Sitemap.xml is the primary discovery channel for crawlers. Shopify serves one automatically at /sitemap.xml — confirm the storefront theme is not stripping it.',
      affectedCount: 1,
      affectedProductIds: [],
      revenueImpactScore: 50,
    });
  } else if (!sitemapReferenced) {
    issues.push({
      pillar: 'crawlability',
      code: 'sitemap-not-referenced',
      severity: 'low',
      title: 'Sitemap.xml is not referenced in robots.txt',
      description:
        'Add a `Sitemap: https://yourstore.com/sitemap.xml` line to robots.txt so crawlers find it without guessing.',
      affectedCount: 1,
      affectedProductIds: [],
      revenueImpactScore: 15,
    });
  }

  return {
    pillar: 'crawlability',
    weight: 15,
    score,
    maxScore: 100,
    locked: false,
    issues,
  };
}

function isNonEmptyBody(body: string | null): body is string {
  return typeof body === 'string' && body.trim().length > 0;
}

function isWellFormedLlmsTxt(body: string): boolean {
  const lines = body.split(/\r?\n/).map((l) => l.trim());
  const hasRootHeading = lines.some((l) => /^#\s+\S/.test(l));
  const hasSectionHeading = lines.some((l) => /^##\s+\S/.test(l));
  return hasRootHeading && hasSectionHeading;
}

function looksLikeSitemap(body: string): boolean {
  const trimmed = body.trim();
  if (!trimmed.startsWith('<')) return false;
  return /<urlset[\s>]|<sitemapindex[\s>]/i.test(trimmed);
}

interface RobotsAnalysis {
  blocksAll: boolean;
  blockedAgents: string[];
}

function robotsBlocksAnyAiAgent(robots: string | null): RobotsAnalysis {
  if (!isNonEmptyBody(robots)) {
    return { blocksAll: false, blockedAgents: [] };
  }

  const groups = parseRobotsGroups(robots);
  const wildcardDisallows = groups
    .filter((g) => g.agents.includes('*'))
    .flatMap((g) => g.disallows);
  const blocksAll = wildcardDisallows.some((d) => d === '/');

  const blocked = new Set<string>();
  for (const agent of AI_AGENTS) {
    const lowered = agent.toLowerCase();
    const group = groups.find((g) =>
      g.agents.some((a) => a.toLowerCase() === lowered),
    );
    if (!group) continue;
    if (group.disallows.some((d) => d === '/')) {
      blocked.add(agent);
    }
  }

  return { blocksAll, blockedAgents: [...blocked] };
}

function sitemapReferencedInRobots(robots: string | null): boolean {
  if (!isNonEmptyBody(robots)) return false;
  return /^\s*sitemap\s*:/im.test(robots);
}

interface RobotsGroup {
  agents: string[];
  disallows: string[];
}

function parseRobotsGroups(body: string): RobotsGroup[] {
  const lines = body
    .split(/\r?\n/)
    .map((l) => l.replace(/#.*$/, '').trim())
    .filter(Boolean);

  const groups: RobotsGroup[] = [];
  let current: RobotsGroup | null = null;
  let lastDirective: 'agent' | 'other' | null = null;

  for (const line of lines) {
    const match = /^([A-Za-z-]+)\s*:\s*(.*)$/.exec(line);
    if (!match) continue;
    const field = match[1]!.toLowerCase();
    const value = match[2]!.trim();

    if (field === 'user-agent') {
      if (!current || lastDirective === 'other') {
        current = { agents: [value], disallows: [] };
        groups.push(current);
      } else {
        current.agents.push(value);
      }
      lastDirective = 'agent';
    } else {
      if (!current) continue;
      if (field === 'disallow') {
        current.disallows.push(value);
      }
      lastDirective = 'other';
    }
  }

  return groups;
}
