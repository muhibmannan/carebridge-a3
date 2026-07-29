import { readFileSync } from "node:fs";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";

const serviceAccount = JSON.parse(
  readFileSync(new URL("./serviceAccountKey.json", import.meta.url)),
);

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

const resources = [
  {
    id: "ndis-planning-workbook-2024",
    title: "NDIS Planning Workbook 2024",
    category: "NDIS Guides",
    type: "PDF",
    description:
      "Comprehensive guide to creating and managing your NDIS support plan with step-by-step worksheets.",
    url: "https://www.ndis.gov.au/participants/using-your-plan",
    views: 1240,
    ratingAvg: 4.9,
    ratingCount: 64,
    featured: true,
  },
  {
    id: "assistive-technology-funding-guide",
    title: "Assistive Technology Funding Guide",
    category: "Equipment",
    type: "Guide",
    description:
      "Everything you need to know about funding assistive technology through your NDIS plan.",
    url: "https://www.ndis.gov.au/participants/assistive-technology/assistive-technology-and-advisors/guide-assistive-technology",
    views: 892,
    ratingAvg: 4.7,
    ratingCount: 41,
    featured: true,
  },
  {
    id: "disability-employment-services-explained",
    title: "Disability Employment Services Explained",
    category: "Employment",
    type: "Article",
    description:
      "Navigate the DES system to find meaningful employment with the right support behind you.",
    url: "https://www.dss.gov.au/disability-and-carers",
    views: 654,
    ratingAvg: 4.5,
    ratingCount: 28,
    featured: false,
  },
  {
    id: "mental-health-support-directory",
    title: "Mental Health Support Directory",
    category: "Health & Wellbeing",
    type: "Directory",
    description:
      "State-by-state directory of mental health services available to NDIS participants.",
    url: "https://www.medicarementalhealth.gov.au/",
    views: 1089,
    ratingAvg: 4.8,
    ratingCount: 52,
    featured: false,
  },
  {
    id: "accessible-housing-options-guide",
    title: "Accessible Housing Options Guide",
    category: "Housing",
    type: "Guide",
    description:
      "Understanding SDA, SIL, and other NDIS housing options for people with disabilities.",
    url: "https://www.ndis.gov.au/participants/home-and-living",
    views: 445,
    ratingAvg: 4.3,
    ratingCount: 19,
    featured: false,
  },
  {
    id: "transport-assistance-programs",
    title: "Transport Assistance Programs",
    category: "Transport",
    type: "Guide",
    description:
      "State-based transport subsidies and NDIS transport support options explained clearly.",
    url: "https://www.ndis.gov.au/participants/using-your-funding/different-budget-types/what-are-recurring-supports",
    views: 378,
    ratingAvg: 4.4,
    ratingCount: 22,
    featured: false,
  },
  {
    id: "understanding-your-rights-under-the-ndis",
    title: "Understanding Your Rights Under the NDIS",
    category: "Legal",
    type: "Guide",
    description:
      "A plain-language explainer of participant rights, complaints processes and appeals.",
    url: "https://www.ndiscommission.gov.au/participants/making-complaint",
    views: 301,
    ratingAvg: 4.6,
    ratingCount: 17,
    featured: false,
  },
  {
    id: "guardianship-and-decision-making-support",
    title: "Guardianship and Decision-Making Support",
    category: "Legal",
    type: "Article",
    description:
      "Overview of supported decision-making and guardianship arrangements across states.",
    url: "https://www.publicadvocate.vic.gov.au/",
    views: 210,
    ratingAvg: 4.2,
    ratingCount: 9,
    featured: false,
  },
  {
    id: "choosing-the-right-wheelchair",
    title: "Choosing the Right Wheelchair",
    category: "Equipment",
    type: "Article",
    description:
      "Key factors to weigh up — manual vs power, fit, and funding pathways.",
    url: "https://www.disabilitygateway.gov.au/aids-equipment",
    views: 530,
    ratingAvg: 4.1,
    ratingCount: 14,
    featured: false,
  },
  {
    id: "telehealth-for-allied-health-services",
    title: "Telehealth for Allied Health Services",
    category: "Health & Wellbeing",
    type: "Article",
    description:
      "How to access physiotherapy, OT and speech therapy remotely under your plan.",
    url: "https://www.health.gov.au/topics/health-technologies-and-digital-health/about/telehealth",
    views: 412,
    ratingAvg: 4.5,
    ratingCount: 20,
    featured: false,
  },
  {
    id: "ndis-support-coordination-explained",
    title: "NDIS Support Coordination Explained",
    category: "NDIS Guides",
    type: "Guide",
    description:
      "What a support coordinator does and how to get the most out of that funding line.",
    url: "https://www.ndis.gov.au/participants/using-your-plan/who-can-help-start-your-plan/support-coordination",
    views: 760,
    ratingAvg: 4.7,
    ratingCount: 33,
    featured: false,
  },
  {
    id: "job-interview-preparation-for-people-with-disability",
    title: "Job Interview Preparation for People with Disability",
    category: "Employment",
    type: "Guide",
    description:
      "Practical tips for disclosure, workplace adjustments, and interview confidence.",
    url: "https://www.jobaccess.gov.au/",
    views: 288,
    ratingAvg: 4.0,
    ratingCount: 11,
    featured: false,
  },
];

async function seed() {
  const batch = db.batch();
  const now = Timestamp.now();

  for (const { id, ...data } of resources) {
    batch.set(db.collection("resources").doc(id), { ...data, createdAt: now });
  }

  await batch.commit();
  console.log(`Seeded ${resources.length} resources.`);
}

seed().then(() => process.exit(0));
