// Task pools tailored to an experienced backend engineer (4.5y) moving into applied AI,
// with production RAG + on-prem LLM experience and high-throughput backend/systems background.

export const CAREER_POOLS = {
  applications: [
    { id: "apply3", text: "Apply to 3 carefully selected AI/Backend roles (prioritize RAG/LLM platform & applied-AI teams)" },
    { id: "apply5", text: "Apply to 5 targeted roles emphasizing backend + applied-AI hybrid titles" },
    { id: "tailor-batch", text: "Tailor resume bullets/cover note for 3 applications using JD keywords" },
    { id: "apply-followup", text: "Follow up on 2 applications from earlier this week" },
  ],
  networking: [
    { id: "net5dm", text: "Send 5 targeted connection/DM messages to recruiters or engineers at target companies" },
    { id: "net-comment", text: "Engage meaningfully on 3 LinkedIn posts from AI/backend hiring managers" },
    { id: "net-followup", text: "Follow up with 2 stalled recruiter/application threads" },
    { id: "net-referral", text: "Ask 1 former colleague or manager for a referral or warm intro" },
  ],
  coding: [
    { id: "py3", text: "Solve 3 Python interview problems (arrays/strings/hashmaps) and note time/space complexity" },
    { id: "py-dp", text: "Solve 2 dynamic-programming problems and write clean, tested solutions" },
    { id: "py-internals", text: "Review a Python internals topic (GIL, memory model, or asyncio) and write a 5-line summary" },
    { id: "py-graphs", text: "Solve 2 graph/tree traversal problems relevant to backend interviews" },
  ],
  systemDesign: [
    { id: "sd-fraud", text: "Whiteboard your fraud-detection architecture (Kafka + Redis + Elasticsearch, ~20-25k events/sec) and rehearse trade-offs" },
    { id: "sd-kafka", text: "Practice a system design question focused on Kafka partitioning & consumer-group scaling" },
    { id: "sd-cache", text: "Design a caching/invalidation strategy for a high-read API using Redis" },
    { id: "sd-ai-arch", text: "Sketch an end-to-end RAG application architecture (ingestion -> retrieval -> LLM -> API) and note failure points" },
    { id: "sd-latency", text: "Rehearse explaining how you kept 150-250ms latency at 20-25k events/sec" },
  ],
  rag: [
    { id: "rag-eval", text: "Run retrieval evaluation on 20 test questions from your judgments RAG system; record hit-rate & grounded-answer rate" },
    { id: "rag-chunking", text: "Document your structural chunking strategy and why it reduces hallucination" },
    { id: "rag-hybrid", text: "Study/implement hybrid search (BM25 + embeddings) and note when it beats pure vector search" },
    { id: "rag-citations", text: "Write your interview answer: how your system produces page/paragraph citations for auditability" },
    { id: "rag-modelsel", text: "Write a comparison note on Gemma 3 vs Llama 3.2 vs Tulu 3 for on-prem inference trade-offs" },
  ],
  agentic: [
    { id: "agent-tool", text: "Implement or refine one agent tool call in your demo project" },
    { id: "agent-planning", text: "Study agent planning patterns (ReAct, plan-and-execute) and note trade-offs vs simple workflows" },
    { id: "agent-guardrails", text: "Add/define guardrails or failure handling for your agent (retries, tool-call validation)" },
    { id: "agent-memory", text: "Design the memory/state approach for multi-turn agent interactions" },
    { id: "agent-eval", text: "Write 5 test cases that check your agent's tool-selection accuracy" },
  ],
  behavioral: [
    { id: "beh-star", text: "Write and rehearse one STAR story from your fraud-detection or RAG work" },
    { id: "beh-mock", text: "Conduct or schedule a mock interview (technical or behavioral)" },
    { id: "beh-record", text: "Record a 2-minute explanation of your project and review it critically" },
    { id: "beh-whyai", text: "Rehearse your answer to 'why are you moving deeper into applied AI'" },
  ],
  resume: [
    { id: "resume-bullets", text: "Rewrite 3 resume bullets to lead with metrics (250ms latency, 20-25k events/sec, 250 customer sites)" },
    { id: "resume-linkedin", text: "Update LinkedIn headline/About to position as a backend engineer expanding into applied AI" },
    { id: "resume-ats", text: "Run resume through an ATS keyword check against 2 target job descriptions" },
  ],
  portfolio: [
    { id: "portfolio-readme", text: "Write the README architecture section for your demo project" },
    { id: "portfolio-diagram", text: "Create an architecture diagram for your demo project" },
    { id: "portfolio-live", text: "Get your demo project link/deployment reachable and add it to your resume/LinkedIn" },
  ],
};

// Which categories to draw from per phase, in priority order
export const PHASE_CATEGORY_ORDER = {
  1: ["resume", "portfolio", "applications", "rag", "systemDesign", "coding"],
  2: ["applications", "networking", "coding", "rag", "agentic", "systemDesign"],
  3: ["systemDesign", "rag", "agentic", "applications", "coding", "behavioral"],
  4: ["behavioral", "networking", "applications", "systemDesign", "rag", "portfolio"],
};

export const PHASE_TASK_COUNT = { 1: 3, 2: 4, 3: 4, 4: 3 };
