import type { Metadata } from "next";
import Image from "next/image";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { Arch } from "@/components/ui/arch";
import { Button } from "@/components/ui/button";
import { ScriptureEyebrow } from "@/components/ui/scripture-eyebrow";
import { BeliefsAccordion, type Belief } from "./beliefs-accordion";

export const metadata: Metadata = {
  title: "About",
  description:
    "Discover the vision, story, and beliefs of RCCG Covenant Embassy — a house of covenant and destiny in Plano, Texas.",
};

const BELIEFS: Belief[] = [
  {
    heading: "The Bible",
    body: "We believe the Bible is the inspired, infallible Word of God and our final authority for faith and life.",
  },
  {
    heading: "One God in Three Persons",
    body: "We believe in one God, eternally existing in three persons: Father, Son, and Holy Spirit.",
  },
  {
    heading: "Jesus Christ",
    body: "We believe Jesus Christ is the Son of God who lived a sinless life, died for our sins, rose bodily, and is coming again.",
  },
  {
    heading: "Salvation by Grace",
    body: "We believe salvation is a gift of God received through faith in Jesus Christ alone, not earned by works.",
  },
  {
    heading: "The Holy Spirit",
    body: "We believe the Holy Spirit indwells, empowers, and gifts believers to live holy lives and serve the church and world.",
  },
  {
    heading: "The Church & The Great Commission",
    body: "We believe the church is the body of Christ, called to make disciples of all nations through the proclamation of the gospel.",
  },
];

const LEADERS = [
  {
    name: "Pastor [Full Name]", // TODO: confirm real leader
    role: "Lead Pastor",
    bio: "Leads the vision of Covenant Embassy with a heart for sound teaching, worship, and seeing destinies fulfilled.",
    image:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80",
  },
  {
    name: "Pastor [Full Name]", // TODO: confirm real leader
    role: "Associate Pastor",
    bio: "Shepherds pastoral care and discipleship, walking closely with members through every season of life.",
    image:
      "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=800&q=80",
  },
  {
    name: "[Full Name]", // TODO: confirm real leader
    role: "Worship Director",
    bio: "Cultivates an atmosphere of worship and leads our musicians and creatives to point hearts to Jesus.",
    image:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800&q=80",
  },
  {
    name: "[Full Name]", // TODO: confirm real leader
    role: "Children & Family Pastor",
    bio: "Champions the next generation, building a safe and joyful place where children come to know Jesus.",
    image:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&q=80",
  },
];

export default function AboutPage() {
  return (
    <>
      {/* Hero / vision & mission */}
      <section className="bg-navy text-cream">
        <Container className="max-w-3xl py-16 text-center sm:py-24">
          <ScriptureEyebrow
            reference="Habakkuk 2:2"
            label="Our Vision"
            className="justify-center"
          />
          <h1 className="mt-5 font-display text-4xl font-bold leading-tight sm:text-5xl">
            A House of Covenant &amp; Destiny
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-cream/80">
            Our vision is to be a thriving, Spirit-filled community where people
            encounter the living God, are rooted in His Word, and are released
            into the destiny He has prepared for them.
          </p>
          <p className="mt-4 leading-relaxed text-cream/70">
            Our mission is simple: to love God, love people, and make disciples
            who transform their families, our city of Plano, and the nations.
          </p>
        </Container>
      </section>

      {/* Our Story */}
      <Section tone="cream">
        <Container className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="mx-auto w-full max-w-sm">
            {/* TODO: replace with real church photography */}
            <Arch className="aspect-[4/5] w-full shadow-xl shadow-navy/10">
              <Image
                src="https://images.unsplash.com/photo-1529070538774-1843cb3265df?w=1000&q=80"
                alt="A gathering of the church family"
                width={800}
                height={1000}
                className="h-full w-full object-cover"
              />
            </Arch>
          </div>
          <div>
            <ScriptureEyebrow
              reference="1 Samuel 7:12"
              label="Our Story"
              className="text-gold-deep"
            />
            <h2 className="mt-5 font-display text-3xl font-bold text-navy sm:text-4xl">
              Built on Faithfulness
            </h2>
            <div className="mt-6 space-y-4 leading-relaxed text-ink/85">
              <p>
                {/* TODO: confirm founding details */}
                RCCG Covenant Embassy began as a small gathering of believers
                with a big conviction: that God is faithful to His covenant and
                that He had called us to plant a house of His presence in Plano,
                Texas.
              </p>
              <p>
                As part of the Redeemed Christian Church of God, a global family
                of churches, we have grown into a vibrant, multi-generational
                community united by worship, the Word, and a love for our city.
                Through every season, we have seen the Lord prove Himself
                faithful again and again.
              </p>
              <p>
                Today we continue that journey, believing the best is yet to
                come as we make room for more people to encounter Jesus and step
                into their destiny.
              </p>
            </div>
          </div>
        </Container>
      </Section>

      {/* Statement of Beliefs */}
      <Section tone="cream" className="pt-0">
        <Container className="max-w-3xl">
          <div className="text-center">
            <ScriptureEyebrow
              reference="Jude 1:3"
              label="What We Believe"
              className="justify-center text-gold-deep"
            />
            <h2 className="mt-5 font-display text-3xl font-bold text-navy sm:text-4xl">
              Statement of Beliefs
            </h2>
            <p className="mt-4 text-ink/80">
              The core convictions that shape who we are and how we live.
            </p>
          </div>
          <div className="mt-10">
            <BeliefsAccordion beliefs={BELIEFS} />
          </div>
        </Container>
      </Section>

      {/* Leadership */}
      <Section tone="navy">
        <Container>
          <div className="text-center">
            <ScriptureEyebrow
              reference="Hebrews 13:7"
              label="Our Leadership"
              className="justify-center"
            />
            <h2 className="mt-5 font-display text-3xl font-bold text-cream sm:text-4xl">
              Meet the Team
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-cream/75">
              {/* TODO: confirm real leaders, names, roles, and bios */}
              Our pastors and leaders are devoted to shepherding this church
              family with humility, wisdom, and care.
            </p>
          </div>

          <ul className="mt-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {LEADERS.map((leader) => (
              <li key={leader.role} className="text-center">
                {/* TODO: replace with real church photography */}
                <Arch className="mx-auto aspect-[3/4] w-full max-w-[14rem]">
                  <Image
                    src={leader.image}
                    alt={`${leader.name}, ${leader.role}`}
                    width={400}
                    height={533}
                    className="h-full w-full object-cover"
                  />
                </Arch>
                <h3 className="mt-5 font-display text-xl font-bold text-cream">
                  {leader.name}
                </h3>
                <p className="font-mono text-xs uppercase tracking-[0.18em] text-gold">
                  {leader.role}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-cream/75">
                  {leader.bio}
                </p>
              </li>
            ))}
          </ul>

          <div className="mt-14 text-center">
            <Button href="/visit" variant="gold" size="lg">
              Plan Your Visit
            </Button>
          </div>
        </Container>
      </Section>
    </>
  );
}
