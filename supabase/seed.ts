/**
 * Seeds the Organizza Supabase project with the same demo data the design
 * mockups used, so the app looks alive right after setup.
 *
 * Requires .env.local with NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
 * and SUPABASE_SERVICE_ROLE_KEY. Run once with `npm run seed`.
 *
 * Auth users can't be created with plain SQL, so this script uses the
 * Supabase admin API to create one auth user per roster member (which
 * triggers the handle_new_user() DB trigger to create their profile row),
 * then inserts events/tasks/shifts/etc. referencing those profile ids.
 * Everyone gets the password "organizza-demo" — change it after first login.
 */
import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const DEMO_PASSWORD = "organizza-demo";

type RosterSeed = {
  key: string;
  name: string;
  email: string;
  role: "admin" | "employee";
  phone: string;
  color: string;
  jobTitle: string;
  department: string;
  skills: string[];
  availability: "Disponível" | "Ocupado" | "Ausente";
  hr: {
    dob: string;
    address: string;
    personalPhone: string;
    personalEmail: string;
    emergencyName: string;
    emergencyPhone: string;
    contractType: "Permanente" | "Freelancer";
    weeklyHours: number;
    rate: number;
    rateUnit: string;
    iban: string;
    taxId: string;
    bankName: string;
    status: "Ativo" | "Inativo";
    startDate: string;
  };
};

