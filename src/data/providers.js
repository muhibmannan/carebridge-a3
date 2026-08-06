
export const PROVIDERS = [
  {
    id: "sarah-mitchell",
    name: "Sarah Mitchell",
    service: "Physiotherapy",
    location: "Melbourne Rehab Centre",
    durationMin: 60,
  },
  {
    id: "priya-nair",
    name: "Priya Nair",
    service: "Occupational Therapy",
    location: "Enable Collective — Fitzroy",
    durationMin: 60,
  },
  {
    id: "omar-khalil",
    name: "Omar Khalil",
    service: "Speech Therapy",
    location: "Enable Collective — Carlton",
    durationMin: 45,
  },
  {
    id: "tom-walsh",
    name: "Tom Walsh",
    service: "NDIS Planning Meeting",
    location: "Enable Collective — Head Office",
    durationMin: 45,
  },
  {
    id: "amara-osei",
    name: "Amara Osei",
    service: "Support Coordination Review",
    location: "Enable Collective — Head Office",
    durationMin: 30,
  },
  {
    id: "grace-kim",
    name: "Grace Kim",
    service: "Assistive Technology Assessment",
    location: "Enable Collective — Fitzroy",
    durationMin: 60,
  },
];

export function providerById(id) {
  return PROVIDERS.find((p) => p.id === id) || null;
}