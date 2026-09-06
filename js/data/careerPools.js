// Task pools tailored to an experienced backend engineer (4.5y) moving into applied AI,
// with production RAG + on-prem LLM experience and high-throughput backend/systems background.
// Every task has an estimated `minutes` so the daily time budget can be filled sensibly.

export const CAREER_POOLS = {
  applications: [
    { id: "apply3", text: "Apply to 3 jobs you're a strong fit for", minutes: 30 },
    { id: "apply5", text: "Apply to 5 jobs you're a strong fit for", minutes: 45 },
    { id: "tailor-batch", text: "Update your resume for 3 job applications", minutes: 30 },
    { id: "apply-followup", text: "Follow up on 2 jobs you applied to earlier", minutes: 15 },
  ],
  networking: [
    { id: "net5dm", text: "Message 5 recruiters or engineers on LinkedIn", minutes: 25 },
    { id: "net-comment", text: "Comment on 3 posts from people who hire for AI/backend roles", minutes: 15 },
    { id: "net-followup", text: "Follow up with 2 people who haven't replied yet", minutes: 10 },
    { id: "net-referral", text: "Ask 1 former colleague for a referral", minutes: 10 },
  ],
  coding: [
    { id: "py3", text: "Solve 3 easy/medium coding problems in Python", minutes: 45 },
    { id: "py-dp", text: "Solve 2 dynamic-programming problems", minutes: 40 },
    { id: "py-internals", text: "Read about one Python topic (like the GIL or asyncio) and write 5 lines about it", minutes: 20 },
    { id: "py-graphs", text: "Solve 2 problems about graphs or trees", minutes: 40 },
  ],
  systemDesign: [
    { id: "sd-fraud", text: "Practice explaining how your fraud-detection system worked", minutes: 30 },
    { id: "sd-kafka", text: "Practice a system design question about Kafka", minutes: 30 },
    { id: "sd-cache", text: "Design a simple caching system using Redis", minutes: 30 },
    { id: "sd-ai-arch", text: "Sketch how a RAG app works end to end, and where it could break", minutes: 30 },
    { id: "sd-latency", text: "Practice explaining how you kept your system fast under heavy load", minutes: 20 },
  ],
  rag: [
    { id: "rag-eval", text: "Test your RAG system on 20 questions and note how many it got right", minutes: 45 },
    { id: "rag-chunking", text: "Write down how you split documents into chunks, and why", minutes: 20 },
    { id: "rag-hybrid", text: "Learn about combining keyword search with AI search (hybrid search)", minutes: 30 },
    { id: "rag-citations", text: "Practice explaining how your system shows the exact source for each answer", minutes: 20 },
    { id: "rag-modelsel", text: "Compare 3 AI models you've used and when to pick each one", minutes: 25 },
  ],
  agentic: [
    { id: "agent-tool", text: "Add or improve one tool your AI agent can use", minutes: 45 },
    { id: "agent-planning", text: "Learn how AI agents plan multi-step tasks", minutes: 25 },
    { id: "agent-guardrails", text: "Add a safety check so your agent doesn't do something wrong", minutes: 30 },
    { id: "agent-memory", text: "Decide how your agent will remember earlier parts of a conversation", minutes: 25 },
    { id: "agent-eval", text: "Write 5 test questions to check if your agent picks the right tool", minutes: 30 },
  ],
  behavioral: [
    { id: "beh-star", text: "Write one story about a project using Situation-Task-Action-Result", minutes: 25 },
    { id: "beh-mock", text: "Do a practice interview (with someone, or out loud by yourself)", minutes: 45 },
    { id: "beh-record", text: "Record yourself explaining your project in 2 minutes", minutes: 15 },
    { id: "beh-whyai", text: "Practice answering: why are you moving into AI roles?", minutes: 10 },
  ],
  resume: [
    { id: "resume-bullets", text: "Rewrite 3 resume lines to include real numbers", minutes: 25 },
    { id: "resume-linkedin", text: "Update your LinkedIn headline and About section", minutes: 20 },
    { id: "resume-ats", text: "Check your resume against 2 job postings for missing keywords", minutes: 20 },
  ],
  portfolio: [
    { id: "portfolio-readme", text: "Write a short README explaining how your project works", minutes: 30 },
    { id: "portfolio-diagram", text: "Draw a simple diagram of your project", minutes: 25 },
    { id: "portfolio-live", text: "Get your project link working and add it to your resume", minutes: 30 },
  ],
};

// Which categories to draw from per phase, in priority order
export const PHASE_CATEGORY_ORDER = {
  1: ["resume", "portfolio", "applications", "rag", "systemDesign", "coding"],
  2: ["applications", "networking", "coding", "rag", "agentic", "systemDesign"],
  3: ["systemDesign", "rag", "agentic", "applications", "coding", "behavioral"],
  4: ["behavioral", "networking", "applications", "systemDesign", "rag", "portfolio"],
};
