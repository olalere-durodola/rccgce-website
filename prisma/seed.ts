/**
 * Database seed for RCCG Covenant Embassy.
 *
 * Run with: `npm run seed`  (alias for `tsx prisma/seed.ts`).
 *
 * Idempotent: existing content rows are cleared and re-created, and the demo
 * users are upserted, so the script is safe to run repeatedly against dev.db.
 *
 * Demo credentials (also documented in the README):
 *   ADMIN  — admin@covenantembassy.org / Admin123!
 *   MEMBER — member@example.com        / Member123!
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const connectionString = process.env.DATABASE_URL;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const BCRYPT_ROUNDS = 12;

// Helper: a date `days` from now (negative = past, positive = future).
function daysFromNow(days: number, hour = 10, minute = 0): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, minute, 0, 0);
  return d;
}

async function main() {
  console.log("Seeding RCCG Covenant Embassy database...");

  // ---------------------------------------------------------------------------
  // Clear content (children before parents). Users are upserted, not cleared,
  // so we avoid breaking referential bits like BlogPost.authorId on re-runs.
  // ---------------------------------------------------------------------------
  await prisma.savedSermon.deleteMany();
  await prisma.blogPost.deleteMany();
  await prisma.sermon.deleteMany();
  await prisma.series.deleteMany();
  await prisma.event.deleteMany();
  await prisma.ministry.deleteMany();

  // ---------------------------------------------------------------------------
  // Users
  // ---------------------------------------------------------------------------
  const adminPassword = await bcrypt.hash("Admin123!", BCRYPT_ROUNDS);
  const memberPassword = await bcrypt.hash("Member123!", BCRYPT_ROUNDS);

  const admin = await prisma.user.upsert({
    where: { email: "admin@covenantembassy.org" },
    update: { role: "ADMIN", hashedPassword: adminPassword, name: "Site Administrator" },
    create: {
      email: "admin@covenantembassy.org",
      name: "Site Administrator",
      role: "ADMIN",
      hashedPassword: adminPassword,
    },
  });

  await prisma.user.upsert({
    where: { email: "member@example.com" },
    update: { role: "MEMBER", hashedPassword: memberPassword, name: "Covenant Member" },
    create: {
      email: "member@example.com",
      name: "Covenant Member",
      role: "MEMBER",
      hashedPassword: memberPassword,
    },
  });

  console.log("  - users seeded (1 admin, 1 member)");

  // ---------------------------------------------------------------------------
  // Series + Sermons
  // ---------------------------------------------------------------------------
  const covenantSeries = await prisma.series.create({
    data: {
      title: "The Covenant Life",
      slug: "the-covenant-life",
      description:
        "A study through the promises of God and what it means to live as covenant people, anchored in His unchanging faithfulness.",
      imageUrl:
        "https://images.unsplash.com/photo-1507692049790-de58290a4334?w=1600&q=80",
    },
  });

  const destinySeries = await prisma.series.create({
    data: {
      title: "Walking in Destiny",
      slug: "walking-in-destiny",
      description:
        "Discovering the purpose God has written over your life and learning to walk in it with courage and faith.",
      imageUrl:
        "https://images.unsplash.com/photo-1438232992991-995b7058bbb3?w=1600&q=80",
    },
  });

  // YouTube embed + speaker names are placeholders pending real media/staff.
  const PLACEHOLDER_VIDEO = "https://www.youtube.com/embed/dQw4w9WgXcQ"; // TODO: replace with real sermon videos

  const sermons = [
    {
      title: "Anchored in the Covenant",
      slug: "anchored-in-the-covenant",
      speaker: "Pastor [Name]", // TODO: confirm speaker
      scripture: "Genesis 17:7",
      date: daysFromNow(-7),
      seriesId: covenantSeries.id,
      description:
        "God's covenant is not earned but given. We explore the security and identity that come from belonging to a faithful God.",
      thumbnailUrl:
        "https://images.unsplash.com/photo-1490127252417-7c393f993ee4?w=1200&q=80",
    },
    {
      title: "Promises That Do Not Fail",
      slug: "promises-that-do-not-fail",
      speaker: "Pastor [Name]", // TODO: confirm speaker
      scripture: "2 Corinthians 1:20",
      date: daysFromNow(-14),
      seriesId: covenantSeries.id,
      description:
        "Every promise of God finds its yes in Christ. A message on trusting the One who keeps His word across generations.",
      thumbnailUrl:
        "https://images.unsplash.com/photo-1519491050282-cf00c82424b4?w=1200&q=80",
    },
    {
      title: "A People Set Apart",
      slug: "a-people-set-apart",
      speaker: "Pastor [Name]", // TODO: confirm speaker
      scripture: "1 Peter 2:9",
      date: daysFromNow(-21),
      seriesId: covenantSeries.id,
      description:
        "What does it mean to be a chosen people, a royal priesthood? An invitation to live distinctly for God's glory.",
      thumbnailUrl:
        "https://images.unsplash.com/photo-1438232992991-995b7058bbb3?w=1200&q=80",
    },
    {
      title: "Discovering Your Destiny",
      slug: "discovering-your-destiny",
      speaker: "Pastor [Name]", // TODO: confirm speaker
      scripture: "Jeremiah 29:11",
      date: daysFromNow(-35),
      seriesId: destinySeries.id,
      description:
        "God's plans for you are good. Learn to recognize His direction and step into the future He has prepared.",
      thumbnailUrl:
        "https://images.unsplash.com/photo-1501446529957-6226bd447c46?w=1200&q=80",
    },
    {
      title: "Courage for the Journey",
      slug: "courage-for-the-journey",
      speaker: "Pastor [Name]", // TODO: confirm speaker
      scripture: "Joshua 1:9",
      date: daysFromNow(-49),
      seriesId: destinySeries.id,
      description:
        "Destiny requires courage. A word on facing uncertainty with the assurance that God goes before us.",
      thumbnailUrl:
        "https://images.unsplash.com/photo-1473773508845-188df298d2d1?w=1200&q=80",
    },
    {
      title: "Faithful in the Small Things",
      slug: "faithful-in-the-small-things",
      speaker: "Pastor [Name]", // TODO: confirm speaker
      scripture: "Luke 16:10",
      date: daysFromNow(-63),
      seriesId: destinySeries.id,
      description:
        "Great destinies are built on faithful daily obedience. How God grows us through ordinary faithfulness.",
      thumbnailUrl:
        "https://images.unsplash.com/photo-1529070538774-1843cb3265df?w=1200&q=80",
    },
  ];

  for (const s of sermons) {
    await prisma.sermon.create({
      data: { ...s, videoUrl: PLACEHOLDER_VIDEO },
    });
  }
  console.log("  - 2 series + 6 sermons seeded");

  // ---------------------------------------------------------------------------
  // Events (upcoming relative to now)
  // ---------------------------------------------------------------------------
  await prisma.event.createMany({
    data: [
      {
        title: "Sunday Celebration Service",
        slug: "sunday-celebration-service",
        description:
          "Join us for a Spirit-filled time of worship, the Word, and warm community. All are welcome.",
        startsAt: daysFromNow(3, 9, 0),
        endsAt: daysFromNow(3, 11, 0),
        location: "Main Auditorium, Plano, TX", // TODO: confirm venue
        isFeatured: true,
        imageUrl:
          "https://images.unsplash.com/photo-1438232992991-995b7058bbb3?w=1600&q=80",
      },
      {
        title: "Midweek Bible Study",
        slug: "midweek-bible-study",
        description:
          "A deeper dive into Scripture and prayer. Bring your Bible and a friend as we grow together in the Word.",
        startsAt: daysFromNow(6, 19, 0),
        endsAt: daysFromNow(6, 20, 30),
        location: "Fellowship Hall, Plano, TX", // TODO: confirm venue
        imageUrl:
          "https://images.unsplash.com/photo-1504052434569-70ad5836ab65?w=1600&q=80",
      },
      {
        title: "Covenant Youth Conference",
        slug: "covenant-youth-conference",
        description:
          "A weekend gathering for teens and young adults — worship, workshops, and life-changing encounters with God.",
        startsAt: daysFromNow(24, 18, 0),
        endsAt: daysFromNow(26, 13, 0),
        location: "Main Auditorium, Plano, TX", // TODO: confirm venue
        imageUrl:
          "https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=1600&q=80",
      },
      {
        title: "Community Outreach Day",
        slug: "community-outreach-day",
        description:
          "Serving our Plano neighbors with food, prayer, and practical love. Volunteers of every age are welcome.",
        startsAt: daysFromNow(38, 10, 0),
        endsAt: daysFromNow(38, 14, 0),
        location: "Haggard Park, Plano, TX", // TODO: confirm venue
        imageUrl:
          "https://images.unsplash.com/photo-1593113598332-cd288d649433?w=1600&q=80",
      },
    ],
  });
  console.log("  - 4 events seeded");

  // ---------------------------------------------------------------------------
  // Ministries
  // ---------------------------------------------------------------------------
  await prisma.ministry.createMany({
    data: [
      {
        name: "Children's Church",
        slug: "childrens-church",
        summary:
          "A safe, joyful place where children encounter Jesus through age-appropriate worship, stories, and play.",
        description:
          "Children's Church exists to lay a lasting foundation of faith in the youngest members of our family. Through interactive Bible lessons, music, crafts, and caring mentors, we help children know that they are loved by God and by His church. Our team is screened and trained so that every child is safe, seen, and celebrated every Sunday.",
        leader: "[Children's Pastor Name]", // TODO: confirm leader
        meetingTime: "Sundays during both services", // TODO: confirm
        imageUrl:
          "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=1600&q=80",
      },
      {
        name: "Youth & Teens",
        slug: "youth-and-teens",
        summary:
          "Empowering the next generation to own their faith, build authentic friendships, and discover their calling.",
        description:
          "Our Youth & Teens ministry is a place where students from middle school through high school can ask honest questions, be known, and grow into confident followers of Christ. We gather weekly for worship, relevant teaching, small groups, and plenty of fun. Beyond the meetings, we walk with students through the real pressures of adolescence and help them step into the destiny God has for them.",
        leader: "[Youth Pastor Name]", // TODO: confirm leader
        meetingTime: "Fridays 6:30 PM", // TODO: confirm
        imageUrl:
          "https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=1600&q=80",
      },
      {
        name: "Women of Covenant",
        slug: "women-of-covenant",
        summary:
          "A sisterhood pursuing God together through study, prayer, mentorship, and genuine friendship.",
        description:
          "Women of Covenant brings together women in every season of life to grow in faith and support one another. Through Bible study, prayer gatherings, retreats, and mentorship, we create space for women to be encouraged, equipped, and sent out to make a difference in their homes, workplaces, and city. You belong here.",
        leader: "[Women's Ministry Lead Name]", // TODO: confirm leader
        meetingTime: "Second Saturday monthly, 10:00 AM", // TODO: confirm
        imageUrl:
          "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1600&q=80",
      },
      {
        name: "Men's Fellowship",
        slug: "mens-fellowship",
        summary:
          "Building men of integrity, faith, and purpose who lead well at home, at work, and in the church.",
        description:
          "Men's Fellowship challenges and supports men to grow as disciples, husbands, fathers, and leaders. We meet for honest conversation, biblical teaching, accountability, and service projects. Our heart is to see men strengthened in their walk with God and equipped to be a blessing to those around them.",
        leader: "[Men's Ministry Lead Name]", // TODO: confirm leader
        meetingTime: "First Saturday monthly, 8:00 AM", // TODO: confirm
        imageUrl:
          "https://images.unsplash.com/photo-1529390079861-591de354faf5?w=1600&q=80",
      },
      {
        name: "Worship & Arts",
        slug: "worship-and-arts",
        summary:
          "Leading the church into the presence of God through music, song, and creative expression.",
        description:
          "The Worship & Arts ministry serves the church by cultivating an atmosphere where people can encounter God. Vocalists, musicians, sound and media technicians, and creatives use their gifts each week to point hearts to Jesus. If you have a passion for worship and a desire to serve, there is a place for you on the team.",
        leader: "[Worship Director Name]", // TODO: confirm leader
        meetingTime: "Rehearsals Thursdays 7:00 PM", // TODO: confirm
        imageUrl:
          "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=1600&q=80",
      },
      {
        name: "Outreach & Missions",
        slug: "outreach-and-missions",
        summary:
          "Carrying the love of Christ beyond our walls to Plano, our nation, and the nations.",
        description:
          "Outreach & Missions mobilizes our congregation to serve the practical and spiritual needs of our community and the world. From local benevolence and outreach events to supporting global missionaries, we believe the church exists for the sake of those not yet in it. Come help us be good news to our neighbors.",
        leader: "[Missions Coordinator Name]", // TODO: confirm leader
        meetingTime: "Monthly planning, third Sunday after service", // TODO: confirm
        imageUrl:
          "https://images.unsplash.com/photo-1593113598332-cd288d649433?w=1600&q=80",
      },
    ],
  });
  console.log("  - 6 ministries seeded");

  // ---------------------------------------------------------------------------
  // Blog posts (authored by admin)
  // ---------------------------------------------------------------------------
  const blogPosts = [
    {
      title: "Why Covenant Matters More Than You Think",
      slug: "why-covenant-matters",
      excerpt:
        "At the heart of our church name is a word that shapes everything we believe about God's relationship with us.",
      coverImage:
        "https://images.unsplash.com/photo-1507692049790-de58290a4334?w=1600&q=80",
      publishedAt: daysFromNow(-10),
      body: `## A Promise That Holds

Covenant is not a transaction; it is a relationship sealed by promise. When God said to Abraham, "I will establish my covenant... to be God to you and to your offspring after you" (Genesis 17:7), He bound Himself to a people forever.

Living as covenant people means we do not approach God anxiously, wondering if we have done enough. We come confidently, because the covenant rests on His faithfulness, not ours.

## What This Means for You

- You are secure in a love that does not depend on your performance.
- You belong to a family that spans generations and nations.
- You are invited to live as someone God has chosen and set apart.

This is the foundation of everything we do at Covenant Embassy.`,
    },
    {
      title: "Five Ways to Grow in Prayer This Season",
      slug: "five-ways-to-grow-in-prayer",
      excerpt:
        "Practical, sustainable habits to deepen your conversation with God — wherever you are starting from.",
      coverImage:
        "https://images.unsplash.com/photo-1490127252417-7c393f993ee4?w=1600&q=80",
      publishedAt: daysFromNow(-24),
      body: `Prayer can feel intimidating, but it is simply talking with a Father who loves you. Here are five gentle ways to grow.

1. **Start small and consistent.** Five honest minutes daily beats an hour once a month.
2. **Pray the Scriptures.** Let a Psalm give you words when you have none.
3. **Keep a list.** Writing your requests helps you notice God's answers.
4. **Pray with others.** Our midweek gatherings are a great place to begin.
5. **Listen.** Leave space in silence to hear what God might be saying.

Whatever your starting point, God delights to meet you there.`,
    },
    {
      title: "Serving Plano: A Year of Loving Our City",
      slug: "serving-plano-a-year-of-loving-our-city",
      excerpt:
        "A look back at how our church family stepped into the community — and an invitation to join what comes next.",
      coverImage:
        "https://images.unsplash.com/photo-1593113598332-cd288d649433?w=1600&q=80",
      publishedAt: daysFromNow(-40),
      body: `## The Church Beyond the Walls

This year our Outreach & Missions teams served thousands of meals, partnered with local schools, and prayed with neighbors across Plano. We believe the gospel is best heard when it is also seen.

## Why We Do It

Jesus did not wait for people to come to Him; He went to them. As His church, we are called to be good news in practical, tangible ways.

## Join Us

Our next Community Outreach Day is coming soon. Whatever your gifts, there is a place for you to serve. Come be part of how God is loving our city.`,
    },
  ];

  for (const post of blogPosts) {
    await prisma.blogPost.create({
      data: { ...post, authorId: admin.id },
    });
  }
  console.log("  - 3 blog posts seeded");

  console.log("Seed complete.");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
