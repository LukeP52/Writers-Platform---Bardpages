import { db, categories, tags } from "./index";

async function seedDatabase() {
  console.log("Seeding database...");

  // Seed Event Type Categories
  const eventTypes = [
    { name: "Battles & Wars", slug: "battles-wars", type: "event_type", color: "#dc2626", description: "Military conflicts and warfare" },
    { name: "Births & Deaths", slug: "births-deaths", type: "event_type", color: "#059669", description: "Notable births and deaths" },
    { name: "Coronations & Politics", slug: "coronations-politics", type: "event_type", color: "#7c3aed", description: "Political events and royal ceremonies" },
    { name: "Scientific Discoveries", slug: "scientific-discoveries", type: "event_type", color: "#2563eb", description: "Scientific breakthroughs and discoveries" },
    { name: "Cultural & Religious", slug: "cultural-religious", type: "event_type", color: "#d97706", description: "Cultural and religious events" },
    { name: "Natural Disasters", slug: "natural-disasters", type: "event_type", color: "#b91c1c", description: "Natural catastrophes and disasters" },
    { name: "Inventions & Innovations", slug: "inventions-innovations", type: "event_type", color: "#0891b2", description: "Technological innovations and inventions" },
    { name: "Explorations & Discoveries", slug: "explorations-discoveries", type: "event_type", color: "#65a30d", description: "Geographic explorations and discoveries" },
  ] as const;

  // Seed Historical Eras
  const eras = [
    { name: "Ancient", slug: "ancient", type: "era", color: "#92400e", description: "Before 500 CE" },
    { name: "Medieval", slug: "medieval", type: "era", color: "#7c2d12", description: "500-1500 CE" },
    { name: "Renaissance", slug: "renaissance", type: "era", color: "#a16207", description: "1400-1600" },
    { name: "Early Modern", slug: "early-modern", type: "era", color: "#059669", description: "1500-1800" },
    { name: "Modern", slug: "modern", type: "era", color: "#2563eb", description: "1800-1945" },
    { name: "Contemporary", slug: "contemporary", type: "era", color: "#7c3aed", description: "1945-Present" },
  ] as const;

  // Seed Regions
  const regions = [
    { name: "Europe", slug: "europe", type: "region", color: "#dc2626", description: "European continent" },
    { name: "Asia", slug: "asia", type: "region", color: "#d97706", description: "Asian continent" },
    { name: "Africa", slug: "africa", type: "region", color: "#65a30d", description: "African continent" },
    { name: "North America", slug: "north-america", type: "region", color: "#2563eb", description: "North American continent" },
    { name: "South America", slug: "south-america", type: "region", color: "#0891b2", description: "South American continent" },
    { name: "Oceania", slug: "oceania", type: "region", color: "#7c3aed", description: "Oceania and Pacific islands" },
    { name: "Global", slug: "global", type: "region", color: "#374151", description: "Events affecting multiple regions" },
  ] as const;

  // Insert categories
  await db.insert(categories).values([...eventTypes, ...eras, ...regions]);

  // Seed some common tags
  const commonTags = [
    { name: "Biography", slug: "biography", description: "Biographical content" },
    { name: "War", slug: "war", description: "War-related events" },
    { name: "Science", slug: "science", description: "Scientific events" },
    { name: "Art", slug: "art", description: "Artistic events" },
    { name: "Literature", slug: "literature", description: "Literary events" },
    { name: "Music", slug: "music", description: "Musical events" },
    { name: "Religion", slug: "religion", description: "Religious events" },
    { name: "Technology", slug: "technology", description: "Technological events" },
    { name: "Sports", slug: "sports", description: "Sporting events" },
    { name: "Economics", slug: "economics", description: "Economic events" },
  ];

  await db.insert(tags).values(commonTags);

  console.log("Database seeded successfully!");
}

if (require.main === module) {
  seedDatabase().catch(console.error);
}

export { seedDatabase };