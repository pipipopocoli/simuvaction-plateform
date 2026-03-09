export const EDITORIAL_NEWS_SEEDS = [
  {
    key: "infrastructure-readiness",
    lookupTitles: [
      "Low-Connectivity Schools Push AI Policy Talks Toward Infrastructure Guarantees",
    ],
    title: "Low-Connectivity Schools Push AI Policy Talks Toward Infrastructure Guarantees",
    body:
      "Diplomatic discussions on AI and education are shifting away from abstract principles and toward a concrete operational question: what happens to schools that still struggle with electricity, bandwidth, or reliable devices.\n\nSeveral delegations are now arguing that any international framework for educational AI should include minimum infrastructure guarantees before advanced classroom tools are scaled. Their position is that adaptive tutors, automated feedback systems, and multilingual assistants can improve learning outcomes only when students can access them consistently. Without that baseline, AI deployments risk becoming another layer of inequality rather than a corrective instrument.\n\nPolicy drafters are therefore exploring language that ties educational AI deployment to public-interest infrastructure goals: resilient connectivity, device maintenance, teacher support, and local hosting options where needed. The emerging consensus is notable. In this round of debate, the most persuasive argument has not been about technological ambition, but about institutional readiness and equal access.",
    imageUrl:
      "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&q=80&w=1400",
    sourceLabel: "SimuVaction Editorial • Infrastructure Readiness",
    publishedOffsetMinutes: 20,
  },
  {
    key: "classroom-safeguards",
    lookupTitles: [
      "Safeguards for Classroom AI Move to the Center of the Education Negotiations",
    ],
    title: "Safeguards for Classroom AI Move to the Center of the Education Negotiations",
    body:
      "The latest debate round has made one point unmistakably clear: educational AI policy will be judged less by how impressive the tools appear and more by how seriously institutions address safety, accountability, and child protection.\n\nParticipants spent much of the session examining how schools should govern automated tutoring systems, predictive learning analytics, and AI-assisted assessment. Concerns focused on three operational risks: opaque decision-making, over-collection of student data, and excessive dependence on tools that can shape learning behaviour without meaningful human review.\n\nAs a result, negotiators are converging on a framework that would require auditability, educator oversight, age-appropriate design, and clear channels for contesting automated outcomes. Rather than rejecting classroom AI, the debate is moving toward disciplined adoption. The direction of travel is pragmatic: if AI is to support education, it must remain answerable to teachers, institutions, and the students whose development it influences.",
    imageUrl:
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=1400",
    sourceLabel: "SimuVaction Editorial • Classroom Safeguards",
    publishedOffsetMinutes: 60,
  },
  {
    key: "teacher-capacity",
    lookupTitles: [
      "Teacher Capacity Emerges as the Decisive Variable in AI for Education",
    ],
    title: "Teacher Capacity Emerges as the Decisive Variable in AI for Education",
    body:
      "One of the strongest themes to emerge from the simulation is that teacher capacity—not model performance alone—may determine whether AI improves education systems in practice.\n\nDelegations repeatedly noted that even well-designed tools can underperform when educators are asked to deploy them without time, training, or institutional support. In response, several proposals now frame professional development as a first-order policy requirement, not a secondary implementation detail. The discussion increasingly treats teachers as system stewards who must understand when to rely on AI, when to override it, and how to explain its limits to students and families.\n\nThat framing is changing the tone of negotiations. Instead of seeing AI as a substitute for overstretched education systems, participants are positioning it as an instrument that must strengthen human judgment. If that logic holds in the final text, the most durable outcome of these talks may be a governance model in which educator preparedness becomes the benchmark for responsible educational AI adoption.",
    imageUrl:
      "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80&w=1400",
    sourceLabel: "SimuVaction Editorial • Teacher Capacity",
    publishedOffsetMinutes: 120,
  },
] as const;

export function getEditorialNewsAsset(title: string) {
  const normalizedTitle = title.trim();
  return (
    EDITORIAL_NEWS_SEEDS.find((article) =>
      article.lookupTitles.some((candidateTitle) => candidateTitle === normalizedTitle),
    ) ?? null
  );
}