const ROSTER: RosterSeed[] = [
  { key: "ac", name: "Ana Costa", email: "ana.costa@organizza.pt", role: "admin", phone: "+351 917 220 331", color: "#8A9A7B",
    jobTitle: "Gestora de Eventos", department: "Produção", skills: ["Coordenação", "Relação com Clientes", "Orçamentação"], availability: "Disponível",
    hr: { dob: "1990-03-14", address: "Rua das Flores 22, 1200-192 Lisboa", personalPhone: "+351 917 220 331", personalEmail: "ana.costa.pessoal@gmail.com", emergencyName: "Rui Costa (marido)", emergencyPhone: "+351 917 220 990", contractType: "Permanente", weeklyHours: 40, rate: 1850, rateUnit: "mês", iban: "PT50 0000 0000 0000 0000 4471", taxId: "123 456 471", bankName: "Novo Banco", status: "Ativo", startDate: "2022-01-02" } },
  { key: "mf", name: "Miguel Ferreira", email: "miguel.ferreira@organizza.pt", role: "employee", phone: "+351 918 442 210", color: "#C4703F",
    jobTitle: "Coordenador de Produção", department: "Produção", skills: ["Montagem", "Logística", "Gestão de Equipas"], availability: "Ocupado",
    hr: { dob: "1988-11-02", address: "Av. da República 88, 2700-123 Amadora", personalPhone: "+351 918 442 210", personalEmail: "miguel.ferreira88@gmail.com", emergencyName: "Sara Ferreira (irmã)", emergencyPhone: "+351 918 442 555", contractType: "Permanente", weeklyHours: 40, rate: 1700, rateUnit: "mês", iban: "PT50 0000 0000 0000 0000 2290", taxId: "198 220 331", bankName: "Caixa Geral de Depósitos", status: "Ativo", startDate: "2021-05-10" } },
  { key: "rp", name: "Rita Pereira", email: "rita.pereira@organizza.pt", role: "employee", phone: "+351 916 552 774", color: "#B8A88A",
    jobTitle: "Decoration Designer", department: "Decoração", skills: ["Florals", "Styling", "Set Design"], availability: "Disponível",
    hr: { dob: "1993-06-25", address: "Rua do Alecrim 14, 1200-018 Lisboa", personalPhone: "+351 916 552 774", personalEmail: "rita.pereira93@gmail.com", emergencyName: "Helena Pereira (mãe)", emergencyPhone: "+351 916 552 001", contractType: "Permanente", weeklyHours: 40, rate: 1550, rateUnit: "mês", iban: "PT50 0000 0000 0000 0000 7702", taxId: "211 330 774", bankName: "Millennium BCP", status: "Ativo", startDate: "2022-09-18" } },
  { key: "ir", name: "Inês Rodrigues", email: "ines.rodrigues@organizza.pt", role: "employee", phone: "+351 915 776 220", color: "#C4703F",
    jobTitle: "Designer Floral", department: "Decoração", skills: ["Arranjos Florais", "Composição", "Sazonalidade"], availability: "Disponível",
    hr: { dob: "1991-09-19", address: "Rua Nova da Trindade 5, 1200-303 Lisboa", personalPhone: "+351 915 776 220", personalEmail: "ines.floral@gmail.com", emergencyName: "Paulo Rodrigues (pai)", emergencyPhone: "+351 915 776 004", contractType: "Freelancer", weeklyHours: 20, rate: 180, rateUnit: "dia", iban: "PT50 0000 0000 0000 0000 5561", taxId: "234 771 220", bankName: "Banco BPI", status: "Ativo", startDate: "2024-02-05" } },
  { key: "ta", name: "Tiago Alves", email: "tiago.alves@organizza.pt", role: "employee", phone: "+351 913 440 887", color: "#8A9A7B",
    jobTitle: "Técnico de Iluminação", department: "Logística", skills: ["Iluminação", "Som", "Efeitos"], availability: "Ocupado",
    hr: { dob: "1995-01-30", address: "Rua da Boavista 61, 4050-113 Porto", personalPhone: "+351 913 440 887", personalEmail: "tiago.luz.alves@gmail.com", emergencyName: "Marta Alves (esposa)", emergencyPhone: "+351 913 440 112", contractType: "Freelancer", weeklyHours: 25, rate: 160, rateUnit: "dia", iban: "PT50 0000 0000 0000 0000 8834", taxId: "256 662 887", bankName: "Santander Totta", status: "Ativo", startDate: "2023-06-12" } },
  { key: "pn", name: "Pedro Nunes", email: "pedro.nunes@organizza.pt", role: "employee", phone: "+351 912 330 664", color: "#6B655D",
    jobTitle: "Logística", department: "Logística", skills: ["Transporte", "Fornecedores", "Carga"], availability: "Disponível",
    hr: { dob: "1985-12-08", address: "Rua de São Bento 200, 1200-822 Lisboa", personalPhone: "+351 912 330 664", personalEmail: "pedro.nunes85@gmail.com", emergencyName: "Cláudia Nunes (esposa)", emergencyPhone: "+351 912 330 009", contractType: "Permanente", weeklyHours: 40, rate: 1450, rateUnit: "mês", iban: "PT50 0000 0000 0000 0000 3390", taxId: "178 990 664", bankName: "Novo Banco", status: "Ativo", startDate: "2020-01-20" } },
  { key: "bs", name: "Beatriz Santos", email: "beatriz.santos@organizza.pt", role: "employee", phone: "+351 919 002 771", color: "#B8A88A",
    jobTitle: "Assistente de Decoração", department: "Decoração", skills: ["Styling", "Montagem"], availability: "Ausente",
    hr: { dob: "1998-04-22", address: "Rua do Ouro 30, 1100-063 Lisboa", personalPhone: "+351 919 002 771", personalEmail: "beatriz.santos98@gmail.com", emergencyName: "Luís Santos (pai)", emergencyPhone: "+351 919 002 001", contractType: "Freelancer", weeklyHours: 0, rate: 130, rateUnit: "dia", iban: "PT50 0000 0000 0000 0000 9012", taxId: "245 001 771", bankName: "Millennium BCP", status: "Inativo", startDate: "2024-03-14" } },
  { key: "jr", name: "João Ribeiro", email: "joao.ribeiro@organizza.pt", role: "employee", phone: "+351 911 774 220", color: "#6B655D",
    jobTitle: "Logística", department: "Logística", skills: ["Transporte", "Coordenação de Fornecedores"], availability: "Disponível",
    hr: { dob: "1987-07-17", address: "Rua Actor Vale 12, 1900-025 Lisboa", personalPhone: "+351 911 774 220", personalEmail: "joao.ribeiro87@gmail.com", emergencyName: "Teresa Ribeiro (mãe)", emergencyPhone: "+351 911 774 003", contractType: "Permanente", weeklyHours: 40, rate: 1400, rateUnit: "mês", iban: "PT50 0000 0000 0000 0000 1156", taxId: "190 442 220", bankName: "Caixa Geral de Depósitos", status: "Ativo", startDate: "2021-11-03" } },
  { key: "sm", name: "Sofia Martins", email: "sofia.martins@organizza.pt", role: "employee", phone: "+351 912 345 010", color: "#8A9A7B",
    jobTitle: "Designer Gráfico", department: "Design", skills: ["Identidade Visual", "Convites", "Sinalética"], availability: "Disponível",
    hr: { dob: "1994-02-11", address: "Rua Augusta 100, 1100-053 Lisboa", personalPhone: "+351 912 345 010", personalEmail: "sofia.martins@gmail.com", emergencyName: "—", emergencyPhone: "—", contractType: "Permanente", weeklyHours: 35, rate: 1350, rateUnit: "mês", iban: "PT50 0000 0000 0000 0000 6621", taxId: "220 010 010", bankName: "ActivoBank", status: "Ativo", startDate: "2023-01-09" } },
  { key: "cg", name: "Catarina Gomes", email: "catarina.gomes@organizza.pt", role: "employee", phone: "+351 912 345 011", color: "#B8A88A",
    jobTitle: "Designer Gráfico", department: "Design", skills: ["Apresentações", "Digital"], availability: "Ausente",
    hr: { dob: "1996-08-03", address: "Rua do Carmo 40, 1200-092 Lisboa", personalPhone: "+351 912 345 011", personalEmail: "catarina.gomes@gmail.com", emergencyName: "—", emergencyPhone: "—", contractType: "Freelancer", weeklyHours: 15, rate: 140, rateUnit: "dia", iban: "PT50 0000 0000 0000 0000 7734", taxId: "231 011 011", bankName: "Banco BPI", status: "Ativo", startDate: "2024-05-01" } },
  { key: "at", name: "Ana Teixeira", email: "ana.teixeira@organizza.pt", role: "employee", phone: "+351 912 345 012", color: "#C4703F",
    jobTitle: "Freelancer", department: "Freelancers", skills: ["Apoio no Local", "Hospedagem"], availability: "Disponível",
    hr: { dob: "1997-10-27", address: "Rua de Santa Catarina 5, 4000-447 Porto", personalPhone: "+351 912 345 012", personalEmail: "ana.teixeira@gmail.com", emergencyName: "—", emergencyPhone: "—", contractType: "Freelancer", weeklyHours: 10, rate: 110, rateUnit: "dia", iban: "PT50 0000 0000 0000 0000 8845", taxId: "242 012 012", bankName: "Santander Totta", status: "Ativo", startDate: "2024-06-20" } },
  { key: "bn", name: "Bruno Nogueira", email: "bruno.nogueira@organizza.pt", role: "employee", phone: "+351 912 345 013", color: "#6B655D",
    jobTitle: "Freelancer", department: "Freelancers", skills: ["Apoio no Local", "Segurança"], availability: "Disponível",
    hr: { dob: "1992-05-15", address: "Rua Direita 8, 4700-000 Braga", personalPhone: "+351 912 345 013", personalEmail: "bruno.nogueira@gmail.com", emergencyName: "—", emergencyPhone: "—", contractType: "Freelancer", weeklyHours: 10, rate: 115, rateUnit: "dia", iban: "PT50 0000 0000 0000 0000 9956", taxId: "253 013 013", bankName: "Millennium BCP", status: "Ativo", startDate: "2024-07-01" } },
];

