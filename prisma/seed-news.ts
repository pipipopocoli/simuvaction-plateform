import { PrismaClient } from "@prisma/client";

export async function seedNews(prisma: PrismaClient, eventId: string) {
  // Find a journalist user to attach authors to
  const journalist = await prisma.user.findFirst({
    where: { role: "journalist", eventId }
  });

  if (!journalist) return;

  const mockNews = [
    {
      title: "UN Secretary General Urges Caution on GenAI in Primary Schools",
      body: "In a sweeping address this morning, the Secretary General emphasized the need for a balanced approach when introducing Generative AI tools in early childhood education. 'We must harness AI to close the educational divide, not widen it with untested algorithms,' the statement read. The resolution under discussion is expected to introduce strict oversight mechanisms.",
      imageUrl: "https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&q=80&w=1200",
      source: "UN General Assembly Press Office",
      status: "published",
      authorId: journalist.id,
      eventId,
      publishedAt: new Date(),
    },
    {
      title: "European Union Bloc Proposes 'AI Sandbox' Framework",
      body: "European delegates have circulated a draft proposal suggesting the creation of 'AI Sandboxes'—controlled testing environments for educational tech. This framework aims to evaluate the cognitive impact of AI tutors on students before mass deployment. The proposal faces pushback from tech-heavy delegations arguing it will stifle innovation.",
      imageUrl: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=1200",
      source: "EU Delegation Internal Memo",
      status: "published",
      authorId: journalist.id,
      eventId,
      publishedAt: new Date(Date.now() - 3600000), // 1 hour ago
    },
    {
      title: "Private Sector Coalition Pledges Open-Source Models for Developing Nations",
      body: "A coalition of leading tech firms has pledged to provide open-source, localized AI models designed specifically for under-resourced schools. This move is seen as a direct counter-offer to recent taxation proposals aimed at funding global tech infrastructure. Negotiations are ongoing in closed-door sessions.",
      imageUrl: null,
      source: "Tech Industry Press Release",
      status: "published",
      authorId: journalist.id,
      eventId,
      publishedAt: new Date(Date.now() - 7200000), // 2 hours ago
    }
  ];

  for (const news of mockNews) {
    await prisma.newsPost.create({ data: news });
  }

  console.log("Seeded mock news articles.");
}