async function main() {
  console.log("Creating auth users + profiles…");
  const idByKey = new Map<string, string>();

  for (const person of ROSTER) {
    const { data: existing } = await supabase.auth.admin.listUsers();
    const already = existing.users.find((u) => u.email === person.email);
    let userId: string;

    if (already) {
      userId = already.id;
      console.log(`  ↺ ${person.email} already exists`);
    } else {
      const { data, error } = await supabase.auth.admin.createUser({
        email: person.email,
        password: DEMO_PASSWORD,
        email_confirm: true,
        user_metadata: { full_name: person.name },
      });
      if (error || !data.user) throw error ?? new Error("createUser failed");
      userId = data.user.id;
      console.log(`  ✓ ${person.email}`);
    }
    idByKey.set(person.key, userId);

    // trigger sets role='employee' by default (or 'admin' if first ever user) — force the intended role/profile fields
    await supabase.from("profiles").update({
      full_name: person.name,
      role: person.role,
      phone: person.phone,
      avatar_color: person.color,
      job_title: person.jobTitle,
      department: person.department,
      skills: person.skills,
      availability: person.availability,
    }).eq("id", userId);

    await supabase.from("people_hr").upsert({
      profile_id: userId,
      dob: person.hr.dob,
      address: person.hr.address,
      personal_phone: person.hr.personalPhone,
      personal_email: person.hr.personalEmail,
      emergency_name: person.hr.emergencyName,
      emergency_phone: person.hr.emergencyPhone,
      contract_type: person.hr.contractType,
      weekly_hours: person.hr.weeklyHours,
      rate: person.hr.rate,
      rate_unit: person.hr.rateUnit,
      iban: person.hr.iban,
      tax_id: person.hr.taxId,
      bank_name: person.hr.bankName,
      status: person.hr.status,
      start_date: person.hr.startDate,
    });
  }

  console.log("Creating events…");
  const EVENTS = [
    { name: "Sofia & Pedro", type: "Casamento", client: "Sofia Martins", date: "2026-08-14", venue: "Quinta da Torre", guests: 180, lead: "mf", status: "Produção", services: ["Produção", "Decoração", "Iluminação"], team: ["mf", "rp", "ta"] },
    { name: "Galp — Conferência de Liderança", type: "Corporativo", client: "Galp Energia", date: "2026-08-19", venue: "Palácio de Seteais", guests: 120, lead: "ac", status: "Planeamento", services: ["Produção", "Catering", "Design Gráfico"], team: ["ac", "cg"] },
    { name: "Beatriz & Rui", type: "Casamento", client: "Beatriz Santos", date: "2026-08-29", venue: "Quinta de Sintra", guests: 140, lead: "rp", status: "Planeamento", services: ["Decoração", "Design Floral"], team: ["rp", "sm"] },
    { name: "Catarina & João", type: "Casamento", client: "Catarina Silva", date: "2026-10-18", venue: "Quinta de Sintra", guests: 180, lead: "ac", status: "Planeamento", services: ["Produção", "Decoração", "Design Floral", "Iluminação"], team: ["ac", "mf", "rp", "ta"] },
    { name: "Retiro Origens", type: "Privado", client: "Inês Rodrigues", date: "2026-09-04", venue: "Convento do Beato", guests: 30, lead: "pn", status: "Planeamento", services: ["Logística", "Catering"], team: ["pn"] },
    { name: "EDP — Jantar de Natal", type: "Corporativo", client: "EDP", date: "2026-09-11", venue: "Tivoli Palácio", guests: 90, lead: "jr", status: "Planeamento", services: ["Produção", "Catering"], team: ["jr", "mf"] },
    { name: "Miguel & Ana", type: "Casamento", client: "Miguel Ferreira", date: "2026-07-25", venue: "Quinta da Torre", guests: 160, lead: "rp", status: "Concluído", services: ["Decoração", "Design Floral"], team: ["rp", "ir"] },
    { name: "Prova de Vinhos — Adega Regional", type: "Privado", client: "João Ribeiro", date: "2026-07-12", venue: "Palácio de Seteais", guests: 40, lead: "ta", status: "Concluído", services: ["Iluminação"], team: ["ta"] },
    { name: "Sonae — Encontro de Diretores", type: "Corporativo", client: "Sonae", date: "2026-10-03", venue: "Tivoli Palácio", guests: 70, lead: "mf", status: "Cancelado", services: ["Produção"], team: ["mf"] },
  ];

  const eventIdByName = new Map<string, string>();
  for (const ev of EVENTS) {
    const { data: existing } = await supabase.from("events").select("id").eq("name", ev.name).maybeSingle();
    let eventId = existing?.id as string | undefined;
    if (!eventId) {
      const { data, error } = await supabase.from("events").insert({
        name: ev.name, type: ev.type, client: ev.client, event_date: ev.date, venue: ev.venue,
        guests: ev.guests, lead_id: idByKey.get(ev.lead), status: ev.status,
      }).select("id").single();
      if (error || !data) throw error ?? new Error("insert event failed");
      eventId = data.id;
      await supabase.from("event_services").insert(ev.services.map((label) => ({ event_id: eventId, label })));
      await supabase.from("event_team").insert(ev.team.map((k) => ({ event_id: eventId, profile_id: idByKey.get(k) })));
      console.log(`  ✓ ${ev.name}`);
    } else {
      console.log(`  ↺ ${ev.name} already exists`);
    }
    eventIdByName.set(ev.name, eventId!);
  }

  console.log("Seeding tasks + notes for Catarina & João…");
  const flagshipId = eventIdByName.get("Catarina & João");
  if (flagshipId) {
    const { count } = await supabase.from("tasks").select("id", { count: "exact", head: true }).eq("event_id", flagshipId);
    if (!count) {
      await supabase.from("tasks").insert([
        { event_id: flagshipId, label: "Confirmar lista final de convidados", responsible_id: idByKey.get("ac"), deadline: "2026-09-15", done: true },
        { event_id: flagshipId, label: "Assinar contrato com floristaria", responsible_id: idByKey.get("ir"), deadline: "2026-09-20", done: true },
        { event_id: flagshipId, label: "Enviar planta de montagem à Quinta de Sintra", responsible_id: idByKey.get("mf"), deadline: "2026-07-25", done: false },
        { event_id: flagshipId, label: "Reservar equipamento de iluminação", responsible_id: idByKey.get("ta"), deadline: "2026-10-01", done: false },
        { event_id: flagshipId, label: "Confirmar menu com catering", responsible_id: idByKey.get("ac"), deadline: "2026-10-05", done: false },
        { event_id: flagshipId, label: "Ensaio de cerimónia no local", responsible_id: idByKey.get("ac"), deadline: "2026-10-17", done: false },
      ]);
      await supabase.from("notes").insert([
        { event_id: flagshipId, author_id: idByKey.get("ac"), body: "@Rita confirma que o fornecedor floral chega às 07:30, antes da montagem geral." },
        { event_id: flagshipId, author_id: idByKey.get("rp"), body: "Confirmado. Vou coordenar com a @Inês para os arranjos da mesa principal." },
        { event_id: flagshipId, author_id: idByKey.get("mf"), body: "Planta de acesso à Quinta de Sintra atualizada nos documentos — via norte fechada até às 08:00." },
      ]);
    }
  }

  console.log("Seeding this week's shifts…");
  const WEEK_DATES = ["2026-08-10", "2026-08-11", "2026-08-12", "2026-08-13", "2026-08-14", "2026-08-15", "2026-08-16"];
  const sofiaPedroId = eventIdByName.get("Sofia & Pedro");
  const galpId = eventIdByName.get("Galp — Conferência de Liderança");
  const retiroId = eventIdByName.get("Retiro Origens");
  const beatrizRuiId = eventIdByName.get("Beatriz & Rui");
  const { count: shiftCount } = await supabase.from("shifts").select("id", { count: "exact", head: true });
  if (!shiftCount) {
    const shifts = [
      { key: "mf", day: 4, start: "09:00", end: "18:00", event: sofiaPedroId, role: "Assistente de Produção" },
      { key: "pn", day: 5, start: "07:00", end: "15:00", event: sofiaPedroId, role: "Carga e Descarga" },
      { key: "rp", day: 4, start: "08:00", end: "20:00", event: sofiaPedroId, role: "Decoradora Responsável" },
      { key: "ir", day: 4, start: "07:30", end: "14:00", event: sofiaPedroId, role: "Designer Floral" },
      { key: "ta", day: 4, start: "09:00", end: "23:00", event: sofiaPedroId, role: "Técnico de Iluminação" },
      { key: "ac", day: 1, start: "09:00", end: "17:00", event: galpId, role: "Coordenação" },
      { key: "cg", day: 2, start: "09:00", end: "17:00", event: galpId, role: "Design Gráfico" },
      { key: "pn", day: 0, start: "08:00", end: "16:00", event: retiroId, role: "Logística" },
      { key: "bs", day: 3, start: "10:00", end: "18:00", event: beatrizRuiId, role: "Assistente de Decoração" },
      { key: "sm", day: 3, start: "09:00", end: "17:00", event: beatrizRuiId, role: "Designer" },
    ];
    await supabase.from("shifts").insert(
      shifts.map((s) => ({
        profile_id: idByKey.get(s.key), event_id: s.event, shift_date: WEEK_DATES[s.day],
        start_time: s.start, end_time: s.end, role_on_shift: s.role,
      }))
    );
  }

  console.log("\nDone. Sign in with any @organizza.pt email above and password:", DEMO_PASSWORD);
  console.log("Admin account: ana.costa@organizza.pt");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
